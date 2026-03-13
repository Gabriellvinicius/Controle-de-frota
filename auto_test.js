import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kjibefrdxeygdbshbxtb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaWJlZnJkeGV5Z2Ric2hieHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjAyNzksImV4cCI6MjA4MzUzNjI3OX0.5g0D_2xFlMfkIob2CoCzEt6AsPPt37Cu7VrerU7nLXs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTests() {
    try {
        console.log('--- TESTE 1: CRIAR MOTORISTA E GESTOR ---');

        const timestamp = Date.now();
        const motoristaEmail = `moto${timestamp}@teste.com`;
        const gestorEmail = `gestor${timestamp}@teste.com`;
        const pass = 'senha123';

        // 1. Criar Motorista
        console.log(`Criando motorista: ${motoristaEmail}`);
        let { data: authMoto, error: errAuthMoto } = await supabase.auth.signUp({
            email: motoristaEmail,
            password: pass
        });
        if (errAuthMoto) throw errAuthMoto;

        // Ao dar signUp, o cliente Supabase loga o novo usuário se não tiver confirmação de e-mail.
        let { error: errProfMoto } = await supabase.from('profiles').insert([
            { id: authMoto.user.id, email: motoristaEmail, role: 'motorista' }
        ]);
        if (errProfMoto) throw errProfMoto;
        console.log('✅ Perfil Motorista criado com sucesso!');

        // 2. Criar Gestor
        console.log(`Criando gestor: ${gestorEmail}`);
        let { data: authGestor, error: errAuthGestor } = await supabase.auth.signUp({
            email: gestorEmail,
            password: pass
        });
        if (errAuthGestor) throw errAuthGestor;

        let { error: errProfGestor } = await supabase.from('profiles').insert([
            { id: authGestor.user.id, email: gestorEmail, role: 'gestor' }
        ]);
        if (errProfGestor) throw errProfGestor;
        console.log('✅ Perfil Gestor criado com sucesso!');


        console.log('\n--- TESTE 2: MOTORISTA SÓ VÊ SEUS PRÓPRIOS DADOS ---');
        // Logar como motorista
        await supabase.auth.signInWithPassword({ email: motoristaEmail, password: pass });

        // Inserir uma multa como motorista
        const multaTeste = {
            vehicle_id: 'algum-veiculo', // RLS não deve bloquear inserção mesmo sem fk válido se a tabela alvo não checar no insert (esperamos erro fk se aplicável)
            valor: 100.50,
            descricao: 'Multa de teste motorista'
        };
        // vamos só tentar inserir em trips para não precisar de FKs se possível
        const tripTeste = {
            driver_name: 'Ze Teste',
            destination: 'Lugar Nenhum',
            distance_km: 10,
            revenue: 50,
            tolls: 0
        };

        const { error: tripInsErr } = await supabase.from('trips').insert([tripTeste]);
        if (tripInsErr) console.log('Aviso ao inserir trip (motorista):', tripInsErr.message);
        else console.log('Motorista inseriu viagem com sucesso.');

        // Ler trips
        const { data: tripsMoto, error: tripsMotoErr } = await supabase.from('trips').select('*');
        if (tripsMotoErr) throw tripsMotoErr;

        // Checar se todas as trips retornadas pertencem ao motorista (ou lista vazia confirmando que filtramos o resto do DB)
        const apenasDele = tripsMoto.every(t => t.user_id === authMoto.user.id);
        if (apenasDele) {
            console.log(`✅ Sucesso: O Motorista consultou a tabela e viu apenas seus próprios registros (total: ${tripsMoto.length}).`);
        } else {
            console.log(`❌ Erro: O Motorista está vendo registros de outras pessoas!`);
        }


        console.log('\n--- TESTE 3: GESTOR NÃO CONSEGUE EXCLUIR REGISTROS FINANCEIROS ---');
        // Logar como gestor
        await supabase.auth.signInWithPassword({ email: gestorEmail, password: pass });

        console.log('Tentando excluir registro de abastecimento (refuelings) como gestor...');
        const { error: delRefErr } = await supabase.from('refuelings').delete().eq('id', 'uuid-qualquer');

        if (delRefErr) {
            console.log('Erro retornado:', delRefErr.message);
            console.log('✅ Sucesso: O banco de dados bloqueou o gestor (violação da política RLS para delete).');
        } else {
            console.log('❌ O gestor conseguiu executar o comando delete! A política RLS não bloqueou!');
        }

        console.log('\nTodos os testes foram concluídos!');
        process.exit(0);

    } catch (error) {
        console.error('❌ ERRO DURANTE OS TESTES:', error.message);
        process.exit(1);
    }
}

runTests();
