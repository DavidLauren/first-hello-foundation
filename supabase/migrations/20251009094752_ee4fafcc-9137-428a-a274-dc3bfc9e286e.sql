-- Ajouter une colonne pour les vidéos dans blog_posts
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS video_url text;