-- Ajouter une politique pour permettre aux utilisateurs de supprimer leurs propres commandes
-- Mais seulement si elles ne sont pas livrées et n'ont pas de fichiers livrés
CREATE POLICY "Users can delete their own undelivered orders" 
ON public.orders 
FOR DELETE 
USING (
  auth.uid() = user_id 
  AND delivered_at IS NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.delivered_files 
    WHERE order_id = orders.id
  )
);