-- Création du système de parrainage

-- Table pour stocker les codes de parrainage des utilisateurs
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Table pour stocker les parrainages réalisés
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL, -- Celui qui parraine
  referred_id UUID NOT NULL, -- Celui qui a été parrainé
  referral_code TEXT NOT NULL,
  reward_given_to_referrer BOOLEAN NOT NULL DEFAULT false,
  reward_given_to_referred BOOLEAN NOT NULL DEFAULT false,
  referrer_reward_amount INTEGER DEFAULT 0, -- En centimes
  referred_reward_amount INTEGER DEFAULT 0, -- En centimes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id) -- Un utilisateur ne peut être parrainé qu'une seule fois
);

-- Activer RLS sur les tables
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour referral_codes
CREATE POLICY "Users can view their own referral code" 
ON public.referral_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral code" 
ON public.referral_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all referral codes" 
ON public.referral_codes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all referral codes" 
ON public.referral_codes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Politiques RLS pour referrals
CREATE POLICY "Users can view their own referrals" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (true); -- Géré par les fonctions

CREATE POLICY "Admins can view all referrals" 
ON public.referrals 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all referrals" 
ON public.referrals 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fonction pour générer un code de parrainage unique
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer automatiquement un code de parrainage pour un nouvel utilisateur
CREATE OR REPLACE FUNCTION public.create_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer un code de parrainage pour le nouvel utilisateur
    INSERT INTO public.referral_codes (user_id, code)
    VALUES (NEW.id, public.generate_referral_code());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un code de parrainage
CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_referral_code();

-- Fonction pour appliquer un code de parrainage
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques de parrainage d'un utilisateur
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
$$ LANGUAGE plpgsql SECURITY DEFINER;