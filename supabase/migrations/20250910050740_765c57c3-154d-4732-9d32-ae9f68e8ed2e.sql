-- Ajouter une colonne pour marquer quand une commande a été facturée
ALTER TABLE public.orders 
ADD COLUMN invoiced_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;