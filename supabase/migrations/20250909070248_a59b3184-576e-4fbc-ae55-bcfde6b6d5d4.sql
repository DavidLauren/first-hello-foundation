-- Créer le bucket pour les médias admin
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-media', 'admin-media', true);

-- Politiques pour que les admins puissent uploader des fichiers
CREATE POLICY "Admins can upload media files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'admin-media' AND 
  public.has_role(auth.uid(), 'admin')
);

-- Politiques pour que les admins puissent voir tous les fichiers média
CREATE POLICY "Admins can view all media files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'admin-media' AND 
  public.has_role(auth.uid(), 'admin')
);

-- Politiques pour que les admins puissent supprimer des fichiers média
CREATE POLICY "Admins can delete media files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'admin-media' AND 
  public.has_role(auth.uid(), 'admin')
);

-- Tout le monde peut voir les fichiers (bucket public pour affichage sur le site)
CREATE POLICY "Public can view media files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'admin-media');