-- SCRIPT DE CORREÇÃO DE ADMIN
-- Substitua 'SEU_EMAIL_AQUI' pelo seu email de login (ex: 'joao@empresa.com')

INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'SEU_EMAIL_AQUI' -- <--- EDITE AQUI
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
