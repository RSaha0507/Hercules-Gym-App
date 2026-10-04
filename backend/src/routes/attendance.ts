import { Hono } from 'hono';
import { collections } from '../db.js';
import { authMiddleware } from '../auth.js';
import { User, AttendanceRecord } from '../types.js';

const router = new Hono();

// QR Check-in / Check-out
router.post('/check-in', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const body = await c.req.json();
    const today = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    // Check existing check-in for today
    const existing = await collections.attendance().findOne({
      user_id: user.id,
      date: today,
      check_out_time: { $exists: false },
    });

    if (existing) {
      // Perform Check-out
      const checkInDate = new Date(existing.check_in_time);
      const durationMin = Math.round((new Date().getTime() - checkInDate.getTime()) / (1000 * 60));

      await collections.attendance().updateOne(
        { id: existing.id },
        {
          $set: {
            check_out_time: nowIso,
            duration_minutes: durationMin,
          },
        }
      );

      return c.json({
        action: 'check_out',
        record: { ...existing, check_out_time: nowIso, duration_minutes: durationMin },
        message: `Check-out recorded. Total workout duration: ${durationMin} minutes.`,
      });
    }

    // Perform Check-in
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      user_id: user.id,
      user_name: user.full_name,
      user_role: user.role,
      center: user.center,
      date: today,
      check_in_time: nowIso,
      method: body.method || 'qr_scanner',
    };

    await collections.attendance().insertOne(newRecord);

    return c.json({
      action: 'check_in',
      record: newRecord,
      message: `Welcome to ${user.center} Center! Check-in confirmed at ${new Date().toLocaleTimeString()}.`,
    }, 201);
  } catch (err: any) {
    return c.json({ error: err.message || 'Attendance operation failed' }, 500);
  }
});

// Get Attendance History (Branch & Role Aware)
router.get('/', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  const dateQuery = c.req.query('date') || new Date().toISOString().slice(0, 10);
  const filter: Record<string, any> = { date: dateQuery };

  if (user.role === 'member') {
    filter.user_id = user.id;
  } else if (user.role === 'trainer' || user.role === 'admin') {
    if (user.role !== 'admin') {
      filter.center = user.center;
    }
  }

  const logs = await collections.attendance().find(filter).sort({ check_in_time: -1 }).toArray();
  return c.json({ attendance: logs, count: logs.length });
});

export default router;
