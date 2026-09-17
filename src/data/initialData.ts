import {
  User,
  AttendanceRecord,
  WorkoutPlan,
  DietPlan,
  FitnessMetricEntry,
  MerchandiseItem,
  CatalogItem,
  ChatMessage,
  Announcement,
  PaymentRecord,
  Order,
} from '../types';

export const INITIAL_USERS: User[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_PRODUCTS: MerchandiseItem[] = [];
export const INITIAL_CATALOG: CatalogItem[] = [];
export const INITIAL_METRICS: FitnessMetricEntry[] = [];
export const INITIAL_MESSAGES: ChatMessage[] = [];
export const INITIAL_PAYMENTS: PaymentRecord[] = [];
export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_WORKOUT_PLAN: WorkoutPlan = {
  id: 'plan-default',
  user_id: 'default',
  updated_at: new Date().toISOString(),
  goal: '',
  level: 'Beginner',
  days: [],
};

export const INITIAL_DIET_PLAN: DietPlan = {
  id: 'diet-default',
  user_id: 'default',
  daily_calories_target: 0,
  daily_protein_target: 0,
  daily_water_target_liters: 0,
  meals: [],
};
