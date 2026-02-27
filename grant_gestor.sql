-- SQL para conceder acesso de Gestor ao usuário gabrielcaldas@geogis.com.br
-- Execute este comando no SQL Editor do seu Dashboard do Supabase

UPDATE public.profiles
SET role = 'gestor'
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'gabrielcaldas@geogis.com.br'
);
