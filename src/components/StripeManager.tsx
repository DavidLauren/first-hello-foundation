import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CreditCard, TestTube, Shield } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";


const StripeManager = () => {
  const { settings, updateSetting, loading } = useAppSettings();
  const { toast } = useToast();
  const [isTestMode, setIsTestMode] = useState(true);
  const [testPublicKey, setTestPublicKey] = useState('');
  const [livePublicKey, setLivePublicKey] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.length > 0) {
      const testKeySetting = settings.find(s => s.setting_key === 'stripe_test_public_key');
      const liveKeySetting = settings.find(s => s.setting_key === 'stripe_live_public_key');
      const modeSetting = settings.find(s => s.setting_key === 'stripe_mode');
      
      setTestPublicKey(testKeySetting?.setting_value || '');
      setLivePublicKey(liveKeySetting?.setting_value || '');
      setIsTestMode(modeSetting?.setting_value === 'test' || !modeSetting);
    }
  }, [settings]);

  const handleSaveKeys = async () => {
    setSaving(true);
    try {
      // Sauvegarder les clés publiques
      await updateSetting('stripe_test_public_key', testPublicKey);
      await updateSetting('stripe_live_public_key', livePublicKey);
      
      toast({
        title: "Clés sauvegardées",
        description: "Les clés Stripe ont été mises à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les clés",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleModeSwitch = async (newMode: boolean) => {
    const mode = newMode ? 'test' : 'live';
    setIsTestMode(newMode);
    
    try {
      await updateSetting('stripe_mode', mode);
      
      // Mettre à jour la clé publique active
      const activeKey = newMode ? testPublicKey : livePublicKey;
      if (activeKey) {
        await updateSetting('stripe_public_key', activeKey);
      }
      
      toast({
        title: "Mode Stripe changé",
        description: `Mode ${newMode ? 'test' : 'live'} activé`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de changer le mode",
        variant: "destructive",
      });
    }
  };

  const getCurrentPublicKey = () => {
    return isTestMode ? testPublicKey : livePublicKey;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configuration Stripe
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isTestMode ? "secondary" : "default"} className="flex items-center gap-1">
              {isTestMode ? <TestTube className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
              Mode {isTestMode ? 'Test' : 'Live'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {isTestMode ? 'Environnement de test' : 'Environnement de production'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basculer entre test et live */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Mode Stripe</Label>
              <p className="text-sm text-muted-foreground">
                Basculer entre l'environnement de test et de production
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${isTestMode ? 'font-medium' : 'text-muted-foreground'}`}>
                Test
              </span>
              <Switch
                checked={!isTestMode}
                onCheckedChange={(checked) => handleModeSwitch(!checked)}
              />
              <span className={`text-sm ${!isTestMode ? 'font-medium' : 'text-muted-foreground'}`}>
                Live
              </span>
            </div>
          </div>

          {/* Configuration des clés */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-key">Clé publique test</Label>
              <Input
                id="test-key"
                placeholder="pk_test_..."
                value={testPublicKey}
                onChange={(e) => setTestPublicKey(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="live-key">Clé publique live</Label>
              <Input
                id="live-key"
                placeholder="pk_live_..."
                value={livePublicKey}
                onChange={(e) => setLivePublicKey(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Clé active */}
          <div className="p-4 bg-muted rounded-lg">
            <Label className="text-sm font-medium">Clé publique active</Label>
            <p className="text-sm text-muted-foreground mt-1 font-mono break-all">
              {getCurrentPublicKey() || 'Aucune clé configurée'}
            </p>
          </div>

          <Button 
            onClick={handleSaveKeys} 
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder les clés'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeManager;