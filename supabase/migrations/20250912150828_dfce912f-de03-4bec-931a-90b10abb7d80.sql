-- Ajouter les nouveaux paramètres pour les images de la rangée du bas de la homepage
INSERT INTO app_settings (setting_key, setting_value, description) VALUES 
('homepage_before_image2', '', 'URL de l''image "avant 2" de la page d''accueil'),
('homepage_after_image2', '', 'URL de l''image "après 2" de la page d''accueil')
ON CONFLICT (setting_key) DO NOTHING;