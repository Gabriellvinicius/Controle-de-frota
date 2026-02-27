-- 1. Garante que a coluna 'name' existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name text;

-- 2. Atualiza seu usuário específico (IMPORTANTE: TROQUE O EMAIL ABAIXO)
UPDATE profiles 
SET 
  name = 'Gabriel Caldas',
  role = 'admin'
WHERE email = 'SEU_EMAIL_AQUI'; -- <--- DIGITE SEU EMAIL AQUI ENTRE AS ASPAS

-- 3. Recria a permissão de atualização de perfil para evitar erros
DROP POLICY IF EXISTS "Users can update own details" ON profiles;

CREATE POLICY "Users can update own details" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
