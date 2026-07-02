require('dotenv').config();
const { execSync } = require('child_process');

function addEnv(name, value) {
  if (!value) {
    console.error(`Error: Value for ${name} is empty or undefined.`);
    return;
  }
  try {
    execSync(`npx vercel@54.18.2 env rm ${name} production --yes`, { stdio: 'ignore' });
  } catch (e) {}
  console.log(`Adding ${name}...`);
  execSync(`npx vercel@54.18.2 env add ${name} production --yes`, {
    input: value,
    stdio: ['pipe', 'inherit', 'inherit']
  });
}

const supabaseUrl = process.env.SUPABASE_URL || 'https://hxxsdkwpkenouscuyuxg.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseKey) {
  console.error("Missing SUPABASE_KEY / SUPABASE_SECRET_KEY in environment or .env file.");
  process.exit(1);
}

addEnv('SUPABASE_KEY', supabaseKey);
addEnv('SUPABASE_URL', supabaseUrl);

