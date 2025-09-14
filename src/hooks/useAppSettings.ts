import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description?: string;
}

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('setting_key');

      if (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres",
          variant: "destructive",
        });
      } else {
        setSettings(data || []);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingKey: string, value: string) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey);

      if (error) {
        console.error('Error updating setting:', error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le paramètre",
          variant: "destructive",
        });
        return false;
      } else {
        await fetchSettings(); // Refresh settings
        toast({
          title: "Paramètre mis à jour",
          description: "Le paramètre a été sauvegardé avec succès",
        });
        return true;
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  };

  const getPricePerPhoto = (): number => {
    const priceSetting = settings.find(s => s.setting_key === 'price_per_photo');
    return parseInt(priceSetting?.setting_value || '14');
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    loading,
    updateSetting,
    getPricePerPhoto,
    refetch: fetchSettings
  };
};