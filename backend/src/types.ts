export type Role = 'admin' | 'trainer' | 'member';
export type CenterType = 'Ranaghat' | 'Chakdah' | 'Madanpur';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type Language = 'en' | 'bn' | 'hi';
export type AdmissionType = 'New Admission' | 'Re-admission';
export type ProfessionType = 'Business' | 'Service' | 'Student' | 'Others';
export type EnrollmentProgramme = 'Gym' | 'Karate' | 'Yoga' | 'Crossfit' | 'Kidsfit';
export type EnrollmentCategory = 'Ladies & Gents' | 'Ladies';
export type RevenueCategory = 'gym_fees' | 'gym_item' | 'others';

export interface User {
  id: string;
  member_id?: string;
  email: string;
  phone: string;
  password_hash?: string;
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

  // Admission details
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

  // Trainer details
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

export interface PaymentRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_phone?: string;
  center: CenterType;
  amount: number;
  normal_amount?: number;
  fine_amount?: number;
  date: string; // ISO string
  status: 'verified' | 'pending' | 'rejected';
  category?: string;
  revenue_category?: RevenueCategory;
  payment_for?: string;
  payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'online' | 'offline';
  proof_image?: string;
  verified_by?: string;
  notes?: string;
  order_id?: string;
  days_late?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_role: Role;
  created_at: string;
  center: CenterType | 'All';
  type: 'general' | 'achievement' | 'urgent' | 'maintenance' | 'offer';
  target_roles?: Role[];
}

export interface OfferPlan {
  id: string;
  title: string;
  description: string;
  discount_percentage?: number;
  fixed_price?: number;
  duration_months?: number;
  centers: CenterType[];
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
  created_at: string;
  created_by?: string;
  discount_badge?: string;
  features?: string[];
}
