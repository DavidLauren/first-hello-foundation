-- Créer un bucket de stockage pour les fichiers finaux
INSERT INTO storage.buckets (id, name, public) VALUES ('final-photos', 'final-photos', false);

-- Créer une table pour les fichiers finaux livrés
CREATE TABLE public.delivered_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS sur delivered_files
ALTER TABLE public.delivered_files ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour delivered_files
CREATE POLICY "Users can view their delivered files" 
ON public.delivered_files 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = delivered_files.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all delivered files" 
ON public.delivered_files 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ajouter une colonne delivered_at à la table orders
ALTER TABLE public.orders ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;

-- Politique pour les storage objects du bucket final-photos
CREATE POLICY "Users can view their final photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'final-photos' 
  AND EXISTS (
    SELECT 1 FROM public.delivered_files df
    JOIN public.orders o ON o.id = df.order_id
    WHERE df.file_path = name AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can upload final photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'final-photos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can view all final photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'final-photos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger pour mettre à jour delivered_at quand on ajoute des fichiers livrés
CREATE OR REPLACE FUNCTION public.update_order_delivered_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders 
  SET delivered_at = now(), 
      status = 'delivered'
  WHERE id = NEW.order_id 
  AND delivered_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_delivered_at_trigger
  AFTER INSERT ON public.delivered_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_delivered_at();