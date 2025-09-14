-- Activer les mises à jour en temps réel pour la table examples
ALTER TABLE public.examples REPLICA IDENTITY FULL;

-- Ajouter la table à la publication supabase_realtime pour activer la synchronisation temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE public.examples;