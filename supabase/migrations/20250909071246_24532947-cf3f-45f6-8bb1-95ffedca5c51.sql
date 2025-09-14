-- Table des codes promo
CREATE TABLE public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    free_photos INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER DEFAULT NULL, -- NULL = usage illimité
    current_uses INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour tracker l'utilisation des codes par utilisateur
CREATE TABLE public.user_promo_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
    photos_used INTEGER DEFAULT 0,
    photos_remaining INTEGER DEFAULT 0,
    used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, promo_code_id)
);

-- Activer RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_promo_usage ENABLE ROW LEVEL SECURITY;

-- Politiques pour promo_codes
CREATE POLICY "Everyone can view active promo codes"
ON public.promo_codes
FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour user_promo_usage
CREATE POLICY "Users can view their own promo usage"
ON public.user_promo_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own promo usage"
ON public.user_promo_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own promo usage"
ON public.user_promo_usage
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all promo usage"
ON public.user_promo_usage
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Fonction pour appliquer un code promo
CREATE OR REPLACE FUNCTION public.apply_promo_code(
    _user_id UUID,
    _code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    promo_record RECORD;
    existing_usage RECORD;
    result JSON;
BEGIN
    -- Vérifier si le code existe et est valide
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
    
    -- Vérifier si l'utilisateur a déjà utilisé ce code
    SELECT * INTO existing_usage 
    FROM public.user_promo_usage 
    WHERE user_id = _user_id AND promo_code_id = promo_record.id;
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Code promo déjà utilisé'
        );
    END IF;
    
    -- Appliquer le code promo
    INSERT INTO public.user_promo_usage (
        user_id, 
        promo_code_id, 
        photos_remaining
    ) VALUES (
        _user_id, 
        promo_record.id, 
        promo_record.free_photos
    );
    
    -- Incrémenter le compteur d'utilisation
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
$$;

-- Fonction pour obtenir les photos gratuites d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_free_photos(_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(SUM(photos_remaining), 0)
    FROM public.user_promo_usage
    WHERE user_id = _user_id;
$$;

-- Trigger pour update automatique
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();