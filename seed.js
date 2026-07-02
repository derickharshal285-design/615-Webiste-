import { createClient } from '@supabase/supabase-js';

import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hxxsdkwpkenouscuyuxg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY; // Fallback

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const dummyPosters = [
  {
    id: `poster-${Date.now()}-1`,
    title: 'CYBER SAMURAI',
    description: 'Neon bathed warrior in a dystopian futuristic city. High detail print.',
    price: 3500,
    imageUrl: 'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=600&auto=format&fit=crop',
    entityType: 'Poster',
    creatorId: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: `poster-${Date.now()}-2`,
    title: 'NEON SYNDICATE',
    description: 'Abstract grid runner visual representing the underworld of club 615.',
    price: 4200,
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop',
    entityType: 'Poster',
    creatorId: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: `poster-${Date.now()}-3`,
    title: 'RETRO GRID 1984',
    description: 'Vaporwave aesthetics featuring a sunset over a digital grid matrix.',
    price: 2800,
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
    entityType: 'Poster',
    creatorId: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: `poster-${Date.now()}-4`,
    title: 'AI SINGULARITY',
    description: 'A conceptual piece representing artificial intelligence surpassing human thought.',
    price: 5000,
    imageUrl: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=600&auto=format&fit=crop',
    entityType: 'Poster',
    creatorId: 'admin',
    createdAt: new Date().toISOString()
  }
];

async function seed() {
  console.log("Fetching current DB state from Supabase...");
  const { data, error } = await supabase.from('json_store').select('data').eq('id', 'db').single();
  
  if (error) {
    console.error("Failed to read DB", error);
    return;
  }
  
  let currentDb = data.data;
  
  if (!currentDb.products) currentDb.products = [];
  
  // Add our dummy posters to the products array
  currentDb.products.push(...dummyPosters);
  
  console.log("Writing seeded data to Supabase...");
  const { error: writeError } = await supabase.from('json_store').update({ data: currentDb }).eq('id', 'db');
  
  if (writeError) {
    console.error("Failed to seed", writeError);
  } else {
    console.log("Successfully seeded", dummyPosters.length, "dummy posters.");
  }
}

seed();
