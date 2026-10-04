import { Hono } from 'hono';
import { collections } from '../db.js';
import { authMiddleware, requireRole } from '../auth.js';
import { User, CenterType, EnrollmentProgramme } from '../types.js';

const router = new Hono();

// Helper mappings for XX-YYY-NNNN member ID generation
const BRANCH_CODES: Record<string, string> = {
  Ranaghat: 'RG',
  Chakdah: 'CD',
  Madanpur: 'MD',
};

const PROGRAMME_CODES: Record<string, string> = {
  Gym: 'GYM',
  Karate: 'KRT',
  Yoga: 'YGA',
  Crossfit: 'CRF',
  Kidsfit: 'KID',
};

export function getBranchCode(center?: string): string {
  if (!center) return 'RG';
  const c = center.toLowerCase();
  if (c.includes('chakdah') || c === 'cd') return 'CD';
  if (c.includes('madanpur') || c === 'md') return 'MD';
  return 'RG';
}

export function getProgrammeCode(prog?: string): string {
  if (!prog) return 'GYM';
  const p = prog.toLowerCase();
  if (p.includes('karate') || p === 'krt') return 'KRT';
  if (p.includes('yoga') || p === 'yga') return 'YGA';
  if (p.includes('cross') || p === 'crf') return 'CRF';
  if (p.includes('kid') || p === 'kid') return 'KID';
  return 'GYM';
}

// Generate & Increment Next Monotonic Sequential Member ID
async function allocateNextMemberId(center: CenterType, programme: EnrollmentProgramme): Promise<string> {
  const branch = getBranchCode(center);
  const progCode = getProgrammeCode(programme);

  const result = await collections.memberCounters().findOneAndUpdate(
    { center: branch, category: progCode },
    { $inc: { counter: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  const counterNum = result?.counter || 1;
  const padded = String(counterNum).padStart(4, '0');
  return `${branch}-${progCode}-${padded}`;
}

// List Members (Search, Filter, Multi-Branch Aware)
router.get('/', authMiddleware, async (c) => {
  const currentUser = c.get('user') as User;
  const centerQuery = c.req.query('center');
  const roleQuery = c.req.query('role');
  const searchQuery = c.req.query('q');

  const filter: Record<string, any> = {};

  // Branch Isolation: non-admins only see their assigned center
  if (currentUser.role !== 'admin') {
    filter.center = currentUser.center;
  } else if (centerQuery && centerQuery !== 'All') {
    filter.center = centerQuery;
  }

  if (roleQuery && roleQuery !== 'all') {
    filter.role = roleQuery;
  }

  if (searchQuery) {
    const q = searchQuery.trim();
    filter.$or = [
      { full_name: { $regex: q, $options: 'i' } },
      { member_id: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }

  const users = await collections.users()
    .find(filter, { projection: { password_hash: 0 } })
    .sort({ created_at: -1 })
    .toArray();

  return c.json({ members: users, total: users.length });
});

// Admit / Register New Member (Admin only)
router.post('/admit', authMiddleware, requireRole(['admin']), async (c) => {
  try {
    const body = await c.req.json();
    const { full_name, phone, center, enrollment_programme } = body;

    if (!full_name || !phone || !center) {
      return c.json({ error: 'Full name, phone, and center branch are required' }, 400);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const newUserId = `usr-${Date.now()}`;

    // Auto generate sequential XX-YYY-NNNN if not provided
    const assignedId = body.member_id || await allocateNextMemberId(center, enrollment_programme || 'Gym');

    const newMember: User = {
      id: newUserId,
      member_id: assignedId,
      full_name,
      phone,
      email: (body.email || `${newUserId}@herculesgym.in`).toLowerCase(),
      role: 'member',
      center,
      created_at: todayStr,
      is_active: true,
      approval_status: 'approved',
      admission_type: body.admission_type || 'New Admission',
      profession: body.profession || 'Student',
      guardian_name: body.guardian_name,
      guardian_phone: body.guardian_phone,
      present_address: body.present_address,
      permanent_address: body.permanent_address,
      body_weight: Number(body.body_weight) || 70,
      body_height: body.body_height || "5'8''",
      health_problems: body.health_problems,
      enrollment_programme: enrollment_programme || 'Gym',
      enrollment_category: body.enrollment_category || 'Ladies & Gents',
      profile_image: body.profile_image,
      membership: {
        plan_name: body.selected_plan_name || 'Quarterly Pro Tier',
        plan_duration: body.selected_plan_duration || 'quarterly',
        start_date: todayStr,
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'active',
        fee_paid: body.fee_paid || 1900,
        due_amount: 0,
      },
    };

    await collections.users().insertOne(newMember);

    return c.json({
      member: newMember,
      message: `Member ${newMember.full_name} (${newMember.member_id}) admitted successfully`,
    }, 201);
  } catch (err: any) {
    return c.json({ error: err.message || 'Admission failed' }, 500);
  }
});

// Update Member Profile
router.put('/:id', authMiddleware, requireRole(['admin']), async (c) => {
  const targetId = c.req.param('id');
  const updates = await c.req.json();
  delete updates.id;
  delete updates.password_hash;

  const result = await collections.users().findOneAndUpdate(
    { id: targetId },
    { $set: updates },
    { returnDocument: 'after', projection: { password_hash: 0 } }
  );

  if (!result) {
    return c.json({ error: 'Member not found' }, 404);
  }

  return c.json({ member: result, message: 'Profile updated successfully' });
});

// Delete Member (Admin only - monotonic counter is never decremented)
router.delete('/:id', authMiddleware, requireRole(['admin']), async (c) => {
  const targetId = c.req.param('id');
  const result = await collections.users().deleteOne({ id: targetId });

  if (result.deletedCount === 0) {
    return c.json({ error: 'Member not found' }, 404);
  }

  return c.json({ message: 'Member profile deleted successfully' });
});

export default router;
