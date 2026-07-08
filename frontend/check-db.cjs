const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(url, key);

async function test() {
  console.log("Checking pg_policies for user_progress...");
  const { data: policies, error: polErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'user_progress');
  console.log(policies || polErr);

  console.log("\nChecking a row in user_progress...");
  const { data: rows, error: rowErr } = await supabase.from('user_progress').select('*').limit(1);
  console.log(rows || rowErr);
}
test();
