-- Ajouter une colonne archived_at pour les factures archivées
ALTER TABLE public.deferred_invoices 
ADD COLUMN archived_at timestamp with time zone NULL;