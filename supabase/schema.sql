-- StaffHub UNS Pro Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Staff table (GenzaiX and Ukeoi employees)
CREATE TABLE staff (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('GenzaiX', 'Ukeoi')),
  emp_id TEXT,
  full_name TEXT,
  full_name_kana TEXT,
  nationality TEXT,
  gender TEXT,
  birth_date DATE,
  age INTEGER,
  phone TEXT,
  email TEXT,
  address TEXT,
  postal_code TEXT,
  station TEXT,
  visa_type TEXT,
  visa_expiry DATE,
  residence_card TEXT,
  hire_date DATE,
  status TEXT DEFAULT 'Active',
  hourly_wage INTEGER,
  billing_unit INTEGER,
  profit_margin INTEGER,
  standard_remuneration INTEGER,
  health_ins INTEGER,
  nursing_ins INTEGER,
  pension INTEGER,
  employment_ins INTEGER,
  is_shaku BOOLEAN DEFAULT FALSE,
  bank_name TEXT,
  bank_branch TEXT,
  bank_account_type TEXT,
  bank_account_number TEXT,
  bank_account_holder TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  notes TEXT,
  resume_id UUID,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resumes table (Rirekisho/CV)
CREATE TABLE resumes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  applicant_id TEXT,
  full_name TEXT,
  full_name_kana TEXT,
  birth_date DATE,
  age INTEGER,
  gender TEXT,
  nationality TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  postal_code TEXT,
  photo TEXT,
  education JSONB DEFAULT '[]',
  job_history JSONB DEFAULT '[]',
  licenses JSONB DEFAULT '[]',
  skills TEXT,
  hobbies TEXT,
  motivation TEXT,
  requests TEXT,
  family JSONB DEFAULT '[]',
  commute_time TEXT,
  dependents INTEGER,
  spouse BOOLEAN,
  spouse_support BOOLEAN,
  interview_result TEXT,
  interview_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table (Hiring workflow)
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id),
  factory_name TEXT,
  position TEXT,
  status TEXT DEFAULT 'Pending',
  applied_date DATE,
  interview_date DATE,
  start_date DATE,
  hourly_wage INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Factories table (Job sites)
CREATE TABLE factories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  contact_person TEXT,
  phone TEXT,
  billing_rate INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'User',
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to access all data
CREATE POLICY "Allow authenticated read staff" ON staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert staff" ON staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update staff" ON staff FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete staff" ON staff FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read resumes" ON resumes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert resumes" ON resumes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update resumes" ON resumes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete resumes" ON resumes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read applications" ON applications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert applications" ON applications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update applications" ON applications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete applications" ON applications FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read factories" ON factories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert factories" ON factories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update factories" ON factories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete factories" ON factories FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read profiles" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert profiles" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated update profiles" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_staff_type ON staff(type);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_resumes_applicant ON resumes(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER resumes_updated_at BEFORE UPDATE ON resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER factories_updated_at BEFORE UPDATE ON factories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
