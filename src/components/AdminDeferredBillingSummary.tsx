import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useDeferredBilling } from "@/hooks/useDeferredBilling";
import { useToast } from "@/hooks/use-toast";
import { usePricing } from "@/hooks/usePricing";
import { RefreshCw, FileText, Users, Euro } from "lucide-react";

const AdminDeferredBillingSummary = () => {
  const { fetchAllDeferredBilling, resetDeferredBilling } = useDeferredBilling();
  const { pricePerPhoto } = usePricing();
  const { toast } = useToast();
  const [data, setData] = useState<any>({ users: [], totalPhotos: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchAllDeferredBilling();
    setData(result);
    setLoading(false);
  };

  const handleReset = async () => {
    setResetting(true);
    const success = await resetDeferredBilling();
    
    if (success) {
      toast({
        title: "Facturation créée",
        description: "Les factures différées ont été générées avec succès",
      });
      
      // Attendre un peu pour que la base de données soit à jour
      setTimeout(async () => {
        // Recharger les données pour réinitialiser l'affichage
        await loadData();
        // Émettre un événement pour notifier le DeferredInvoicesViewer
        window.dispatchEvent(new CustomEvent('invoices-created'));
      }, 500);
      
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de créer les factures différées",
        variant: "destructive",
      });
    }
    setResetting(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Récapitulatif Facturation Différée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="bg-gray-200 h-6 rounded"></div>
            <div className="bg-gray-200 h-6 rounded"></div>
            <div className="bg-gray-200 h-6 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentMonth = new Date().toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Facturation Différée - {currentMonth}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Résumé global */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-blue-700">{data.users.length}</p>
            <p className="text-sm text-blue-600">Clients VIP</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <FileText className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-700">{data.totalPhotos}</p>
            <p className="text-sm text-green-600">Photos traitées</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Euro className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-purple-700">{data.totalAmount}€</p>
            <p className="text-sm text-purple-600">Total TTC</p>
          </div>
        </div>

        {/* Liste des clients */}
        {data.users.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Détail par client :</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.users.map((user: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{user.contact_name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{user.photos} photos</p>
                    <p className="text-sm text-gray-600">{(user.photos || 0) * pricePerPhoto}€ TTC</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bouton de reset */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleReset}
            disabled={resetting || data.totalPhotos === 0}
            className="w-full bg-gradient-button hover:scale-105 transform transition-all duration-300"
          >
            {resetting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Création des factures...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Créer les factures différées ({data.totalPhotos} photos)
              </>
            )}
          </Button>
          
          {data.totalPhotos === 0 && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Aucune photo à facturer ce mois-ci
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDeferredBillingSummary;