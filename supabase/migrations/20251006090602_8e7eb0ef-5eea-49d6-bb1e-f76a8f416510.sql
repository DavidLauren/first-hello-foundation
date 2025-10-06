-- Créer la table des articles de blog
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Politique : tout le monde peut voir les articles publiés
CREATE POLICY "Anyone can view published blog posts"
ON public.blog_posts
FOR SELECT
USING (published = true);

-- Politique : les admins peuvent tout gérer
CREATE POLICY "Admins can manage all blog posts"
ON public.blog_posts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();