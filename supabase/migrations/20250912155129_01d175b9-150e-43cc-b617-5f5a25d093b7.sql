-- Add explicit policy to deny public access to company_info
-- This ensures sensitive business data is only accessible to authenticated admins

-- First, let's add a policy that explicitly denies access to non-authenticated users
CREATE POLICY "Deny public access to company info" 
ON public.company_info 
FOR ALL 
TO anon 
USING (false);

-- Add a policy that denies access to regular authenticated users (non-admins)
CREATE POLICY "Deny regular users access to company info" 
ON public.company_info 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));