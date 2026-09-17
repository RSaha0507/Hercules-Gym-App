export type Role = 'admin' | 'trainer' | 'member';
export type CenterType = 'Ranaghat' | 'Chakdah' | 'Madanpur';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type Language = 'en' | 'bn' | 'hi';

export interface RefundRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_phone?: string;
  center?: CenterType;
  amount: number;
  total_original_fee?: number;
  percentage?: number;
  reason: string;
  days_to_refund?: number;
  payment_mode?: 'online' | 'offline';
  refund_date: string;
  status: 'approved' | 'processed';
  processed_by: string;
  notes?: string;
}

export type AdmissionType = 'New Admission' | 'Re-admission';
export type ProfessionType = 'Business' | 'Service' | 'Student' | 'Others';
export type EnrollmentProgramme = 'Gym' | 'Karate' | 'Yoga' | 'Crossfit' | 'Kidsfit';
export type EnrollmentCategory = 'Ladies & Gents' | 'Ladies';

export interface User {
  id: string;
  member_id?: string;
  email: string;
  phone: string;
  full_name: string;
  role: Role;
  center: CenterType;
  date_of_birth?: string;
  created_at: string;
  is_active: boolean;
  days_overdue?: number;
  profile_image?: string;
  is_primary_admin?: boolean;
  approval_status: ApprovalStatus;
  achievements?: string[];
  assigned_trainer_id?: string;
  
  // Admission & Member Profile details
  admission_type?: AdmissionType;
  guardian_name?: string;
  guardian_phone?: string;
  profession?: ProfessionType | string;
  present_address?: string;
  permanent_address?: string;
  body_weight?: number;
  body_height?: string | number;
  health_problems?: string;
  enrollment_programme?: EnrollmentProgramme | string;
  enrollment_category?: EnrollmentCategory | string;
  
  // Trainer-specific details
  trainer_specialties?: string[];
  trainer_certifications?: string;
  trainer_experience?: string;
  
  membership?: {
    plan_name: string;
    plan_duration?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
    start_date: string;
    end_date: string;
    status: 'active' | 'expired' | 'due_soon';
    fee_paid: number;
    due_amount: number;
    approved_at?: string;
    reminder_frequency?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
    next_reminder_date?: string;
  };
  refund_record?: RefundRecord;
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

export interface CatalogItem {
  id: string;
  name: string;
  category: 'Supplements' | 'Apparel' | 'Accessories' | 'Equipment';
  price: number;
  description?: string;
  variants: string[]; // Flavours for supplements, or Choices/Sizes for other categories
  created_at?: string;
  created_by?: string;
}

export interface MerchandiseItem {
  id: string;
  catalog_id?: string;
  name: string;
  category: 'Supplements' | 'Apparel' | 'Accessories' | 'Equipment';
  price: number;
  price_min?: number;
  price_max?: number; // Supports price range e.g. min - max
  original_price?: number;
  stock: number; // Gym inventory counter (total stock)
  variant_stocks?: Record<string, number>; // Variant-wise inventory counter e.g. {"Double Rich Chocolate": 10, "Vanilla": 0}
  image_url: string; // Primary mandatory image
  additional_images?: string[]; // Optional secondary images
  description?: string;
  badge?: string;
  flavours_or_choices?: string[]; // Mandatory at least 1 (e.g. flavours for supplements or sizes/options for others)
  flavours?: string[];
  sizes?: string[];
  available_centers: (CenterType | 'All')[]; // All centers, Ranaghat, Chakdah, Madanpur
  created_by?: string;
  rating?: number;
  reviews_count?: number;
}

export interface CartItem {
  product: MerchandiseItem;
  quantity: number;
  selected_size?: string;
  size?: string;
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
  screenshot_url?: string;
  verification_status?: 'verified' | 'pending_verification' | 'rejected';
  payment_mode?: 'online' | 'offline';
  offline_note?: string;
  verified_at?: string;
  verified_by?: string;
}

export interface HGAiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface WorkoutLogItem {
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface WorkoutLogEntry {
  id: string;
  user_id?: string;
  created_at: string;
  items: WorkoutLogItem[];
}

export interface OfferPlan {
  id: string;
  title: string;
  occasion?: string;
  occasion_name?: string;
  occasion_tag?: string;
  description: string;
  price: number;
  offer_price?: number;
  original_price?: number;
  discount_percentage?: number;
  duration_months: number;
  plan_duration?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  plan_duration_type?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom';
  target_center?: CenterType | 'All';
  applicable_center?: CenterType | 'All';
  center?: CenterType | 'All';
  admission_type_applicable?: 'All' | 'New Admission' | 'Re-admission';
  applicable_admission?: 'All' | 'New Admission' | 'Re-admission';
  applicable_to?: 'all' | 'new_admission' | 're_admission';
  is_active: boolean;
  valid_until?: string;
  created_at: string;
  created_by?: string;
  discount_badge?: string;
  features?: string[];
}
