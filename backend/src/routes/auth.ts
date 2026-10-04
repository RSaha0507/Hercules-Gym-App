import { Hono } from 'hono';
import { collections } from '../db.js';
import { hashPassword, verifyPassword, generateToken, authMiddleware } from '../auth.js';
import { User } from '../types.js';

const router = new Hono();

// Login
router.post('/login', async (c) => {
  try {
    const { identifier, email, phone, password } = await c.req.json();
    const loginIdentifier = identifier || email || phone;

    if (!loginIdentifier || !password) {
      return c.json({ error: 'Email/Phone and password are required' }, 400);
    }

    const cleanId = String(loginIdentifier).trim();
    const user = await collections.users().findOne({
      $or: [
        { email: cleanId.toLowerCase() },
        { phone: cleanId },
        { member_id: cleanId.toUpperCase() },
      ],
    });

    if (!user) {
      return c.json({ error: 'Invalid credentials or user not found' }, 401);
    }

    const isMatch = await verifyPassword(password, user.password_hash || '');
    if (!isMatch) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    if (user.approval_status === 'pending') {
      return c.json({ error: 'Account pending administrative approval' }, 403);
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    return c.json({
      token,
      user: safeUser,
      message: `Welcome back, ${user.full_name}`,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Login failed' }, 500);
  }
});

// Register
router.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { full_name, email, phone, password, center, role } = body;

    if (!full_name || !phone || !password || !center) {
      return c.json({ error: 'Full name, phone, password, and center are required' }, 400);
    }

    const existing = await collections.users().findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        { phone },
      ],
    });

    if (existing) {
      return c.json({ error: 'User with this email or phone number already exists' }, 409);
    }

    const passwordHash = await hashPassword(password);
    const newUserId = `usr-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);

    const newUser: User = {
      id: newUserId,
      full_name,
      email: (email || `${newUserId}@herculesgym.in`).toLowerCase(),
      phone,
      password_hash: passwordHash,
      role: role || 'member',
      center: center || 'Ranaghat',
      created_at: today,
      is_active: true,
      approval_status: role === 'admin' ? 'approved' : 'pending',
      ...body,
    };

    await collections.users().insertOne(newUser);
    const { password_hash: _, ...safeUser } = newUser;
    const token = generateToken(newUser);

    return c.json({
      token,
      user: safeUser,
      message: 'Account registered successfully',
    }, 201);
  } catch (err: any) {
    return c.json({ error: err.message || 'Registration failed' }, 500);
  }
});

// Current User Profile
router.get('/me', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  const { password_hash, ...safeUser } = user;
  return c.json({ user: safeUser });
});

export default router;
