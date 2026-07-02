import 'dotenv/config';
import { db } from './db.js';
import { hashPassword } from './auth.js';

async function seedLocalGods() {
  console.log('Seeding God accounts directly into database...');
  
  const gods = [
    { email: 'derick@club615.com', displayName: 'derick', password: '615club' },
    { email: 'aryan@club615.com', displayName: 'aryan', password: '615club' }
  ];
  
  await db.ensureData();
  
  for (const god of gods) {
    let user = await db.findUserByEmail(god.email);
    if (!user) {
      console.log(`Creating ${god.displayName}...`);
      
      const { salt, hash } = hashPassword(god.password);
      
      user = {
        uid: `god-${god.displayName}`,
        email: god.email,
        displayName: god.displayName,
        photoURL: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${god.displayName}`,
        roles: ['admin', 'creator'],
        nickname: god.displayName,
        tagline: 'System God',
        bio: 'Absolute root access.',
        links: '',
        createdAt: new Date().toISOString(),
        salt,
        passwordHash: hash
      };
      await db.createUser(user);
      console.log(`✅ ${god.displayName} created successfully.`);
    } else {
      console.log(`⚠️ ${god.displayName} already exists.`);
      const { salt, hash } = hashPassword(god.password);
      await db.updateUser(user.uid, { salt, passwordHash: hash, roles: ['admin', 'creator'] });
      console.log(`✅ ${god.displayName} password and roles updated.`);
    }
  }
  
  console.log('Done!');
}

seedLocalGods().catch(console.error);
