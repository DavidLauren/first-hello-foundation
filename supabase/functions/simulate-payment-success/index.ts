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
    const { orderId } = await req.json();
    
    if (!orderId) {
      throw new Error("Order ID manquant");
    }

    console.log("Simulating payment success for order:", orderId);

    // Initialiser Supabase avec la clé de service
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError) {
      console.error("Error fetching order:", orderError);
      throw new Error("Commande introuvable");
    }

    console.log("Order found:", order.order_number);

    // Si la commande n'a pas de fichiers, en créer des exemples
    const { data: existingFiles, error: filesCheckError } = await supabase
      .from("order_files")
      .select("*")
      .eq("order_id", orderId);

    if (filesCheckError) {
      console.error("Error checking files:", filesCheckError);
    }

    if (!existingFiles || existingFiles.length === 0) {
      console.log("No files found, creating sample files...");
      
      // Créer des fichiers d'exemple
      const sampleFiles = [
        {
          order_id: orderId,
          file_name: "photo1.jpg",
          file_path: "sample-uploads/photo1.jpg",
          file_size: 1024000,
          file_type: "jpg",
          is_original: true
        },
        {
          order_id: orderId,
          file_name: "photo2.png",
          file_path: "sample-uploads/photo2.png", 
          file_size: 2048000,
          file_type: "png",
          is_original: true
        }
      ];

      const { error: insertError } = await supabase
        .from("order_files")
        .insert(sampleFiles);

      if (insertError) {
        console.error("Error inserting sample files:", insertError);
      } else {
        console.log("Sample files created");
      }
    }

    // Marquer la commande comme complétée
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({ 
        status: "completed", 
        completed_at: new Date().toISOString() 
      })
      .eq("id", orderId)
      .select("order_number, instructions")
      .single();

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw new Error("Erreur lors de la mise à jour de la commande");
    }

    console.log("Order updated successfully:", updatedOrder.order_number);

    // Récupérer les fichiers de la commande (maintenant qu'on en a)
    const { data: orderFiles, error: filesError } = await supabase
      .from("order_files")
      .select("*")
      .eq("order_id", orderId);

    if (filesError) {
      console.error("Error fetching order files:", filesError);
      throw new Error("Erreur lors de la récupération des fichiers");
    }

    // Récupérer les informations de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, contact_name")
      .eq("id", order.user_id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      throw new Error("Erreur lors de la récupération du profil utilisateur");
    }

    console.log("User profile:", { email: profile.email, name: profile.contact_name });

    // Envoyer l'email de notification
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
          throw new Error("Erreur lors de l'envoi de l'email");
        } else {
          console.log('Email notification sent successfully');
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        throw new Error("Erreur lors de l'envoi de l'email");
      }
    } else {
      throw new Error("Pas de fichiers à notifier ou pas d'adresse email");
    }

    return new Response(JSON.stringify({ 
      success: true,
      orderNumber: updatedOrder.order_number,
      filesCount: orderFiles?.length || 0,
      emailSent: true,
      userEmail: profile.email
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in simulate-payment-success:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});