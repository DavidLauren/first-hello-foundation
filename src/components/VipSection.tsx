import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Crown, CreditCard, FileText, Building2, MapPin, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const VipSection = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deferredBilling, setDeferredBilling] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    billing_company: '',
    billing_address: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setDeferredBilling(profile.deferred_billing_enabled || false);
      setBillingInfo({
        billing_company: profile.billing_company || '',
        billing_address: profile.billing_address || ''
      });
    }
  }, [profile]);

  const handleDeferredBillingToggle = async (enabled: boolean) => {
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ deferred_billing_enabled: enabled })
        .eq('id', user.id);

      if (error) throw error;

      setDeferredBilling(enabled);
      // Profile will be updated automatically via auth state change
      
      toast({
        title: enabled ? "Facturation différée activée" : "Facturation différée désactivée",
        description: enabled 
          ? "Vos achats seront regroupés sur une facture mensuelle" 
          : "Les paiements redeviendront immédiats",
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les préférences de facturation",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBillingInfoSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update(billingInfo)
        .eq('id', user.id);

      if (error) throw error;

      // Profile will be updated automatically via auth state change
      
      toast({
        title: "Informations sauvegardées",
        description: "Vos informations de facturation ont été mises à jour",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les informations",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!profile?.is_vip) {
    return null;
  }

  return (
    <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-full">
            <Crown className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <span className="text-yellow-800">Espace VIP</span>
            <Badge className="ml-2 bg-yellow-500 hover:bg-yellow-600">
              Membre VIP
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avantages VIP */}
        <div className="bg-white/60 rounded-lg p-4 border border-yellow-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Vos avantages VIP
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Facturation différée disponible
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Support prioritaire
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Conditions tarifaires préférentielles
            </li>
          </ul>
        </div>

        {/* Préférences de facturation */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Préférences de facturation
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-white/60 rounded-lg border border-gray-200">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Facturation différée</Label>
              <p className="text-xs text-gray-600">
                {deferredBilling 
                  ? "Vos achats sont regroupés sur une facture mensuelle" 
                  : "Les paiements sont effectués immédiatement"}
              </p>
            </div>
            <Switch
              checked={deferredBilling}
              onCheckedChange={handleDeferredBillingToggle}
              disabled={saving}
            />
          </div>

          {deferredBilling && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Mode facturation différée activé</span>
              </div>
              <p className="text-xs text-blue-700">
                Vos commandes seront regroupées et facturées à la fin du mois. 
                Vous recevrez une facture détaillée par email.
              </p>
            </div>
          )}
        </div>

        {/* Informations de facturation */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Informations de facturation
          </h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="billing_company" className="text-sm">Société de facturation</Label>
              <Input
                id="billing_company"
                value={billingInfo.billing_company}
                onChange={(e) => setBillingInfo(prev => ({ ...prev, billing_company: e.target.value }))}
                placeholder="Nom de votre société"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="billing_address" className="text-sm">Adresse de facturation</Label>
              <Textarea
                id="billing_address"
                value={billingInfo.billing_address}
                onChange={(e) => setBillingInfo(prev => ({ ...prev, billing_address: e.target.value }))}
                placeholder="Adresse complète de facturation"
                className="mt-1"
                rows={3}
              />
            </div>
            
            <Button 
              onClick={handleBillingInfoSave}
              disabled={saving}
              className="w-full"
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder les informations'}
            </Button>
          </div>
        </div>

        {/* Historique des factures */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Historique des factures
          </h3>
          
          <div className="bg-white/60 rounded-lg p-4 border border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Aucune facture générée pour le moment
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Vos factures apparaîtront ici une fois générées
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VipSection;