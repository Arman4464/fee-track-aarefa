
-- Function to safely retrieve user email by ID
CREATE OR REPLACE FUNCTION public.get_user_email(user_id UUID)
RETURNS TABLE(email TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT email::text FROM auth.users WHERE id = user_id;
$$;
