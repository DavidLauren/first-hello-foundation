import { supabase } from '@/integrations/supabase/client';

interface ImageToUpload {
  localPath: string;
  targetName: string;
  exampleTitle: string;
  type: 'before' | 'after';
}

const imagesToUpload: ImageToUpload[] = [
  {
    localPath: '/temp-before-removal.jpg',
    targetName: 'before-removal.jpg',
    exampleTitle: 'Suppression d\'objets indésirables',
    type: 'before'
  },
  {
    localPath: '/temp-after-removal.jpg',
    targetName: 'after-removal.jpg',
    exampleTitle: 'Suppression d\'objets indésirables',
    type: 'after'
  },
  {
    localPath: '/temp-before-lighting.jpg',
    targetName: 'before-lighting.jpg',
    exampleTitle: 'Amélioration de l\'éclairage',
    type: 'before'
  },
  {
    localPath: '/temp-after-lighting.jpg',
    targetName: 'after-lighting.jpg',
    exampleTitle: 'Amélioration de l\'éclairage',
    type: 'after'
  },
  {
    localPath: '/temp-before-portrait.jpg',
    targetName: 'before-portrait.jpg',
    exampleTitle: 'Retouche de portrait',
    type: 'before'
  },
  {
    localPath: '/temp-after-portrait.jpg',
    targetName: 'after-portrait.jpg',
    exampleTitle: 'Retouche de portrait',
    type: 'after'
  },
  {
    localPath: '/temp-before-example.jpg',
    targetName: 'before-example.jpg',
    exampleTitle: 'Restauration de photo ancienne',
    type: 'before'
  },
  {
    localPath: '/temp-after-example.jpg',
    targetName: 'after-example.jpg',
    exampleTitle: 'Restauration de photo ancienne',
    type: 'after'
  }
];

export const uploadExampleImages = async () => {
  console.log('Starting upload of example images...');
  
  for (const image of imagesToUpload) {
    try {
      // Fetch the image as blob
      const response = await fetch(image.localPath);
      if (!response.ok) {
        console.error(`Failed to fetch ${image.localPath}`);
        continue;
      }
      
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('admin-media')
        .upload(image.targetName, blob, {
          cacheControl: '3600',
          upsert: true // Overwrite if exists
        });

      if (error) {
        console.error(`Error uploading ${image.targetName}:`, error);
        continue;
      }

      console.log(`Successfully uploaded: ${image.targetName}`);
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('admin-media')
        .getPublicUrl(image.targetName);

      console.log(`Public URL for ${image.targetName}: ${urlData.publicUrl}`);

    } catch (error) {
      console.error(`Error processing ${image.targetName}:`, error);
    }
  }
  
  console.log('Upload process completed. Refreshing page to see updated images...');
  window.location.reload();
};

// Auto-run if this file is imported
if (typeof window !== 'undefined') {
  console.log('Example images uploader ready. Call uploadExampleImages() to start upload.');
}