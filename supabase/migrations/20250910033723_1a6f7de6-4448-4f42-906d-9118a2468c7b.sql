-- Ajouter le statut VIP et les préférences de facturation aux profils
ALTER TABLE public.profiles 
ADD COLUMN is_vip BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN deferred_billing_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN billing_address TEXT,
ADD COLUMN billing_company TEXT,
ADD COLUMN vip_activated_at TIMESTAMPTZ,
ADD COLUMN vip_activated_by UUID REFERENCES auth.users(id);

-- Créer une table pour les factures différées
CREATE TABLE public.deferred_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  total_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ NOT NULL,
  issued_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Créer une table pour les éléments des factures
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.deferred_invoices(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS pour les nouvelles tables
ALTER TABLE public.deferred_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour deferred_invoices
CREATE POLICY "Users can view their own invoices" ON public.deferred_invoices
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all invoices" ON public.deferred_invoices
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage invoices" ON public.deferred_invoices
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Politiques RLS pour invoice_items
CREATE POLICY "Users can view their own invoice items" ON public.invoice_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.deferred_invoices 
    WHERE id = invoice_items.invoice_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all invoice items" ON public.invoice_items
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage invoice items" ON public.invoice_items
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour auto-incrémenter les numéros de facture
CREATE SEQUENCE invoice_number_seq;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'INV' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number = public.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invoice_number_trigger
  BEFORE INSERT ON public.deferred_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_invoice_number();

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_deferred_invoices_updated_at
  BEFORE UPDATE ON public.deferred_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();