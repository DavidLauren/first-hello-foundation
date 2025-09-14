import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
}

export const useAdminMedia = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMediaFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('admin-media')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error fetching media files:', error);
        return;
      }

      const filesWithUrls: MediaFile[] = data.map(file => {
        const { data: urlData } = supabase.storage
          .from('admin-media')
          .getPublicUrl(file.name);

        return {
          id: file.id || file.name,
          name: file.name,
          url: urlData.publicUrl,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || 'unknown',
          created_at: file.created_at || new Date().toISOString()
        };
      });

      setMediaFiles(filesWithUrls);
    } catch (error) {
      console.error('Error in fetchMediaFiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const uploadFile = async (file: File): Promise<MediaFile | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('admin-media')
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
        .from('admin-media')
        .getPublicUrl(fileName);

      const newFile: MediaFile = {
        id: data.id || fileName,
        name: fileName,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        created_at: new Date().toISOString()
      };

      setMediaFiles(prev => [newFile, ...prev]);
      
      toast({
        title: "Fichier uploadé",
        description: `${file.name} a été uploadé avec succès`,
      });

      return newFile;
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

  const deleteFile = async (fileName: string) => {
    try {
      // Vérifier si le fichier est utilisé par des exemples avant suppression
      const fileUrl = `https://lanlbjogoaelaslrrtsu.supabase.co/storage/v1/object/public/admin-media/${fileName}`;
      
      const { data: examples, error: checkError } = await supabase
        .from('examples')
        .select('id, title, before_image_url, after_image_url')
        .or(`before_image_url.eq.${fileUrl},after_image_url.eq.${fileUrl}`);

      if (checkError) {
        console.error('Error checking file usage:', checkError);
        toast({
          title: "Erreur de vérification",
          description: "Impossible de vérifier l'utilisation du fichier",
          variant: "destructive",
        });
        return;
      }

      if (examples && examples.length > 0) {
        const exampleTitles = examples.map(ex => ex.title).join(', ');
        toast({
          title: "Suppression impossible",
          description: `Ce fichier est utilisé par les exemples suivants: ${exampleTitles}. Supprimez d'abord ces exemples ou changez leurs images.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.storage
        .from('admin-media')
        .remove([fileName]);

      if (error) {
        toast({
          title: "Erreur de suppression",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setMediaFiles(prev => prev.filter(file => file.name !== fileName));
      
      toast({
        title: "Fichier supprimé",
        description: "Le fichier a été supprimé avec succès",
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return {
    mediaFiles,
    uploading,
    loading,
    uploadFile,
    deleteFile,
    formatFileSize,
    refetch: fetchMediaFiles
  };
};