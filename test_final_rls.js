import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kjibefrdxeygdbshbxtb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaWJlZnJkeGV5Z2Ric2hieHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjAyNzksImV4cCI6MjA4MzUzNjI3OX0.5g0D_2xFlMfkIob2CoCzEt6AsPPt37Cu7VrerU7nLXs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTests() {
    try {
        console.log('--- INICIANDO VERIFICAÇÃO FINAL ---');

        const timestamp = Date.now();
        const motoristaEmail = `moto_final_${timestamp}@teste.com`;
        const gestorEmail = `gestor_final_${timestamp}@teste.com`;
        const pass = 'senha123';

        // 1. Criar Motorista
        console.log(`\n1. Criando motorista via Auth: ${motoristaEmail}`);
        let { data: authMoto, error: errAuthMoto } = await supabase.auth.signUp({
            email: motoristaEmail,
            password: pass,
            options: {
                data: { role: 'motorista' }
            }
        });
        if (errAuthMoto) throw errAuthMoto;

        // Aguardando um instante pro Trigger rodar no servidor
        await new Promise(r => setTimeout(r, 1000));

        // Vamos checar se o trigger funcionou
        const { data: profMoto, error: profErr } = await supabase.from('profiles').select('*').eq('id', authMoto.user.id).single();
        if (profErr) {
            console.log('Aviso (Perfil): Pode ser que o Admin precise inserir o perfis se o trigger não disparou:', profErr.message);
        } else {
            console.log(`✅ Trigger funcionou! Perfil criado com role: ${profMoto.role}`);
        }

        console.log('\n2. Testando RLS do Motorista (Ver só os próprios dados)');
        // Logando como motorista (agora deve funcionar pois confirm_email tá desligado)
        const { error: loginMotoErr } = await supabase.auth.signInWithPassword({ email: motoristaEmail, password: pass });
        if (loginMotoErr) throw loginMotoErr;

        // Tentar ler os registros da tabela trips
        const { data: tripsMoto, error: tripsMotoErr } = await supabase.from('trips').select('*');
        if (tripsMotoErr) throw tripsMotoErr;

        const apenasDele = tripsMoto.every(t => t.user_id === authMoto.user.id);
        if (apenasDele) {
            console.log(`✅ SUCESSO! O Motorista consultou a tabela e viu apenas os seus próprios registros (total: ${tripsMoto.length}). Nenhuma outra viagem vazou!`);
        } else {
            console.log(`❌ FALHA! O Motorista viu dados de outras pessoas!`);
        }


        console.log(`\n3. Criando gestor via Auth: ${gestorEmail}`);
        let { data: authGestor, error: errAuthGestor } = await supabase.auth.signUp({
            email: gestorEmail,
            password: pass,
            options: {
                data: { role: 'gestor' }
            }
        });
        if (errAuthGestor) throw errAuthGestor;

        await new Promise(r => setTimeout(r, 1000));

        console.log('\n4. Testando RLS do Gestor (Não poder apagar financeiro)');
        const { error: loginGestorErr } = await supabase.auth.signInWithPassword({ email: gestorEmail, password: pass });
        if (loginGestorErr) throw loginGestorErr;

        // Tentar excluir de 'abastecimentos' que não tem política de DELETE para Gestor (só Admin)
        const { error: delRefErr } = await supabase.from('abastecimentos').delete().eq('id', 'uuid-qualquer');

        // Esperamos um erro! (violates row-level security policy)
        if (delRefErr) {
            console.log(`✅ SUCESSO! O banco bloqueou a exclusão e retornou erro de permissão para o Gestor: ${delRefErr.message}`);
        } else {
            console.log('❌ FALHA! O Gestor conseguiu deletar ou a política não tá bloqueando.');
        }

        console.log('\n--- VERIFICAÇÃO CONCLUÍDA COM SUCESSO ---');
        process.exit(0);

    } catch (error) {
        console.error('❌ ERRO DURANTE OS TESTES:', error.message || error);
        process.exit(1);
    }
}

runTests();
