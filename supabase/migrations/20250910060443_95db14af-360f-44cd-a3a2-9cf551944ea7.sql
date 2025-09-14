-- Créer une fonction pour créer automatiquement un code de parrainage pour l'utilisateur
CREATE OR REPLACE FUNCTION create_user_referral_code(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_code TEXT;
BEGIN
    -- Vérifier si l'utilisateur a déjà un code
    SELECT code INTO new_code 
    FROM referral_codes 
    WHERE user_id = _user_id AND is_active = true
    LIMIT 1;
    
    -- Si pas de code existant, en créer un nouveau
    IF new_code IS NULL THEN
        -- Générer un nouveau code unique
        SELECT generate_referral_code() INTO new_code;
        
        -- Insérer le nouveau code dans la table
        INSERT INTO referral_codes (user_id, code)
        VALUES (_user_id, new_code);
    END IF;
    
    RETURN new_code;
END;
$$;