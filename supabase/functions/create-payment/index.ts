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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    // Use service role key for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { files, instructions, totalPhotos, forcePayment = false } = await req.json();
    
    console.log("Received payment request:", { files: files?.length, totalPhotos, forcePayment });
    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    // Calculer les valeurs
    const calculatedTotalPhotos = totalPhotos || files.length;
    
    // Récupérer les photos gratuites disponibles pour cet utilisateur côté serveur
    const { data: userFreePhotos } = await supabaseClient.rpc('get_user_free_photos', {
      _user_id: user.id
    });
    
    const availableFreePhotos = userFreePhotos || 0;
    const calculatedFreePhotosUsed = Math.min(availableFreePhotos, calculatedTotalPhotos);
    
    // Récupérer le prix par photo depuis la base de données
    const { data: priceSettings } = await supabaseClient
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'price_per_photo')
      .single();
    
    const pricePerPhoto = parseInt(priceSettings?.setting_value || '14');
    const photosToCharge = Math.max(0, calculatedTotalPhotos - calculatedFreePhotosUsed);
    
    // SÉCURITÉ: Toujours recalculer le montant côté serveur - JAMAIS faire confiance au client
    const serverCalculatedAmount = photosToCharge * pricePerPhoto * 100; // en centimes

    console.log("Payment calculation:", {
      totalPhotos: calculatedTotalPhotos,
      availableFreePhotos,
      freePhotosUsed: calculatedFreePhotosUsed,
      photosToCharge,
      pricePerPhoto,
      serverCalculatedAmount,
      forcePayment
    });

    // Vérifier si l'utilisateur est VIP ET a la facturation différée activée
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_vip, deferred_billing_enabled')
      .eq('id', user.id)
      .single();

    // SÉCURITÉ: Seuls les VIP avec facturation différée peuvent bypasser le paiement
    // ET seulement si forcePayment n'est pas activé
    if (profile?.is_vip && profile?.deferred_billing_enabled && !forcePayment) {
      // Create order for VIP user
      const { data: order, error: orderError } = await supabaseClient
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: 0, // Montant 0 pour VIP
          currency: "EUR",
          status: "completed", // Directement complétée pour VIP
          instructions: instructions || null,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) {
        console.error("VIP Order creation error:", orderError);
        throw new Error("Failed to create VIP order");
      }

      // Créer les fichiers de commande
      const fileInserts = files.map((file: any) => ({
        order_id: order.id,
        file_name: file.name,
        file_path: file.path,
        file_size: file.size,
        file_type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        is_original: true
      }));

      await supabaseClient.from("order_files").insert(fileInserts);

      // Envoyer email de notification
      try {
        await supabaseClient.functions.invoke('send-upload-notification', {
          body: {
            files: files.map((f: any) => ({ 
              name: f.name, 
              size: f.size, 
              path: f.path 
            })),
            userEmail: user.email,
            orderNumber: order.order_number,
            instructions: instructions
          }
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }

      return new Response(JSON.stringify({ 
        success: true,
        order_id: order.id,
        message: "Commande VIP créée avec succès"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // TOUS les autres cas (non-VIP, VIP sans facturation différée, ou forcePayment)
    // doivent passer par le paiement Stripe

    // Pour les utilisateurs non-VIP ou VIP qui doivent payer, créer une commande normale
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: serverCalculatedAmount, // Utiliser le montant calculé côté serveur
        currency: "EUR",
        status: "pending",
        instructions: instructions || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error("Failed to create order");
    }

    // Créer les fichiers de commande immédiatement (même pour les commandes payantes)
    const fileInserts = files.map((file: any) => ({
      order_id: order.id,
      file_name: file.name,
      file_path: file.path,
      file_size: file.size,
      file_type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      is_original: true
    }));

    const { error: filesError } = await supabaseClient.from("order_files").insert(fileInserts);
    if (filesError) {
      console.error("Files insertion error:", filesError);
      // Ne pas faire échouer le processus de commande pour les fichiers
    } else {
      console.log(`${fileInserts.length} files saved for order ${order.id}`);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }


    // Si le montant final est 0 (toutes les photos sont gratuites)
    if (serverCalculatedAmount === 0) {
      // Marquer la commande comme complétée directement
      await supabaseClient
        .from("orders")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", order.id);

      // Créer les fichiers de commande
      const fileInserts = files.map((file: any) => ({
        order_id: order.id,
        file_name: file.name,
        file_path: file.path,
        file_size: file.size,
        file_type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        is_original: true
      }));

      await supabaseClient.from("order_files").insert(fileInserts);

      // Envoyer email de notification
      try {
        await supabaseClient.functions.invoke('send-upload-notification', {
          body: {
            files: files.map((f: any) => ({ 
              name: f.name, 
              size: f.size, 
              path: f.path 
            })),
            userEmail: user.email,
            orderNumber: order.order_number,
            instructions: instructions
          }
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }

      // Mettre à jour l'utilisation des photos gratuites si nécessaire
      if (calculatedFreePhotosUsed > 0) {
        // Utiliser les photos gratuites disponibles
        const { data: promoUsages } = await supabaseClient
          .from('user_promo_usage')
          .select('*')
          .eq('user_id', user.id)
          .gt('photos_remaining', 0)
          .order('used_at', { ascending: true });

        if (promoUsages && promoUsages.length > 0) {
          let photosToDeduct = calculatedFreePhotosUsed;
          
          for (const usage of promoUsages) {
            if (photosToDeduct <= 0) break;
            
            const canUse = Math.min(photosToDeduct, usage.photos_remaining);
            
            await supabaseClient
              .from('user_promo_usage')
              .update({
                photos_remaining: usage.photos_remaining - canUse,
                photos_used: usage.photos_used + canUse
              })
              .eq('id', usage.id);
              
            photosToDeduct -= canUse;
          }
        }
      }

      return new Response(JSON.stringify({ 
        success: true,
        order_id: order.id,
        message: "Commande créée avec succès - Commande gratuite"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create Stripe checkout session with order ID in metadata
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { 
              name: `Retouche photo - ${calculatedTotalPhotos} fichier(s)`,
              description: `Service de retouche photo professionnelle${calculatedFreePhotosUsed > 0 ? ` (${calculatedFreePhotosUsed} photo(s) gratuite(s) incluse(s))` : ''}`
            },
            unit_amount: pricePerPhoto * 100, // Prix par photo en centimes
          },
          quantity: photosToCharge, // Nombre de photos à facturer
        },
      ],
      mode: "payment",
      payment_method_types: ["card"], // Seuls les paiements par carte bancaire
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        user_id: user.id,
        order_id: order.id,
        file_count: (calculatedTotalPhotos || 0).toString(),
        free_photos_used: (calculatedFreePhotosUsed || 0).toString(),
      }
    });

    console.log("Payment session created:", { 
      sessionId: session.id, 
      orderId: order.id,
      amount: serverCalculatedAmount,
      files: files.length 
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      order_id: order.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});