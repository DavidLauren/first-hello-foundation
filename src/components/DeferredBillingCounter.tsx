import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CreditCard } from "lucide-react";
import { useDeferredBilling } from "@/hooks/useDeferredBilling";
import { useAuth } from "@/contexts/AuthContext";

const DeferredBillingCounter = () => {
  const { profile } = useAuth();
  const { photosThisMonth, totalAmount, loading } = useDeferredBilling();

  // Ne pas afficher si l'utilisateur n'est pas VIP ou n'a pas la facturation différée activée
  if (!profile?.is_vip || !profile?.deferred_billing_enabled) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Facturation différée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <CreditCard className="h-5 w-5" />
          Facturation différée
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
            <Calendar className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Photos traitées ce mois-ci</p>
              <p className="font-bold text-xl text-purple-700">
                {photosThisMonth} photo{photosThisMonth > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Montant à facturer</p>
              <p className="font-bold text-xl text-purple-700">
                {totalAmount}€ TTC
              </p>
            </div>
          </div>
          
          {photosThisMonth > 0 && (
            <div className="text-xs text-gray-500 bg-white/40 p-2 rounded">
              💡 Facturation automatique en fin de mois
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeferredBillingCounter;