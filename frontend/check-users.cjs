const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function test() {
  const { data: users } = await supabase.from('users').select('*');
  console.log("Users in public.users:", users);
  
  // also check auth.users if possible
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  if (!error) {
    console.log("Users in auth.users:", authUsers.users.map(u => ({ id: u.id, email: u.email })));
  }
}
test();
