const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load Supabase Config
let supabaseUrl = '';
let supabaseAnonKey = '';
try {
  const envPath = path.join(__dirname, '../frontend/.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
        if (key === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = val;
      }
    });
  }
} catch (e) {
  console.error(e.message);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase
    .from('user_push_subscriptions')
    .select('*');

  if (error) {
    console.error('Error fetching subscriptions:', error.message);
  } else {
    console.log('Subscriptions in database:', data);
  }
}

check();
