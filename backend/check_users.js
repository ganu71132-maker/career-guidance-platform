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
  const { data: users, error: err1 } = await supabase
    .from('users')
    .select('*');

  if (err1) {
    console.error('Error fetching users:', err1.message);
  } else {
    console.log('Users in public.users table:', users);
  }
}

check();
