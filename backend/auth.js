import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db.js';
import { verifyCredentials } from '@supabase/server/core';
import { kv } from '@vercel/kv';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 64) {
  throw new Error('JWT_SECRET must be at least 64 characters');
}

// Hash password using native PBKDF2 with 600,000 iterations
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// Verify password supporting both new 600k iterations and legacy 1000 iterations fallback
export function verifyPassword(password, salt, hash) {
  const verifyHashNew = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
  if (hash === verifyHashNew) return true;
  const verifyHashOld = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHashOld;
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

export async function blacklistToken(token) {
  if (!token) return;
  try {
    if (process.env.KV_REST_API_URL) {
      await kv.set(`blacklist:${token}`, '1', { ex: 3600 });
    }
  } catch (err) {
    console.error('[AUTH] Failed to write to Vercel KV blacklist:', err.message);
  }
  // Local fallback
  tokenBlacklist.add(token);
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 60 * 60 * 1000);
}

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

export function verifyToken(token) {
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

  // Check token blacklist
  if (await isTokenBlacklisted(token)) {
    req.user = null;
    return next();
  }
  
  let uid = null;
  const decoded = verifyToken(token);
  
  if (decoded) {
    uid = decoded.uid;
  } else {
    // Fallback: Verify as a direct Supabase JWT token using @supabase/server
    try {
      const apikey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const { data, error } = await verifyCredentials({ token, apikey }, { auth: 'user' });
      if (data?.user?.id) {
        uid = `user-${data.user.id}`;
      } else if (data?.userClaims?.sub) {
        uid = data.userClaims.sub;
      }
    } catch (err) {
      console.error("[AUTH] Supabase server token verification error:", err.message);
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
