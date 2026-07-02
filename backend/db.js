import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const dbProductSchema = z.object({
  title: z.string().min(1).max(200),
  price: z.number().nonnegative().max(999999),
  description: z.string().max(5000).optional().or(z.literal("")),
  entityType: z.string().min(1).max(100),
  imageUrl: z.string().url().max(2000).optional().or(z.literal("")),
  metadata: z.record(z.any()).optional(),
  status: z.string().optional(),
  deliveryTime: z.string().optional(),
  creatorId: z.string().min(1),
  creatorName: z.string().optional()
}).strict();

const dbMessageSchema = z.object({
  senderId: z.string().min(1),
  senderName: z.string().min(1).max(200),
  content: z.string().min(1).max(10000)
}).strict();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
}

class SupabaseDatabase {
  constructor() {
    try {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    } catch (err) {
      console.error("[DB] Failed to initialize Supabase client:", err.message);
      this.supabase = null;
    }
    this.cachedData = null;
    this.cacheTimestamp = 0;
    this.CACHE_TTL_MS = 0; // query Supabase directly for true real-time synchronization
    this.usersByUid = new Map();
    this.usersByEmail = new Map();
    this.productsById = new Map();
    this.ordersById = new Map();
    this.requestsById = new Map();
    this.applicationsById = new Map();
    this.creatorsById = new Map();
    this.productsByCreator = new Map();
    this.productsByType = new Map();
  }

  async ensureData() {
    const now = Date.now();
    if (this.cachedData && (now - this.cacheTimestamp) < this.CACHE_TTL_MS) {
      return this.cachedData;
    }
    if (!this.supabase) {
       console.error("[DB] Supabase is not connected. Falling back to memory.");
       if (!this.cachedData) {
         this.cachedData = { users: [], products: [], orders: [], requests: [], wishlists: {}, carts: {}, chats: [], messages: {}, leaderboards: {}, portfolios: {}, applications: [], creators: [], system_logs: [], reviews: [] };
       }
       this.buildIndexes();
       return this.cachedData;
    }
    const { data, error } = await this.supabase.from('json_store').select('data').eq('id', 'db').single();
    if (error || !data) {
       console.error("[DB] Supabase fetch error:", error);
       if (!this.cachedData) {
         this.cachedData = { users: [], products: [], orders: [], requests: [], wishlists: {}, carts: {}, chats: [], messages: {}, leaderboards: {}, portfolios: {}, applications: [], creators: [], system_logs: [], reviews: [] };
       }
    } else {
       this.cachedData = data.data;
       if (!this.cachedData.chats) this.cachedData.chats = [];
       if (!this.cachedData.messages) this.cachedData.messages = {};
       if (!this.cachedData.leaderboards) this.cachedData.leaderboards = {};
       if (!this.cachedData.portfolios) this.cachedData.portfolios = {};
       if (!this.cachedData.applications) this.cachedData.applications = [];
       if (!this.cachedData.carts) this.cachedData.carts = {};
       if (!this.cachedData.wishlists) this.cachedData.wishlists = {};
       if (!this.cachedData.creators) this.cachedData.creators = [];
       if (!this.cachedData.system_logs) this.cachedData.system_logs = [];
       if (!this.cachedData.reviews) this.cachedData.reviews = [];
    }
    this.cacheTimestamp = now;
    this.buildIndexes();
    return this.cachedData;
  }

