import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kjibefrdxeygdbshbxtb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaWJlZnJkeGV5Z2Ric2hieHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjAyNzksImV4cCI6MjA4MzUzNjI3OX0.5g0D_2xFlMfkIob2CoCzEt6AsPPt37Cu7VrerU7nLXs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAndTestUsers() {
    try {
        console.log('1. Criando usuário Gestor...');
        const gestorEmail = 'gestor_test_' + Date.now() + '@empresa.com';
        const gestorPassword = 'password123';

        let { data: gestorAuth, error: gestorErr } = await supabase.auth.signUp({
            email: gestorEmail,
            password: gestorPassword
        });

        if (gestorErr) {
            console.error('Erro ao criar Gestor:', gestorErr.message);
            return;
        }

        const gestorId = gestorAuth.user?.id;
        console.log('Gestor criado:', gestorEmail, gestorId);

        if (gestorId) {
            const { error: pErr } = await supabase.from('profiles').insert([
                { id: gestorId, email: gestorEmail, role: 'gestor' }
            ]);
            if (pErr) console.error('Erro ao inserir perfil gestor:', pErr.message);
        }

        console.log('2. Testando Gestor (tentando deletar multa)...');
        // Let's try to delete a fine as Gestor
        const { error: delErr } = await supabase.from('multas').delete().eq('id', 'algum-id-fake');
        if (delErr) {
            console.log('✅ Gestor bloqueado de deletar (RLS funcionou):', delErr.message);
        } else {
            console.log('❌ Gestor conseguiu deletar ou não encontrou erro de permissão.');
        }

        // ==========================================
        console.log('\n3. Criando usuário Motorista...');
        const motoristaEmail = 'motorista_test_' + Date.now() + '@empresa.com';
        const motoristaPassword = 'password123';

        let { data: motoristaAuth, error: motoristaErr } = await supabase.auth.signUp({
            email: motoristaEmail,
            password: motoristaPassword
        });

        if (motoristaErr) {
            console.error('Erro ao criar Motorista:', motoristaErr.message);
            return;
        }

        const motoristaId = motoristaAuth.user?.id;
        console.log('Motorista criado:', motoristaEmail, motoristaId);

        if (motoristaId) {
            const { error: pErr } = await supabase.from('profiles').insert([
                { id: motoristaId, email: motoristaEmail, role: 'motorista' }
            ]);
            if (pErr) console.error('Erro ao inserir perfil motorista:', pErr.message);
        }

        console.log('4. Testando Motorista (visão de dados)...');
        // Let's insert a trip as Motorista
        const { error: insTripErr } = await supabase.from('trips').insert([
            {
                driver_name: 'Motorista Teste',
                destination: 'Teste Dest',
                distance_km: 10,
                revenue: 100,
                tolls: 0,
                user_id: motoristaId
            }
        ]);
        if (insTripErr) {
            console.error('Erro ao inserir trip como Motorista:', insTripErr.message);
        } else {
            console.log('✅ Motorista conseguiu inserir viagem própria.');
        }

        const { data: tripsList, error: tripsListErr } = await supabase.from('trips').select('*');
        if (tripsListErr) {
            console.error('Erro ao ler trips:', tripsListErr.message);
        } else {
            console.log(`✅ Motorista consegue ver ${tripsList?.length || 0} viagens. (Se > 0 e só as dele, RLS visão própria ok)`);
        }

    } catch (err) {
        console.error('Erro geral script:', err);
    }
}

createAndTestUsers();
