-- Ajouter des politiques RLS pour que les admins puissent voir toutes les commandes et fichiers
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all order files" 
ON public.order_files 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));