-- REPAIR SCRIPT: Recreate Multas Table Correctly
-- Run this in Supabase SQL Editor to fix the schema mismatch.

-- 1. Drop the incorrect table if it exists
DROP TABLE IF EXISTS multas;

-- 2. Recreate the table with correct English references
-- We keep 'veiculo_id' and 'condutor_id' (Portuguese) to match the Frontend code
-- But they reference 'vehicles' and 'drivers' (English) which are the real tables.

CREATE TABLE multas (
  id uuid default uuid_generate_v4() primary key,
  veiculo_id uuid references vehicles(id) on delete cascade not null,
  condutor_id uuid references drivers(id) on delete set null not null,
  valor numeric(10,2) not null,
  data date not null default CURRENT_DATE,
  descricao text,
  status text default 'pendente' check (status in ('pendente', 'pago')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS (Security)
ALTER TABLE multas ENABLE ROW LEVEL SECURITY;

-- 4. Add Policy (Allow all for now, as requested)
CREATE POLICY "Permitir acesso total multas"
ON multas FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Comment for clarity
COMMENT ON TABLE multas IS 'Tabela de multas ligada a vehicles e drivers';
