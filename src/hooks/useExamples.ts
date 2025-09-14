import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Example {
  id: string;
  title: string;
  description: string;
  category: string;
  beforeImage: string;
  afterImage: string;
  order: number;
  isActive?: boolean;
}

export const useExamples = () => {
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fonction pour normaliser les catégories
  const normalizeCategory = (category: string) => {
    return category.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  const fetchExamples = async () => {
    try {
      const { data, error } = await supabase
        .from('examples')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching examples:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les exemples",
          variant: "destructive",
        });
        return;
      }

      // Transform data to match the old interface with category normalization
      const transformedData: Example[] = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category, // Garde la catégorie originale pour l'affichage
        beforeImage: item.before_image_url,
        afterImage: item.after_image_url,
        order: item.display_order,
        isActive: item.is_active
      }));

      // Trier par ordre d'affichage pour garantir la cohérence
      const sortedData = transformedData.sort((a, b) => a.order - b.order);
      
      setExamples(sortedData);
    } catch (error) {
      console.error('Error in fetchExamples:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamples();

    // Configuration de la synchro temps réel
    const channel = supabase
      .channel('examples_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'examples'
        },
        (payload) => {
          console.log('Exemple modifié:', payload);
          // Recharge automatiquement les données quand un changement est détecté
          fetchExamples();
        }
      )
      .subscribe();

    // Nettoyage à la désactivation du composant
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const saveExample = async (example: Example) => {
    try {
      const isNew = !example.id || example.id === '0';
      
      if (isNew) {
        // Get the highest order to append at the end
        const maxOrder = Math.max(...examples.map(ex => ex.order), 0);
        
        const { data, error } = await supabase
          .from('examples')
          .insert({
            title: example.title,
            description: example.description,
            category: example.category,
            before_image_url: example.beforeImage,
            after_image_url: example.afterImage,
            display_order: maxOrder + 1,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;

        const newExample: Example = {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          beforeImage: data.before_image_url,
          afterImage: data.after_image_url,
          order: data.display_order,
          isActive: data.is_active
        };

        setExamples(prev => [...prev, newExample].sort((a, b) => a.order - b.order));
        
        toast({
          title: "Exemple ajouté",
          description: "L'exemple a été créé avec succès",
        });
      } else {
        const { error } = await supabase
          .from('examples')
          .update({
            title: example.title,
            description: example.description,
            category: example.category,
            before_image_url: example.beforeImage,
            after_image_url: example.afterImage,
            display_order: example.order
          })
          .eq('id', example.id);

        if (error) throw error;

        setExamples(prev => 
          prev.map(ex => 
            ex.id === example.id ? example : ex
          ).sort((a, b) => a.order - b.order)
        );

        toast({
          title: "Exemple modifié",
          description: "L'exemple a été mis à jour avec succès",
        });
      }
    } catch (error) {
      console.error('Error saving example:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'exemple",
        variant: "destructive",
      });
    }
  };

  const deleteExample = async (id: string) => {
    try {
      const { error } = await supabase
        .from('examples')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExamples(prev => prev.filter(ex => ex.id !== id));
      
      toast({
        title: "Exemple supprimé",
        description: "L'exemple a été supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting example:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'exemple",
        variant: "destructive",
      });
    }
  };

  const reorderExamples = async (reorderedExamples: Example[]) => {
    try {
      // Update the orders in the database
      const updates = reorderedExamples.map((example, index) => ({
        id: example.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('examples')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      // Update local state
      const updatedExamples = reorderedExamples.map((example, index) => ({
        ...example,
        order: index + 1
      }));

      setExamples(updatedExamples);

      toast({
        title: "Ordre mis à jour",
        description: "L'ordre des exemples a été sauvegardé",
      });
    } catch (error) {
      console.error('Error reordering examples:', error);
      toast({
        title: "Erreur",
        description: "Impossible de réorganiser les exemples",
        variant: "destructive",
      });
    }
  };

  const getCategories = () => {
    // Dédoublonne les catégories en normalisant puis garde les originales
    const categoryMap = new Map();
    examples.forEach(ex => {
      const normalized = normalizeCategory(ex.category);
      if (!categoryMap.has(normalized)) {
        categoryMap.set(normalized, ex.category);
      }
    });
    const uniqueCategories = Array.from(categoryMap.values()).sort();
    return ['Tous', ...uniqueCategories];
  };

  return {
    examples,
    loading,
    saveExample,
    deleteExample,
    getCategories,
    reorderExamples,
    refetch: fetchExamples
  };
};