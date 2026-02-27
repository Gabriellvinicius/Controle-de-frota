-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: veiculos
create table veiculos (
  id uuid default uuid_generate_v4() primary key,
  placa text not null unique,
  marca text not null,
  modelo text not null,
  ano integer not null,
  tipo text not null,
  status text not null default 'ativo' check (status in ('ativo', 'manutenção', 'inativo')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: condutores
create table condutores (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  cpf text not null unique,
  categoria_cnh text not null,
  validade_cnh date not null,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: checklists
create table checklists (
  id uuid default uuid_generate_v4() primary key,
  veiculo_id uuid references veiculos(id) on delete cascade not null,
  condutor_id uuid references condutores(id) on delete set null,
  data date not null default current_date,
  hora time not null default current_time,
  km_atual integer not null,
  nivel_combustivel text not null,
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: checklist_itens
create table checklist_itens (
  id uuid default uuid_generate_v4() primary key,
  checklist_id uuid references checklists(id) on delete cascade not null,
  item text not null,
  status boolean not null default true -- true = ok, false = não ok
);

-- Table: checklist_fotos
create table checklist_fotos (
  id uuid default uuid_generate_v4() primary key,
  checklist_id uuid references checklists(id) on delete cascade not null,
  url_foto text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: abastecimentos
create table abastecimentos (
  id uuid default uuid_generate_v4() primary key,
  veiculo_id uuid references veiculos(id) on delete cascade not null,
  data date not null default current_date,
  litros numeric not null,
  valor numeric not null,
  km integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: manutencoes
create table manutencoes (
  id uuid default uuid_generate_v4() primary key,
  veiculo_id uuid references veiculos(id) on delete cascade not null,
  tipo text not null,
  data date not null default current_date,
  custo numeric not null,
  status text not null default 'pendente' check (status in ('em dia', 'pendente')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: viagens
create table viagens (
  id uuid default uuid_generate_v4() primary key,
  veiculo_id uuid references veiculos(id) on delete cascade not null,
  condutor_id uuid references condutores(id) on delete set null,
  destino text not null,
  distancia_km numeric not null,
  qtd_pessoas integer not null default 1,
  qtd_pedagios integer not null default 0,
  duracao_dias integer not null default 1,
  data_inicio date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Row Level Security)
alter table veiculos enable row level security;
alter table condutores enable row level security;
alter table checklists enable row level security;
alter table checklist_itens enable row level security;
alter table checklist_fotos enable row level security;
alter table abastecimentos enable row level security;
alter table manutencoes enable row level security;
alter table viagens enable row level security;

-- Open access for simple demonstration (User should refine this for RBAC later)
create policy "Enable all access for all users" on veiculos for all using (true);
create policy "Enable all access for all users" on condutores for all using (true);
create policy "Enable all access for all users" on checklists for all using (true);
create policy "Enable all access for all users" on checklist_itens for all using (true);
create policy "Enable all access for all users" on checklist_fotos for all using (true);
create policy "Enable all access for all users" on abastecimentos for all using (true);
create policy "Enable all access for all users" on manutencoes for all using (true);
create policy "Enable all access for all users" on viagens for all using (true);
