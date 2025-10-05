-- Migration : Copier les paires fixes de app_settings vers homepage_image_pairs
-- et nettoyer les anciennes entrées

-- Insérer la première paire (si elle n'existe pas déjà avec ces URLs)
INSERT INTO homepage_image_pairs (title, description, before_image_url, after_image_url, display_order, is_active)
SELECT 
  'Paire fixe 1' as title,
  'Ancienne paire fixe migrée' as description,
  (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_before_image') as before_image_url,
  (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_after_image') as after_image_url,
  0 as display_order,
  true as is_active
WHERE 
  -- Ne pas insérer si les URLs existent déjà
  NOT EXISTS (
    SELECT 1 FROM homepage_image_pairs 
    WHERE before_image_url = (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_before_image')
    AND after_image_url = (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_after_image')
  )
  -- Ne pas insérer si les URLs sont vides
  AND (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_before_image') IS NOT NULL
  AND (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_before_image') != ''
  AND (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_after_image') IS NOT NULL
  AND (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_after_image') != '';

-- Insérer la deuxième paire (si elle n'existe pas déjà avec ces URLs)
INSERT INTO homepage_image_pairs (title, description, before_image_url, after_image_url, display_order, is_active)
SELECT 
  'Paire fixe 2' as title,
  'Ancienne paire fixe migrée' as description,
  (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_before_image2') as before_image_url,
  (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_after_image2') as after_image_url,
  1 as display_order,
  true as is_active
WHERE 
  -- Ne pas insérer si les URLs existent déjà
  NOT EXISTS (
    SELECT 1 FROM homepage_image_pairs 
    WHERE before_image_url = (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_before_image2')
    AND after_image_url = (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_after_image2')
  )
  -- Ne pas insérer si les URLs sont vides
  AND (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_before_image2') IS NOT NULL
  AND (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_before_image2') != ''
  AND (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_after_image2') IS NOT NULL
  AND (SELECT setting_value FROM app_settings WHERE setting_key = 'homepage_after_image2') != '';

-- Réorganiser les display_order pour que tout soit cohérent
UPDATE homepage_image_pairs
SET display_order = subquery.new_order
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY display_order, created_at) as new_order
  FROM homepage_image_pairs
  WHERE is_active = true
) as subquery
WHERE homepage_image_pairs.id = subquery.id;

-- Optionnel : Vider les anciennes clés app_settings (commenté pour sécurité)
-- UPDATE app_settings SET setting_value = '' WHERE setting_key IN ('homepage_before_image', 'homepage_after_image', 'homepage_before_image2', 'homepage_after_image2');