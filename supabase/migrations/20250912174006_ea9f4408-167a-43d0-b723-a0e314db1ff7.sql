-- Create examples table to manage gallery examples properly
CREATE TABLE public.examples (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  before_image_url text NOT NULL,
  after_image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.examples ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active examples
CREATE POLICY "Examples are publicly readable" 
ON public.examples 
FOR SELECT 
USING (is_active = true);

-- Only admins can manage examples
CREATE POLICY "Admins can manage examples" 
ON public.examples 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_examples_updated_at
  BEFORE UPDATE ON public.examples
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default examples (using placeholder URLs that should be replaced with actual Supabase URLs)
INSERT INTO public.examples (title, description, category, before_image_url, after_image_url, display_order) VALUES
('Suppression d''objets indésirables', 'Elimination parfaite d''éléments gênants dans la composition', 'Suppression d''objets', '/placeholder.svg', '/placeholder.svg', 1),
('Amélioration de l''éclairage', 'Correction professionnelle de l''exposition et des couleurs', 'Éclairage', '/placeholder.svg', '/placeholder.svg', 2),
('Retouche de portrait', 'Sublimation naturelle sans effet artificiel', 'Portrait', '/placeholder.svg', '/placeholder.svg', 3),
('Restauration de photo ancienne', 'Redonner vie aux souvenirs précieux', 'Restauration', '/placeholder.svg', '/placeholder.svg', 4),
('Modification d''arrière-plan', 'Changement complet de décor avec réalisme parfait', 'Arrière-plan', '/placeholder.svg', '/placeholder.svg', 5),
('Correction de perspective', 'Redressement architectural et correction des déformations', 'Architecture', '/placeholder.svg', '/placeholder.svg', 6);