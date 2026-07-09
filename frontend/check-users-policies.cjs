const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { table_name: 'users' });
  if (error) {
    // If helper RPC doesn't exist, query pg_policies directly
    const { data: policies, error: err } = await supabase.from('pg_policies').select('*').eq('tablename', 'users');
    console.log("Policies:", policies);
    console.log("Query Error:", err);
  } else {
    console.log("Policies:", data);
  }
}
check();