  buildIndexes() {
    this.usersByUid.clear();
    this.usersByEmail.clear();
    this.productsById.clear();
    this.ordersById.clear();
    this.requestsById.clear();
    this.applicationsById.clear();
    this.creatorsById.clear();
    this.productsByCreator.clear();
    this.productsByType.clear();
    
    if (!this.cachedData) return;
    
    if (Array.isArray(this.cachedData.users)) {
      for (const u of this.cachedData.users) {
        if (u.uid) this.usersByUid.set(u.uid, u);
        if (u.email) this.usersByEmail.set(u.email.toLowerCase(), u);
      }
    }
    if (Array.isArray(this.cachedData.products)) {
      for (const p of this.cachedData.products) {
        if (p.id) this.productsById.set(p.id, p);
        if (p.creatorId) {
          if (!this.productsByCreator.has(p.creatorId)) {
            this.productsByCreator.set(p.creatorId, []);
          }
          this.productsByCreator.get(p.creatorId).push(p);
        }
        if (p.entityType) {
          if (!this.productsByType.has(p.entityType)) {
            this.productsByType.set(p.entityType, []);
          }
          this.productsByType.get(p.entityType).push(p);
        }
      }
    }
    if (Array.isArray(this.cachedData.orders)) {
      for (const o of this.cachedData.orders) {
        if (o.id) this.ordersById.set(o.id, o);
      }
    }
    if (Array.isArray(this.cachedData.requests)) {
      for (const r of this.cachedData.requests) {
        if (r.id) this.requestsById.set(r.id, r);
      }
    }
    if (Array.isArray(this.cachedData.applications)) {
      for (const a of this.cachedData.applications) {
        if (a.id) this.applicationsById.set(a.id, a);
      }
    }
    if (Array.isArray(this.cachedData.creators)) {
      for (const c of this.cachedData.creators) {
        if (c.id) this.creatorsById.set(c.id, c);
      }
    }
  }

  async write(data) {
    this.cachedData = data;
    this.cacheTimestamp = Date.now(); // fresh data — start TTL from now
    this.buildIndexes();
    if (this.supabase) {
       const { error } = await this.supabase.from('json_store').update({ data }).eq('id', 'db');
       if (error) console.error("[DB] Supabase write error:", error);
    }
  }

  async getUser(uid) {
    await this.ensureData();
    return this.usersByUid.get(uid) || null;
  }

  async findUserByEmail(email) {
    await this.ensureData();
    if (!email) return null;
    return this.usersByEmail.get(email.toLowerCase()) || null;
  }

  async createUser(user) {
    const data = await this.ensureData();
    data.users.push(user);
    if (user.uid) this.usersByUid.set(user.uid, user);
    if (user.email) this.usersByEmail.set(user.email.toLowerCase(), user);
    await this.write(data);
    return user;
  }

