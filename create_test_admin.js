import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kjibefrdxeygdbshbxtb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaWJlZnJkeGV5Z2Ric2hieHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjAyNzksImV4cCI6MjA4MzUzNjI3OX0.5g0D_2xFlMfkIob2CoCzEt6AsPPt37Cu7VrerU7nLXs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAdmin() {
    try {
        const email = 'admin_test@teste.com';
        const password = 'password123';

        console.log('Criando admin...');
        let { data: auth, error: authErr } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authErr) {
            console.error('Erro ao criar user Auth:', authErr.message);
            // Ignore if already registered
        }

        const { data: userLogin, error: loginErr } = await supabase.auth.signInWithPassword({
            email, password
        });

        const userId = userLogin?.user?.id || auth?.user?.id;

        if (userId) {
            const { error: pErr } = await supabase.from('profiles').upsert([
                { id: userId, email: email, role: 'admin', name: 'Admin Test' }
            ]);
            if (pErr) console.error('Erro ao inserir perfil:', pErr.message);
            else console.log('✅ Admin de teste criado com sucesso:', email, password);
        } else {
            console.log("Não consegui pegar ID. Já existe? Tentando buscar ID pelo banco...");
        }

    } catch (err) {
        console.error('Erro geral script:', err);
    }
}

createAdmin();
