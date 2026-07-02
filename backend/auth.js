import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db.js';
import { verifyCredentials } from '@supabase/server/core';
import { kv } from '@vercel/kv';
import argon2 from 'argon2';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 64) {
  throw new Error('JWT_SECRET must be at least 64 characters');
}

// Critical #1: Hash password using Argon2id
export async function hashPassword(password) {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    timeCost: 3,
    memoryCost: 65536,  // 64 MB
    parallelism: 1,
  });
}

// Critical #1: Verify password with Argon2id and fallback to legacy PBKDF2 (1000 iterations)
export async function verifyPassword(password, salt, storedHash) {
  try {
    // If the stored hash looks like an Argon2 hash, verify it directly
    if (storedHash && storedHash.startsWith('$argon2')) {
      return await argon2.verify(storedHash, password);
    }
  } catch (err) {
    // Fallback in case verification throws on bad input formats
  }

  // Fallback to legacy PBKDF2
  try {
    const verifyHashOld = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return storedHash === verifyHashOld;
  } catch (err) {
    return false;
  }
}

export function signToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn,
    issuer: 'club-615',
    audience: 'club-615-users',
    jwtid: crypto.randomUUID(),
  });
}

const tokenBlacklist = new Set();

// Critical #2: KV-backed token blacklist
export async function blacklistToken(token, ttlSeconds = 3600) {
  if (!token) return;
  try {
    if (process.env.KV_REST_API_URL) {
      await kv.set(`blacklist:${token}`, '1', { ex: ttlSeconds });
    }
  } catch (err) {
    console.error('[AUTH] Failed to write to Vercel KV blacklist:', err.message);
  }
  // Local fallback
  tokenBlacklist.add(token);
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, ttlSeconds * 1000);
}

// Critical #2: Check Vercel KV token blacklist
export async function isTokenBlacklisted(token) {
  if (!token) return false;
  if (tokenBlacklist.has(token)) return true;
  try {
    if (process.env.KV_REST_API_URL) {
      const val = await kv.get(`blacklist:${token}`);
      return !!val;
    }
  } catch (err) {
    console.error('[AUTH] Failed to read from Vercel KV blacklist:', err.message);
  }
  return false;
}

// Critical #2: Update verifyToken to be async
export async function verifyToken(token) {
  if (await isTokenBlacklisted(token)) return null;
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'club-615',
      audience: 'club-615-users',
    });
  } catch {
    return null;
  }
}

// ── MIDDLEWARE: Populate req.user if token present (does NOT block) ──
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (req.cookies && req.cookies.auth_token) || (authHeader && authHeader.split(' ')[1]);
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  let uid = null;
  const decoded = await verifyToken(token);
  
  if (decoded) {
    uid = decoded.uid;
  } else {
    // Critical #3: Stop email derivation, use canonical Supabase token verification
    try {
      if (db.supabase) {
        const { data, error } = await db.supabase.auth.getUser(token);
        if (!error && data?.user?.id) {
          uid = `user-${data.user.id}`;
        }
      }
    } catch (err) {
      console.error("[AUTH] Supabase token verification error:", err.message);
    }
  }
  
  if (!uid) {
    req.user = null;
    return next();
  }
  
  const user = await db.getUser(uid);
  if (!user) {
    req.user = null;
    return next();
  }
  
  req.user = user;
  next();
}

// ── GUARD: Require a valid logged-in session ──
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required. Please log in." });
  }
  next();
}

// ── GUARD: Require admin role ──
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }
  if (!req.user.roles?.includes('admin')) {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

// ── GUARD: Require creator role ──
export function requireCreator(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }
  if (!req.user.roles?.includes('creator') && !req.user.roles?.includes('admin')) {
    return res.status(403).json({ error: "Creator access required." });
  }
  next();
}

// ── GUARD: Require user to be accessing their OWN resource ──
export function requireSelf(uidParam = 'uid') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    const targetUid = req.params[uidParam];
    if (req.user.uid !== targetUid) {
      return res.status(403).json({ error: "You can only access your own data." });
    }
    next();
  };
}
