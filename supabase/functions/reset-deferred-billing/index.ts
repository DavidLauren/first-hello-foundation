import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Utiliser le service role key pour contourner RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Vérifier que l'utilisateur est admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    // Vérifier si l'utilisateur est admin
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roles) {
      throw new Error("Access denied - admin role required");
    }

    console.log('Admin user verified:', userData.user.email);

    const currentMonth = new Date();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Récupérer toutes les commandes VIP avec facturation différée ce mois
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select(`
        id,
        user_id,
        created_at,
        order_files(id)
      `)
      .eq('status', 'completed')
      .eq('total_amount', 0)
      .is('invoiced_at', null)
      .gte('created_at', firstDay.toISOString())
      .lte('created_at', lastDay.toISOString());

    if (ordersError) {
      throw new Error(`Error fetching orders: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No orders to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log('Found orders to process:', orders.length);

    // Récupérer les profils des utilisateurs concernés
    const userIds = [...new Set(orders.map(order => order.user_id))];
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, contact_name, email, deferred_billing_enabled')
      .in('id', userIds)
      .eq('deferred_billing_enabled', true);

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    console.log('Found profiles with deferred billing:', profiles?.length || 0);

    // Grouper par utilisateur avec facturation différée activée
    const userGroups = orders.reduce((acc: any, order: any) => {
      const profile = profiles?.find(p => p.id === order.user_id);
      if (!profile?.deferred_billing_enabled) return acc;
      
      const userId = order.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user_id: userId,
          contact_name: profile.contact_name,
          email: profile.email,
          photos: 0,
          orderIds: []
        };
      }
      acc[userId].photos += order.order_files?.length || 0;
      acc[userId].orderIds.push(order.id);
      return acc;
    }, {});

    const users = Object.values(userGroups);
    const ordersToUpdate: string[] = [];

    console.log('Processing users:', users.length);

    // Récupérer le prix par photo
    const { data: settings } = await supabaseClient
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'price_per_photo')
      .maybeSingle();

    const pricePerPhoto = parseInt(settings?.setting_value || '13');

    for (const user of users as any[]) {
      if (user.photos > 0) {
        const totalAmount = user.photos * pricePerPhoto;

        console.log(`Creating invoice for user ${user.email}: ${user.photos} photos, ${totalAmount}€`);

        // Créer la facture différée
        const { data: invoice, error: invoiceError } = await supabaseClient
          .from('deferred_invoices')
          .insert({
            user_id: user.user_id,
            total_amount: totalAmount * 100, // Convertir en centimes
            currency: 'EUR',
            status: 'pending',
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            invoice_number: '',
          })
          .select()
          .single();

        if (invoiceError) {
          console.error('Invoice creation error:', invoiceError);
          continue;
        }

        if (invoice?.id) {
          // Créer les éléments de facture
          const { error: itemError } = await supabaseClient
            .from('invoice_items')
            .insert({
              invoice_id: invoice.id,
              description: `Traitement de ${user.photos} photos - ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
              quantity: user.photos,
              unit_price: pricePerPhoto * 100,
              total_price: totalAmount * 100,
            });

          if (itemError) {
            console.error('Invoice item creation error:', itemError);
          } else {
            console.log(`Invoice ${invoice.id} created successfully`);
            ordersToUpdate.push(...user.orderIds);
          }
        }
      }
    }

    console.log('Orders to mark as invoiced:', ordersToUpdate.length);

    // Marquer toutes les commandes comme facturées
    if (ordersToUpdate.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({ invoiced_at: new Date().toISOString() })
        .in('id', ordersToUpdate);

      if (updateError) {
        console.error('Error updating orders:', updateError);
        throw new Error(`Error updating orders: ${updateError.message}`);
      }

      console.log(`Successfully marked ${ordersToUpdate.length} orders as invoiced`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully processed ${users.length} users and ${ordersToUpdate.length} orders`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in reset-deferred-billing:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});