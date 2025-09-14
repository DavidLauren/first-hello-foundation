import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePromoCodes } from '@/hooks/usePromoCodes';
import { Gift, History, Sparkles } from 'lucide-react';

const PromoCodeSection = () => {
  const { userFreePhotos, userPromoUsage, loading, applyPromoCode } = usePromoCodes();
  const [promoCode, setPromoCode] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    setApplying(true);
    const success = await applyPromoCode(promoCode);
    if (success) {
      setPromoCode('');
    }
    setApplying(false);
  };

  return (
    <div className="space-y-6">
      {/* Solde de photos gratuites */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Gift className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Photos gratuites disponibles</h3>
              <p className="text-2xl font-bold text-green-600">
                {userFreePhotos} photo{userFreePhotos > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire code promo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-primary" />
            Appliquer un code promo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleApplyCode} className="space-y-4">
            <div>
              <Label htmlFor="promo-code">Code promo</Label>
              <div className="flex gap-3">
                <Input
                  id="promo-code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Saisissez votre code promo"
                  className="flex-1"
                  disabled={applying}
                />
                <Button 
                  type="submit" 
                  disabled={!promoCode.trim() || applying}
                  className="bg-gradient-button hover:scale-105 transform transition-all duration-300"
                >
                  {applying ? 'Application...' : 'Appliquer'}
                </Button>
              </div>
            </div>
          </form>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              💡 <strong>Astuce :</strong> Les codes promo vous donnent des photos gratuites à utiliser pour vos retouches !
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Historique des codes promo */}
      {userPromoUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-gray-600" />
              Historique des codes promo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userPromoUsage.map((usage) => (
                <div 
                  key={usage.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {usage.promo_code?.code}
                    </p>
                    <p className="text-sm text-gray-600">
                      Utilisé le {new Date(usage.used_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{usage.promo_code?.free_photos} photos
                    </p>
                    <p className="text-sm text-gray-500">
                      Restantes: {usage.photos_remaining}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PromoCodeSection;