import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hxxsdkwpkenouscuyuxg.supabase.co', 'sb_publishable_0IUad9AEFWRjbXtytQ39SQ_tsb6Kj63');
async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({ email: 'derickharshal285@gmail.com', password: '615club' });
  console.log('Login Result:', { data, error });
}
testLogin();
