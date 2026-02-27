-- ACCESS CONTROL SETUP SCRIPT (FINAL CORRECTED)
-- Run this in Supabase SQL Editor.

-- 1. Create Profiles Table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text not null check (role in ('admin', 'gestor', 'motorista')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 2. Add user_id to all tables to track ownership
-- Tables: vehicles, drivers, checklists, refuelings, maintenances, trips, multas
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vehicles', 'drivers', 'checklists', 'refuelings', 'maintenances', 'trips', 'multas']
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id) on delete set null', t);
    EXCEPTION 
      WHEN duplicate_column THEN
        RAISE NOTICE 'Column user_id already exists in %', t;
      WHEN undefined_table THEN
        RAISE NOTICE 'Table % does not exist, skipping', t;
    END;
  END LOOP;
END $$;

-- 3. Enable RLS on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE refuelings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE multas ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies (Cleaning up old ones)
DO $$
DECLARE
  -- List of all potential table names to clean up
  tables text[] := ARRAY['vehicles', 'drivers', 'checklists', 'refuelings', 'maintenances', 'trips', 'multas', 'veiculos', 'condutores', 'abastecimentos', 'viagens'];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    BEGIN
        EXECUTE format('DROP POLICY IF EXISTS "Enable all access for all users" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Permitir acesso total multas" ON %I', t);
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END LOOP;
END $$;

-- 5. Create New RLS Policies

-- HELPER FUNCTIONS
create or replace function is_admin_or_gestor()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'gestor')
  );
end;
$$ language plpgsql security definer;

create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- POLICIES

