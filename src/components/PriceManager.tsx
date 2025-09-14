import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Euro, Save } from 'lucide-react';

const PriceManager = () => {
  const { settings, loading, updateSetting, getPricePerPhoto } = useAppSettings();
  const [pricePerPhoto, setPricePerPhoto] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Initialize price from settings when they load
  useState(() => {
    if (!loading && settings.length > 0) {
      setPricePerPhoto(getPricePerPhoto().toString());
    }
  });

  const handleSavePrice = async () => {
    setSaving(true);
    const success = await updateSetting('price_per_photo', pricePerPhoto);
    if (success) {
      // Reload the page to update all price displays
      window.location.reload();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Configuration des prix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price-per-photo">Prix par photo (€)</Label>
            <div className="flex gap-2">
              <Input
                id="price-per-photo"
                type="number"
                min="1"
                step="1"
                value={pricePerPhoto}
                onChange={(e) => setPricePerPhoto(e.target.value)}
                placeholder={getPricePerPhoto().toString()}
                className="max-w-32"
              />
              <Button 
                onClick={handleSavePrice}
                disabled={saving || !pricePerPhoto || pricePerPhoto === getPricePerPhoto().toString()}
                className="bg-brand-primary hover:bg-brand-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Ce prix sera affiché partout sur le site. Actuellement : <strong>{getPricePerPhoto()}€</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Le prix sera mis à jour partout sur le site après sauvegarde</p>
            <p>• Les commandes en cours conserveront leur prix d'origine</p>
            <p>• La page se rechargera automatiquement pour appliquer les changements</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceManager;