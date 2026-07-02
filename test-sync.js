import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hxxsdkwpkenouscuyuxg.supabase.co', 'sb_publishable_0IUad9AEFWRjbXtytQ39SQ_tsb6Kj63');
async function test() {
  const { data } = await supabase.auth.signInWithPassword({ email: 'derickharshal285@gmail.com', password: '615club' });
  const res = await fetch('https://projectmigration.vercel.app/api/auth/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + data.session.access_token
    },
    body: JSON.stringify({ email: 'derickharshal285@gmail.com', displayName: 'derick', role: 'creator' })
  });
  const text = await res.text();
  console.log('Sync Response:', res.status, text);
}
test();
