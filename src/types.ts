export type Role = 'admin' | 'trainer' | 'member';
export type CenterType = 'Ranaghat' | 'Chakdah' | 'Madanpur';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type Language = 'en' | 'bn' | 'hi';

export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: Role;
  center: CenterType;
  date_of_birth?: string;
  created_at: string;
  is_active: boolean;
  profile_image?: string;
  is_primary_admin?: boolean;
  approval_status: ApprovalStatus;
  achievements?: string[];
  assigned_trainer_id?: string;
  membership?: {
    plan_name: string;
    start_date: string;
    end_date: string;
    status: 'active' | 'expired' | 'due_soon';
    fee_paid: number;
    due_amount: number;
  };
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_role: Role;
  center: CenterType;
  date: string; // YYYY-MM-DD
  check_in_time: string; // ISO string
  check_out_time?: string;
  method: 'qr_scanner' | 'admin_scan' | 'manual' | 'geofence';
  duration_minutes?: number;
}

export interface Exercise {
  id: string;
  name: string;
  target_muscle: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
  video_url?: string;
}

export interface WorkoutDay {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  title: string;
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  trainer_id?: string;
  updated_at: string;
  goal: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  days: WorkoutDay[];
}

export interface MealItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number; // in grams
  carbs: number;
  fats: number;
  time?: string;
}

export interface DietPlan {
  id: string;
  user_id: string;
  trainer_id?: string;
  daily_calories_target: number;
  daily_protein_target: number;
  daily_water_target_liters: number;
  meals: {
    meal_type: 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Evening Snack' | 'Dinner';
    time: string;
    items: MealItem[];
  }[];
  notes?: string;
}

export interface FitnessMetricEntry {
  id: string;
  date: string;
  weight_kg: number;
  height_cm: number;
  body_fat_pct?: number;
  bmi: number;
  chest_in?: number;
  waist_in?: number;
  biceps_in?: number;
  notes?: string;
}

export interface MerchandiseItem {
  id: string;
  name: string;
  category: 'Supplements' | 'Apparel' | 'Accessories' | 'Equipment';
  price: number;
  original_price?: number;
  stock: number;
  image_url: string;
  description: string;
  badge?: string;
  available_centers: CenterType[];
}

export interface CartItem {
  product: MerchandiseItem;
  quantity: number;
  selected_size?: string;
}

export interface Order {
  id: string;
  user_id: string;
  user_name: string;
  center: CenterType;
  items: {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
  }[];
  total_amount: number;
  status: 'pending' | 'processing' | 'ready_for_pickup' | 'completed';
  payment_method: 'upi' | 'cash_at_desk' | 'card';
  payment_status: 'paid' | 'pending';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: Role;
  recipient_id?: string; // empty if channel message
  channel_id?: string;
  content: string;
  timestamp: string;
  is_read?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_role: string;
  target_center: CenterType | 'All';
  created_at: string;
  is_pinned?: boolean;
  category: 'Event' | 'Notice' | 'Achievement' | 'Holiday' | 'Maintenance';
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  user_name: string;
  center: CenterType;
  plan_name: string;
  amount: number;
  payment_date: string;
  due_date: string;
  status: 'paid' | 'pending' | 'overdue';
  payment_method: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
  receipt_no: string;
}
