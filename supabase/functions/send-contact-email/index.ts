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
    const { name, email, message } = await req.json();
    
    console.log("New contact form submission:", { name, email });
    
    const emailContent = `
Nouvelle demande de contact depuis le site CrazyPixels:

Nom: ${name}
Email: ${email}

Message:
${message}

---
Cette demande a été envoyée depuis le formulaire de contact du site CrazyPixels.
    `;
    
    await smtp.send({
      from: "contact@crazypixels.fr",
      to: "contact@crazypixels.fr",
      subject: `Nouveau contact de ${name} - CrazyPixels`,
      content: emailContent,
    });
    
    console.log("Contact email sent successfully");
    
    return new Response(
      JSON.stringify({ success: true, message: "Email envoyé avec succès" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-contact-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});