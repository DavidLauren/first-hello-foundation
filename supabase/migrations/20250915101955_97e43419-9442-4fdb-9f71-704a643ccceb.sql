-- Ajouter les nouvelles colonnes pour la configuration Stripe dans app_settings
INSERT INTO app_settings (setting_key, setting_value, description)
VALUES 
  ('stripe_test_public_key', '', 'Clé publique Stripe pour l''environnement de test'),
  ('stripe_live_public_key', '', 'Clé publique Stripe pour l''environnement de production'),
  ('stripe_mode', 'test', 'Mode Stripe actif (test ou live)')
ON CONFLICT (setting_key) DO NOTHING;