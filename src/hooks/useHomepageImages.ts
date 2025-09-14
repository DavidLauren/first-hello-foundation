import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import beforeExample from '@/assets/before-example.jpg';
import afterExample from '@/assets/after-example.jpg';

export interface HomepageImage {
  before: string;
  after: string;
  before2: string;
  after2: string;
}

export const useHomepageImages = () => {
  const [images, setImages] = useState<HomepageImage>({
    before: beforeExample,
    after: afterExample,
    before2: beforeExample,
    after2: afterExample
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['homepage_before_image', 'homepage_after_image', 'homepage_before_image2', 'homepage_after_image2']);

      if (error) {
        console.error('Error fetching homepage images:', error);
        setLoading(false);
        return;
      }

      const settings = data?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, string>) || {};

      console.info('Homepage images settings', settings);
      setImages({
        before: settings.homepage_before_image || beforeExample,
        after: settings.homepage_after_image || afterExample,
        before2: settings.homepage_before_image2 || beforeExample,
        after2: settings.homepage_after_image2 || afterExample
      });
    } catch (error) {
      console.error('Error in fetchImages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const uploadImage = async (file: File, type: 'before' | 'after' | 'before2' | 'after2'): Promise<string | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `homepage-${type}-${Date.now()}.${fileExt}`;

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

  const updateImage = async (type: 'before' | 'after' | 'before2' | 'after2', url: string) => {
    try {
      const settingKey = type === 'before' ? 'homepage_before_image' : 
                        type === 'after' ? 'homepage_after_image' :
                        type === 'before2' ? 'homepage_before_image2' : 'homepage_after_image2';
      
      const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: url, updated_at: new Date().toISOString() })
        .eq('setting_key', settingKey);

      if (error) {
        toast({
          title: "Erreur de mise à jour",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setImages(prev => ({
        ...prev,
        [type]: url
      }));

      toast({
        title: "Image mise à jour",
        description: `L'image ${type.includes('2') ? '2 ' : ''}${type.includes('before') ? 'avant' : 'après'} a été mise à jour avec succès`,
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

  return {
    images,
    loading,
    uploading,
    uploadImage,
    updateImage,
    refetch: fetchImages
  };
};