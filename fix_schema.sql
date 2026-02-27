BEGIN;

-- 1) List tables in public
-- RAISE NOTICE '--- Tables in public ---';
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 2) List columns for relevant tables
-- RAISE NOTICE '--- Columns for multas, veiculos, condutores, viagens ---';
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('multas','veiculos','veículos','condutores','motoristas','viagens')
ORDER BY table_name, ordinal_position;

-- 3) List constraints for multas
-- RAISE NOTICE '--- Constraints for public.multas ---';
SELECT conname, contype, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public' AND t.relname = 'multas';

-- 4) List installed extensions
-- RAISE NOTICE '--- Installed extensions ---';
SELECT extname, extversion FROM pg_extension ORDER BY extname;

-- 5) RLS and policy state for multas
-- RAISE NOTICE '--- RLS status for public.multas ---';
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND relname = 'multas';

-- RAISE NOTICE '--- Policies on public.multas ---';
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'multas';

-- 6) Ensure pgcrypto extension for gen_random_uuid()
-- RAISE NOTICE '--- Ensuring pgcrypto extension ---';
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 7) Create multas table if not exists (defensive)
-- RAISE NOTICE '--- Ensuring public.multas table exists ---';
CREATE TABLE IF NOT EXISTS public.multas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  veiculo_id uuid,
  condutor_id uuid,
  data date NOT NULL DEFAULT current_date,
  valor numeric NOT NULL,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8) Conditionally add foreign keys if referenced tables exist and constraint absent
-- RAISE NOTICE '--- Adding FK constraints to public.multas if possible ---';
DO $$
BEGIN
  -- FK to veiculos (or veículos)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'veiculos') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'multas_veiculo_fk') THEN
          ALTER TABLE public.multas ADD CONSTRAINT multas_veiculo_fk FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) ON DELETE CASCADE;
      END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'veículos') THEN
      -- If veiculos not found, try veículos
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'multas_veiculo_fk') THEN
          ALTER TABLE public.multas ADD CONSTRAINT multas_veiculo_fk FOREIGN KEY (veiculo_id) REFERENCES public."veículos"(id) ON DELETE CASCADE;
      END IF;
  END IF;

  -- FK to condutores (or motoristas)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'condutores') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'multas_condutor_fk') THEN
          ALTER TABLE public.multas ADD CONSTRAINT multas_condutor_fk FOREIGN KEY (condutor_id) REFERENCES public.condutores(id) ON DELETE SET NULL;
      END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'motoristas') THEN
      -- If condutores not found, try motoristas
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'multas_condutor_fk') THEN
          ALTER TABLE public.multas ADD CONSTRAINT multas_condutor_fk FOREIGN KEY (condutor_id) REFERENCES public.motoristas(id) ON DELETE SET NULL;
      END IF;
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- RAISE NOTICE 'FK addition encountered an error: %', SQLERRM;
END$$;

-- 9) Ensure viagens.valor_pedagios exists (check if table 'viagens' exists)
-- RAISE NOTICE '--- Ensuring public.viagens.valor_pedagios column exists ---';
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'viagens'
  ) THEN
    ALTER TABLE public.viagens
      ADD COLUMN IF NOT EXISTS valor_pedagios numeric DEFAULT 0;
  END IF;
END$$;

-- 10) Enable RLS and create a permissive policy for authenticated if none exists
-- RAISE NOTICE '--- Enabling RLS on public.multas and ensuring a permissive policy for authenticated ---';
ALTER TABLE public.multas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'multas' AND policyname = 'authenticated_full_access_multas'
  ) THEN
    CREATE POLICY authenticated_full_access_multas
      ON public.multas
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
    -- RAISE NOTICE 'Created policy authenticated_full_access_multas';
  ELSE
    -- RAISE NOTICE 'Policy authenticated_full_access_multas already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- RAISE NOTICE 'Policy creation encountered an error: %', SQLERRM;
END$$;

COMMIT;

-- 11) Post-run checks (re-list policies + table columns)
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('multas','veiculos','veículos','condutores','motoristas','viagens')
ORDER BY table_name, ordinal_position;

SELECT conname, contype, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public' AND t.relname = 'multas';

SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'multas';
