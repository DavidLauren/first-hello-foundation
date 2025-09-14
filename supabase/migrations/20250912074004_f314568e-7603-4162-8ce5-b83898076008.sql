-- Correction 1: Restreindre l'accès aux codes promo
-- Les utilisateurs ne peuvent voir que les codes qu'ils ont utilisés
DROP POLICY IF EXISTS "Authenticated users can view active promo codes" ON promo_codes;

CREATE POLICY "Users can only view promo codes during validation" 
ON promo_codes 
FOR SELECT 
TO authenticated 
USING (
  -- Seuls les admins peuvent voir tous les codes
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  -- Ou si l'utilisateur a déjà utilisé ce code
  EXISTS (
    SELECT 1 FROM user_promo_usage 
    WHERE user_id = auth.uid() AND promo_code_id = promo_codes.id
  )
);

-- Correction 2: Restreindre l'accès aux paramètres d'application
DROP POLICY IF EXISTS "Authenticated users can view app settings" ON app_settings;

CREATE POLICY "Limited app settings access" 
ON app_settings 
FOR SELECT 
TO authenticated 
USING (
  -- Admins peuvent tout voir
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Utilisateurs ne peuvent voir que certains paramètres publics non-sensibles
  setting_key IN ('company_name', 'contact_email', 'website_url')
);

-- Correction 3: Permettre l'accès au prix seulement pendant le checkout
CREATE POLICY "Price access during checkout only" 
ON app_settings 
FOR SELECT 
TO authenticated 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR
  (setting_key = 'price_per_photo' AND auth.uid() IS NOT NULL)
);

-- Correction 4: Sécuriser les search_path des fonctions
CREATE OR REPLACE FUNCTION public.apply_promo_code(_user_id uuid, _code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    promo_record RECORD;
    existing_usage RECORD;
    result JSON;
BEGIN
    -- Le code reste identique, seul le SET search_path est ajouté
    SELECT * INTO promo_record 
    FROM public.promo_codes 
    WHERE code = _code 
    AND active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Code promo invalide ou expiré'
        );
    END IF;
    
    SELECT * INTO existing_usage 
    FROM public.user_promo_usage 
    WHERE user_id = _user_id AND promo_code_id = promo_record.id;
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Code promo déjà utilisé'
        );
    END IF;
    
    INSERT INTO public.user_promo_usage (
        user_id, 
        promo_code_id, 
        photos_remaining
    ) VALUES (
        _user_id, 
        promo_record.id, 
        promo_record.free_photos
    );
    
    UPDATE public.promo_codes 
    SET current_uses = current_uses + 1,
        updated_at = now()
    WHERE id = promo_record.id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Code promo appliqué avec succès',
        'free_photos', promo_record.free_photos
    );
END;
$function$;