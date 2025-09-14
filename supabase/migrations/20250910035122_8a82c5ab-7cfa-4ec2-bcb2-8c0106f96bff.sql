-- CRITICAL SECURITY FIXES
-- Phase 1: Immediate fixes for RLS policies and database security

-- 1. Fix app_settings RLS policies - restrict public access to business data
DROP POLICY IF EXISTS "Everyone can view app settings" ON public.app_settings;

CREATE POLICY "Authenticated users can view app settings" 
ON public.app_settings 
FOR SELECT 
TO authenticated
USING (true);

-- 2. Fix promo_codes RLS policies - require authentication for viewing codes
DROP POLICY IF EXISTS "Everyone can view active promo codes" ON public.promo_codes;

CREATE POLICY "Authenticated users can view active promo codes" 
ON public.promo_codes 
FOR SELECT 
TO authenticated
USING (active = true);

-- 3. Add admin RLS policies for profiles table
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update user profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() != id  -- Prevent admins from modifying their own profile via admin interface
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND auth.uid() != id
);

-- 4. Fix database function security - add proper security definer and search_path
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'CP' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number = public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, contact_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- 5. Add audit logging trigger for profile updates by admins
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log changes made by admins on other users' profiles
  IF has_role(auth.uid(), 'admin'::app_role) AND auth.uid() != NEW.id THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      target_user_id,
      action,
      table_name,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      NEW.id,
      TG_OP,
      TG_TABLE_NAME,
      CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Add audit trigger to profiles table
CREATE TRIGGER audit_profile_updates
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_changes();

-- 6. Add validation to prevent admin role escalation
CREATE OR REPLACE FUNCTION public.validate_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent admins from creating or modifying admin roles unless they are super admin
  IF NEW.role = 'admin' AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only existing admins can create admin roles';
  END IF;
  
  -- Prevent users from creating their own admin roles
  IF NEW.role = 'admin' AND NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot assign admin role to themselves';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add validation trigger to user_roles
CREATE TRIGGER validate_role_assignment
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_changes();