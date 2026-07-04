const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rqmpmiziybhiyukklpjk.supabase.co', 'sb_publishable_KMk6tO2FpQVDw9-6kygBoQ_0FUiypzT');

async function test() {
  const { data, error } = await supabase.from('announcements').insert([{
    title: 'Test',
    message: 'Test message',
    is_active: true,
  }]);
  console.log('Insert attempt:', error ? error.message : 'Success');
}
test();
