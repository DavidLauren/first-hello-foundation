import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminCharges = (userId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: charges, isLoading } = useQuery({
    queryKey: ['admin-charges', userId],
    queryFn: async () => {
      const query = supabase
        .from('admin_charges')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (userId) {
        query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const createCharge = useMutation({
    mutationFn: async ({ userId, amount, description }: { 
      userId: string; 
      amount: number;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('admin_charges')
        .insert({
          user_id: userId,
          amount: Math.round(amount * 100), // Convert to cents
          description: description || 'Document numérique',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-charges'] });
      toast({
        title: 'Charge créée',
        description: 'La charge a été ajoutée avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error creating charge:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la charge.',
        variant: 'destructive',
      });
    },
  });

  return {
    charges,
    isLoading,
    createCharge: createCharge.mutate,
  };
};
