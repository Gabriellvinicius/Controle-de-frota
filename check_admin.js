import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kjibefrdxeygdbshbxtb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaWJlZnJkeGV5Z2Ric2hieHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjAyNzksImV4cCI6MjA4MzUzNjI3OX0.5g0D_2xFlMfkIob2CoCzEt6AsPPt37Cu7VrerU7nLXs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkUser() {
    const email = 'gabrielcaldas@geogis.com.br';
    console.log(`Checking profile for: ${email}`);
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (error) {
        console.error('Error fetching profile:', error.message);
    } else {
        console.log('Profile found:', profile);
    }
}

checkUser();
