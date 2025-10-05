import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const chargeId = session.metadata?.charge_id;
      const userId = session.metadata?.user_id;

      if (!chargeId || !userId) {
        throw new Error('Missing charge_id or user_id in metadata');
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get charge details
      const { data: charge, error: chargeError } = await supabase
        .from('admin_charges')
        .select('*, profiles!admin_charges_user_id_fkey(email, contact_name, billing_address, billing_company)')
        .eq('id', chargeId)
        .single();

      if (chargeError || !charge) {
        throw new Error('Charge not found');
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('deferred_invoices')
        .insert({
          user_id: userId,
          total_amount: charge.amount,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'paid',
        })
        .select()
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Failed to create invoice');
      }

      // Create invoice item
      await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoice.id,
          description: charge.description,
          quantity: 1,
          unit_price: charge.amount,
          total_price: charge.amount,
        });

      // Update charge status
      await supabase
        .from('admin_charges')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          invoice_id: invoice.id,
        })
        .eq('id', chargeId);

      console.log('Admin charge processed successfully');
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
