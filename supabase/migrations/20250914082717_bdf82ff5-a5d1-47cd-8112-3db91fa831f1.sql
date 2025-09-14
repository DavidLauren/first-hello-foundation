-- Mettre à jour la contrainte pour inclure le statut 'delivered'
ALTER TABLE public.orders DROP CONSTRAINT valid_status;

-- Créer la nouvelle contrainte avec tous les statuts valides
ALTER TABLE public.orders ADD CONSTRAINT valid_status 
CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'delivered'::text, 'cancelled'::text, 'refunded'::text]));

-- Créer le déclencheur pour mettre à jour automatiquement le statut quand des fichiers sont livrés
CREATE OR REPLACE FUNCTION public.update_order_delivered_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Mettre à jour la commande avec la date de livraison et le statut
  UPDATE public.orders 
  SET delivered_at = now(), 
      status = 'delivered',
      updated_at = now()
  WHERE id = NEW.order_id 
  AND delivered_at IS NULL;
  
  RETURN NEW;
END;
$$;

-- Créer le déclencheur sur la table delivered_files
DROP TRIGGER IF EXISTS update_order_delivered_at_trigger ON delivered_files;
CREATE TRIGGER update_order_delivered_at_trigger
  AFTER INSERT ON public.delivered_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_delivered_at();

-- Mettre à jour manuellement la commande CP20250914-0067
UPDATE public.orders 
SET delivered_at = (
  SELECT MIN(created_at) 
  FROM delivered_files 
  WHERE order_id = (SELECT id FROM orders WHERE order_number = 'CP20250914-0067')
),
status = 'delivered',
updated_at = now()
WHERE order_number = 'CP20250914-0067';