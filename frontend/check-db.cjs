const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('user_gamification').select('*, users(full_name)').limit(1);
  console.log("Joined data:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}
test();
