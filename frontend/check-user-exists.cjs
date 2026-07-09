const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function check() {
  const userId = '142a0636-d731-4a89-b4c7-adcf3fae71c8';
  
  // 1. Check public.users
  const { data: pUser, error: pError } = await supabase.from('users').select('*').eq('id', userId);
  console.log("Public User:", pUser, "Error:", pError);

  // 2. Check user_gamification
  const { data: gamification, error: gError } = await supabase.from('user_gamification').select('*').eq('user_id', userId);
  console.log("Gamification:", gamification, "Error:", gError);
}
check();
