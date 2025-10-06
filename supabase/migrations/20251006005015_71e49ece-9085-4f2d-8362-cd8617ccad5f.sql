-- Insert test data for the condominium management system

-- First, create a test condominium
INSERT INTO public.condominiums (id, name, address, city, state, zip_code) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Residencial Sunset', 'Av. Principal, 1000', 'São Paulo', 'SP', '01234-567')
ON CONFLICT (id) DO NOTHING;

-- Create test units
INSERT INTO public.units (condominium_id, number, block, floor) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', '101', 'A', 1),
  ('11111111-1111-1111-1111-111111111111', '102', 'A', 1),
  ('11111111-1111-1111-1111-111111111111', '201', 'A', 2),
  ('11111111-1111-1111-1111-111111111111', '202', 'A', 2)
ON CONFLICT DO NOTHING;

-- Create common areas
INSERT INTO public.common_areas (condominium_id, name, description, max_hours, requires_approval) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Salão de Festas', 'Capacidade para 50 pessoas', 8, true),
  ('11111111-1111-1111-1111-111111111111', 'Churrasqueira', 'Área gourmet com churrasqueira', 6, false),
  ('11111111-1111-1111-1111-111111111111', 'Quadra Poliesportiva', 'Quadra para práticas esportivas', 3, false),
  ('11111111-1111-1111-1111-111111111111', 'Piscina', 'Piscina aquecida', 4, false)
ON CONFLICT DO NOTHING;

-- Function to assign multiple roles to specific user (victorodovalho@gmail.com)
CREATE OR REPLACE FUNCTION public.assign_multiple_roles_to_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find the user by email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'victorodovalho@gmail.com';
  
  -- Only proceed if user exists
  IF admin_user_id IS NOT NULL THEN
    -- Insert all three roles for this user
    INSERT INTO public.user_roles (user_id, role)
    VALUES 
      (admin_user_id, 'admin'::app_role),
      (admin_user_id, 'sindico'::app_role),
      (admin_user_id, 'morador'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Update profile with condominium
    UPDATE public.profiles
    SET condominium_id = '11111111-1111-1111-1111-111111111111',
        unit_id = (SELECT id FROM public.units WHERE number = '101' AND condominium_id = '11111111-1111-1111-1111-111111111111' LIMIT 1)
    WHERE id = admin_user_id;
  END IF;
END;
$$;

-- Execute the function
SELECT public.assign_multiple_roles_to_admin();