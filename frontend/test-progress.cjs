const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
let url, key;
if (fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf8');
  url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
  key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
}
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('user_progress').insert({
    user_id: '12345678-1234-1234-1234-123456789012',
    roadmap_step_id: '12345678-1234-1234-1234-123456789012',
    completed: true,
    completed_at: new Date().toISOString()
  });
  console.log('Insert Error:', error);
}
test();
