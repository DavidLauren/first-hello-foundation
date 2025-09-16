-- Ajouter une colonne notes à la table profiles pour permettre aux admins de prendre des notes sur les clients
ALTER TABLE public.profiles 
ADD COLUMN admin_notes TEXT;