-- Supprimer la politique dangereuse qui permet la création non restreinte
DROP POLICY IF EXISTS "System can create referrals" ON public.referrals;

-- Créer une nouvelle politique restrictive qui n'autorise que les opérations via les fonctions sécurisées
-- Les utilisateurs ne peuvent pas insérer directement dans la table referrals
-- Seules les fonctions avec SECURITY DEFINER peuvent le faire
CREATE POLICY "Referrals can only be created by secure functions" 
ON public.referrals 
FOR INSERT 
WITH CHECK (false); -- Empêche toute insertion directe

-- Mettre à jour la fonction apply_referral_code pour utiliser SECURITY DEFINER
-- afin qu'elle puisse contourner RLS de manière sécurisée
CREATE OR REPLACE FUNCTION public.apply_referral_code(_user_id uuid, _code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Permet de contourner RLS de manière sécurisée
SET search_path = public
AS $$
DECLARE
    referrer_record RECORD;
    existing_referral RECORD;
    referrer_reward INTEGER := 500; -- 5€ en centimes
    referred_reward INTEGER := 300; -- 3€ en centimes
    result JSON;
BEGIN
    -- Vérifier si l'utilisateur a déjà été parrainé
    SELECT * INTO existing_referral 
    FROM public.referrals 
    WHERE referred_id = _user_id;
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Vous avez déjà utilisé un code de parrainage'
        );
    END IF;
    
    -- Vérifier si le code existe et est valide
    SELECT rc.*, p.contact_name 
    INTO referrer_record 
    FROM public.referral_codes rc
    JOIN public.profiles p ON p.id = rc.user_id
    WHERE rc.code = UPPER(_code) 
    AND rc.is_active = true 
    AND rc.user_id != _user_id; -- On ne peut pas se parrainer soi-même
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Code de parrainage invalide ou inexistant'
        );
    END IF;
    
    -- Vérification supplémentaire : s'assurer que l'utilisateur qui applique le code existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Utilisateur invalide'
        );
    END IF;
    
    -- Créer le parrainage (cette fonction peut contourner RLS grâce à SECURITY DEFINER)
    INSERT INTO public.referrals (
        referrer_id, 
        referred_id, 
        referral_code,
        referrer_reward_amount,
        referred_reward_amount
    ) VALUES (
        referrer_record.user_id, 
        _user_id, 
        _code,
        referrer_reward,
        referred_reward
    );
    
    -- Donner les récompenses sous forme de photos gratuites
    -- Pour le parrain : 5€ = environ 3 photos (si prix = 14€)
    INSERT INTO public.user_promo_usage (
        user_id, 
        promo_code_id, 
        photos_remaining,
        photos_used
    ) VALUES (
        referrer_record.user_id,
        NULL, -- Pas de code promo, c'est une récompense de parrainage
        3, -- 3 photos gratuites pour le parrain
        0
    );
    
    -- Pour le filleul : 3€ = environ 2 photos
    INSERT INTO public.user_promo_usage (
        user_id, 
        promo_code_id, 
        photos_remaining,
        photos_used
    ) VALUES (
        _user_id,
        NULL, -- Pas de code promo, c'est une récompense de parrainage
        2, -- 2 photos gratuites pour le filleul
        0
    );
    
    -- Marquer les récompenses comme données
    UPDATE public.referrals 
    SET reward_given_to_referrer = true,
        reward_given_to_referred = true
    WHERE referred_id = _user_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Code de parrainage appliqué avec succès ! Vous et votre parrain avez reçu des photos gratuites.',
        'referrer_name', referrer_record.contact_name,
        'your_reward', 2,
        'referrer_reward', 3
    );
END;
$$;