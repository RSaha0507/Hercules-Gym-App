import { Hono } from 'hono';
import { collections } from '../db.js';
import { authMiddleware, requireRole } from '../auth.js';
import { User, OfferPlan } from '../types.js';

const router = new Hono();

// List Offers
router.get('/', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  const filter: Record<string, any> = {
    $or: [
      { centers: 'All' },
      { centers: user.center },
    ],
  };

  const offers = await collections.offers().find(filter).sort({ created_at: -1 }).toArray();
  return c.json({ offers });
});

// Create Offer (Admin only)
router.post('/', authMiddleware, requireRole(['admin']), async (c) => {
  try {
    const user = c.get('user') as User;
    const body = await c.req.json();
    const { title, description, centers, fixed_price, duration_months } = body;

    const newOffer: OfferPlan = {
      id: `off-${Date.now()}`,
      title,
      description,
      centers: centers || ['Ranaghat', 'Chakdah', 'Madanpur'],
      fixed_price: Number(fixed_price) || 1999,
      duration_months: Number(duration_months) || 3,
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: user.full_name,
      valid_from: new Date().toISOString().slice(0, 10),
      ...body,
    };

    await collections.offers().insertOne(newOffer);
    return c.json({ offer: newOffer, message: 'Offer created successfully' }, 201);
  } catch (err: any) {
    return c.json({ error: err.message || 'Creating offer failed' }, 500);
  }
});

export default router;
