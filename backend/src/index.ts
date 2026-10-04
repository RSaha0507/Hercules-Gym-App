import { Hono, Context, Next } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { connectDB } from './db.js';

import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import attendanceRoutes from './routes/attendance.js';
import paymentRoutes from './routes/payments.js';
import announcementRoutes from './routes/announcements.js';
import offerRoutes from './routes/offers.js';

const app = new Hono();

// Global Middlewares
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Performance Timing Middleware
app.use('*', async (c: Context, next: Next) => {
  const start = performance.now();
  await next();
  const ms = (performance.now() - start).toFixed(2);
  c.header('X-Response-Time', `${ms}ms`);
  c.header('X-Powered-By', 'Hercules Hono Engine');
});

// Health check endpoint
app.get('/health', (c: Context) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    engine: 'Hono / TypeScript 5.7',
    branches: ['Ranaghat', 'Chakdah', 'Madanpur'],
  });
});

// Mount /api Route Tree
const api = new Hono();
api.route('/auth', authRoutes);
api.route('/members', memberRoutes);
api.route('/attendance', attendanceRoutes);
api.route('/payments', paymentRoutes);
api.route('/announcements', announcementRoutes);
api.route('/offers', offerRoutes);

app.route('/api', api);

// Root greeting
app.get('/', (c: Context) => {
  return c.json({
    service: 'Hercules Gym Management High-Efficiency API',
    version: '2.0.0',
    status: 'online',
    docs: '/api/docs',
  });
});

const PORT = Number(process.env.PORT) || 8080;

async function startServer() {
  try {
    await connectDB();
    serve({
      fetch: app.fetch,
      port: PORT,
    }, (info: { port: number; address: string }) => {
      console.log(`🚀 Hercules Gym Hono Backend running on http://0.0.0.0:${info.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
