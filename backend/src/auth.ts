import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Context, Next } from 'hono';
import { collections } from './db.js';
import { User, Role } from './types.js';

const JWT_SECRET = process.env.SECRET_KEY || process.env.JWT_SECRET || 'hercules-gym-production-secret-key-change-me';
const TOKEN_EXPIRY = '30d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  center: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    center: user.center,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Authentication Middleware
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or malformed Authorization header' }, 401);
  }

  const token = authHeader.slice(7).trim();
  const payload = verifyToken(token);
  if (!payload) {
    return c.json({ error: 'Invalid or expired authentication token' }, 401);
  }

  const user = await collections.users().findOne({ id: payload.userId });
  if (!user || !user.is_active) {
    return c.json({ error: 'User account is inactive or not found' }, 401);
  }

  c.set('user', user);
  await next();
}

// Role Guard Middleware
export function requireRole(allowedRoles: Role[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as User;
    if (!user || !allowedRoles.includes(user.role)) {
      return c.json({ error: 'Access denied: insufficient permissions' }, 403);
    }
    await next();
  };
}
