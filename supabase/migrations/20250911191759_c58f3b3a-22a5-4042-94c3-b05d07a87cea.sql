-- Create storage bucket for homepage images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('homepage-images', 'homepage-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for homepage images
CREATE POLICY "Homepage images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'homepage-images');

CREATE POLICY "Admins can upload homepage images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'homepage-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update homepage images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'homepage-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete homepage images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'homepage-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Add homepage image settings to app_settings if they don't exist
INSERT INTO app_settings (setting_key, setting_value, description) 
VALUES 
  ('homepage_before_image', '/src/assets/before-example.jpg', 'URL de l''image "avant" de la page d''accueil'),
  ('homepage_after_image', '/src/assets/after-example.jpg', 'URL de l''image "après" de la page d''accueil')
ON CONFLICT (setting_key) DO NOTHING;