import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';

export const usePendingOrdersCount = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  return useQuery({
    queryKey: ['pending-orders-count'],
    queryFn: async () => {
      if (!user || !isAdmin) {
        return 0;
      }

      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'processing']);

      if (error) {
        console.error('Error fetching pending orders count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user && isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};