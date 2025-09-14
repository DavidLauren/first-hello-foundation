-- Backfill missing invoice numbers for existing invoices
UPDATE public.deferred_invoices
SET invoice_number = public.generate_invoice_number()
WHERE invoice_number IS NULL OR invoice_number = '';

-- Ensure due_date is set for any legacy rows (30 days after issued_date or created_at)
UPDATE public.deferred_invoices di
SET due_date = COALESCE(di.issued_date, di.created_at) + INTERVAL '30 days'
WHERE di.due_date IS NULL;