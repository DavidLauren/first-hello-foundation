-- Corriger le déclencheur pour mettre à jour le statut des commandes
DROP TRIGGER IF EXISTS update_order_delivered_at_trigger ON delivered_files;

-- Créer le déclencheur manquant
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