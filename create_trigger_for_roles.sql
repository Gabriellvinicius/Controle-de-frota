-- CRIAÇÃO DO TRIGGER AUTOMÁTICO (CORRETO) NO SUPABASE
-- Execute isso no SQL Editor do Supabase se quiser que o perfil seja criado automaticamente
-- após o usuário confirmar o e-mail, capturando o "role" que enviamos via metadata:

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'motorista')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove o trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Cria o novo trigger para rodar sempre que um usuário for inserido em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
