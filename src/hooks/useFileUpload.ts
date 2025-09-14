import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  url: string;
  path: string;
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadFiles = async (files: FileList): Promise<UploadedFile[]> => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour uploader des fichiers",
        variant: "destructive",
      });
      return [];
    }

    setUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Format non supporté",
            description: `Le fichier ${file.name} n'est pas une image`,
            variant: "destructive",
          });
          continue;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
          toast({
            title: "Fichier trop volumineux",
            description: `Le fichier ${file.name} dépasse 50MB`,
            variant: "destructive",
          });
          continue;
        }

        // Create unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('photo-uploads')
          .upload(filePath, file);

        if (error) {
          console.error('Upload error:', error);
          toast({
            title: "Erreur d'upload",
            description: `Impossible d'uploader ${file.name}: ${error.message}`,
            variant: "destructive",
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('photo-uploads')
          .getPublicUrl(filePath);

        const uploadedFile: UploadedFile = {
          id: data.id || fileName,
          name: file.name,
          size: file.size,
          url: publicUrl,
          path: filePath,
        };

        uploadedFiles.push(uploadedFile);
      }

      setUploadedFiles(prev => [...prev, ...uploadedFiles]);
      
      if (uploadedFiles.length > 0) {
        toast({
          title: "Upload réussi",
          description: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
        });
      }

    } catch (error) {
      console.error('Upload process error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }

    return uploadedFiles;
  };

  const removeFile = async (file: UploadedFile) => {
    try {
      // Remove from storage
      const { error } = await supabase.storage
        .from('photo-uploads')
        .remove([file.path]);

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le fichier",
          variant: "destructive",
        });
        return;
      }

      // Remove from state
      setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
      
      toast({
        title: "Fichier supprimé",
        description: `${file.name} a été supprimé`,
      });
    } catch (error) {
      console.error('Remove file error:', error);
    }
  };

  const clearFiles = () => {
    setUploadedFiles([]);
  };

  return {
    uploading,
    uploadedFiles,
    uploadFiles,
    removeFile,
    clearFiles,
  };
};