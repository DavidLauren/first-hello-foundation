import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const smtp = new SMTPClient({
  connection: {
    hostname: "smtp.hostinger.com",
    port: 465,
    tls: true,
    auth: {
      username: "contact@crazypixels.fr",
      password: Deno.env.get("EMAIL_PASSWORD") || "",
    },
  },
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, contactName } = await req.json();
    
    console.log("New account created:", { userId, email, contactName });
    
    const emailContent = `
Nouveau compte créé sur CrazyPixels:

ID Utilisateur: ${userId}
Email: ${email}
Nom de contact: ${contactName || 'Non renseigné'}
Date de création: ${new Date().toLocaleString('fr-FR')}

---
Cette notification a été envoyée automatiquement lors de la création d'un nouveau compte sur CrazyPixels.
    `;
    
    await smtp.send({
      from: "CrazyPixels <contact@crazypixels.fr>",
      to: "contact@crazypixels.fr",
      subject: `Nouveau compte créé - ${email}`,
      content: emailContent,
    });
    
    console.log("New account notification sent successfully");
    
    return new Response(
      JSON.stringify({ success: true, message: "Notification envoyée" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-new-account-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});