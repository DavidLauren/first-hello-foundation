import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PromoCode {
  id: string;
  code: string;
  free_photos: number;
  max_uses?: number;
  current_uses: number;
  active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface UserPromoUsage {
  id: string;
  promo_code_id: string;
  photos_used: number;
  photos_remaining: number;
  used_at: string;
  promo_code?: PromoCode;
}

export const usePromoCodes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userFreePhotos, setUserFreePhotos] = useState(0);
  const [userPromoUsage, setUserPromoUsage] = useState<UserPromoUsage[]>([]);

  // Charger les photos gratuites de l'utilisateur
  const fetchUserFreePhotos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_free_photos', {
        _user_id: user.id
      });

      if (error) {
        console.error('Error fetching free photos:', error);
        return;
      }

      setUserFreePhotos(data || 0);
    } catch (error) {
      console.error('Error in fetchUserFreePhotos:', error);
    }
  };

  // Charger l'historique des codes promo de l'utilisateur
  const fetchUserPromoUsage = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_promo_usage')
        .select(`
          *,
          promo_code:promo_codes(*)
        `)
        .eq('user_id', user.id)
        .order('used_at', { ascending: false });

      if (error) {
        console.error('Error fetching promo usage:', error);
        return;
      }

      setUserPromoUsage(data || []);
    } catch (error) {
      console.error('Error in fetchUserPromoUsage:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserFreePhotos();
      fetchUserPromoUsage();
    }
  }, [user]);

  // Appliquer un code promo
  const applyPromoCode = async (code: string) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour utiliser un code promo",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('apply_promo_code', {
        _user_id: user.id,
        _code: code.trim().toUpperCase()
      });

      if (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'application du code",
          variant: "destructive",
        });
        return false;
      }

      if (data && typeof data === 'object' && data !== null) {
        const result = data as { success: boolean; message: string; free_photos?: number };
        
        if (result.success) {
          toast({
            title: "Code promo appliqué !",
            description: `Vous avez reçu ${result.free_photos} photo(s) gratuite(s)`,
          });
          
          // Recharger les données
          await fetchUserFreePhotos();
          await fetchUserPromoUsage();
          return true;
        } else {
          toast({
            title: "Code invalide",
            description: result.message,
            variant: "destructive",
          });
          return false;
        }
      }
    } catch (error) {
      console.error('Error applying promo code:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Utiliser des photos gratuites
  const useFreePhotos = async (count: number) => {
    if (!user || userFreePhotos < count) return false;

    try {
      // Décrémenter les photos restantes dans l'ordre chronologique
      const { error } = await supabase
        .from('user_promo_usage')
        .update({ 
          photos_remaining: userFreePhotos - count,
          photos_used: userPromoUsage[0]?.photos_used + count || count
        })
        .eq('user_id', user.id)
        .gt('photos_remaining', 0);

      if (!error) {
        setUserFreePhotos(prev => prev - count);
        return true;
      }
    } catch (error) {
      console.error('Error using free photos:', error);
    }
    return false;
  };

  return {
    userFreePhotos,
    userPromoUsage,
    loading,
    applyPromoCode,
    useFreePhotos,
    refetch: () => {
      fetchUserFreePhotos();
      fetchUserPromoUsage();
    }
  };
};