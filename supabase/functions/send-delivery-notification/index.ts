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
    const { orderNumber, clientEmail, clientName, filesCount, instructions } = await req.json();
    
    console.log("Sending delivery notification:", { orderNumber, clientEmail, clientName, filesCount });
    
    // Email au client - contenu HTML compact pour éviter les problèmes d'encodage
    const clientEmailContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vos photos sont prêtes !</title><style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }.container { max-width: 600px; margin: 0 auto; padding: 20px; }.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }.content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }.highlight { background: #667eea; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; }.button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }.footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }</style></head><body><div class="container"><div class="header"><h1>🎉 Vos photos sont prêtes !</h1><p>Commande ${orderNumber}</p></div><div class="content"><p>Bonjour ${clientName},</p><p>Excellente nouvelle ! Vos photos ont été retouchées avec soin et sont maintenant disponibles au téléchargement.</p><div class="highlight"><h3>📸 Détails de votre commande :</h3><p><strong>Numéro de commande :</strong> ${orderNumber}</p><p><strong>Nombre de photos :</strong> ${filesCount} photo${filesCount > 1 ? 's' : ''}</p>${instructions ? `<p><strong>Instructions :</strong> ${instructions}</p>` : ''}</div><p>Pour télécharger vos photos retouchées :</p><ol><li>Connectez-vous à votre compte CrazyPixels</li><li>Rendez-vous dans la section "Mes Commandes"</li><li>Cliquez sur votre commande ${orderNumber}</li><li>Téléchargez vos photos en haute qualité</li></ol><div style="text-align: center;"><a href="https://crazypixels.fr/account" class="button">📥 Télécharger mes photos</a></div><p>Nous espérons que vous serez ravi(e) du résultat ! Si vous avez des questions ou souhaitez des modifications, n'hésitez pas à nous contacter.</p><p>Merci de faire confiance à CrazyPixels pour la retouche de vos photos.</p></div><div class="footer"><p>CrazyPixels - Retouche Photo Professionnelle</p><p>contact@crazypixels.fr</p></div></div></body></html>`;
    
    // Envoyer l'email au client
    await smtp.send({
      from: "CrazyPixels <contact@crazypixels.fr>",
      to: clientEmail,
      subject: `✨ Vos photos sont prêtes ! - Commande ${orderNumber}`,
      content: clientEmailContent,
      html: clientEmailContent,
    });
    
    console.log("Delivery notification sent successfully to client");
    
    return new Response(
      JSON.stringify({ success: true, message: "Notification envoyée au client" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-delivery-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});