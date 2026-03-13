-- 1. Remove triggers antigs que criam perfis como 'assistente'
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_new_user_profile ON auth.users;

-- 2. Permite ao Admin INSERIR e ATUALIZAR novos perfis manualmente:
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