  async updateUser(uid, updateData) {
    const data = await this.ensureData();
    const idx = data.users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      const oldEmail = data.users[idx].email;
      
      const ALLOWED_FIELDS = [
        'displayName', 'email', 'bio', 'photoURL', 'nickname', 'tagline', 
        'links', 'portfolioConfig', 'keywords', 'roles', 'passwordHash', 'salt'
      ];
      const sanitized = {};
      for (const key of ALLOWED_FIELDS) {
        if (updateData[key] !== undefined) {
          sanitized[key] = updateData[key];
        }
      }
      
      data.users[idx] = { ...data.users[idx], ...sanitized };
      this.usersByUid.set(uid, data.users[idx]);
      if (oldEmail && oldEmail.toLowerCase() !== data.users[idx].email?.toLowerCase()) {
        this.usersByEmail.delete(oldEmail.toLowerCase());
      }
      if (data.users[idx].email) {
        this.usersByEmail.set(data.users[idx].email.toLowerCase(), data.users[idx]);
      }
      await this.write(data);
      return data.users[idx];
    }
    return null;
  }

  async checkUsernameAvailable(username, excludeUid) {
    await this.ensureData();
    if (!username) return false;
    const lowerName = username.toLowerCase();
    for (const u of this.cachedData.users) {
      if (u.displayName && u.displayName.toLowerCase() === lowerName && u.uid !== excludeUid) {
        return false;
      }
    }
    return true;
  }

  async getCreators() {
    await this.ensureData();
    return Array.from(this.usersByUid.values()).filter(u => u.roles?.includes('creator'));
  }

  async getAllUsers() {
    await this.ensureData();
    return Array.from(this.usersByUid.values());
  }

  async getProducts(type, creatorId) {
    await this.ensureData();
    if (creatorId && type) {
      return (this.productsByCreator.get(creatorId) || []).filter(p => p.entityType === type);
    } else if (creatorId) {
      return this.productsByCreator.get(creatorId) || [];
    } else if (type) {
      return this.productsByType.get(type) || [];
    }
    return Array.from(this.productsById.values());
  }

  async getProduct(id) {
    await this.ensureData();
    return this.productsById.get(id) || null;
  }

  async addProduct(product) {
    const validated = dbProductSchema.parse(product);
    const data = await this.ensureData();
    const newProduct = { id: `prod-${Date.now()}`, ...validated };
    data.products.push(newProduct);
    this.productsById.set(newProduct.id, newProduct);
    await this.write(data);
    return newProduct;
  }

  async deleteProduct(id) {
    const data = await this.ensureData();
    const lenBefore = data.products.length;
    data.products = data.products.filter(p => p.id !== id);
    this.productsById.delete(id);
    await this.write(data);
    return data.products.length < lenBefore;
  }

  async getOrders() {
    await this.ensureData();
    return Array.from(this.ordersById.values());
  }

  async getOrdersByUser(userId) {
    await this.ensureData();
    return Array.from(this.ordersById.values()).filter(o => o.userId === userId);
  }

  async addOrder(order) {
    const data = await this.ensureData();
    const newOrder = { id: `order-${Date.now()}`, ...order };
    data.orders.push(newOrder);
    this.ordersById.set(newOrder.id, newOrder);
    await this.write(data);
    return newOrder;
  }

  async updateOrderStatus(id, status, expectedVersion) {
    const data = await this.ensureData();
    const idx = data.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      const order = data.orders[idx];
      
      const VALID_TRANSITIONS = {
        'Payment_Pending': ['Order_Confirmed', 'Cancelled'],
        'Order_Confirmed': ['Paid', 'Printing_Processing', 'Cancelled'],
        'Paid': ['Printing_Processing', 'Cancelled', 'Refunded'],
        'Printing_Processing': ['Dispatched', 'Cancelled'],
        'Dispatched': ['Out_for_Delivery', 'Cancelled'],
        'Out_for_Delivery': ['Delivered', 'Cancelled'],
        'Delivered': ['Refunded'],
        'Cancelled': [],
        'Refunded': []
      };

      if (order.status && VALID_TRANSITIONS[order.status] && !VALID_TRANSITIONS[order.status].includes(status)) {
        throw new Error(`Invalid transition from ${order.status} to ${status}`);
      }

      const currentVersion = order.version || 1;
      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new Error(`Conflict error: Version mismatch. Expected ${expectedVersion} but got ${currentVersion}.`);
      }

      data.orders[idx].status = status;
      data.orders[idx].version = currentVersion + 1;
      data.orders[idx].updatedAt = new Date().toISOString();
      
      this.ordersById.set(id, data.orders[idx]);
      await this.write(data);
      return data.orders[idx];
    }
    return null;
  }

  async getRequests(query) {
    await this.ensureData();
    let results = Array.from(this.requestsById.values());
    if (query?.creatorId) {
      results = results.filter(r => r.creatorId === query.creatorId);
    }
    if (query?.viewerId) {
      results = results.filter(r => r.viewerId === query.viewerId);
    }
    return results;
  }

  async addRequest(request) {
    const data = await this.ensureData();
    const newRequest = { id: `req-${Date.now()}`, ...request };
    data.requests.push(newRequest);
    this.requestsById.set(newRequest.id, newRequest);
    await this.write(data);
    return newRequest;
  }

  async updateRequestStatus(id, status) {
    const data = await this.ensureData();
    const idx = data.requests.findIndex(r => r.id === id);
    if (idx !== -1) {
      data.requests[idx].status = status;
      this.requestsById.set(id, data.requests[idx]);
      await this.write(data);
      return data.requests[idx];
    }
    return null;
  }

  async getRequest(id) {
    await this.ensureData();
    return this.requestsById.get(id) || null;
  }

  async updateRequest(id, updateData) {
    const data = await this.ensureData();
    const idx = data.requests.findIndex(r => r.id === id);
    if (idx !== -1) {
      data.requests[idx] = { ...data.requests[idx], ...updateData };
      this.requestsById.set(id, data.requests[idx]);
      await this.write(data);
      return data.requests[idx];
    }
    return null;
  }

  async getWishlist(userId) {
    const data = await this.ensureData();
    if (!data.wishlists) data.wishlists = {};
    return data.wishlists[userId] || { items: [], isPublic: true };
  }

  async updateWishlist(userId, items, isPublic) {
    const data = await this.ensureData();
    if (!data.wishlists) data.wishlists = {};
    const current = data.wishlists[userId] || { items: [], isPublic: true };
    data.wishlists[userId] = {
      items: items !== undefined ? items : current.items,
      isPublic: isPublic !== undefined ? isPublic : current.isPublic
    };
    await this.write(data);
    return data.wishlists[userId];
  }

  // --- CARTS ---
  async getCart(userId) {
    const data = await this.ensureData();
    if (!data.carts) data.carts = {};
    return data.carts[userId] || { items: [] };
  }

  async updateCart(userId, items) {
    const data = await this.ensureData();
    if (!data.carts) data.carts = {};
    data.carts[userId] = { items };
    await this.write(data);
    return { items };
  }

  // --- CHATS ---
  async getChats(userId) {
    const data = await this.ensureData();
    return data.chats.filter(c => c.participants && c.participants.includes(userId));
  }
  
  async getChatMessages(chatId) {
    const data = await this.ensureData();
    return data.messages[chatId] || [];
  }
  
  async addMessage(chatId, msg) {
    const validated = dbMessageSchema.parse(msg);
    const data = await this.ensureData();
    if (!data.messages[chatId]) data.messages[chatId] = [];
    const newMsg = { id: `msg-${Date.now()}`, ...validated, createdAt: new Date().toISOString() };
    data.messages[chatId].push(newMsg);
    await this.write(data);
    return newMsg;
  }
  
  async createChat(chatData) {
    const data = await this.ensureData();
    const newChat = { id: `chat-${Date.now()}`, ...chatData, createdAt: new Date().toISOString() };
    data.chats.push(newChat);
    await this.write(data);
    return newChat;
  }

  // --- LEADERBOARDS ---
  async getLeaderboard(gameId) {
    const data = await this.ensureData();
    return data.leaderboards[gameId] || [];
  }
  
  async addLeaderboardEntry(gameId, entry) {
    const data = await this.ensureData();
    if (!data.leaderboards[gameId]) data.leaderboards[gameId] = [];
    const newEntry = { id: `score-${Date.now()}`, ...entry, createdAt: new Date().toISOString() };
    data.leaderboards[gameId].push(newEntry);
    data.leaderboards[gameId].sort((a, b) => b.score - a.score);
    await this.write(data);
    return newEntry;
  }

  // --- PORTFOLIOS ---
  async getPortfolio(userId) {
    const data = await this.ensureData();
    return data.portfolios[userId] || null;
  }
  
  async updatePortfolio(userId, portfolioData) {
    const data = await this.ensureData();
    data.portfolios[userId] = portfolioData;
    await this.write(data);
    return portfolioData;
  }

  // --- CREATOR APPLICATIONS ---
  async getApplications() {
    await this.ensureData();
    return Array.from(this.applicationsById.values());
  }

  async addApplication(appData) {
    const data = await this.ensureData();
    const newApp = { id: `app-${Date.now()}`, ...appData, status: 'pending', createdAt: new Date().toISOString() };
    data.applications.push(newApp);
    this.applicationsById.set(newApp.id, newApp);
    await this.write(data);
    return newApp;
  }

  async updateApplicationStatus(id, status, tier) {
    const data = await this.ensureData();
    const idx = data.applications.findIndex(a => a.id === id);
    if (idx !== -1) {
      data.applications[idx].status = status;
      if (tier) data.applications[idx].tier = tier;
      this.applicationsById.set(id, data.applications[idx]);
      await this.write(data);
      return data.applications[idx];
    }
    return null;
  }

  // --- CREATORS (DUAL IDENTITY) ---
  async getCreator(creatorId) {
    await this.ensureData();
    return this.creatorsById.get(creatorId) || null;
  }

  async getCreatorByOwnerId(uid) {
    await this.ensureData();
    return this.cachedData.creators.find(c => c.owner_uid === uid) || null;
  }

  async createCreator(creatorData) {
    const data = await this.ensureData();
    const newCreator = { 
      id: `creator_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
      ...creatorData, 
      followers: [], 
      createdAt: new Date().toISOString() 
    };
    data.creators.push(newCreator);
    this.creatorsById.set(newCreator.id, newCreator);
    await this.write(data);
    return newCreator;
  }

  // --- SOCIAL GRAPH (FOLLOWERS) ---
  async addFollow(followerUid, targetId) {
    const data = await this.ensureData();
    if (followerUid === targetId) throw new Error("Cannot follow yourself");
    
    let target = null;
    if (targetId.startsWith('creator_')) {
      target = this.creatorsById.get(targetId);
    } else {
      target = this.usersByUid.get(targetId);
    }
    
    if (!target) throw new Error("Target not found");
    if (!target.followers) target.followers = [];
    if (!target.followers.includes(followerUid)) {
      target.followers.push(followerUid);
    }
    
    const follower = this.usersByUid.get(followerUid);
    if (follower) {
      if (!follower.following) follower.following = [];
      if (!follower.following.includes(targetId)) {
        follower.following.push(targetId);
      }
    }
    
    await this.write(data);
    return { success: true, targetId, followerUid };
  }

  async removeFollow(followerUid, targetId) {
    const data = await this.ensureData();
    let target = null;
    if (targetId.startsWith('creator_')) {
      target = this.creatorsById.get(targetId);
    } else {
      target = this.usersByUid.get(targetId);
    }
    
    if (target && target.followers) {
      target.followers = target.followers.filter(id => id !== followerUid);
    }
    
    const follower = this.usersByUid.get(followerUid);
    if (follower && follower.following) {
      follower.following = follower.following.filter(id => id !== targetId);
    }
    
    await this.write(data);
    return { success: true, targetId, followerUid };
  }
  async getAllSystemLogs() {
    await this.ensureData();
    return this.cachedData.system_logs || [];
  }

  async logSystemError(errorLog) {
    await this.ensureData();
    if (!this.cachedData.system_logs) this.cachedData.system_logs = [];
    
    // Ensure status is present
    errorLog.status = errorLog.status || 'open';
    
    // Unshift to put newest first, limit to last 200 logs to prevent bloat
    this.cachedData.system_logs.unshift(errorLog);
    if (this.cachedData.system_logs.length > 200) {
      this.cachedData.system_logs = this.cachedData.system_logs.slice(0, 200);
    }
    
    await this.write(this.cachedData);
  }

  async updateSystemLogStatus(id, status) {
    const data = await this.ensureData();
    if (!data.system_logs) return null;
    
    const idx = data.system_logs.findIndex(log => log.id === id);
    if (idx !== -1) {
      data.system_logs[idx].status = status;
      await this.write(data);
      return data.system_logs[idx];
    }
    return null;
  }

  async getReviewsForCreator(creatorId) {
    const data = await this.ensureData();
    if (!data.reviews) data.reviews = [];
    return data.reviews.filter(r => r.creatorId === creatorId);
  }

  async canUserReview(userId, creatorId) {
    const data = await this.ensureData();
    if (!data.orders) return false;
    
    // Check if the user has an order containing a product owned by creatorId, marked as Delivered or Completed.
    // Also, custom request bids completed.
    const hasCompletedOrder = data.orders.some(o => {
      const isBuyer = o.userId === userId;
      const isCompleted = o.status === 'Delivered' || o.status === 'Completed';
      const belongsToCreator = Array.isArray(o.items) && o.items.some(item => item.creatorId === creatorId);
      return isBuyer && isCompleted && belongsToCreator;
    });

    if (hasCompletedOrder) return true;

    // Check if they had a custom request completed by this creator
    const hasCompletedRequest = Array.isArray(data.requests) && data.requests.some(r => {
      return r.viewerId === userId && r.acceptedCreatorId === creatorId && r.status === 'Completed';
    });

    return hasCompletedRequest;
  }

  async addReview(review) {
    const data = await this.ensureData();
    if (!data.reviews) data.reviews = [];
    
    const newReview = {
      id: `rev-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...review
    };
    
    data.reviews.push(newReview);
    await this.write(data);
    return newReview;
  }
}

export const db = new SupabaseDatabase();
