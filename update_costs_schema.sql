-- Add support for Fines (Multas) and Tolls Value (Pedágios)

-- 1. Create table for Fines (Multas)
create table if not exists multas (
  id uuid default uuid_generate_v4() primary key,
  veiculo_id uuid references veiculos(id) on delete cascade not null,
  condutor_id uuid references condutores(id) on delete set null,
  data date not null default current_date,
  valor numeric not null,
  motivo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add Toll Value to Trips (Viagens)
alter table viagens add column if not exists valor_pedagios numeric default 0;

-- 3. Enable RLS for Fines
alter table multas enable row level security;

-- 4. Open access policy for Fines (for demo purposes, matching other tables)
create policy "Enable all access for all users" on multas for all using (true);
