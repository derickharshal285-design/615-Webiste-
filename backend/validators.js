import { z } from 'zod';

// Middleware to parse and validate request body
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
  };
};

// 1. Auth Schemas
export const firebaseAuthSchema = z.object({
  uid: z.string().min(1).max(256),
  email: z.string().email().max(256),
  displayName: z.string().max(100).optional(),
  photoURL: z.string().url().max(2000).optional(),
  role: z.string().max(50).optional(),
  extra: z.any().optional()
}).strict();

export const swapIdentitySchema = z.object({
  uid: z.string().min(1).max(256)
}).strict();

export const legacyRegisterSchema = z.object({
  email: z.string().email().max(256),
  password: z.string().min(6).max(256),
  displayName: z.string().min(1).max(100),
  role: z.string().max(50).optional(),
  nickname: z.string().max(50).optional(),
  tagline: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  links: z.string().max(1000).optional()
}).strict();

export const legacyLoginSchema = z.object({
  email: z.string().email().max(256),
  password: z.string().min(1).max(256)
}).strict();

// 2. Product Schemas
export const createProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  price: z.number().nonnegative(),
  entityType: z.string().max(100),
  imageUrl: z.string().url().max(2000).optional(),
  metadata: z.record(z.any()).optional(),
  status: z.string().max(50).optional(),
  deliveryTime: z.string().max(100).optional(),
  creatorId: z.string().min(1).max(256),
  creatorName: z.string().max(100).optional()
}).strict();

// 3. Order Schemas
export const createOrderSchema = z.object({
  userId: z.string().min(1).max(256),
  items: z.array(z.any()),
  total: z.number().nonnegative(),
  address: z.any().optional(),
  idempotencyKey: z.string().max(256).optional()
}).strict();

export const updateOrderStatusSchema = z.object({
  status: z.string().min(1).max(50),
  version: z.number().optional()
}).strict();

// 4. Request / Bidding Schemas
export const createRequestSchema = z.object({
  viewerId: z.string().min(1).max(256),
  creatorId: z.string().min(1).max(256),
  title: z.string().min(1).max(200),
  notes: z.string().max(5000).optional(),
  specs: z.record(z.any()).optional()
}).strict();

export const updateRequestStatusSchema = z.object({
  status: z.string().min(1).max(50),
  acceptedCreatorId: z.string().max(256).optional()
}).strict();

export const createBidSchema = z.object({
  creatorId: z.string().min(1).max(256),
  creatorName: z.string().max(100).optional(),
  quote: z.union([z.number(), z.string().max(100)]),
  notes: z.string().max(5000).optional()
}).strict();

// 5. Review Schema
export const createReviewSchema = z.object({
  userId: z.string().min(1).max(256),
  username: z.string().max(100).optional(),
  creatorId: z.string().min(1).max(256),
  rating: z.union([z.number(), z.string().max(100)]),
  comment: z.string().max(5000).optional()
}).strict();

// 6. User / Profile Schemas
export const updateProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  nickname: z.string().max(50).optional(),
  tagline: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  links: z.string().max(1000).optional(),
  photoURL: z.string().url().max(2000).or(z.literal("")).optional(),
  portfolioConfig: z.record(z.any()).optional(),
  keywords: z.array(z.string().max(100)).optional()
}).strict();

export const updateWishlistSchema = z.object({
  items: z.array(z.any()),
  isPublic: z.boolean().optional()
}).strict();

export const updateCartSchema = z.object({
  items: z.array(z.any())
}).strict();

export const updatePortfolioSchema = z.object({
  theme: z.record(z.any()).optional(),
  blocks: z.array(z.any()).optional(),
  avatar: z.record(z.any()).optional()
}).strict();

export const overrideRoleSchema = z.object({
  uid: z.string().min(1).max(256),
  role: z.string().min(1).max(50)
}).strict();

export const checkUsernameSchema = z.object({
  username: z.string().min(1).max(50),
  excludeUid: z.string().max(256).optional()
}).strict();

export const followSchema = z.object({
  followerUid: z.string().min(1).max(256)
}).strict();

// 7. Application Schemas
export const createApplicationSchema = z.object({
  uid: z.string().min(1).max(256),
  email: z.string().email().max(256),
  nickname: z.string().min(1).max(50),
  bio: z.string().min(1).max(1000),
  posterUrl: z.string().max(2000).optional(),
  date: z.string().max(100)
}).strict();

export const updateApplicationStatusSchema = z.object({
  status: z.string().min(1).max(50),
  tier: z.union([z.number(), z.string().max(100)]).optional(),
  uid: z.string().max(256).optional()
}).strict();

// 8. Chat Schemas
export const createMessageSchema = z.object({
  senderId: z.string().min(1).max(256),
  senderName: z.string().min(1).max(200),
  content: z.string().min(1).max(10000)
}).strict();

export const createChatSchema = z.object({
  participants: z.array(z.string().max(256)).min(1),
  participantsNames: z.array(z.string().max(200)).optional(),
  bountyTitle: z.string().max(200).optional(),
  bountyId: z.string().max(256).optional(),
  bidId: z.string().max(256).optional()
}).strict();

// 9. Leaderboard / Games Schemas
export const submitScoreSchema = z.object({
  score: z.number(),
  metadata: z.record(z.any()).optional()
}).strict();

// 10. AI Search Schema
export const aiSearchSchema = z.object({
  query: z.string().min(1).max(1000)
}).strict();

// 11. Logs
export const createLogSchema = z.object({
  action: z.string().min(1).max(200),
  details: z.record(z.any()).optional(),
  status: z.string().max(50).optional()
}).strict();

export const updateLogStatusSchema = z.object({
  status: z.enum(['open', 'resolved'])
}).strict();
