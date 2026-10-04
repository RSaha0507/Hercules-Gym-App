import { Hono } from 'hono';
import { collections } from '../db.js';
import { authMiddleware, requireRole } from '../auth.js';
import { User, Announcement } from '../types.js';

const router = new Hono();

// List Announcements
router.get('/', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  const filter: Record<string, any> = {
    $or: [
      { center: 'All' },
      { center: user.center },
    ],
  };

  const list = await collections.announcements().find(filter).sort({ created_at: -1 }).toArray();
  return c.json({ announcements: list });
});

// Create Announcement (Admin & Trainer)
router.post('/', authMiddleware, requireRole(['admin', 'trainer']), async (c) => {
  try {
    const user = c.get('user') as User;
    const body = await c.req.json();
    const { title, content, center, type } = body;

    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400);
    }

    const newAnnouncement: Announcement = {
      id: `anc-${Date.now()}`,
      title,
      content,
      author_id: user.id,
      author_name: user.full_name,
      author_role: user.role,
      created_at: new Date().toISOString(),
      center: center || user.center || 'All',
      type: type || 'general',
    };

    await collections.announcements().insertOne(newAnnouncement);
    return c.json({ announcement: newAnnouncement, message: 'Announcement posted' }, 201);
  } catch (err: any) {
    return c.json({ error: err.message || 'Posting announcement failed' }, 500);
  }
});

// Delete Announcement
router.delete('/:id', authMiddleware, requireRole(['admin']), async (c) => {
  const id = c.req.param('id');
  await collections.announcements().deleteOne({ id });
  return c.json({ message: 'Announcement deleted' });
});

export default router;
