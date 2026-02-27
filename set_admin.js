import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kjibefrdxeygdbshbxtb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaWJlZnJkeGV5Z2Ric2hieHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjAyNzksImV4cCI6MjA4MzUzNjI3OX0.5g0D_2xFlMfkIob2CoCzEt6AsPPt37Cu7VrerU7nLXs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setAdmin() {
    try {
        console.log('Buscando e definindo o primeiro usuário como admin...');

        // Pega todos os perfis
        const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');

        if (pErr) {
            console.error('Erro ao buscar perfis:', pErr.message);
            return;
        }

        if (profiles && profiles.length > 0) {
            // Pega o gabriel ou o primeiro que tiver
            const targetUser = profiles.find(p => p.email.includes('gabriel')) || profiles[0];

            console.log(`Definindo usuário ${targetUser.email} como gestor principal (admin)...`);

            const { error: updateErr } = await supabase
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', targetUser.id);

            if (updateErr) {
                console.error('Erro ao atualizar para admin:', updateErr.message);
            } else {
                console.log('✅ Usuário atualizado com sucesso. Recarregue a página na aplicação web logado com essa conta.');
            }
        } else {
            console.log('Nenhum perfil encontrado no banco para promover a admin.');
        }
    } catch (err) {
        console.error('Erro:', err);
    }
}

setAdmin();
