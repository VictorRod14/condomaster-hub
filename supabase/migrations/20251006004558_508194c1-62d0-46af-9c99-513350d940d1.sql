-- Fix the handle_new_user function with correct search_path syntax
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_text TEXT;
  final_role app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  
  -- Get role from metadata or use default
  user_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'morador');
  
  -- Cast to app_role type with explicit schema
  final_role := user_role_text::public.app_role;
  
  -- Insert default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, final_role);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, use morador as default with explicit schema
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'morador'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$$;