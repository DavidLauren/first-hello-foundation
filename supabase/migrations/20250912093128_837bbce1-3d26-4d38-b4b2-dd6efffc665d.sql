-- Ensure invoice numbers are automatically generated on insert
-- Add trigger to call set_invoice_number() when inserting into deferred_invoices

-- Drop existing trigger if present to avoid duplicates
DROP TRIGGER IF EXISTS set_invoice_number_trigger ON public.deferred_invoices;

-- Create trigger to generate invoice_number using generate_invoice_number()
CREATE TRIGGER set_invoice_number_trigger
BEFORE INSERT ON public.deferred_invoices
FOR EACH ROW
EXECUTE FUNCTION public.set_invoice_number();

-- Keep updated_at in sync on updates (quality of life, harmless)
DROP TRIGGER IF EXISTS update_deferred_invoices_updated_at ON public.deferred_invoices;
CREATE TRIGGER update_deferred_invoices_updated_at
BEFORE UPDATE ON public.deferred_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();