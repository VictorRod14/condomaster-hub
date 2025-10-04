-- Drop all policies that depend on the role column
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Sindicos can view profiles in their condominium" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their condominium" ON public.condominiums;
DROP POLICY IF EXISTS "Admins can insert condominiums" ON public.condominiums;
DROP POLICY IF EXISTS "Admins can update condominiums" ON public.condominiums;
DROP POLICY IF EXISTS "Users can view units in their condominium" ON public.units;
DROP POLICY IF EXISTS "Sindicos can manage units in their condominium" ON public.units;
DROP POLICY IF EXISTS "Admins can manage all units" ON public.units;
DROP POLICY IF EXISTS "Users can view announcements in their condominium" ON public.announcements;
DROP POLICY IF EXISTS "Sindicos can manage announcements in their condominium" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage all announcements" ON public.announcements;
DROP POLICY IF EXISTS "Users can view their own financial records" ON public.financial_records;
DROP POLICY IF EXISTS "Sindicos can manage financial records in their condominium" ON public.financial_records;
DROP POLICY IF EXISTS "Admins can manage all financial records" ON public.financial_records;
DROP POLICY IF EXISTS "Users can view common areas in their condominium" ON public.common_areas;
DROP POLICY IF EXISTS "Sindicos can manage common areas in their condominium" ON public.common_areas;
DROP POLICY IF EXISTS "Admins can manage all common areas" ON public.common_areas;
DROP POLICY IF EXISTS "Sindicos can manage reservations in their condominium" ON public.reservations;
DROP POLICY IF EXISTS "Admins can manage all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Sindicos can manage occurrences in their condominium" ON public.occurrences;
DROP POLICY IF EXISTS "Admins can manage all occurrences" ON public.occurrences;

-- Now we can safely remove the role column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Create the app_role enum type
CREATE TYPE public.app_role AS ENUM ('admin', 'sindico', 'morador');

-- Create the user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Update the handle_new_user function to insert default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  
  -- Insert default role (morador)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'morador')
  );
  
  RETURN NEW;
END;
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Recreate profiles RLS policies
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sindicos can view profiles in their condominium"
ON public.profiles
FOR SELECT
USING (
  condominium_id IN (
    SELECT condominium_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND public.has_role(auth.uid(), 'sindico')
  )
);

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Recreate announcements RLS policies
CREATE POLICY "Admins can manage all announcements"
ON public.announcements
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sindicos can manage announcements in their condominium"
ON public.announcements
FOR ALL
USING (
  condominium_id IN (
    SELECT condominium_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND public.has_role(auth.uid(), 'sindico')
  ) OR author_id = auth.uid()
);

CREATE POLICY "Users can view announcements in their condominium"
ON public.announcements
FOR SELECT
USING (
  condominium_id IN (
    SELECT condominium_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);

-- Recreate common_areas RLS policies
CREATE POLICY "Admins can manage all common areas"
ON public.common_areas
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sindicos can manage common areas in their condominium"
ON public.common_areas
FOR ALL
USING (
  condominium_id IN (
    SELECT condominium_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND public.has_role(auth.uid(), 'sindico')
  )
);

CREATE POLICY "Users can view common areas in their condominium"
ON public.common_areas
FOR SELECT
USING (
  condominium_id IN (
    SELECT condominium_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);

-- Recreate condominiums RLS policies
CREATE POLICY "Admins can insert condominiums"
ON public.condominiums
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update condominiums"
ON public.condominiums
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their condominium"
ON public.condominiums
FOR SELECT
USING (
  id IN (
    SELECT condominium_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);

-- Recreate financial_records RLS policies
CREATE POLICY "Admins can manage all financial records"
ON public.financial_records
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sindicos can manage financial records in their condominium"
ON public.financial_records
FOR ALL
USING (
  condominium_id IN (
    SELECT condominium_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND public.has_role(auth.uid(), 'sindico')
  )
);

CREATE POLICY "Users can view their own financial records"
ON public.financial_records
FOR SELECT
USING (
  unit_id IN (
    SELECT unit_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  ) OR condominium_id IN (
    SELECT condominium_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND (
      public.has_role(auth.uid(), 'sindico') OR 
      public.has_role(auth.uid(), 'admin')
    )
  )
);

-- Recreate occurrences RLS policies
CREATE POLICY "Admins can manage all occurrences"
ON public.occurrences
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sindicos can manage occurrences in their condominium"
ON public.occurrences
FOR ALL
USING (
  condominium_id IN (
    SELECT condominium_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND public.has_role(auth.uid(), 'sindico')
  ) OR reporter_id = auth.uid()
);

-- Recreate reservations RLS policies
CREATE POLICY "Admins can manage all reservations"
ON public.reservations
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sindicos can manage reservations in their condominium"
ON public.reservations
FOR ALL
USING (
  condominium_id IN (
    SELECT condominium_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND public.has_role(auth.uid(), 'sindico')
  )
);

-- Recreate units RLS policies
CREATE POLICY "Admins can manage all units"
ON public.units
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sindicos can manage units in their condominium"
ON public.units
FOR ALL
USING (
  condominium_id IN (
    SELECT condominium_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND public.has_role(auth.uid(), 'sindico')
  )
);

CREATE POLICY "Users can view units in their condominium"
ON public.units
FOR SELECT
USING (
  condominium_id IN (
    SELECT condominium_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);