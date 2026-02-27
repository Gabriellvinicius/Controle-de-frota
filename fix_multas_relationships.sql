-- REPAIR SCRIPT: Fix Relationships
-- Run this in Supabase SQL Editor to fix the "Could not find a relationship" error.

-- 1. Drop potential existing constraints to ensure clean slate
ALTER TABLE multas DROP CONSTRAINT IF EXISTS multas_veiculo_id_fkey;
ALTER TABLE multas DROP CONSTRAINT IF EXISTS multas_condutor_id_fkey;
ALTER TABLE multas DROP CONSTRAINT IF EXISTS fk_multas_veiculos;
ALTER TABLE multas DROP CONSTRAINT IF EXISTS fk_multas_condutores;

-- 2. Re-add the Foreign Keys explicitly
ALTER TABLE multas
ADD CONSTRAINT fk_multas_veiculos
FOREIGN KEY (veiculo_id)
REFERENCES veiculos(id)
ON DELETE CASCADE;

ALTER TABLE multas
ADD CONSTRAINT fk_multas_condutores
FOREIGN KEY (condutor_id)
REFERENCES condutores(id)
ON DELETE SET NULL;

-- 3. Verify columns exist (Just to be safe, though they should)
-- This query doesn't change anything but ensures the command is treated as a schema update.
COMMENT ON TABLE multas IS 'Tabela de multas com relacionamentos corrigidos';
