-- Create table for admin charges
CREATE TABLE public.admin_charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL DEFAULT 'Document numérique',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  invoice_id UUID REFERENCES public.deferred_invoices(id),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_charges ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all charges
CREATE POLICY "Admins can manage all charges"
ON public.admin_charges
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own charges
CREATE POLICY "Users can view their own charges"
ON public.admin_charges
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_charges_updated_at
BEFORE UPDATE ON public.admin_charges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();