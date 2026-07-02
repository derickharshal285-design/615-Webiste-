const fetch = require('node-fetch');

async function getLogs() {
  const res = await fetch('https://615-webiste.vercel.app/api/logs');
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

getLogs();
