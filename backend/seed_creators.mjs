import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hxxsdkwpkenouscuyuxg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0IUad9AEFWRjbXtytQ39SQ_tsb6Kj63';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log("Fetching existing db...");
  const { data, error } = await supabase.from('json_store').select('data').eq('id', 'db').single();
  
  if (error && error.code === 'PGRST116') {
      console.log("No db row found. Make sure json_store table exists and has id='db' row.");
      return;
  }
  
  if (error) {
      console.error("Error fetching db:", error);
      return;
  }
  
  let dbData = data.data;
  
  const derickUser = {
      uid: 'user-derickharshal285',
      email: 'derickharshal285@gmail.com',
      displayName: 'derick',
      roles: ['creator', 'admin'],
      nickname: 'Derick',
      tagline: 'System God',
      bio: 'Absolute root access.',
      links: '',
      photoURL: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=derick'
  };
  
  const aryanUser = {
      uid: 'user-club.615.chill',
      email: 'club.615.chill@gmail.com',
      displayName: 'aryan',
      roles: ['creator', 'admin'],
      nickname: 'Aryan',
      tagline: 'System God',
      bio: 'Absolute root access.',
      links: '',
      photoURL: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=aryan'
  };
  
  // Add users if they don't exist
  if (!dbData.users.find(u => u.email === derickUser.email)) {
      dbData.users.push(derickUser);
  }
  if (!dbData.users.find(u => u.email === aryanUser.email)) {
      dbData.users.push(aryanUser);
  }
  
  // Also add them to creators specifically if not there
  const derickCreator = {
      id: 'creator-' + derickUser.uid,
      userId: derickUser.uid,
      ownerId: derickUser.uid,
      name: 'Derick',
      tagline: 'System God',
      bio: 'Absolute root access.',
      stats: { rating: 5, views: 9999, earnings: 99999 }
  };
  
  const aryanCreator = {
      id: 'creator-' + aryanUser.uid,
      userId: aryanUser.uid,
      ownerId: aryanUser.uid,
      name: 'Aryan',
      tagline: 'System God',
      bio: 'Absolute root access.',
      stats: { rating: 5, views: 9999, earnings: 99999 }
  };

  if (!dbData.creators.find(c => c.userId === derickUser.uid)) {
      dbData.creators.push(derickCreator);
  }
  if (!dbData.creators.find(c => c.userId === aryanUser.uid)) {
      dbData.creators.push(aryanCreator);
  }
  
  console.log("Updating db...");
  const { error: updateError } = await supabase.from('json_store').update({ data: dbData }).eq('id', 'db');
  
  if (updateError) {
      console.error("Failed to update:", updateError);
  } else {
      console.log("Success! Seeded Derick and Aryan as creators.");
  }
}

seed();
