import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import csrf from 'csurf';
import { db } from './db.js';
import { hashPassword, verifyPassword, signToken, authenticateToken, requireAuth, requireAdmin, requireCreator, requireSelf, blacklistToken } from './auth.js';
import { validateBody, firebaseAuthSchema, swapIdentitySchema, legacyRegisterSchema, legacyLoginSchema, createProductSchema, createOrderSchema, updateOrderStatusSchema, createRequestSchema, updateRequestStatusSchema, createBidSchema, createReviewSchema, updateProfileSchema, updateWishlistSchema, updateCartSchema, updatePortfolioSchema, overrideRoleSchema, checkUsernameSchema, followSchema, createApplicationSchema, updateApplicationStatusSchema, createMessageSchema, createChatSchema, submitScoreSchema, aiSearchSchema, createLogSchema, updateLogStatusSchema } from './validators.js';
import { OAuth2Client } from 'google-auth-library';
import { kv } from '@vercel/kv';
import multer from 'multer';
import path from 'path';

// Load environment variables
dotenv.config();

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

const app = express();

// Security Headers
app.use(helmet());

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use(limiter);

// Auth Rate Limiter (Stricter)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { error: 'Too many authentication attempts from this IP, please try again after an hour' }
});

// API write rate limiter — covers POST/PUT/DELETE actions
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, please slow down.' }
});

// Strict rate limiter for order placement
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many orders placed in a short period. Please wait a minute.' }
});

// Admin actions rate limiter
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many admin requests.' }
});

// Strict Minute Limiter for Critical Routes (Auth, Search, Messages, Orders)
const strictMinuteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Strict rate limit exceeded (10 requests per minute). Please slow down.' }
});

const checkUsernameLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many username check attempts. Please slow down.' }
});

const productsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many product list requests. Please slow down.' }
});

const aiSearchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => req.user?.uid || req.ip,
  message: {
    response: "TRANSMISSION BLOCKED: AI search core cooled down. Rate limit exceeded (5 requests per hour). Please wait before sending further transmissions.",
    matches: { creators: [], products: [], bounties: [] }
  }
});

// Apply strict limits to requested path prefixes globally
app.use('/api/auth', strictMinuteLimiter);
app.use('/api/chats', strictMinuteLimiter);

// Configure CORS to allow authorization headers and cookies
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://615-webiste.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json());
app.use(cookieParser());

const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  }
});

// Expose CSRF token route
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Global CSRF Protection for state-changing requests
app.use((req, res, next) => {
  const method = req.method.toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return csrfProtection(req, res, next);
  }
  next();
});

// Sanitize 500 error messages to prevent leaking stack traces/internal details
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (obj) {
    if (res.statusCode === 500 && obj && typeof obj.error === 'string') {
      console.error('[API Error]', {
        path: req.path,
        method: req.method,
        error: obj.error
      });
      obj.error = 'Internal server error';
    }
    return originalJson.call(this, obj);
  };
  next();
});

// Order Idempotency Keys store
const processedIdempotencyKeys = new Map();
const IDEMPOTENCY_TTL = 10 * 60 * 1000; // 10 minutes

// Secure Hybrid Cache: leverages Vercel KV if available, falls back to in-memory map locally
const localCache = new Map();
const CACHE_TTL = 60; // 60 seconds

export async function getCache(key) {
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const data = await kv.get(key);
      return data;
    }
  } catch (err) {
    console.error("[CACHE] Vercel KV get error:", err.message);
  }
  
  const cached = localCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  localCache.delete(key);
  return null;
}

export async function setCache(key, data) {
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      await kv.set(key, JSON.stringify(data), { ex: CACHE_TTL });
      return;
    }
  } catch (err) {
    console.error("[CACHE] Vercel KV set error:", err.message);
  }
  
  localCache.set(key, { data, expiry: Date.now() + CACHE_TTL * 1000 });
}

export async function clearCache(keyPrefix) {
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const keys = await kv.keys(`${keyPrefix}*`);
      if (keys.length > 0) {
        await kv.del(...keys);
      }
    }
  } catch (err) {
    console.error("[CACHE] Vercel KV clear error:", err.message);
  }
  
  for (const key of localCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      localCache.delete(key);
    }
  }
}

// Apply authentication middleware globally to populate req.user
app.use(authenticateToken);

// ------------------- AUTHENTICATION API -------------------

