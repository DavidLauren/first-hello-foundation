-- Add separate first_name and last_name columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update existing records to split contact_name into first_name and last_name
UPDATE public.profiles 
SET 
  first_name = CASE 
    WHEN contact_name IS NOT NULL AND contact_name != '' THEN 
      TRIM(SPLIT_PART(contact_name, ' ', 1))
    ELSE ''
  END,
  last_name = CASE 
    WHEN contact_name IS NOT NULL AND contact_name != '' THEN 
      TRIM(SUBSTRING(contact_name FROM POSITION(' ' IN contact_name) + 1))
    ELSE ''
  END
WHERE contact_name IS NOT NULL;