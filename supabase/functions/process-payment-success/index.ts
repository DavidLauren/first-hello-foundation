import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID manquant");
    }

    console.log("Processing payment success for session:", sessionId);

// Initialiser Stripe avec la clé appropriée (test vs live)
const isLiveSession = sessionId.startsWith("cs_live_");
const testKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const liveKey = Deno.env.get("STRIPE_LIVE_SECRET_KEY") || "";
const chosenKey = isLiveSession ? (liveKey || testKey) : testKey;
console.log("Stripe init mode:", isLiveSession ? "live" : "test");
const stripe = new Stripe(chosenKey, {
  apiVersion: "2023-10-16",
});

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("Stripe session retrieved:", { 
      id: session.id, 
      payment_status: session.payment_status,
      metadata: session.metadata 
    });

    if (session.payment_status !== "paid") {
      throw new Error("Paiement non confirmé");
    }

    // Initialiser Supabase avec la clé de service
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Récupérer les métadonnées
    const { user_id, order_id, file_count, free_photos_used } = session.metadata;
    
    if (!order_id || !user_id) {
      throw new Error("Métadonnées de commande manquantes");
    }

    console.log("Order metadata:", { user_id, order_id, file_count, free_photos_used });

    // Vérifier que la commande n'a pas déjà été traitée
    const { data: existingOrder, error: checkError } = await supabase
      .from("orders")
      .select("status, order_number")
      .eq("id", order_id)
      .single();

    if (checkError) {
      console.error("Error checking order:", checkError);
      throw new Error("Commande introuvable");
    }

    if (existingOrder.status === "completed") {
      console.log("Order already processed");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Commande déjà traitée",
        orderNumber: existingOrder.order_number 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Marquer la commande comme complétée
    const { data: updatedOrder, error: orderError } = await supabase
      .from("orders")
      .update({ 
        status: "completed", 
        completed_at: new Date().toISOString() 
      })
      .eq("id", order_id)
      .select("order_number, instructions")
      .single();

    if (orderError) {
      console.error("Error updating order:", orderError);
      throw new Error("Erreur lors de la mise à jour de la commande");
    }

    console.log("Order updated successfully:", updatedOrder.order_number);

    // Récupérer les fichiers de la commande
    const { data: orderFiles, error: filesError } = await supabase
      .from("order_files")
      .select("*")
      .eq("order_id", order_id);

    if (filesError) {
      console.error("Error fetching order files:", filesError);
      throw new Error("Erreur lors de la récupération des fichiers");
    }

    // Récupérer les informations de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, contact_name")
      .eq("id", user_id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      throw new Error("Erreur lors de la récupération du profil utilisateur");
    }

    console.log("User profile:", { email: profile.email, name: profile.contact_name });

    // Envoyer l'email de notification si on a des fichiers
    if (orderFiles && orderFiles.length > 0 && profile.email) {
      console.log(`Sending email notification for ${orderFiles.length} files to ${profile.email}`);
      
      try {
        const { data: emailResponse, error: emailError } = await supabase.functions.invoke('send-upload-notification', {
          body: {
            files: orderFiles.map(f => ({
              name: f.file_name,
              size: f.file_size || 0,
              path: f.file_path
            })),
            userEmail: profile.email,
            orderNumber: updatedOrder.order_number,
            instructions: updatedOrder.instructions || null
          }
        });

        if (emailError) {
          console.error('Email notification error:', emailError);
          // Ne pas faire échouer le processus si l'email échoue
        } else {
          console.log('Email notification sent successfully');
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continuer même si l'email échoue
      }
    } else {
      console.log("No files to notify or no email address");
    }

    // Mettre à jour l'utilisation des photos gratuites si applicable
    if (free_photos_used && parseInt(free_photos_used) > 0) {
      console.log(`Updating promo usage: ${free_photos_used} photos used`);
      
      const { data: promoUsage, error: promoFetchError } = await supabase
        .from("user_promo_usage")
        .select("photos_remaining")
        .eq("user_id", user_id)
        .order("used_at", { ascending: false })
        .limit(1)
        .single();

      if (!promoFetchError && promoUsage) {
        const { error: promoError } = await supabase
          .from("user_promo_usage")
          .update({ 
            photos_used: parseInt(free_photos_used),
            photos_remaining: Math.max(0, promoUsage.photos_remaining - parseInt(free_photos_used))
          })
          .eq("user_id", user_id)
          .order("used_at", { ascending: false })
          .limit(1);

        if (promoError) {
          console.error("Error updating promo usage:", promoError);
        } else {
          console.log("Promo usage updated successfully");
        }
      }
    }

    // Vérifier si l'utilisateur est VIP (facturation différée)
    const { data: userProfile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("deferred_billing_enabled")
      .eq("id", user_id)
      .single();

    // Générer une facture immédiate pour les clients non-VIP
    if (!profileCheckError && !userProfile?.deferred_billing_enabled) {
      console.log("Creating immediate invoice for non-VIP user");
      
      try {
        // Récupérer le prix par photo
        const { data: settings } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'price_per_photo')
          .maybeSingle();

        const pricePerPhoto = parseInt(settings?.setting_value || '14');
        const totalAmount = session.amount_total || 0; // Montant en centimes
        const photoCount = orderFiles?.length || parseInt(file_count) || 1;

        // Créer la facture immédiate
        const { data: invoice, error: invoiceError } = await supabase
          .from('deferred_invoices')
          .insert({
            user_id: user_id,
            total_amount: totalAmount,
            currency: 'EUR',
            status: 'paid', // Déjà payée via Stripe
            due_date: new Date().toISOString(), // Échue aujourd'hui (déjà payée)
            invoice_number: '',
          })
          .select()
          .single();

        if (!invoiceError && invoice?.id) {
          // Créer les éléments de facture
          const { error: itemError } = await supabase
            .from('invoice_items')
            .insert({
              invoice_id: invoice.id,
              description: `Traitement de ${photoCount} photo${photoCount > 1 ? 's' : ''} - Commande ${updatedOrder.order_number}`,
              quantity: photoCount,
              unit_price: pricePerPhoto * 100, // En centimes
              total_price: totalAmount,
              order_id: order_id
            });

          if (!itemError) {
            console.log(`Immediate invoice ${invoice.id} created successfully for order ${updatedOrder.order_number}`);
          } else {
            console.error('Error creating invoice items:', itemError);
          }
        } else {
          console.error('Error creating immediate invoice:', invoiceError);
        }
      } catch (invoiceCreationError) {
        console.error('Failed to create immediate invoice:', invoiceCreationError);
        // Ne pas faire échouer le processus si la facture échoue
      }
    } else {
      console.log("User has deferred billing enabled or error checking profile - no immediate invoice created");
    }

    return new Response(JSON.stringify({ 
      success: true,
      orderNumber: updatedOrder.order_number,
      filesCount: orderFiles?.length || 0,
      emailSent: !!profile.email
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in process-payment-success:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});