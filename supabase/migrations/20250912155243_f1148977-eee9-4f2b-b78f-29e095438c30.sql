-- Add comprehensive RLS policies to completely secure admin_audit_log table
-- This ensures only administrators can access audit logs and prevents any unauthorized monitoring

-- Explicitly deny all access to anonymous users
CREATE POLICY "Deny anonymous access to audit logs" 
ON public.admin_audit_log 
FOR ALL 
TO anon 
USING (false);

-- Explicitly deny access to authenticated non-admin users  
CREATE POLICY "Deny non-admin access to audit logs" 
ON public.admin_audit_log 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure only the audit system can insert records (not even admins manually)
CREATE POLICY "Only system can insert audit records" 
ON public.admin_audit_log 
FOR INSERT 
TO authenticated 
WITH CHECK (false);

-- Prevent any manual updates to audit records to maintain integrity
CREATE POLICY "Prevent manual audit record updates" 
ON public.admin_audit_log 
FOR UPDATE 
TO authenticated 
USING (false);

-- Prevent any deletion of audit records to maintain audit trail integrity
CREATE POLICY "Prevent audit record deletion" 
ON public.admin_audit_log 
FOR DELETE 
TO authenticated 
USING (false);