-- A. VIEW (SELECT)
DROP POLICY IF EXISTS "Pol_View_Vehicles" ON vehicles;
CREATE POLICY "Pol_View_Vehicles" ON vehicles FOR SELECT USING (is_admin_or_gestor() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Pol_View_Drivers" ON drivers;
CREATE POLICY "Pol_View_Drivers" ON drivers FOR SELECT USING (is_admin_or_gestor() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Pol_View_Checklists" ON checklists;
CREATE POLICY "Pol_View_Checklists" ON checklists FOR SELECT USING (is_admin_or_gestor() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Pol_View_Refuelings" ON refuelings;
CREATE POLICY "Pol_View_Refuelings" ON refuelings FOR SELECT USING (is_admin_or_gestor() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Pol_View_Maintenances" ON maintenances;
CREATE POLICY "Pol_View_Maintenances" ON maintenances FOR SELECT USING (is_admin_or_gestor() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Pol_View_Trips" ON trips;
CREATE POLICY "Pol_View_Trips" ON trips FOR SELECT USING (is_admin_or_gestor() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Pol_View_Multas" ON multas;
CREATE POLICY "Pol_View_Multas" ON multas FOR SELECT USING (is_admin_or_gestor() OR user_id = auth.uid());


-- B. INSERT
DROP POLICY IF EXISTS "Pol_Insert_Vehicles" ON vehicles;
CREATE POLICY "Pol_Insert_Vehicles" ON vehicles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Pol_Insert_Drivers" ON drivers;
CREATE POLICY "Pol_Insert_Drivers" ON drivers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Pol_Insert_Checklists" ON checklists;
CREATE POLICY "Pol_Insert_Checklists" ON checklists FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Pol_Insert_Refuelings" ON refuelings;
CREATE POLICY "Pol_Insert_Refuelings" ON refuelings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Pol_Insert_Maintenances" ON maintenances;
CREATE POLICY "Pol_Insert_Maintenances" ON maintenances FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Pol_Insert_Trips" ON trips;
CREATE POLICY "Pol_Insert_Trips" ON trips FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Pol_Insert_Multas" ON multas;
CREATE POLICY "Pol_Insert_Multas" ON multas FOR INSERT WITH CHECK (true);


-- C. UPDATE
-- Admin/Gestor: Update ALL.
-- Motorista: Update OWN only if created_at > now() - 24 hours.

DROP POLICY IF EXISTS "Pol_Update_Vehicles" ON vehicles;
CREATE POLICY "Pol_Update_Vehicles" ON vehicles FOR UPDATE USING (is_admin_or_gestor() OR (user_id = auth.uid() AND created_at > (now() - interval '24 hours')));

DROP POLICY IF EXISTS "Pol_Update_Drivers" ON drivers;
CREATE POLICY "Pol_Update_Drivers" ON drivers FOR UPDATE USING (is_admin_or_gestor() OR (user_id = auth.uid() AND created_at > (now() - interval '24 hours')));

DROP POLICY IF EXISTS "Pol_Update_Checklists" ON checklists;
CREATE POLICY "Pol_Update_Checklists" ON checklists FOR UPDATE USING (is_admin_or_gestor() OR (user_id = auth.uid() AND created_at > (now() - interval '24 hours')));

DROP POLICY IF EXISTS "Pol_Update_Refuelings" ON refuelings;
CREATE POLICY "Pol_Update_Refuelings" ON refuelings FOR UPDATE USING (is_admin_or_gestor() OR (user_id = auth.uid() AND created_at > (now() - interval '24 hours')));

DROP POLICY IF EXISTS "Pol_Update_Maintenances" ON maintenances;
CREATE POLICY "Pol_Update_Maintenances" ON maintenances FOR UPDATE USING (is_admin_or_gestor() OR (user_id = auth.uid() AND created_at > (now() - interval '24 hours')));

DROP POLICY IF EXISTS "Pol_Update_Trips" ON trips;
CREATE POLICY "Pol_Update_Trips" ON trips FOR UPDATE USING (is_admin_or_gestor() OR (user_id = auth.uid() AND created_at > (now() - interval '24 hours')));

DROP POLICY IF EXISTS "Pol_Update_Multas" ON multas;
CREATE POLICY "Pol_Update_Multas" ON multas FOR UPDATE USING (is_admin_or_gestor() OR (user_id = auth.uid() AND created_at > (now() - interval '24 hours')));


-- D. DELETE
-- Non-Financial Tables
DROP POLICY IF EXISTS "Pol_Delete_NonFin_Vehicles" ON vehicles;
CREATE POLICY "Pol_Delete_NonFin_Vehicles" ON vehicles FOR DELETE USING (is_admin_or_gestor());

DROP POLICY IF EXISTS "Pol_Delete_Drivers" ON drivers;
CREATE POLICY "Pol_Delete_Drivers" ON drivers FOR DELETE USING (is_admin_or_gestor());

DROP POLICY IF EXISTS "Pol_Delete_Checklists" ON checklists;
CREATE POLICY "Pol_Delete_Checklists" ON checklists FOR DELETE USING (is_admin_or_gestor());

DROP POLICY IF EXISTS "Pol_Delete_Trips" ON trips;
CREATE POLICY "Pol_Delete_Trips" ON trips FOR DELETE USING (is_admin_or_gestor());

-- Financial Tables (Restricted for Gestor)
DROP POLICY IF EXISTS "Pol_Delete_Fin_Refuelings" ON refuelings;
CREATE POLICY "Pol_Delete_Fin_Refuelings" ON refuelings FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "Pol_Delete_Fin_Maintenances" ON maintenances;
CREATE POLICY "Pol_Delete_Fin_Maintenances" ON maintenances FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "Pol_Delete_Fin_Multas" ON multas;
CREATE POLICY "Pol_Delete_Fin_Multas" ON multas FOR DELETE USING (is_admin());


-- 6. Grant current user Admin access (SAFE MODE)
DO $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NOT NULL THEN
    INSERT INTO profiles (id, role, email)
    VALUES (current_user_id, 'admin', 'admin@sistema.com')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  ELSE
    RAISE NOTICE '⚠️ ATENÇÃO: Não foi possível detectar seu usuário automaticamente (auth.uid() é NULL). Você PRECISARÁ adicionar seu usuário manualmente na tabela profiles com a role "admin" para ter acesso total.';
  END IF;
END $$;

-- 7. AUTO-SET USER_ID TRIGGER
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vehicles', 'drivers', 'checklists', 'refuelings', 'maintenances', 'trips', 'multas']
  LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS tr_set_user_id ON %I', t);
      EXECUTE format('CREATE TRIGGER tr_set_user_id BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION set_user_id()', t);
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Table % does not exist, skipping trigger creation', t;
    END;
  END LOOP;
END $$;
