-- Créer une table pour les informations de l'entreprise
CREATE TABLE IF NOT EXISTS public.company_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  address text,
  postal_code text,
  city text,
  country text DEFAULT 'France',
  phone text,
  email text,
  website text,
  siret text,
  vat_number text,
  registration_number text,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent gérer les infos de l'entreprise
CREATE POLICY "Admins can manage company info" 
ON public.company_info 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_company_info_updated_at
BEFORE UPDATE ON public.company_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();