-- Ajouter des colonnes pour les images avant/après dans blog_posts
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS before_image_url text,
ADD COLUMN IF NOT EXISTS after_image_url text;