import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useDeferredBilling = () => {
  const { user } = useAuth();
  const [photosThisMonth, setPhotosThisMonth] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUserDeferredBilling = async () => {
    if (!user) return;
    
    try {
      const currentMonth = new Date();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Compter les commandes VIP complétées ce mois (total_amount = 0 pour VIP, pas encore facturées)
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          created_at,
          order_files(id)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .eq('total_amount', 0)
        .is('invoiced_at', null)
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', lastDay.toISOString());

      if (error) {
        console.error('Error fetching deferred billing:', error);
        return;
      }

      // Compter le nombre total de photos de toutes les commandes VIP du mois
      const totalPhotos = orders?.reduce((acc, order) => {
        return acc + (order.order_files?.length || 0);
      }, 0) || 0;

      setPhotosThisMonth(totalPhotos);

      // Calculer le montant total (prix par photo * nombre de photos)
      const { data: settings } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'price_per_photo')
        .maybeSingle();

      const pricePerPhoto = parseInt(settings?.setting_value || '13');
      setTotalAmount(totalPhotos * pricePerPhoto);
      
    } catch (error) {
      console.error('Error in fetchUserDeferredBilling:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDeferredBilling = async () => {
    try {
      const currentMonth = new Date();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Récupérer toutes les commandes VIP avec facturation différée ce mois (pas encore facturées)
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          created_at,
          order_files(id)
        `)
        .eq('status', 'completed')
        .eq('total_amount', 0)
        .is('invoiced_at', null)
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', lastDay.toISOString());

      if (error) {
        console.error('Error fetching all deferred billing:', error);
        return { users: [], totalPhotos: 0, totalAmount: 0 };
      }

      if (!orders || orders.length === 0) {
        return { users: [], totalPhotos: 0, totalAmount: 0 };
      }

      // Récupérer les profils des utilisateurs concernés
      const userIds = [...new Set(orders.map(order => order.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, contact_name, email, deferred_billing_enabled')
        .in('id', userIds)
        .eq('deferred_billing_enabled', true);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return { users: [], totalPhotos: 0, totalAmount: 0 };
      }

      // Grouper par utilisateur avec facturation différée activée
      const userGroups = orders?.reduce((acc: any, order: any) => {
        const profile = profiles?.find(p => p.id === order.user_id);
        if (!profile?.deferred_billing_enabled) return acc;
        
        const userId = order.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            contact_name: profile.contact_name,
            email: profile.email,
            photos: 0
          };
        }
        acc[userId].photos += order.order_files?.length || 0;
        return acc;
      }, {});

      const users = Object.values(userGroups || {});
      const totalPhotos = users.reduce((acc: number, user: any) => acc + (user.photos || 0), 0);
      
      const { data: settings } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'price_per_photo')
        .maybeSingle();

      const pricePerPhoto = parseInt(settings?.setting_value || '13');
      const totalAmount = (typeof totalPhotos === 'number' ? totalPhotos : 0) * pricePerPhoto;

      return { users, totalPhotos, totalAmount };
    } catch (error) {
      console.error('Error in fetchAllDeferredBilling:', error);
      return { users: [], totalPhotos: 0, totalAmount: 0 };
    }
  };

  const resetDeferredBilling = async () => {
    try {
      // Utiliser l'edge function qui a les permissions service role
      const { data, error } = await supabase.functions.invoke('reset-deferred-billing');

      if (error) {
        console.error('Error calling reset-deferred-billing function:', error);
        return false;
      }

      if (data?.success) {
        console.log('Reset deferred billing successful:', data.message);
        return true;
      } else {
        console.error('Reset deferred billing failed:', data?.error);
        return false;
      }
    } catch (error) {
      console.error('Error resetting deferred billing:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserDeferredBilling();
    }
  }, [user]);

  return {
    photosThisMonth,
    totalAmount,
    loading,
    refetch: fetchUserDeferredBilling,
    fetchAllDeferredBilling,
    resetDeferredBilling
  };
};