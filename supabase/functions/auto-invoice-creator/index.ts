import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTO-INVOICE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Use the service role key to bypass RLS for administrative operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get current date for billing period
    const currentDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days to pay

    logStep("Searching for users with deferred billing enabled");

    // Find all users with deferred billing enabled who have delivered orders
    const { data: usersWithBilling, error: usersError } = await supabaseClient
      .from('profiles')
      .select(`
        id,
        email,
        contact_name,
        company_name,
        deferred_billing_enabled
      `)
      .eq('deferred_billing_enabled', true);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    logStep("Found users with deferred billing", { count: usersWithBilling?.length });

    for (const user of usersWithBilling || []) {
      logStep("Processing user", { userId: user.id, email: user.email });

      // Find delivered orders for this user that haven't been invoiced yet
      const { data: orders, error: ordersError } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'delivered')
        .is('invoiced_at', null);

      if (ordersError) {
        logStep("Error fetching orders", { error: ordersError.message });
        continue;
      }

      if (!orders || orders.length === 0) {
        logStep("No uninvoiced orders found for user", { userId: user.id });
        continue;
      }

      logStep("Found uninvoiced orders", { userId: user.id, orderCount: orders.length });

      // Calculate total amount for the invoice
      const totalAmount = orders.reduce((sum, order) => sum + order.total_amount, 0);

      // Create the invoice
      const { data: invoice, error: invoiceError } = await supabaseClient
        .from('deferred_invoices')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          currency: 'EUR',
          status: 'pending',
          due_date: dueDate.toISOString(),
          issued_date: currentDate.toISOString()
        })
        .select()
        .single();

      if (invoiceError) {
        logStep("Error creating invoice", { error: invoiceError.message });
        continue;
      }

      logStep("Invoice created", { invoiceId: invoice.id, invoiceNumber: invoice.invoice_number });

      // Create invoice items for each order
      const invoiceItems = orders.map(order => ({
        invoice_id: invoice.id,
        order_id: order.id,
        description: `Commande ${order.order_number} - Retouche photos`,
        quantity: 1,
        unit_price: order.total_amount,
        total_price: order.total_amount
      }));

      const { error: itemsError } = await supabaseClient
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        logStep("Error creating invoice items", { error: itemsError.message });
        continue;
      }

      // Mark orders as invoiced
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({ invoiced_at: currentDate.toISOString() })
        .in('id', orders.map(order => order.id));

      if (updateError) {
        logStep("Error updating orders", { error: updateError.message });
        continue;
      }

      logStep("Successfully processed user", { 
        userId: user.id, 
        invoiceId: invoice.id,
        orderCount: orders.length,
        totalAmount: totalAmount / 100
      });
    }

    logStep("Auto-invoice creation completed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Auto-invoice creation completed",
      processedUsers: usersWithBilling?.length || 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in auto-invoice-creator", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});