-- Create Multas Table
create table if not exists multas (
  id uuid default uuid_generate_v4() primary key,
  veiculo_id uuid references veiculos(id) on delete cascade not null,
  condutor_id uuid references condutores(id) on delete set null,
  valor numeric not null,
  data date not null default current_date,
  descricao text,
  status text not null default 'pendente' check (status in ('pendente', 'pago')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table multas enable row level security;

-- Policy
create policy "Enable all access for all users" on multas for all using (true);
