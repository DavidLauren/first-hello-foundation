import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ReferralStats {
  referral_code: string;
  referrals_count: number;
  total_rewards: number;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  reward_given_to_referrer: boolean;
  reward_given_to_referred: boolean;
  referrer_reward_amount: number;
  referred_reward_amount: number;
  created_at: string;
  profiles?: {
    contact_name: string;
    email: string;
  };
}

export const useReferral = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  // Charger les statistiques de parrainage
  const fetchReferralStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_referral_stats', {
        _user_id: user.id
      });

      if (error) {
        console.error('Error fetching referral stats:', error);
        return;
      }

      const stats = data as any as ReferralStats;
      
      // Si l'utilisateur n'a pas de code de parrainage, en créer un
      if (!stats.referral_code || stats.referral_code === '') {
        try {
          // Générer un nouveau code avec la fonction dédiée
          const { data: newCode, error: generateError } = await supabase.rpc('generate_referral_code');
          
          if (!generateError && newCode) {
            // Insérer le nouveau code dans la table
            const { error: insertError } = await supabase
              .from('referral_codes')
              .insert({
                user_id: user.id,
                code: newCode
              });
              
            if (!insertError) {
              // Mettre à jour les stats avec le nouveau code
              setStats({
                ...stats,
                referral_code: newCode
              });
            } else {
              console.error('Error inserting referral code:', insertError);
              setStats(stats);
            }
          } else {
            console.error('Error generating referral code:', generateError);
            setStats(stats);
          }
        } catch (createError) {
          console.error('Error creating referral code:', createError);
          setStats(stats);
        }
      } else {
        setStats(stats);
      }
    } catch (error) {
      console.error('Error in fetchReferralStats:', error);
    }
  };

  // Charger la liste des parrainages
  const fetchReferrals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referrals:', error);
        return;
      }

      // Convertir les données en type Referral avec profiles optionnels
      const referralsData = (data || []).map(referral => ({
        ...referral,
        profiles: undefined
      }));

      setReferrals(referralsData);
    } catch (error) {
      console.error('Error in fetchReferrals:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReferralStats();
      fetchReferrals();
    }
  }, [user]);

  // Appliquer un code de parrainage
  const applyReferralCode = async (code: string) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour utiliser un code de parrainage",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('apply_referral_code', {
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
        const result = data as { 
          success: boolean; 
          message: string; 
          referrer_name?: string;
          your_reward?: number;
          referrer_reward?: number;
        };
        
        if (result.success) {
          toast({
            title: "Code de parrainage appliqué !",
            description: `${result.message} Vous avez reçu ${result.your_reward} photo(s) gratuite(s) !`,
          });
          
          // Recharger les données
          await fetchReferralStats();
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
      console.error('Error applying referral code:', error);
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

  // Copier le code de parrainage dans le presse-papiers
  const copyReferralCode = async () => {
    if (!stats?.referral_code) return;

    try {
      await navigator.clipboard.writeText(stats.referral_code);
      toast({
        title: "Code copié !",
        description: "Votre code de parrainage a été copié dans le presse-papiers",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Erreur",
        description: "Impossible de copier le code",
        variant: "destructive",
      });
    }
  };

  return {
    stats,
    referrals,
    loading,
    applyReferralCode,
    copyReferralCode,
    refetch: () => {
      fetchReferralStats();
      fetchReferrals();
    }
  };
};