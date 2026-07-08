const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function seed() {
  const data = JSON.parse(fs.readFileSync('daily_challenges.json', 'utf8'));
  
  console.log("Seeding 30 Daily Challenges...");
  
  for (const c of data) {
    const { error } = await supabase.from('daily_challenges').upsert(c, { onConflict: 'day_number' });
    if (error) {
      console.error(`Error inserting day ${c.day_number}:`, error.message);
    } else {
      console.log(`✅ Seeded Day ${c.day_number}: ${c.title}`);
    }
  }
  console.log("Finished seeding daily challenges!");
}

seed();
