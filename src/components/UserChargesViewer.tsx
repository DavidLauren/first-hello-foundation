import { useState } from 'react';
import { useAdminCharges } from '@/hooks/useAdminCharges';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const UserChargesViewer = () => {
  const { user } = useAuth();
  const { charges, isLoading } = useAdminCharges(user?.id);
  const { toast } = useToast();
  const [payingChargeId, setPayingChargeId] = useState<string | null>(null);

  const handlePayCharge = async (chargeId: string) => {
    try {
      setPayingChargeId(chargeId);
      
      const { data, error } = await supabase.functions.invoke('process-admin-charge', {
        body: { chargeId },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de traiter le paiement.',
        variant: 'destructive',
      });
      setPayingChargeId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingCharges = charges?.filter(c => c.status === 'pending') || [];
  const paidCharges = charges?.filter(c => c.status === 'paid') || [];

  return (
    <div className="space-y-6">
      {pendingCharges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sommes à régler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingCharges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{charge.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Créé le {new Date(charge.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold">{(charge.amount / 100).toFixed(2)} €</p>
                    <Button
                      onClick={() => handlePayCharge(charge.id)}
                      disabled={payingChargeId === charge.id}
                    >
                      {payingChargeId === charge.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        'Payer'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {paidCharges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paidCharges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{charge.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Payé le {new Date(charge.paid_at!).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold">{(charge.amount / 100).toFixed(2)} €</p>
                    <Badge variant="default">Payé</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && charges?.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Aucune somme à régler
          </CardContent>
        </Card>
      )}
    </div>
  );
};
