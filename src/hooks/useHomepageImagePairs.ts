import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HomepageImagePair {
  id: string;
  title: string;
  description: string;
  before_image_url: string;
  after_image_url: string;
  display_order: number;
  is_active: boolean;
}

export const useHomepageImagePairs = () => {
  const [imagePairs, setImagePairs] = useState<HomepageImagePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchImagePairs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('homepage_image_pairs')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching homepage image pairs:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des images",
          variant: "destructive",
        });
        return;
      }

      setImagePairs(data || []);
    } catch (error) {
      console.error('Error in fetchImagePairs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImagePairs();
  }, []);

  const uploadImage = async (file: File, type: 'before' | 'after'): Promise<string | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `homepage-pair-${type}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('homepage-images')
        .upload(fileName, file);

      if (error) {
        toast({
          title: "Erreur d'upload",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('homepage-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erreur d'upload",
        description: "Une erreur est survenue lors de l'upload",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const addImagePair = async (imagePair: Omit<HomepageImagePair, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('homepage_image_pairs')
        .insert([imagePair])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setImagePairs(prev => [...prev, data]);
      toast({
        title: "Succès",
        description: "Paire d'images ajoutée avec succès",
      });
    } catch (error) {
      console.error('Add error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout",
        variant: "destructive",
      });
    }
  };

  const updateImagePair = async (id: string, updates: Partial<HomepageImagePair>) => {
    try {
      const { error } = await supabase
        .from('homepage_image_pairs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setImagePairs(prev => prev.map(pair => 
        pair.id === id ? { ...pair, ...updates } : pair
      ));

      toast({
        title: "Succès",
        description: "Paire d'images mise à jour avec succès",
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const deleteImagePair = async (id: string) => {
    try {
      const { error } = await supabase
        .from('homepage_image_pairs')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setImagePairs(prev => prev.filter(pair => pair.id !== id));
      toast({
        title: "Succès",
        description: "Paire d'images supprimée avec succès",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const reorderImagePairs = async (newOrder: HomepageImagePair[]) => {
    try {
      const updates = newOrder.map((pair, index) => ({
        id: pair.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('homepage_image_pairs')
          .update({ display_order: update.display_order, updated_at: new Date().toISOString() })
          .eq('id', update.id);
      }

      setImagePairs(newOrder);
      toast({
        title: "Succès",
        description: "Ordre des images mis à jour",
      });
    } catch (error) {
      console.error('Reorder error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du réordonnancement",
        variant: "destructive",
      });
    }
  };

  return {
    imagePairs,
    loading,
    uploading,
    uploadImage,
    addImagePair,
    updateImagePair,
    deleteImagePair,
    reorderImagePairs,
    refetch: fetchImagePairs
  };
};