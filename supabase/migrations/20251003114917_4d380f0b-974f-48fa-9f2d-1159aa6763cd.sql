-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'sindico', 'morador');
CREATE TYPE payment_status AS ENUM ('pago', 'pendente', 'atrasado');
CREATE TYPE reservation_status AS ENUM ('pendente', 'confirmada', 'cancelada');
CREATE TYPE occurrence_status AS ENUM ('aberta', 'em_andamento', 'resolvida', 'fechada');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'morador',
  phone TEXT,
  avatar_url TEXT,
  condominium_id UUID,
  unit_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Condominiums table
CREATE TABLE condominiums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units table (apartments/houses)
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  block TEXT,
  number TEXT NOT NULL,
  floor INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(condominium_id, block, number)
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial records table
CREATE TABLE financial_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status payment_status NOT NULL DEFAULT 'pendente',
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Common areas table
CREATE TABLE common_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_hours INTEGER DEFAULT 4,
  requires_approval BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations table
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  common_area_id UUID NOT NULL REFERENCES common_areas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Occurrences table
CREATE TABLE occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status occurrence_status NOT NULL DEFAULT 'aberta',
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table (chat)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for condominium_id in profiles
ALTER TABLE profiles 
  ADD CONSTRAINT fk_profiles_condominium 
  FOREIGN KEY (condominium_id) REFERENCES condominiums(id) ON DELETE SET NULL;

-- Add foreign key for unit_id in profiles
ALTER TABLE profiles 
  ADD CONSTRAINT fk_profiles_unit 
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE condominiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Sindicos can view profiles in their condominium" ON profiles FOR SELECT 
  USING (
    condominium_id IN (
      SELECT condominium_id FROM profiles WHERE id = auth.uid() AND role = 'sindico'
    )
  );
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for Condominiums
CREATE POLICY "Users can view their condominium" ON condominiums FOR SELECT 
  USING (
    id IN (SELECT condominium_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can insert condominiums" ON condominiums FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can update condominiums" ON condominiums FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for Units
CREATE POLICY "Users can view units in their condominium" ON units FOR SELECT 
  USING (
    condominium_id IN (SELECT condominium_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Sindicos can manage units in their condominium" ON units FOR ALL 
  USING (
    condominium_id IN (
      SELECT condominium_id FROM profiles WHERE id = auth.uid() AND role = 'sindico'
    )
  );
CREATE POLICY "Admins can manage all units" ON units FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for Announcements
CREATE POLICY "Users can view announcements in their condominium" ON announcements FOR SELECT 
  USING (
    condominium_id IN (SELECT condominium_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Sindicos can manage announcements in their condominium" ON announcements FOR ALL 
  USING (
    condominium_id IN (
      SELECT condominium_id FROM profiles WHERE id = auth.uid() AND role = 'sindico'
    )
    OR author_id = auth.uid()
  );
CREATE POLICY "Admins can manage all announcements" ON announcements FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for Financial Records
CREATE POLICY "Users can view their own financial records" ON financial_records FOR SELECT 
  USING (
    unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid())
    OR condominium_id IN (
      SELECT condominium_id FROM profiles WHERE id = auth.uid() AND role IN ('sindico', 'admin')
    )
  );
CREATE POLICY "Sindicos can manage financial records in their condominium" ON financial_records FOR ALL 
  USING (
    condominium_id IN (
      SELECT condominium_id FROM profiles WHERE id = auth.uid() AND role = 'sindico'
    )
  );
CREATE POLICY "Admins can manage all financial records" ON financial_records FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for Common Areas
CREATE POLICY "Users can view common areas in their condominium" ON common_areas FOR SELECT 
  USING (
    condominium_id IN (SELECT condominium_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Sindicos can manage common areas in their condominium" ON common_areas FOR ALL 
  USING (
    condominium_id IN (
      SELECT condominium_id FROM profiles WHERE id = auth.uid() AND role = 'sindico'
    )
  );
CREATE POLICY "Admins can manage all common areas" ON common_areas FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for Reservations
CREATE POLICY "Users can view reservations in their condominium" ON reservations FOR SELECT 
  USING (
    condominium_id IN (SELECT condominium_id FROM profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );
CREATE POLICY "Users can create their own reservations" ON reservations FOR INSERT 
  WITH CHECK (
    user_id = auth.uid()
    AND condominium_id IN (SELECT condominium_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Users can update their own pending reservations" ON reservations FOR UPDATE 
  USING (user_id = auth.uid() AND status = 'pendente');
CREATE POLICY "Sindicos can manage reservations in their condominium" ON reservations FOR ALL 
  USING (
    condominium_id IN (
      SELECT condominium_id FROM profiles WHERE id = auth.uid() AND role = 'sindico'
    )
  );
CREATE POLICY "Admins can manage all reservations" ON reservations FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for Occurrences
CREATE POLICY "Users can view occurrences in their condominium" ON occurrences FOR SELECT 
  USING (
    condominium_id IN (SELECT condominium_id FROM profiles WHERE id = auth.uid())
    OR reporter_id = auth.uid()
  );
CREATE POLICY "Users can create occurrences" ON occurrences FOR INSERT 
  WITH CHECK (
    reporter_id = auth.uid()
    AND condominium_id IN (SELECT condominium_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Sindicos can manage occurrences in their condominium" ON occurrences FOR ALL 
  USING (
    condominium_id IN (
      SELECT condominium_id FROM profiles WHERE id = auth.uid() AND role = 'sindico'
    )
    OR reporter_id = auth.uid()
  );
CREATE POLICY "Admins can manage all occurrences" ON occurrences FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for Messages
CREATE POLICY "Users can view their messages" ON messages FOR SELECT 
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Users can send messages" ON messages FOR INSERT 
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update messages they received" ON messages FOR UPDATE 
  USING (recipient_id = auth.uid());

-- Functions for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_condominiums_updated_at BEFORE UPDATE ON condominiums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_records_updated_at BEFORE UPDATE ON financial_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_common_areas_updated_at BEFORE UPDATE ON common_areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_occurrences_updated_at BEFORE UPDATE ON occurrences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'morador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;