// POST /api/auth/register
// Validates: email, password, displayName, role, nickname, tagline, bio, links
app.post('/api/auth/register', authLimiter, validateBody(legacyRegisterSchema), async (req, res) => {
  try {
    const { email, password, displayName, photoURL, role, nickname, tagline, bio, links } = req.body;
    
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Email, password, and display name are required." });
    }

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const { salt, hash } = hashPassword(password);
    const uid = `user-${Date.now()}`;
    
    const newUser = {
      uid,
      email: email.toLowerCase(),
      salt,
      passwordHash: hash,
      displayName,
      photoURL: photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${displayName}`,
      roles: role ? [role] : ['viewer'],
      nickname: nickname || '',
      tagline: tagline || '',
      bio: bio || '',
      links: links || '',
      createdAt: new Date().toISOString()
    };

    await db.createUser(newUser);

    // Create session token (exclude salt & hash from token payload)
    const token = signToken({ uid: newUser.uid, email: newUser.email, displayName: newUser.displayName });
    
    const { salt: _s, passwordHash: _h, ...userProfile } = newUser;
    
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });
    
    res.status(201).json({ user: userProfile });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
// Validates: email, password
app.post('/api/auth/login', authLimiter, validateBody(legacyLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await db.findUserByEmail(email);
    
    // Constant time validation fallback to prevent user enumeration via timing attacks
    const dummySalt = '00000000000000000000000000000000';
    const dummyHash = '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    
    const targetSalt = (user && user.salt) ? user.salt : dummySalt;
    const targetHash = (user && user.passwordHash) ? user.passwordHash : dummyHash;
    
    const isValid = verifyPassword(password, targetSalt, targetHash);
    if (!user || !isValid) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const token = signToken({ uid: user.uid, email: user.email, displayName: user.displayName });
    
    const { salt, passwordHash, ...userProfile } = user;
    
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });
    
    res.json({ user: userProfile });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/swap-identity
// Validates: uid
app.post('/api/auth/swap-identity', strictMinuteLimiter, requireAuth, requireAdmin, validateBody(swapIdentitySchema), async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: "UID is required." });
    }
    const user = await db.getUser(uid);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    const token = signToken({ uid: user.uid, email: user.email, displayName: user.displayName });
    const { salt, passwordHash, ...userProfile } = user;
    
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });
    
    res.json({ user: userProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  const token = (req.cookies && req.cookies.auth_token) || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (token) {
    blacklistToken(token);
  }
  res.clearCookie('auth_token');
  res.json({ message: "Logged out successfully" });
});

// GET /api/auth/me
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const { salt, passwordHash, ...userProfile } = req.user;
  res.json({ user: userProfile });
});

// POST /api/auth/change-password — change user's own password
app.post('/api/auth/change-password', requireAuth, writeLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }
    
    const user = await db.getUser(req.user.uid);
    if (!user || !user.passwordHash || !user.salt) {
      return res.status(404).json({ error: "User or login configuration not found." });
    }
    
    const isValid = verifyPassword(currentPassword, user.salt, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid current password." });
    }
    
    const { salt, hash } = hashPassword(newPassword);
    const success = await db.updateUserPassword(req.user.uid, salt, hash);
    if (success) {
      res.json({ success: true, message: "Password updated successfully." });
    } else {
      res.status(500).json({ error: "Failed to update password." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/google
app.post('/api/auth/google', authLimiter, strictMinuteLimiter, async (req, res) => {
  try {
    const { tokenId, role, nickname, tagline, bio, links } = req.body;
    if (!tokenId) {
      return res.status(400).json({ error: "tokenId is required." });
    }

    if (!googleClient || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: "Google Authentication is not configured on the server." });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Invalid Google token." });
    }

    const email = payload.email.toLowerCase();
    const displayName = payload.name || email.split('@')[0];
    const photoURL = payload.picture || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${displayName}`;

    let user = await db.findUserByEmail(email);
    if (!user) {
      // Register new user automatically
      const uid = `google-user-${Date.now()}`;
      user = {
        uid,
        email,
        displayName,
        photoURL,
        roles: role ? [role] : ['viewer'],
        nickname: nickname || '',
        tagline: tagline || '',
        bio: bio || '',
        links: links || '',
        createdAt: new Date().toISOString()
      };
      await db.createUser(user);
    }

    const token = signToken({ uid: user.uid, email: user.email, displayName: user.displayName });
    const { salt, passwordHash, ...userProfile } = user;
    
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });
    
    res.json({ user: userProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/sync
// Validates: email, displayName, role, extra
app.post('/api/auth/sync', async (req, res) => {
  try {
    const { email, displayName, photoURL, role, extra } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required for sync." });
    }
    
    // Verify Supabase JWT token to prevent client impersonation
    if (db.supabase) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: "Supabase authentication token is required." });
      }
      
      const { data: { user: sbUser }, error: sbError } = await db.supabase.auth.getUser(token);
      if (sbError || !sbUser) {
        return res.status(401).json({ error: "Invalid Supabase authentication token: " + (sbError?.message || "User not found") });
      }
      
      if (!sbUser.email || sbUser.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({ error: "Token email does not match sync email." });
      }
    } else {
      console.warn("[SYNC] Supabase client not initialized, skipping JWT verification in fallback mode.");
    }
    
    // Fallback uid since we don't pass one directly anymore
    const uid = `user-${email.split('@')[0]}`;


    // 1. Try finding by Firebase UID
    let user = await db.getUser(uid);
    
    // 2. If not found, try finding by email to link/merge
    if (!user) {
      user = await db.findUserByEmail(email);
      if (user) {
        // Update user to have the correct Firebase UID
        const updated = await db.updateUser(user.uid, { uid });
        user = updated;
      }
    }

    // 3. If still not found, create new user profile with Firebase UID
    if (!user) {
      user = {
        uid,
        email: email.toLowerCase(),
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${displayName || uid}`,
        roles: role ? [role] : ['viewer'],
        nickname: extra?.nickname || '',
        tagline: extra?.tagline || '',
        bio: extra?.bio || '',
        links: extra?.links || '',
        createdAt: new Date().toISOString()
      };
      await db.createUser(user);
    }

    // 4. Admin Accounts Promotion via Environment Variables
    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes(user.email.toLowerCase())) {
      const requiredRoles = ['admin', 'creator'];
      const currentRoles = user.roles || [];
      const hasAllRequiredRoles = requiredRoles.every(r => currentRoles.includes(r));
      
      if (!hasAllRequiredRoles) {
        user.roles = Array.from(new Set([...currentRoles, ...requiredRoles]));
        user = await db.updateUser(user.uid, { roles: user.roles });
      }
    }

    const token = signToken({ uid: user.uid, email: user.email, displayName: user.displayName });
    const { salt, passwordHash, ...userProfile } = user;

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });

    res.json({ user: userProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// In-memory store for simulated/hashed verification codes with TTL
const pendingOtps = new Map();

// POST /api/auth/phone/send-otp
app.post('/api/auth/phone/send-otp', authLimiter, strictMinuteLimiter, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required." });
    }

    // Generate simulated 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash code with SHA256 before storage
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    
    // Store in memory with a 5-minute expiry
    const expiry = Date.now() + 5 * 60 * 1000;
    pendingOtps.set(phoneNumber, { hashedOtp, expiry });

    // In a real production setup, integrate Twilio here.
    // For now, simulate sending SMS via stdout / console output
    console.log(`\n======================================================`);
    console.log(`[SIMULATED SMS to ${phoneNumber}] OTP Code: ${otp}`);
    console.log(`======================================================\n`);

    res.json({ message: "Verification code sent." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/phone/verify-otp
app.post('/api/auth/phone/verify-otp', authLimiter, strictMinuteLimiter, async (req, res) => {
  try {
    const { phoneNumber, otp, displayName, role, nickname, tagline, bio, links } = req.body;
    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: "Phone number and verification code are required." });
    }

    const pending = pendingOtps.get(phoneNumber);
    if (!pending) {
      return res.status(400).json({ error: "No active verification request found." });
    }

    if (Date.now() > pending.expiry) {
      pendingOtps.delete(phoneNumber);
      return res.status(400).json({ error: "Verification code expired." });
    }

    const hashedInput = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedInput !== pending.hashedOtp) {
      return res.status(400).json({ error: "Invalid verification code." });
    }

    // OTP validated successfully, clear pending entry
    pendingOtps.delete(phoneNumber);

    const email = `${phoneNumber}@phone.network`;
    let user = await db.findUserByEmail(email);
    if (!user) {
      // Register new user automatically
      const name = displayName || `Patron_${phoneNumber.slice(-4)}`;
      const uid = `phone-user-${Date.now()}`;
      user = {
        uid,
        email,
        displayName: name,
        photoURL: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${name}`,
        roles: role ? [role] : ['viewer'],
        nickname: nickname || '',
        tagline: tagline || '',
        bio: bio || '',
        links: links || '',
        createdAt: new Date().toISOString()
      };
      await db.createUser(user);
    }

    const token = signToken({ uid: user.uid, email: user.email, displayName: user.displayName });
    const { salt, passwordHash, ...userProfile } = user;
    
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });
    
    res.json({ user: userProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ------------------- PRODUCTS API -------------------

// GET /api/products — public, but limited and no sensitive fields
app.get('/api/products', productsLimiter, async (req, res) => {
  try {
    const { type, creatorId } = req.query;
    const page = req.query.page ? Math.max(1, parseInt(req.query.page) || 1) : null;
    const limit = req.query.limit ? Math.min(100, parseInt(req.query.limit) || 20) : null;

    const cacheKey = `products_${type || 'all'}_${creatorId || 'all'}_${page || 'all'}_${limit || 'all'}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) return res.json(cachedData);

    const products = await db.getProducts(type, creatorId);
    // Strip any internal fields before sending
    const safe = products.map(({ id, title, price, imageUrl, creatorId, creatorName, entityType, description, status, createdAt }) => ({
      id, title, price, imageUrl, creatorId, creatorName, entityType, description, status, createdAt
    }));

    if (page !== null && limit !== null) {
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedResult = {
        data: safe.slice(start, end),
        pagination: { page, limit, total: safe.length }
      };
      await setCache(cacheKey, paginatedResult);
      return res.json(paginatedResult);
    }

    await setCache(cacheKey, safe);
    res.json(safe);
  } catch (err) {
    console.error('[API Error]', { path: req.path, message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products — must be logged in as creator
// Validates: title, description, price, entityType, imageUrl, metadata, status, deliveryTime, creatorId, creatorName
app.post('/api/products', requireAuth, requireCreator, writeLimiter, validateBody(createProductSchema), async (req, res) => {
  try {
    const { title, price, status, imageUrl, creatorId, creatorName, entityType, description } = req.body;
    
    if (!title || price === undefined || price === null) {
      return res.status(400).json({ error: "Title and price are required." });
    }
    if (Number(price) < 0) {
      return res.status(400).json({ error: "Price cannot be negative." });
    }

    // Secure creatorId: only admin can create products on behalf of other creators
    const targetCreatorId = req.user.roles?.includes('admin') ? (creatorId || req.user.uid) : req.user.uid;
    const targetCreatorName = req.user.roles?.includes('admin') ? (creatorName || req.user.displayName) : req.user.displayName;

    const newProduct = {
      title,
      price: Number(price),
      status: status || "Active",
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&auto=format&fit=crop",
      creatorId: targetCreatorId,
      creatorName: targetCreatorName,
      entityType: entityType || "Service",
      description: description || "",
      createdAt: new Date().toISOString()
    };

    const added = await db.addProduct(newProduct);
    await clearCache('products_'); // Invalidate product caches
    res.status(201).json(added);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id — must own the product
app.delete('/api/products/:id', requireAuth, writeLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.ensureData();
    const product = (data.products || []).find(p => p.id === id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    
    // Only the creator can delete
    if (product.creatorId !== req.user.uid) {
      return res.status(403).json({ error: 'Only the creator can delete this product' });
    }
    const deleted = await db.deleteProduct(id);
    await clearCache('products_');
    console.log(`Product ${id} deleted successfully.`);
    res.json({ success: true, message: "Product deleted successfully." });
  } catch (err) {
    console.error('[API Error]', { path: req.path, message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ------------------- ORDERS API -------------------

// GET /api/orders — ADMIN ONLY: full order dump protected
app.get('/api/orders', requireAuth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const orders = await db.getOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/user/:userId — buyer sees only their own orders
app.get('/api/orders/user/:userId', requireAuth, async (req, res) => {
  if (req.user.uid !== req.params.userId) {
    return res.status(403).json({ error: 'You can only access your own orders' });
  }
  try {
    const orders = await db.getOrdersByUser(req.params.userId);
    res.json(orders);
  } catch (err) {
    console.error('[API Error]', { path: req.path, message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders — must be logged in, with order rate limit
// Validates: productId, title, price, entityType, metadata
app.post('/api/orders', requireAuth, strictMinuteLimiter, validateBody(createOrderSchema), async (req, res) => {
  try {
    const { userId, items, address, idempotencyKey } = req.body;
    
    if (!userId || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Missing required order parameters." });
    }

    if (idempotencyKey) {
      const cached = processedIdempotencyKeys.get(idempotencyKey);
      if (cached && cached.expiry > Date.now()) {
        return res.json(cached.order);
      }
    }

    // VULN-7-A: Recalculate totals server-side using trusted database prices
    let calculatedTotal = 0;
    const validatedItems = [];
    for (const item of items) {
      const product = await db.getProduct(item.id);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.id} not found.` });
      }
      const qty = Number(item.quantity) || 1;
      if (qty <= 0) {
        return res.status(400).json({ error: "Invalid product quantity." });
      }
      calculatedTotal += product.price * qty;
      validatedItems.push({
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: qty,
        imageUrl: product.imageUrl,
        creatorId: product.creatorId
      });
    }

    // VULN-7-E: Calculate platform fee server-side
    const PLATFORM_FEE_PERCENT = 0.10; // 10%
    const platformFee = Math.round(calculatedTotal * PLATFORM_FEE_PERCENT * 100) / 100;
    const creatorEarnings = calculatedTotal - platformFee;

    const newOrder = {
      userId,
      items: validatedItems,
      total: calculatedTotal,
      platformFee,
      creatorEarnings,
      address: address || "Grid Coordinates Default",
      status: "Order_Confirmed",
      createdAt: new Date().toISOString()
    };

    const added = await db.addOrder(newOrder);

    if (idempotencyKey) {
      processedIdempotencyKeys.set(idempotencyKey, {
        order: added,
        expiry: Date.now() + IDEMPOTENCY_TTL
      });
    }

    // Auto-create chat notification for each unique creator in the order
    try {
      const data = await db.ensureData();
      const uniqueCreators = [...new Set(items.map(item => item.creatorId).filter(Boolean))];
      for (const creatorId of uniqueCreators) {
        // Find existing chat between buyer and creator
        let chat = data.chats.find(c => 
          Array.isArray(c.participants) && 
          c.participants.includes(userId) && 
          c.participants.includes(creatorId)
        );
        if (!chat) {
          chat = await db.createChat({
            title: `Order Inquiry`,
            participants: [userId, creatorId]
          });
        }
        
        // Add order notification message
        const creatorItems = items.filter(i => i.creatorId === creatorId);
        const itemsList = creatorItems.map(i => `"${i.title}" (₹${i.price})`).join(', ');
        const messageText = `[SYSTEM MESSAGE] ⚡ New Order Confirmed!\nOrder ID: #${added.id.slice(-8).toUpperCase()}\nItem(s): ${itemsList}\nTotal: ₹${added.total}\nPlease check the Fulfillment dashboard inside your Identity Terminal to ship.`;
        
        await db.addMessage(chat.id, {
          senderId: 'sys-admin',
          senderName: 'Club 615 Foundry',
          content: messageText
        });
      }
    } catch (chatErr) {
      console.error("[Order Chat System] Failed to trigger order notifications:", chatErr);
    }

    res.status(201).json(added);
  } catch (err) {
    console.error('[API Error]', { path: req.path, message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /api/orders/creator/:creatorId — only the creator or admin can see their incoming sales
app.get('/api/orders/creator/:creatorId', requireAuth, async (req, res) => {
  try {
    const { creatorId } = req.params;
    // Must be the creator themselves or an admin
    if (req.user.uid !== creatorId && !req.user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'You can only view your own sales orders.' });
    }
    const data = await db.ensureData();
    const orders = (data.orders || []).filter(o =>
      Array.isArray(o.items) && o.items.some(item => item.creatorId === creatorId)
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/orders/:id — admin only
app.delete('/api/orders/:id', requireAuth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.ensureData();
    const before = data.orders.length;
    data.orders = data.orders.filter(o => o.id !== id);
    if (data.orders.length === before) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    await db.write(data);
    res.json({ success: true, deleted: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats — admin only
app.get('/api/admin/stats', requireAuth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const data = await db.ensureData();
    const users = data.users || [];
    const orders = data.orders || [];
    const products = data.products || [];
    const requests = data.requests || [];
    const revenue = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    res.json({
      totalUsers: users.length,
      totalCreators: users.filter(u => u.roles?.includes('creator')).length,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'Order_Confirmed' || o.status === 'Printing_Processing').length,
      totalProducts: products.length,
      totalRequests: requests.length,
      totalRevenue: revenue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/orders/stale — admin only
app.delete('/api/admin/orders/stale', requireAuth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const data = await db.ensureData();
    const before = data.orders.length;
    // Remove orders where items have title 'undefined' or userId starts with 'stress-user'
    data.orders = data.orders.filter(o => {
      const isStressUser = String(o.userId).startsWith('stress-user');
      const hasBadItems = Array.isArray(o.items) && o.items.some(i => !i.title || i.title === 'undefined');
      return !isStressUser && !hasBadItems;
    });
    const deleted = before - data.orders.length;
    await db.write(data);
    res.json({ success: true, deleted, remaining: data.orders.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/status — creator or admin only
// Validates: status, version
app.put('/api/orders/:id/status', requireAuth, writeLimiter, validateBody(updateOrderStatusSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, version } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "Status is required." });
    }

    const data = await db.ensureData();
    const order = (data.orders || []).find(o => o.id === id);
    if (!order) return res.status(404).json({ error: "Order not found." });

    // Validate ownership: must be buyer, creator of items, or admin
    const isBuyer = order.userId === req.user.uid;
    const isCreator = Array.isArray(order.items) && order.items.some(item => item.creatorId === req.user.uid);
    const isAdmin = req.user.roles?.includes('admin');

    if (!isBuyer && !isCreator && !isAdmin) {
      return res.status(403).json({ error: "You are not authorized to update this order's status." });
    }

    // VULN-9-B: Enforce role-based state transitions
    const isShippingTransition = ['Printing_Processing', 'Dispatched', 'Out_for_Delivery'].includes(status);
    if (isShippingTransition && !isCreator && !isAdmin) {
      return res.status(403).json({ error: "Only the creator/seller can update shipping status." });
    }
    if (status === 'Delivered' && !isBuyer && !isAdmin) {
      return res.status(403).json({ error: "Only the buyer can confirm order delivery." });
    }

    // VULN-9-G: Audit log admin actions
    if (isAdmin) {
      console.log(`[ADMIN AUDIT LOG] Admin user ${req.user.uid} updated order ${id} status to ${status}`);
    }

    const updated = await db.updateOrderStatus(id, status, version);
    if (updated) {
      res.json({ success: true, id, status, version: updated.version });
    } else {
      res.status(404).json({ error: "Order not found." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ------------------- REQUESTS API -------------------

// GET /api/requests — requires auth; filter by creator or viewer
app.get('/api/requests', requireAuth, async (req, res) => {
  try {
    const { creatorId, viewerId } = req.query;
    const requests = await db.getRequests({ creatorId, viewerId });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/requests — requires auth + write limit
// Validates request brief: viewerId, creatorId, title, notes (optional), specs (optional)
app.post('/api/requests', requireAuth, writeLimiter, validateBody(createRequestSchema), async (req, res) => {
  try {
    const { viewerId, creatorId, title, notes, specs } = req.body;
    
    if (!viewerId || !creatorId || !title) {
      return res.status(400).json({ error: "Missing required brief specifications." });
    }

    if (viewerId !== req.user.uid) {
      return res.status(403).json({ error: "Cannot create a request on behalf of another user." });
    }

    // VULN-9-C: Count requests per user per day and reject if >= 5
    const todayStr = new Date().toISOString().split('T')[0];
    const userRequests = await db.getRequests({ viewerId: req.user.uid });
    const todayRequests = userRequests.filter(r => r.createdAt && r.createdAt.startsWith(todayStr));
    if (todayRequests.length >= 5) {
      return res.status(429).json({ error: 'Daily request limit reached. Max 5 requests per day.' });
    }

    const newRequest = {
      viewerId,
      creatorId,
      title,
      notes: notes || "",
      specs: specs || { size: "A3", theme: "Retro" },
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    const added = await db.addRequest(newRequest);
    res.status(201).json(added);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:uid/profile — must be own profile or admin
// Validates profile fields: displayName, nickname, tagline, bio, links, photoURL, portfolioConfig, keywords
app.put('/api/users/:uid/profile', requireAuth, requireSelf('uid'), writeLimiter, validateBody(updateProfileSchema), async (req, res) => {
  try {
    const { uid } = req.params;
    const { displayName, nickname, tagline, bio, links, photoURL, portfolioConfig, keywords } = req.body;
    
    const user = await db.getUser(uid);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const updated = await db.updateUser(uid, {
      displayName: displayName !== undefined ? displayName : user.displayName,
      nickname: nickname !== undefined ? nickname : user.nickname,
      tagline: tagline !== undefined ? tagline : user.tagline,
      bio: bio !== undefined ? bio : user.bio,
      links: links !== undefined ? links : user.links,
      photoURL: photoURL !== undefined ? photoURL : user.photoURL,
      portfolioConfig: portfolioConfig !== undefined ? portfolioConfig : user.portfolioConfig,
      keywords: keywords !== undefined ? keywords : user.keywords
    });

    const { salt, passwordHash, ...profile } = updated;
    res.json({ success: true, user: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requests/:id/status — must be auth'd
// Validates status update fields: status, acceptedCreatorId (optional), version (optional)
app.put('/api/requests/:id/status', requireAuth, writeLimiter, validateBody(updateRequestStatusSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, acceptedCreatorId, version } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "Status is required." });
    }

    const request = await db.getRequest(id);
    if (!request) return res.status(404).json({ error: "Request not found." });

    // Validate ownership: must be creator, viewer, or admin
    const isCreator = request.creatorId === req.user.uid;
    const isViewer = request.viewerId === req.user.uid;
    const isAdmin = req.user.roles?.includes('admin');

    if (!isCreator && !isViewer && !isAdmin) {
      return res.status(403).json({ error: "You are not authorized to update this request's status." });
    }

    // VULN-9-D: If accepting the bid, ensure request status is still Pending or Open
    if (status === 'Accepted' && request.status !== 'Pending' && request.status !== 'Open') {
      return res.status(400).json({ error: "Request has already been accepted or closed." });
    }

    const updated = await db.updateRequestStatus(id, status, version);
    if (updated) {
      // If accepting a bid, also store acceptedCreatorId
      if (acceptedCreatorId) {
        await db.updateRequest(id, { acceptedCreatorId });
      }
      res.json({ success: true, id, status, version: updated.version });
    } else {
      res.status(404).json({ error: "Request not found." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/requests/:id/bid — creator places a bid
// Validates bidding fields: creatorId, creatorName (optional), quote, notes (optional)
app.post('/api/requests/:id/bid', requireAuth, requireCreator, writeLimiter, validateBody(createBidSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { creatorId, creatorName, quote, notes } = req.body;
    if (!creatorId || !quote) {
      return res.status(400).json({ error: "creatorId and quote are required." });
    }

    // Verify that the creatorId matches the authenticated user (unless admin)
    if (creatorId !== req.user.uid && !req.user.roles?.includes('admin')) {
      return res.status(403).json({ error: "You can only place bids as yourself." });
    }

    const request = await db.getRequest(id);
    if (!request) return res.status(404).json({ error: "Request not found." });

    const bid = {
      id: `bid-${Date.now()}`,
      creatorId,
      creatorName: creatorName || 'Anonymous',
      quote: parseFloat(quote) || 0,
      notes: notes || '',
      createdAt: new Date().toISOString()
    };
    const bids = [...(request.bids || []), bid];
    await db.updateRequest(id, { bids });
    res.json(bid);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- VERIFIED REVIEWS API -------------------

// GET /api/reviews/creator/:creatorId — public (safe read-only data)
app.get('/api/reviews/creator/:creatorId', async (req, res) => {
  try {
    const { creatorId } = req.params;
    const reviews = await db.getReviewsForCreator(creatorId);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/check — requires auth
app.get('/api/reviews/check', requireAuth, async (req, res) => {
  try {
    const { userId, creatorId } = req.query;
    if (!userId || !creatorId) {
      return res.status(400).json({ error: "userId and creatorId are required." });
    }
    const eligible = await db.canUserReview(userId, creatorId);
    res.json({ eligible });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews — requires auth + write limit
// Validates review fields: userId, username (optional), creatorId, rating, comment (optional)
app.post('/api/reviews', requireAuth, writeLimiter, validateBody(createReviewSchema), async (req, res) => {
  try {
    const { userId, username, creatorId, rating, comment } = req.body;
    
    if (!userId || !creatorId || !rating) {
      return res.status(400).json({ error: "userId, creatorId, and rating are required." });
    }

    const isEligible = await db.canUserReview(userId, creatorId);
    if (!isEligible) {
      return res.status(403).json({ error: "You can only write a review for a creator after completing an order with them." });
    }

    const review = {
      userId,
      username: username || 'Anonymous',
      creatorId,
      rating: Number(rating),
      comment: comment || ''
    };

    const newReview = await db.addReview(review);
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ------------------- USERS / WISHLIST API -------------------

// GET /api/users/creators
app.get('/api/users/creators', async (req, res) => {
  try {
    const creators = await db.getCreators();
    res.json(creators);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:uid — requires auth; strips sensitive fields
app.get('/api/users/:uid', requireAuth, async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await db.getUser(uid);
    if (user) {
      const { salt, passwordHash, ...profile } = user;
      res.json(profile);
    } else {
      res.status(404).json({ error: "User not found." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/override-role — ADMIN ONLY
// Validates override-role fields: uid, role
app.post('/api/users/override-role', requireAuth, requireAdmin, adminLimiter, validateBody(overrideRoleSchema), async (req, res) => {
  try {
    const { uid, role } = req.body;
    
    if (!uid || !role) {
      return res.status(400).json({ error: "UID and Role are required." });
    }

    const user = await db.getUser(uid);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const roles = Array.from(new Set([...(user.roles || []), role]));
    const updated = await db.updateUser(uid, { roles });
    
    const { salt, passwordHash, ...profile } = updated;
    res.json({ success: true, uid, roles: profile.roles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- CREATOR APPLICATIONS -------------------

// GET /api/applications — ADMIN ONLY
app.get('/api/applications', requireAuth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const apps = await db.getApplications();
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/applications — requires auth + write limit
// Validates application fields: uid, email, nickname, bio, posterUrl (optional), date
app.post('/api/applications', requireAuth, writeLimiter, validateBody(createApplicationSchema), async (req, res) => {
  try {
    const newApp = await db.addApplication(req.body);
    res.status(201).json(newApp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/applications/:id/status — ADMIN ONLY
// Validates application status update fields: status, tier (optional), uid (optional)
app.post('/api/applications/:id/status', requireAuth, requireAdmin, adminLimiter, validateBody(updateApplicationStatusSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tier, uid } = req.body;
    
    const updated = await db.updateApplicationStatus(id, status, tier);
    if (!updated) {
      return res.status(404).json({ error: "Application not found" });
    }
    
    // Automatically elevate role if approved
    if (status === 'approved' && uid) {
      const user = await db.getUser(uid);
      if (user) {
        const roles = Array.from(new Set([...(user.roles || []), 'creator']));
        await db.updateUser(uid, { roles });
        
        // Generate Creator Profile if it doesn't exist
        const existingCreator = await db.getCreatorByOwnerId(uid);
        if (!existingCreator) {
           await db.createCreator({
             owner_uid: uid,
             nickname: updated.nickname || user.nickname || 'Unknown Creator',
             bio: updated.bio || '',
             portfolio: updated.portfolio || null
           });
        }
      }
    }
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- CREATORS & SOCIAL GRAPH -------------------

// GET /api/creators/owner/:uid
app.get('/api/creators/owner/:uid', async (req, res) => {
  try {
    const creator = await db.getCreatorByOwnerId(req.params.uid);
    res.json(creator || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/follow/:targetId — requires auth
// Validates follow fields: followerUid
app.post('/api/follow/:targetId', requireAuth, writeLimiter, validateBody(followSchema), async (req, res) => {
  try {
    const { followerUid } = req.body; // The current user's UID
    if (!followerUid) return res.status(400).json({ error: "followerUid required" });
    const result = await db.addFollow(followerUid, req.params.targetId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/follow/:targetId — requires auth
app.delete('/api/follow/:targetId', requireAuth, writeLimiter, async (req, res) => {
  try {
    const { followerUid } = req.body;
    if (!followerUid) return res.status(400).json({ error: "followerUid required" });
    const result = await db.removeFollow(followerUid, req.params.targetId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/check-username
// Validates check-username fields: username, excludeUid (optional)
app.post('/api/users/check-username', requireAuth, checkUsernameLimiter, validateBody(checkUsernameSchema), async (req, res) => {
  try {
    const { username, excludeUid } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required." });
    }
    const isAvailable = await db.checkUsernameAvailable(username, excludeUid);
    res.json({ available: isAvailable });
  } catch (err) {
    console.error('[API Error]', { path: req.path, message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:uid/wishlist — must be own wishlist
app.get('/api/users/:uid/wishlist', requireAuth, async (req, res) => {
  if (req.user.uid !== req.params.uid) {
    return res.status(403).json({ error: 'Cannot access another user’s wishlist' });
  }
  try {
    const { uid } = req.params;
    const wishlist = await db.getWishlist(uid);
    res.json(wishlist);
  } catch (err) {
    console.error('[API Error]', { path: req.path, message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:uid/wishlist — must be own wishlist
// Validates wishlist fields: items, isPublic (optional)
app.put('/api/users/:uid/wishlist', requireAuth, writeLimiter, validateBody(updateWishlistSchema), async (req, res) => {
  if (req.user.uid !== req.params.uid) {
    return res.status(403).json({ error: 'Cannot modify another user’s wishlist' });
  }
  try {
    const { uid } = req.params;
    const { items, isPublic } = req.body;
    
    if (items === undefined) {
      return res.status(400).json({ error: "Items array is required." });
    }

    const wishlist = await db.updateWishlist(uid, items, isPublic);
    res.json(wishlist);
  } catch (err) {
    console.error('[API Error]', { path: req.path, message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:uid/cart — must be own cart
app.get('/api/users/:uid/cart', requireAuth, async (req, res) => {
  if (req.user.uid !== req.params.uid) {
    return res.status(403).json({ error: 'Cannot access another user’s cart' });
  }
  try {
    const { uid } = req.params;
    const cart = await db.getCart(uid);
    res.json(cart);
  } catch (err) {
    console.error('[API Error]', { path: req.path, message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:uid/cart — must be own cart
// Validates cart fields: items
app.put('/api/users/:uid/cart', requireAuth, writeLimiter, validateBody(updateCartSchema), async (req, res) => {
  if (req.user.uid !== req.params.uid) {
    return res.status(403).json({ error: 'Cannot modify another user’s cart' });
  }
  try {
    const { uid } = req.params;
    const { items } = req.body;
    
    if (!items) {
      return res.status(400).json({ error: "Items array is required." });
    }

    const cart = await db.updateCart(uid, items);
    res.json(cart);
  } catch (err) {
    console.error('[API Error]', { path: req.path, message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users — ADMIN ONLY: returns safe user list (no passwords)
app.get('/api/users', requireAuth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const page = req.query.page ? Math.max(1, parseInt(req.query.page) || 1) : null;
    const limit = req.query.limit ? Math.min(100, parseInt(req.query.limit) || 20) : null;

    const users = await db.getAllUsers();
    const safeUsers = users.map(u => ({
      uid: u.uid,
      displayName: u.displayName,
      roles: u.roles || ['user'],
      createdAt: u.createdAt
    }));

    if (page !== null && limit !== null) {
      const start = (page - 1) * limit;
      const end = start + limit;
      return res.json({
        data: safeUsers.slice(start, end),
        pagination: { page, limit, total: safeUsers.length }
      });
    }

    res.json(safeUsers);
  } catch (err) {
    console.error('[API Error]', { path: req.path, message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});



// GET /api/chats/messages/:chatId — requires auth  ← MUST be before /api/chats/:uid wildcard!
app.get('/api/chats/messages/:chatId', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const data = await db.ensureData();
    const chat = (data.chats || []).find(c => c.id === chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });
    
    // Must be participant or admin
    if (!chat.participants?.includes(req.user.uid) && !req.user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Access denied to this chat.' });
    }
    
    const msgs = await db.getChatMessages(chatId);
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chats/:uid — must be own chats  ← dynamic route AFTER specific ones
app.get('/api/chats/:uid', requireAuth, requireSelf('uid'), async (req, res) => {
  try {
    const chats = await db.getChats(req.params.uid);
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chats/messages/:chatId — requires auth + write limit
// Validates message fields: senderId, senderName, content
app.post('/api/chats/messages/:chatId', requireAuth, writeLimiter, validateBody(createMessageSchema), async (req, res) => {
  try {
    const { chatId } = req.params;
    const data = await db.ensureData();
    const chat = (data.chats || []).find(c => c.id === chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });
    
    // Must be participant or admin
    if (!chat.participants?.includes(req.user.uid) && !req.user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Access denied to this chat.' });
    }
    
    // Force senderId to match the logged-in user (unless admin is writing)
    const senderId = req.user.roles?.includes('admin') ? (req.body.senderId || req.user.uid) : req.user.uid;
    const msgData = {
      ...req.body,
      senderId
    };

    const msg = await db.addMessage(chatId, msgData);
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chats — requires auth
// Validates chat fields: participants, participantsNames (optional), bountyTitle (optional), bountyId (optional), bidId (optional)
app.post('/api/chats', requireAuth, writeLimiter, validateBody(createChatSchema), async (req, res) => {
  try {
    const { participants } = req.body;
    if (!Array.isArray(participants)) {
      return res.status(400).json({ error: "participants must be an array." });
    }
    // Requester must be one of the participants (unless they are admin)
    if (!participants.includes(req.user.uid) && !req.user.roles?.includes('admin')) {
      return res.status(403).json({ error: "You can only create chats involving yourself." });
    }
    const chat = await db.createChat(req.body);
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leaderboard/:gameId
app.get('/api/leaderboard/:gameId', async (req, res) => {
  try {
    const lb = await db.getLeaderboard(req.params.gameId);
    res.json(lb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leaderboard/:gameId
// Validates leaderboard fields: score, metadata (optional)
app.post('/api/leaderboard/:gameId', validateBody(submitScoreSchema), async (req, res) => {
  try {
    const entry = await db.addLeaderboardEntry(req.params.gameId, req.body);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:uid/portfolio — public read
app.get('/api/users/:uid/portfolio', async (req, res) => {
  try {
    const portfolio = await db.getPortfolio(req.params.uid);
    res.json(portfolio || { ownerId: req.params.uid, title: "Untitled Protocol", style: "Cyberpunk", description: "Empty Manifest", showcaseUrl: "", tags: [], availability: "Available", status: "Active" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:uid/portfolio — must own portfolio
// Validates portfolio fields: theme (optional), blocks (optional), avatar (optional)
app.put('/api/users/:uid/portfolio', requireAuth, requireSelf('uid'), writeLimiter, validateBody(updatePortfolioSchema), async (req, res) => {
  try {
    const portfolio = await db.updatePortfolio(req.params.uid, req.body);
    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




// In-memory store for AI query daily limits
const aiDailyUsageMap = new Map();

// POST /api/search/ai
// Validates search query: query
app.post('/api/search/ai', requireAuth, aiSearchLimiter, validateBody(aiSearchSchema), async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required." });
    }

    // VULN-8-B: Per-user daily cost cap
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `${req.user.uid}_${today}`;
    const userUsage = aiDailyUsageMap.get(usageKey) || 0;
    if (userUsage >= 50) {
      return res.status(429).json({ error: 'Daily AI limit reached. Max 50 queries per day.' });
    }
    aiDailyUsageMap.set(usageKey, userUsage + 1);

    // VULN-8-D: Throw error if GEMINI_API_KEY is missing
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    
    const [allCreators, allProducts, allRequests] = await Promise.all([
      db.getCreators(),
      db.ensureData().then(data => data.products || []),
      db.ensureData().then(data => data.requests || [])
    ]);

    // VULN-8-C: Strip all PII (remove bio, email, address, etc.)
    const creatorsSummary = allCreators.map(c => ({ id: c.uid || c.id, name: c.displayName, tagline: c.tagline || '' }));
    const productsSummary = allProducts.map(p => ({ id: p.id, title: p.title, price: p.price, creatorName: p.creatorName, entityType: p.entityType, category: p.category }));
    const requestsSummary = allRequests.map(r => ({ id: r.id, title: r.title, description: r.description, status: r.status }));

    // VULN-8-A: Sanitize and escape query to prevent prompt injection
    let safeQuery = query.trim().substring(0, 200);
    safeQuery = safeQuery.replace(/ignore|show prompt|system|forget|previous instructions/gi, '');
    const escapedQuery = JSON.stringify(safeQuery);

    const promptText = `You are "Blabber AI", an advanced, slightly mysterious 8-bit AI matchmaker and conversational search agent for the Club 615 design syndicate.
Your role is to scan the provided database context (creators, products, and bounties) and help the user find what they need.
Speak in a cool, retro-arcade cyberpunk theme, keeping your answers concise and stylish. Use dithered retro lingo!

=== PLATFORM LORE & PURPOSE ===
- What is Club 615? An exclusive, decentralized design syndicate and creative marketplace.
- Why does it exist? It empowers digital artists, designers, and developers to showcase portfolios, list design templates/art assets in the Vault (marketplace) for credits, and claim custom commission work (bounties) in the Forge (gigs space).
- Goal of the platform: Bridge the gap between independent digital creators and clients/collectors through a gamified, high-tech retro interface.
- Core pages/areas:
  1. VAULT: The Marketplace (/home/marketplace) where users browse and buy templates, UI kits, design files, and posters.
  2. FORGE: Gigs Space (/home/custom-requests) where custom requests (bounties) are posted and bids are submitted.
  3. COLLECTIVE: Freelancers Directory (/home/freelancers) listing syndicate-approved creators.
  4. LORE & ARCADE: Ranks, mini-games, and achievements (/home/lore-box, /home/arcade).

=== HOW YOU RESPOND TO QUESTIONS ABOUT PLATFORM PURPOSE ===
If the user asks "why does this exist?", "what is the goal?", "what is this site?", "what can I do here?", or similar questions:
- Enthusiastically explain the purpose of Club 615 as the ultimate creative sandbox/design syndicate.
- Outline how they can browse products, apply to become a creator, bid on gigs, or play arcade games.
- Encourage them to click on the navigation links or explore the Vault.

Context Data Layer:
${JSON.stringify({ creators: creatorsSummary, products: productsSummary, bounties: requestsSummary })}

User Conversational Request:
${escapedQuery}

You MUST analyze the context data and select the entities that best match or relate to the user's request.
Return a JSON object in this exact schema:
{
  "response": "Your conversational retro-style answer matching the query. Mention matching creators or products you found.",
  "matches": {
    "creators": ["array of matching creator uids/ids"],
    "products": ["array of matching product ids"],
    "bounties": ["array of matching request/bounty ids"]
  }
}
If no matches are found, return empty arrays for matches, but explain politely in the response in your retro AI persona.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned error status: ${response.status}`);
    }

    const resultData = await response.json();
    const candidateText = resultData?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!candidateText) {
      throw new Error("Empty response from Gemini model.");
    }

    const parsedResult = JSON.parse(candidateText.trim());
    
    const resolvedCreators = allCreators.filter(c => (parsedResult.matches?.creators || []).includes(c.uid || c.id));
    const resolvedProducts = allProducts.filter(p => (parsedResult.matches?.products || []).includes(p.id));
    const resolvedBounties = allRequests.filter(r => (parsedResult.matches?.bounties || []).includes(r.id));

    res.json({
      response: parsedResult.response,
      matches: {
        creators: resolvedCreators,
        products: resolvedProducts,
        bounties: resolvedBounties
      }
    });

  } catch (err) {
    console.error("AI Search failed:", err);
    res.status(500).json({ error: "Syndicate AI connection lost. Please try again later." });
  }
});


// ------------------- SYSTEM LOGS API -------------------

// POST /api/logs
// Validates log entry: action, details (optional)
app.post('/api/logs', requireAuth, validateBody(createLogSchema), async (req, res) => {
  try {
    const logData = req.body;
    // Log structure { timestamp, error, componentStack, user, url }
    logData.timestamp = logData.timestamp || new Date().toISOString();
    logData.id = `log-${Date.now()}`;
    await db.logSystemError(logData);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Log error endpoint failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/logs/:id/status
app.put('/api/logs/:id/status', requireAuth, requireAdmin, adminLimiter, validateBody(updateLogStatusSchema), async (req, res) => {
  try {
    const log = await db.updateSystemLogStatus(req.params.id, req.body.status);
    if (!log) return res.status(404).json({ error: 'Log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs
app.get('/api/logs', requireAuth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const logs = await db.getAllSystemLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Multer setup with memory storage
const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

// Wrapper to handle Multer specific errors (like size limit) gracefully
const handleMulterUpload = (req, res, next) => {
  fileUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "File size exceeds the 5 MB limit." });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }
    next();
  });
};

// Magic bytes validation function
function isValidMagicBytes(buffer, mimetype) {
  if (!buffer || buffer.length < 4) return false;
  const hex = buffer.toString('hex', 0, 4).toLowerCase();
  
  if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
    return hex.startsWith('ffd8ff');
  }
  if (mimetype === 'image/png') {
    return hex === '89504e47';
  }
  if (mimetype === 'image/gif') {
    return hex === '47494638';
  }
  if (mimetype === 'application/pdf') {
    return hex === '25504446';
  }
  if (mimetype === 'image/svg+xml') {
    const text = buffer.toString('utf8', 0, 100).toLowerCase();
    return text.includes('<svg') || text.includes('<?xml');
  }
  return false;
}

// POST /api/upload — Secure File Upload Endpoint
app.post('/api/upload', requireAuth, writeLimiter, handleMulterUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const { mimetype, buffer } = req.file;

    // Validate MIME types
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'application/pdf'];
    if (!allowedMimeTypes.includes(mimetype)) {
      return res.status(400).json({ error: "Invalid file type. Only JPG, PNG, GIF, SVG, and PDF are allowed." });
    }

    // Validate Magic Bytes
    if (!isValidMagicBytes(buffer, mimetype)) {
      return res.status(400).json({ error: "File content mismatch. The uploaded file is invalid or corrupted." });
    }

    // Determine extension safely
    const ext = mimetype === 'image/jpeg' || mimetype === 'image/jpg' ? '.jpg' :
                mimetype === 'image/png' ? '.png' :
                mimetype === 'image/gif' ? '.gif' :
                mimetype === 'application/pdf' ? '.pdf' :
                mimetype === 'image/svg+xml' ? '.svg' : '.bin';

    // Generate a random UUID filename to completely prevent path traversal/overwrite vulnerability
    const filename = `${crypto.randomUUID()}${ext}`;

    if (!db.supabase) {
      throw new Error("Supabase client not initialized.");
    }

    // Store in a private Supabase bucket
    const { data, error } = await db.supabase.storage
      .from('private-bucket')
      .upload(filename, buffer, {
        contentType: mimetype,
        upsert: false
      });

    if (error) {
      console.error("[Upload] Supabase upload failed:", error.message);
      throw new Error(`Upload storage error: ${error.message}`);
    }

    // Generate a signed URL valid for 24 hours
    const { data: signedData, error: signedError } = await db.supabase.storage
      .from('private-bucket')
      .createSignedUrl(filename, 60 * 60 * 24);

    if (signedError || !signedData?.signedUrl) {
      console.error("[Upload] Supabase signed URL generation failed:", signedError?.message);
      throw new Error("Failed to generate signed URL for uploaded file.");
    }

    res.status(200).json({
      success: true,
      message: "File uploaded successfully.",
      url: signedData.signedUrl
    });

  } catch (err) {
    console.error('[API Error]', { path: req.path, message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});
// POST /api/orders/:id/refund — Ownership check, authorization check, state check (VULN-7-D)
app.post('/api/orders/:id/refund', requireAuth, async (req, res) => {
  try {
    const data = await db.ensureData();
    const order = data.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    
    // Check ownership and admin privileges
    if (order.userId !== req.user.uid && !req.user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }
    
    // VULN-9-E: Validate refundable state and block duplicate refund calls
    if (order.status === 'Refunded' || order.status === 'Refund_Processing') {
      return res.status(400).json({ error: 'Refund already in progress or completed.' });
    }
    if (order.status !== 'Paid' && order.status !== 'Delivered') {
      return res.status(400).json({ error: 'Order cannot be refunded in its current state.' });
    }
    
    // Set status to Refund_Processing immediately to lock the state
    order.status = 'Refund_Processing';
    await db.write(data);

    // [Refunding Process Trigger Here]

    // Set to final Refunded status
    order.status = 'Refunded';
    order.updatedAt = new Date().toISOString();
    await db.write(data);

    res.status(200).json({
      success: true,
      message: "Order refunded successfully.",
      order
    });
  } catch (err) {
    console.error('[API Error]', { path: req.path, message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cache processed webhook event IDs to prevent race condition / replay / double charge (VULN-7-C)
const processedWebhookEvents = new Set();

// POST /api/webhooks/stripe — Webhook signature verification (VULN-7-B) & Idempotency / replay checks (VULN-7-C)
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const stripeModule = await import('stripe');
    const Stripe = stripeModule.default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key');
    
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || 'dummy_secret');
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency: verify if already processed
  if (processedWebhookEvents.has(event.id)) {
    return res.json({ received: true });
  }
  processedWebhookEvents.add(event.id);

  if (event.type === 'payment_intent.succeeded') {
    const orderId = event.data.object.metadata.orderId;
    const version = Number(event.data.object.metadata.version) || 1;
    try {
      await db.updateOrderStatus(orderId, 'Paid', version);
    } catch (dbErr) {
      console.error("[Webhook Database Error]", dbErr.message);
    }
  }
  
  res.json({ received: true });
});

// POST /api/webhooks/razorpay — Webhook signature verification & Idempotency / replay checks
app.post('/api/webhooks/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_secret';
  
  try {
    const cryptoModule = await import('crypto');
    const crypto = cryptoModule.default;
    const bodyStr = req.body.toString();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyStr)
      .digest('hex');
      
    if (expectedSignature !== signature) {
      return res.status(400).send('Invalid signature.');
    }
    
    const body = JSON.parse(bodyStr);
    const eventId = body.event_id || body.id;
    
    // Idempotency: verify if already processed
    if (processedWebhookEvents.has(eventId)) {
      return res.json({ received: true });
    }
    processedWebhookEvents.add(eventId);

    if (body.event === 'payment.captured') {
      const orderId = body.payload.payment.entity.notes.orderId;
      const version = Number(body.payload.payment.entity.notes.version) || 1;
      await db.updateOrderStatus(orderId, 'Paid', version);
    }
    
    res.json({ received: true });
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

if (process.env.VERCEL !== '1' && !process.env.NOW_REGION) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`[Backend] Server running on port ${PORT}`));
}

export default app;
