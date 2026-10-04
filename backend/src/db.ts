import { MongoClient, Db, Collection } from 'mongodb';
import dns from 'node:dns';
import dotenv from 'dotenv';
import { User, AttendanceRecord, PaymentRecord, Announcement, OfferPlan } from './types.js';

dotenv.config();

// Fix for Node.js querySrv ECONNREFUSED on Windows & local ISP DNS resolvers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore in environments where custom DNS servers cannot be set
}

const MONGO_URI = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'hercules_gym';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

export async function connectDB(): Promise<Db | null> {
  if (db && isConnected) return db;

  try {
    const isLocalhost = MONGO_URI.includes('localhost') || MONGO_URI.includes('127.0.0.1');
    if (isLocalhost) {
      console.log('ℹ️  Attempting connection to local MongoDB (mongodb://localhost:27017)...');
      console.log('💡 Tip: For Cloud database, set MONGO_URL in backend/.env with your MongoDB Atlas connection string.');
    }

    client = new MongoClient(MONGO_URI, {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 8000,
    });

    await client.connect();
    db = client.db(DB_NAME);
    isConnected = true;
    console.log(`⚡ Successfully connected to MongoDB (${DB_NAME})`);

    // Ensure vital compound indexes
    try {
      await Promise.all([
        db.collection('users').createIndex({ email: 1 }, { unique: true }),
        db.collection('users').createIndex({ phone: 1 }),
        db.collection('users').createIndex({ member_id: 1 }, { sparse: true }),
        db.collection('users').createIndex({ center: 1, role: 1 }),
        db.collection('attendance').createIndex({ user_id: 1, date: 1 }),
        db.collection('attendance').createIndex({ center: 1, date: 1 }),
        db.collection('payments').createIndex({ user_id: 1, date: 1 }),
        db.collection('payments').createIndex({ center: 1, date: 1 }),
        db.collection('member_counters').createIndex({ center: 1, category: 1 }, { unique: true }),
      ]);
    } catch (idxErr) {
      console.warn('⚠️ Non-critical index creation notice:', idxErr);
    }

    return db;
  } catch (error: any) {
    console.error('❌ MongoDB Connection Notice:');
    if (MONGO_URI.includes('localhost') || MONGO_URI.includes('127.0.0.1')) {
      console.error('👉 No local MongoDB daemon is running on port 27017.');
      console.error('👉 To connect to your cloud database, create a `backend/.env` file containing:');
      console.error('   MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/hercules_gym');
    } else {
      console.error('👉 Failed to connect to remote MongoDB URI:', error.message);
    }
    throw error;
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database is not connected. Please verify your MONGO_URL in backend/.env.');
  }
  return db;
}

export function getCollection<T extends Record<string, any>>(name: string): Collection<T> {
  return getDB().collection<T>(name);
}

// Typed Collection Accessors
export const collections = {
  users: () => getCollection<User>('users'),
  attendance: () => getCollection<AttendanceRecord>('attendance'),
  payments: () => getCollection<PaymentRecord>('payments'),
  announcements: () => getCollection<Announcement>('announcements'),
  offers: () => getCollection<OfferPlan>('offers'),
  memberCounters: () => getCollection<{ center: string; category: string; counter: number }>('member_counters'),
  appSettings: () => getCollection<{ key: string; value: any }>('app_settings'),
};
