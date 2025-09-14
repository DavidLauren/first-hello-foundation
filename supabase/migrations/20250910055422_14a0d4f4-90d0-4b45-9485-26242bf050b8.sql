-- Correction des problèmes de sécurité détectés

-- Mise à jour des fonctions avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Générer un code de 8 caractères alphanumériques
        new_code := UPPER(
            SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8)
        );
        
        -- Vérifier si le code existe déjà
        SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
        
        -- Si le code n'existe pas, le retourner
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.create_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer un code de parrainage pour le nouvel utilisateur
    INSERT INTO public.referral_codes (user_id, code)
    VALUES (NEW.id, public.generate_referral_code());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.apply_referral_code(_user_id UUID, _code TEXT)
RETURNS JSON AS $$
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
    
    -- Créer le parrainage
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_referral_stats(_user_id UUID)
RETURNS JSON AS $$
DECLARE
    referral_code_record RECORD;
    referrals_count INTEGER;
    total_rewards INTEGER;
    result JSON;
BEGIN
    -- Récupérer le code de parrainage de l'utilisateur
    SELECT * INTO referral_code_record 
    FROM public.referral_codes 
    WHERE user_id = _user_id AND is_active = true
    LIMIT 1;
    
    -- Compter les parrainages réalisés
    SELECT COUNT(*) INTO referrals_count
    FROM public.referrals 
    WHERE referrer_id = _user_id;
    
    -- Calculer le total des récompenses en photos
    SELECT COALESCE(SUM(referrer_reward_amount), 0) / 100 * 3 / 14 INTO total_rewards
    FROM public.referrals 
    WHERE referrer_id = _user_id AND reward_given_to_referrer = true;
    
    RETURN json_build_object(
        'referral_code', COALESCE(referral_code_record.code, ''),
        'referrals_count', referrals_count,
        'total_rewards', COALESCE(total_rewards, 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;