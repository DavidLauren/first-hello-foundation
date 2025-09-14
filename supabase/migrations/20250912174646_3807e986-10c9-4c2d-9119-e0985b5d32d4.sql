-- Update examples with proper Supabase storage URLs
-- These URLs should be updated to point to actual uploaded images in the admin-media bucket

UPDATE public.examples 
SET 
  before_image_url = 'https://lanlbjogoaelaslrrtsu.supabase.co/storage/v1/object/public/admin-media/before-removal.jpg',
  after_image_url = 'https://lanlbjogoaelaslrrtsu.supabase.co/storage/v1/object/public/admin-media/after-removal.jpg'
WHERE title = 'Suppression d''objets indésirables';

UPDATE public.examples 
SET 
  before_image_url = 'https://lanlbjogoaelaslrrtsu.supabase.co/storage/v1/object/public/admin-media/before-lighting.jpg',
  after_image_url = 'https://lanlbjogoaelaslrrtsu.supabase.co/storage/v1/object/public/admin-media/after-lighting.jpg'
WHERE title = 'Amélioration de l''éclairage';

UPDATE public.examples 
SET 
  before_image_url = 'https://lanlbjogoaelaslrrtsu.supabase.co/storage/v1/object/public/admin-media/before-portrait.jpg',
  after_image_url = 'https://lanlbjogoaelaslrrtsu.supabase.co/storage/v1/object/public/admin-media/after-portrait.jpg'
WHERE title = 'Retouche de portrait';

UPDATE public.examples 
SET 
  before_image_url = 'https://lanlbjogoaelaslrrtsu.supabase.co/storage/v1/object/public/admin-media/before-example.jpg',
  after_image_url = 'https://lanlbjogoaelaslrrtsu.supabase.co/storage/v1/object/public/admin-media/after-example.jpg'
WHERE title = 'Restauration de photo ancienne';

UPDATE public.examples 
SET 
  before_image_url = 'https://lanlbjogoaelaslrrtsu.supabase.co/storage/v1/object/public/admin-media/before-example.jpg',
  after_image_url = 'https://lanlbjogoaelaslrrtsu.supabase.co/storage/v1/object/public/admin-media/after-example.jpg'
WHERE title = 'Modification d''arrière-plan';

UPDATE public.examples 
SET 
  before_image_url = 'https://lanlbjogoaelaslrrtsu.supabase.co/storage/v1/object/public/admin-media/before-example.jpg',
  after_image_url = 'https://lanlbjogoaelaslrrtsu.supabase.co/storage/v1/object/public/admin-media/after-example.jpg'
WHERE title = 'Correction de perspective';