-- Ajouter un champ image et ordre d'affichage aux articles de blog
ALTER TABLE public.blog_posts
ADD COLUMN image_url TEXT,
ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;