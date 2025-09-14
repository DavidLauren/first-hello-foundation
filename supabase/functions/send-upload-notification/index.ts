import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Créer le client Supabase avec la clé de service
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

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
    const { files, userEmail, orderNumber, instructions } = await req.json();
    
    console.log("New order notification:", { files, userEmail, orderNumber });
    
    const emailContent = `
Bonjour,

Une nouvelle commande a été créée par ${userEmail}:
${orderNumber ? `Numéro de commande: ${orderNumber}` : ''}

Fichiers uploadés:
${files.map((f: any) => `- ${f.name} (${Math.round(f.size / 1024)} KB)`).join('\n')}

Total: ${files.length} fichier(s)

${instructions ? `Instructions: ${instructions}` : ''}

Cordialement,
CrazyPixels
    `;

    // Récupérer les fichiers depuis Supabase Storage pour les attacher
    const attachments = [];
    for (const file of files) {
      if (file.path) {
        try {
          console.log(`Downloading file for attachment: ${file.path}`);
          
          // Télécharger le fichier depuis Supabase Storage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('photo-uploads')
            .download(file.path);
            
          if (downloadError) {
            console.error(`Error downloading file ${file.name}:`, downloadError);
            continue;
          }
          
          if (fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            // Encoder en base64 de manière sûre (sans spread) pour éviter les dépassements de pile
            const base64String = base64Encode(uint8Array);

            const contentType = file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' :
                              file.name.toLowerCase().endsWith('.png') ? 'image/png' :
                              file.name.toLowerCase().endsWith('.webp') ? 'image/webp' : 'application/octet-stream';

            attachments.push({
              filename: file.name,
              content: base64String,
              encoding: 'base64',
              contentType: contentType,
              cid: `image_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}` // Content-ID pour l'affichage inline
            });

            console.log(`File ${file.name} prepared for attachment (${uint8Array.byteLength} bytes, base64 encoded)`);
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
        }
      }
    }
    
    console.log(`Prepared ${attachments.length} attachments for email`);
    
    await smtp.send({
      from: "contact@crazypixels.fr",
      to: "contact@crazypixels.fr",
      subject: `Nouvelle commande CrazyPixels${orderNumber ? ` - ${orderNumber}` : ''}`,
      content: emailContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    
    console.log("Email sent successfully with attachments");
    
    return new Response(
      JSON.stringify({ success: true, message: "Notification logged" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-upload-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});