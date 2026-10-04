import { Hono } from 'hono';
import { collections } from '../db.js';
import { authMiddleware, requireRole } from '../auth.js';
import { User, PaymentRecord, RevenueCategory } from '../types.js';

const router = new Hono();

// Helper: Calculate late fine for date (₹5/day past the 7th of the month)
export function calculateFineForDate(date: Date = new Date()): number {
  const day = date.getDate();
  if (day <= 7) return 0;
  return (day - 7) * 5;
}

// List Payments (with multi-pool ledger breakdown)
router.get('/', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  const centerQuery = c.req.query('center');
  const filter: Record<string, any> = {};

  if (user.role === 'member') {
    filter.user_id = user.id;
  } else if (currentUserCenterFilter(user, centerQuery)) {
    filter.center = currentUserCenterFilter(user, centerQuery);
  }

  const payments = await collections.payments().find(filter).sort({ date: -1 }).toArray();

  // 4-Pool Segregated Revenue Breakdown
  const poolLedger = {
    normalRevenue: payments.filter((p: PaymentRecord) => p.revenue_category === 'gym_fees').reduce((sum: number, p: PaymentRecord) => sum + (p.normal_amount || p.amount || 0), 0),
    fineRevenue: payments.reduce((sum: number, p: PaymentRecord) => sum + (p.fine_amount || 0), 0),
    itemRevenue: payments.filter((p: PaymentRecord) => p.revenue_category === 'gym_item').reduce((sum: number, p: PaymentRecord) => sum + p.amount, 0),
    otherRevenue: payments.filter((p: PaymentRecord) => p.revenue_category === 'others').reduce((sum: number, p: PaymentRecord) => sum + p.amount, 0),
    totalCollected: payments.reduce((sum: number, p: PaymentRecord) => sum + p.amount, 0),
  };

  return c.json({ payments, poolLedger, count: payments.length });
});

function currentUserCenterFilter(user: User, queryCenter?: string): string | null {
  if (user.role !== 'admin') return user.center;
  if (queryCenter && queryCenter !== 'All') return queryCenter;
  return null;
}

// Register Payment (Admin front-desk receipt clearance)
router.post('/register', authMiddleware, requireRole(['admin']), async (c) => {
  try {
    const adminUser = c.get('user') as User;
    const body = await c.req.json();
    const { userId, category, paymentMode, moneyPaid, reason, note } = body;

    const targetMember = await collections.users().findOne({ id: userId });
    if (!targetMember) {
      return c.json({ error: 'Target member not found' }, 404);
    }

    const todayDate = new Date();
    const isGymFees = category === 'gym_fees' || !category;
    const fineAmount = isGymFees ? calculateFineForDate(todayDate) : 0;
    const normalAmount = Math.max(0, Number(moneyPaid) - fineAmount);

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      user_id: targetMember.id,
      user_name: targetMember.full_name,
      user_phone: targetMember.phone,
      center: targetMember.center,
      amount: Number(moneyPaid),
      normal_amount: normalAmount,
      fine_amount: fineAmount,
      date: todayDate.toISOString(),
      status: 'verified',
      revenue_category: (category as RevenueCategory) || 'gym_fees',
      payment_for: reason || 'Gym Fees Payment',
      payment_method: paymentMode || 'online',
      verified_by: adminUser.full_name,
      notes: note || 'Front-desk clearance',
    };

    await collections.payments().insertOne(newPayment);

    // Update member active status & renew term
    await collections.users().updateOne(
      { id: targetMember.id },
      {
        $set: {
          is_active: true,
          'membership.status': 'active',
          'membership.fee_paid': Number(moneyPaid),
          'membership.due_amount': 0,
        },
      }
    );

    return c.json({
      payment: newPayment,
      message: `Payment of ₹${moneyPaid} recorded for ${targetMember.full_name}. Member is ACTIVE.`,
    }, 201);
  } catch (err: any) {
    return c.json({ error: err.message || 'Payment registration failed' }, 500);
  }
});

export default router;
