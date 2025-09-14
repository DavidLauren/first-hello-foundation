import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [filesCount, setFilesCount] = useState<number>(0);
  const sessionId = searchParams.get("session_id");
  const { toast } = useToast();

  useEffect(() => {
    const processPayment = async () => {
      if (!sessionId) {
        setError("Session de paiement invalide");
        setLoading(false);
        return;
      }

      try {
        console.log("Processing payment for session:", sessionId);
        
        // Appeler la edge function pour traiter le paiement
        const { data, error: processError } = await supabase.functions.invoke('process-payment-success', {
          body: { sessionId }
        });

        if (processError) {
          console.error("Payment processing error:", processError);
          throw new Error(processError.message || "Erreur lors du traitement du paiement");
        }

        if (!data.success) {
          throw new Error(data.error || "Erreur lors du traitement du paiement");
        }

        console.log("Payment processed successfully:", data);
        setOrderNumber(data.orderNumber);
        setFilesCount(data.filesCount || 0);

        toast({
          title: "Paiement confirmé",
          description: `Votre commande ${data.orderNumber} a été traitée avec succès.`,
        });

      } catch (error) {
        console.error("Payment processing error:", error);
        setError(error instanceof Error ? error.message : "Erreur lors du traitement du paiement");
        
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du traitement de votre paiement. Contactez-nous si le problème persiste.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    // Délai pour l'UX puis traitement
    const timer = setTimeout(() => {
      processPayment();
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId, toast]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                <h2 className="text-xl font-semibold">Traitement du paiement...</h2>
                <p className="text-muted-foreground">
                  Nous vérifions votre paiement et préparons votre commande.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Erreur de paiement</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <div className="space-y-2 pt-4">
                <Button 
                  onClick={() => navigate("/account")}
                  className="w-full"
                >
                  Voir mes commandes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Paiement réussi !</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Votre commande a été confirmée et traitée. Nous avons bien reçu vos photos et commencerons le travail de retouche sous peu.
            </p>
            {orderNumber && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">
                  Numéro de commande : {orderNumber}
                </p>
                {filesCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {filesCount} fichier{filesCount > 1 ? 's' : ''} reçu{filesCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Vous devriez recevoir un email de confirmation avec vos photos sous peu.
            </p>
            <div className="space-y-2 pt-4">
              <Button 
                onClick={() => navigate("/account")}
                className="w-full"
              >
                Voir ma commande
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="w-full"
              >
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Success;