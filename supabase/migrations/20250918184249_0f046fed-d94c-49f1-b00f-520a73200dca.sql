-- Create table for dynamic homepage image pairs
CREATE TABLE public.homepage_image_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_image_pairs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Homepage image pairs are publicly readable" 
ON public.homepage_image_pairs 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage homepage image pairs" 
ON public.homepage_image_pairs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_homepage_image_pairs_updated_at
BEFORE UPDATE ON public.homepage_image_pairs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();