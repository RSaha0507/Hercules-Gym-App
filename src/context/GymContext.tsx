import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  User,
  Role,
  CenterType,
  AttendanceRecord,
  WorkoutPlan,
  DietPlan,
  FitnessMetricEntry,
  MerchandiseItem,
  CatalogItem,
  CartItem,
  Order,
  ChatMessage,
  Announcement,
  PaymentRecord,
  Language,
  WorkoutLogEntry,
  WorkoutLogItem,
  RefundRecord,
  OfferPlan,
  EnvironmentMode,
  EnvironmentAtmosphere,
  EnrollmentProgramme,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_ATTENDANCE,
  INITIAL_PRODUCTS,
  INITIAL_CATALOG,
  INITIAL_WORKOUT_PLAN,
  INITIAL_DIET_PLAN,
  INITIAL_METRICS,
  INITIAL_MESSAGES,
  INITIAL_PAYMENTS,
  INITIAL_ORDERS,
} from '../data/initialData';
import { translations } from '../utils/translations';
import { webApi } from '../services/api';

export interface CenterTheme {
  name: string;
  id: CenterType | 'All';
  gradient: string;
  textGradient: string;
  badgeBg: string;
  borderAccent: string;
  glowShadow: string;
  active3dButton: string;
  inactive3dButton: string;
  bgGlass: string;
  accentHex: string;
  ringFocus: string;
}

export const getCenterTheme = (center: CenterType | 'All' = 'All', theme: 'dark' | 'light' = 'dark'): CenterTheme => {
  if (center === 'Chakdah') {
    return {
      name: 'Chakdah Center',
      id: 'Chakdah',
      gradient: 'from-amber-600 via-yellow-500 to-orange-400',
      textGradient: 'from-amber-500 via-yellow-400 to-orange-300',
      badgeBg: 'bg-stone-950/90 border border-amber-500/30 text-yellow-300',
      borderAccent: 'border-amber-500/40',
      glowShadow: 'shadow-stone-950/80 shadow-xl',
      active3dButton: 'bg-gradient-to-r from-amber-700 via-yellow-500 to-orange-500 text-stone-950 border-b-4 border-amber-900 shadow-lg shadow-stone-950/60 font-bold',
      inactive3dButton: theme === 'dark' ? 'bg-stone-900/90 text-stone-300 border-b-4 border-stone-950 hover:border-amber-500/40 hover:bg-stone-800' : 'bg-zinc-100 text-zinc-700 border-b-4 border-zinc-300 hover:border-amber-500 hover:bg-zinc-200',
      bgGlass: 'bg-stone-950/20 backdrop-blur-md border border-stone-800/40',
      accentHex: '#f59e0b', // Tailwind amber-500
      ringFocus: 'focus:ring-amber-500',
    };
  }
  if (center === 'Madanpur') {
    return {
      name: 'Madanpur Center',
      id: 'Madanpur',
      gradient: 'from-amber-300 via-lime-400 to-emerald-500',
      textGradient: 'from-amber-200 via-lime-300 to-emerald-400',
      badgeBg: 'bg-neutral-950/90 border border-lime-500/30 text-lime-300',
      borderAccent: 'border-lime-400/40',
      glowShadow: 'shadow-neutral-950/80 shadow-xl',
      active3dButton: 'bg-gradient-to-r from-amber-400 via-lime-400 to-emerald-600 text-neutral-950 border-b-4 border-emerald-800 shadow-lg shadow-neutral-950/60 font-bold',
      inactive3dButton: theme === 'dark' ? 'bg-neutral-900/90 text-neutral-300 border-b-4 border-neutral-950 hover:border-lime-400/40 hover:bg-neutral-800' : 'bg-zinc-100 text-zinc-700 border-b-4 border-zinc-300 hover:border-lime-400 hover:bg-zinc-200',
      bgGlass: 'bg-neutral-950/20 backdrop-blur-md border border-neutral-800/40',
      accentHex: '#a3e635', // Tailwind lime-400
      ringFocus: 'focus:ring-lime-400',
    };
  }
  // Ranaghat or All (Default fiery brand gradient)
  return {
    name: center === 'Ranaghat' ? 'Ranaghat Center' : 'Ranaghat • Chakdah • Madanpur',
    id: center,
    gradient: 'from-amber-400 via-rose-500 to-red-600',
    textGradient: 'from-amber-400 via-rose-500 to-red-500',
    badgeBg: 'bg-rose-950/70 border border-rose-500/40 text-amber-300',
    borderAccent: 'border-rose-500/50',
    glowShadow: 'shadow-rose-950/60 shadow-xl',
    active3dButton: 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white border-b-4 border-red-900 shadow-lg shadow-rose-950/60 font-bold',
    inactive3dButton: theme === 'dark' ? 'bg-zinc-900/90 text-zinc-300 border-b-4 border-zinc-950 hover:border-rose-500/40 hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-700 border-b-4 border-zinc-300 hover:border-rose-400 hover:bg-zinc-200',
    bgGlass: 'bg-rose-950/20 backdrop-blur-md border border-rose-900/30',
    accentHex: '#f43f5e',
    ringFocus: 'focus:ring-rose-500',
  };
};

export const getEnvironmentalAtmosphere = (
  mode: EnvironmentMode = 'auto',
  currentHour: number = new Date().getHours()
): EnvironmentAtmosphere => {
  let effectiveMode: EnvironmentMode = mode;
  if (mode === 'auto') {
    if (currentHour >= 5 && currentHour < 11) effectiveMode = 'dawn';
    else if (currentHour >= 11 && currentHour < 17) effectiveMode = 'midday';
    else if (currentHour >= 17 && currentHour < 21) effectiveMode = 'golden_hour';
    else effectiveMode = 'midnight';
  }

  if (effectiveMode === 'dawn') {
    return {
      id: 'dawn',
      name: 'Dawn Freshness',
      timeRange: '05:00 - 11:00 AM',
      description: 'Crisp morning amber auroras with soft cyan sky undertones',
      primaryGlow: 'rgba(251, 146, 60, 0.22)',
      secondaryGlow: 'rgba(56, 189, 248, 0.18)',
      tertiaryGlow: 'rgba(245, 158, 11, 0.15)',
      accentGlow: 'rgba(14, 165, 233, 0.14)',
      prismShimmer: 'from-amber-400/20 via-sky-400/20 to-emerald-400/20',
      borderRefraction: 'border-amber-400/30 shadow-amber-950/20',
    };
  }
  if (effectiveMode === 'midday') {
    return {
      id: 'midday',
      name: 'Midday Power Surge',
      timeRange: '11:00 AM - 05:00 PM',
      description: 'High-intensity hyper-charged solar chromatic spectrum',
      primaryGlow: 'rgba(239, 68, 68, 0.24)',
      secondaryGlow: 'rgba(245, 158, 11, 0.22)',
      tertiaryGlow: 'rgba(168, 85, 247, 0.18)',
      accentGlow: 'rgba(234, 179, 8, 0.20)',
      prismShimmer: 'from-rose-500/25 via-amber-400/25 to-purple-500/20',
      borderRefraction: 'border-rose-500/30 shadow-rose-950/30',
    };
  }
  if (effectiveMode === 'golden_hour') {
    return {
      id: 'golden_hour',
      name: 'Golden Hour Rush',
      timeRange: '05:00 PM - 09:00 PM',
      description: 'Warm sunset copper, crimson, and deep velvet twilight',
      primaryGlow: 'rgba(249, 115, 22, 0.26)',
      secondaryGlow: 'rgba(225, 29, 72, 0.22)',
      tertiaryGlow: 'rgba(147, 51, 234, 0.18)',
      accentGlow: 'rgba(251, 191, 36, 0.20)',
      prismShimmer: 'from-orange-500/25 via-rose-500/25 to-violet-600/20',
      borderRefraction: 'border-orange-500/30 shadow-orange-950/30',
    };
  }
  if (effectiveMode === 'prismatic') {
    return {
      id: 'prismatic',
      name: 'Prismatic Dispersion',
      timeRange: 'Dynamic Spectrum',
      description: 'Full-spectrum kinetic chromatic prism with dynamic light refraction',
      primaryGlow: 'rgba(168, 85, 247, 0.28)',
      secondaryGlow: 'rgba(6, 182, 212, 0.25)',
      tertiaryGlow: 'rgba(244, 63, 94, 0.22)',
      accentGlow: 'rgba(16, 185, 129, 0.20)',
      prismShimmer: 'from-fuchsia-500/30 via-cyan-400/30 to-rose-400/30',
      borderRefraction: 'border-fuchsia-500/40 shadow-purple-950/40',
    };
  }
  // Midnight Iron (Default night / late evening)
  return {
    id: 'midnight',
    name: 'Midnight Hardcore Iron',
    timeRange: '09:00 PM - 05:00 AM',
    description: 'Deep stealth obsidian with electric laser highlights',
    primaryGlow: 'rgba(99, 102, 241, 0.22)',
    secondaryGlow: 'rgba(168, 85, 247, 0.20)',
    tertiaryGlow: 'rgba(244, 63, 94, 0.16)',
    accentGlow: 'rgba(56, 189, 248, 0.16)',
    prismShimmer: 'from-indigo-500/20 via-purple-500/20 to-pink-500/20',
    borderRefraction: 'border-indigo-500/30 shadow-indigo-950/30',
  };
};

// Branch & Enrollment Programme Code Mappings
// Format: XX-YYY-NNNN
// XX: RG (Ranaghat), CD (Chakdah), MD (Madanpur)
// YYY: GYM, KRT, YGA, CRF, KID
export const CENTER_CODE_MAP: Record<CenterType, string> = {
  Ranaghat: 'RG',
  Chakdah: 'CD',
  Madanpur: 'MD',
};

export const PROGRAMME_CODE_MAP: Record<EnrollmentProgramme, string> = {
  Gym: 'GYM',
  Karate: 'KRT',
  Yoga: 'YGA',
  Crossfit: 'CRF',
  Kidsfit: 'KID',
};

export const getBranchCode = (center?: CenterType | string): string => {
  if (!center) return 'RG';
  const c = center.toString().trim().toLowerCase();
  if (c.includes('chakdah') || c === 'cd' || c.startsWith('chak')) return 'CD';
  if (c.includes('madanpur') || c === 'md' || c.startsWith('madan')) return 'MD';
  if (c.includes('ranaghat') || c === 'rg' || c.startsWith('rana')) return 'RG';
  return 'RG';
};

export const getProgrammeCode = (prog?: EnrollmentProgramme | string): string => {
  if (!prog) return 'GYM';
  const p = prog.toString().trim().toLowerCase();
  if (p.includes('karate') || p === 'krt') return 'KRT';
  if (p.includes('yoga') || p === 'yga') return 'YGA';
  if (p.includes('cross') || p === 'crf') return 'CRF';
  if (p.includes('kid') || p === 'kid') return 'KID';
  if (p.includes('gym') || p === 'gym') return 'GYM';
  return 'GYM';
};

export const formatMemberId = (
  center: CenterType | string = 'Ranaghat',
  prog: EnrollmentProgramme | string = 'Gym',
  counter: number = 1
): string => {
  const branch = getBranchCode(center);
  const programme = getProgrammeCode(prog);
  const padded = String(Math.max(1, counter)).padStart(4, '0');
  return `${branch}-${programme}-${padded}`;
};

export const calculateFineForDay = (date: Date = new Date()): number => {
  const dayOfMonth = date.getDate();
  if (dayOfMonth <= 7) return 0;
  return (dayOfMonth - 7) * 5;
};

export const getPlanStandardFee = (planDurationOrName?: string): number => {
  const str = (planDurationOrName || '').toLowerCase();
  if (str.includes('annual') || str.includes('year') || str.includes('champion')) return 6500;
  if (str.includes('semi') || str.includes('half') || str.includes('elite') || str.includes('6 month')) return 3500;
  if (str.includes('quarter') || str.includes('pro') || str.includes('3 month')) return 1900;
  return 700; // Monthly standard
};

// Calculates exact term expiration (1st of renewal month, ignoring joining day)
export const calculateMemberTermExpiry = (startDateStr?: string, planDuration: string = 'monthly'): Date => {
  const start = startDateStr ? new Date(startDateStr) : new Date();
  const startYear = start.getFullYear();
  const startMonth = start.getMonth(); // 0-indexed: Jan=0, Feb=1, etc.
  
  let termMonths = 1;
  const lower = (planDuration || '').toLowerCase();
  if (lower.includes('annual') || lower.includes('year') || lower.includes('champion')) termMonths = 12;
  else if (lower.includes('semi') || lower.includes('half') || lower.includes('elite') || lower.includes('6 month')) termMonths = 6;
  else if (lower.includes('quarter') || lower.includes('pro') || lower.includes('3 month')) termMonths = 3;
  else termMonths = 1;

  // Exact 1st of the renewal month: e.g. Jan (month 0) + 3 months -> Month 3 (April) 1st 00:00:00
  return new Date(startYear, startMonth + termMonths, 1, 0, 0, 0);
};

export const calculateMemberDue = (user: User): {
  isExpired: boolean;
  normalFee: number;
  fine: number;
  totalDue: number;
  expiryDateStr: string;
  daysLate: number;
} => {
  if (user.role !== 'member') {
    return { isExpired: false, normalFee: 0, fine: 0, totalDue: 0, expiryDateStr: '', daysLate: 0 };
  }

  const planDuration = user.membership?.plan_duration || 'monthly';
  const normalFee = getPlanStandardFee(user.membership?.plan_name || planDuration);
  const expiryDate = calculateMemberTermExpiry(user.membership?.start_date, planDuration);
  const now = new Date();
  const isExpired = now >= expiryDate || user.is_active === false;
  const expiryDateStr = expiryDate.toISOString().slice(0, 10);

  let fine = 0;
  let daysLate = 0;
  if (isExpired) {
    const dayOfMonth = now.getDate();
    if (dayOfMonth > 7) {
      daysLate = dayOfMonth - 7;
      fine = daysLate * 5;
    }
  }

  const totalDue = isExpired ? (normalFee + fine) : 0;

  return {
    isExpired,
    normalFee,
    fine,
    totalDue,
    expiryDateStr,
    daysLate,
  };
};

interface GymContextType {
  currentUser: User | null;
  selectedCenter: CenterType | 'All';
  setSelectedCenter: (center: CenterType | 'All') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isNavOpen: boolean;
  setIsNavOpen: (open: boolean) => void;
  toggleNav: () => void;
  getCenterTheme: (center?: CenterType | 'All') => CenterTheme;

  // Backend Sync Status (MongoDB Atlas)
  backendConnected: boolean;
  isSyncing: boolean;
  syncWithBackend: () => Promise<void>;

  // Users & Auth
  users: User[];
  login: (identifier: string, pass: string) => Promise<boolean>;
  register: (data: Partial<User> & { password?: string }) => Promise<any>;
  logout: () => void;
  switchDemoUser: (userId: string) => void;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string, reason?: string) => Promise<void>;
  updateUserProfile: (userId: string, data: Partial<User>) => void;
  addUser: (userData: Partial<User>) => void;
  deleteUser: (userId: string) => Promise<void>;
  refundMember: (refundData: Omit<RefundRecord, 'id' | 'refund_date' | 'status'>) => RefundRecord;
  refunds: RefundRecord[];

  // Attendance
  attendance: AttendanceRecord[];
  checkIn: (center: CenterType, method?: 'qr_scanner' | 'admin_scan' | 'manual' | 'geofence') => Promise<void>;
  checkOut: () => Promise<void>;
  isCheckedIn: boolean;
  activeCheckIn: AttendanceRecord | null;
  manualCheckIn: (userId: string, center: CenterType) => Promise<void>;

  // Workouts & Diet & Metrics
  workoutPlan: WorkoutPlan;
  dietPlan: DietPlan;
  saveWorkoutPlan: (plan: WorkoutPlan) => void;
  saveDietPlan: (plan: DietPlan) => void;
  fitnessMetrics: FitnessMetricEntry[];
  addFitnessMetric: (metric: Omit<FitnessMetricEntry, 'id'>) => void;

  // Workout Logger (Mobile Parity)
  workoutLogs: WorkoutLogEntry[];
  logWorkout: (items: WorkoutLogItem[]) => Promise<void>;
  fetchWorkoutLogs: () => Promise<void>;

  // AI Assistant (HG.AI Mobile Parity)
  chatWithAi: (
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    context?: { member_name?: string; branch?: string }
  ) => Promise<string>;

  // Merchandise, Catalog & Orders
  products: MerchandiseItem[];
  catalog: CatalogItem[];
  cart: CartItem[];
  addToCart: (product: MerchandiseItem, quantity?: number, size?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  orders: Order[];
  placeOrder: (paymentMethod: 'upi' | 'cash_at_desk' | 'card') => Order;
  addProduct: (product: Omit<MerchandiseItem, 'id'>) => MerchandiseItem;
  updateProduct: (productId: string, data: Partial<MerchandiseItem>) => Promise<void> | void;
  deleteProduct: (productId: string) => Promise<void> | void;
  updateProductStock: (productId: string, newStock: number) => void;
  addCatalogItem: (item: Omit<CatalogItem, 'id' | 'created_at'>) => Promise<CatalogItem>;
  updateCatalogItem: (id: string, data: Partial<CatalogItem>) => Promise<void>;
  deleteCatalogItem: (id: string) => Promise<void>;

  // Messages & Announcements
  messages: ChatMessage[];
  sendMessage: (content: string, recipientId?: string, channelId?: string) => Promise<void>;
  announcements: Announcement[];
  createAnnouncement: (ann: Omit<Announcement, 'id' | 'created_at'>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;

  // Payments & Revenues (Admin Register & Split Calculation)
  payments: PaymentRecord[];
  recordPayment: (payment: Omit<PaymentRecord, 'id' | 'receipt_no'>) => void;
  verifyPayment: (paymentId: string, status: 'verified' | 'rejected') => void;
  adminRegisterPayment: (params: {
    userId: string;
    category: 'gym_fees' | 'gym_item' | 'others';
    paymentMode: 'online' | 'offline';
    moneyPaid: number;
    reason: string;
    note?: string;
    orderId?: string;
  }) => PaymentRecord;
  calculateMemberDue: (user: User) => {
    isExpired: boolean;
    normalFee: number;
    fine: number;
    totalDue: number;
    expiryDateStr: string;
    daysLate: number;
  };

  // Offers & Occasion Plans
  offers: OfferPlan[];
  addOffer: (offer: Omit<OfferPlan, 'id' | 'created_at'>) => OfferPlan;
  updateOffer: (id: string, updates: Partial<OfferPlan>) => void;
  deleteOffer: (id: string) => void;
  toggleOfferStatus: (id: string) => void;

  // Member & Trainer Activation / Inactivation & Re-admission
  toggleUserActiveStatus: (userId: string, targetStatus?: boolean) => void;
  executeReAdmission: (userId: string, reAdmissionData: Partial<User> & { plan_duration?: string; fee_paid?: number; plan_name?: string }) => void;

  // Theme & Language
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;

  // Environmental Theming & Circadian Prism
  environmentMode: EnvironmentMode;
  setEnvironmentMode: (mode: EnvironmentMode) => void;
  currentAtmosphere: EnvironmentAtmosphere;

  // Auto Member ID Counter Engine (Innovation & Branch Category Sequence)
  // Format: XX-YYY-NNNN (e.g. RG-GYM-0001, CD-KRT-0002)
  memberCounters: Record<string, number>;
  getNextMemberId: (center?: CenterType | string, prog?: EnrollmentProgramme | string) => string;
  incrementMemberCounter: (center?: CenterType | string, prog?: EnrollmentProgramme | string) => void;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export const GymProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Safe localStorage helper with complete legacy mock data cleanup
  const loadLocal = <T,>(key: string, fallback: T): T => {
    try {
      // Check current v3 storage key first
      const stored = localStorage.getItem(`hercules_v3_${key}`);
      if (!stored) {
        // Purge old v1 and v2 keys that may hold initial mock records
        localStorage.removeItem(`hercules_${key}`);
        localStorage.removeItem(`hercules_v2_${key}`);
        return fallback;
      }
      const parsed = JSON.parse(stored);

      // Purge legacy mock users or mock pending approvals
      if (key === 'users') {
        if (Array.isArray(parsed)) {
          const cleanUsers = parsed.filter((u: any) => 
            u && 
            u.id &&
            !u.id.startsWith('user-pending-') &&
            u.id !== 'user-pending-1' &&
            u.id !== 'user-pending-2' &&
            u.id !== 'user-admin-1' &&
            u.id !== 'user-trainer-1' &&
            u.id !== 'user-member-1' &&
            !u.email?.includes('pending_mock') &&
            !u.email?.includes('example.com')
          );
          return cleanUsers as unknown as T;
        }
        return fallback;
      }

      // Purge legacy mock workout data
      if (key === 'workout_plan') {
        if (
          !parsed ||
          parsed.id === 'plan-1' ||
          (Array.isArray(parsed.days) && parsed.days.some((d: any) => d.title?.includes('Push Day') || d.title?.includes('Pull Day')))
        ) {
          localStorage.removeItem('hercules_v3_workout_plan');
          return fallback;
        }
      }

      // Purge legacy mock diet data
      if (key === 'diet_plan') {
        if (
          !parsed ||
          parsed.id === 'diet-1' ||
          parsed.daily_calories_target === 2450 ||
          (Array.isArray(parsed.meals) && parsed.meals.some((m: any) => m.meal_type === 'Breakfast'))
        ) {
          localStorage.removeItem('hercules_v3_diet_plan');
          return fallback;
        }
      }

      return parsed;
    } catch {
      return fallback;
    }
  };

  const saveLocal = <T,>(key: string, val: T) => {
    try {
      localStorage.setItem(`hercules_v3_${key}`, JSON.stringify(val));
    } catch (e) {
      console.error(e);
    }
  };

  // Evaluation for exact term month 1st overdue -> Auto Inactivity
  const evaluateMemberInactivity = (userList: User[]): User[] => {
    const now = new Date();

    return userList.map(u => {
      if (u.role !== 'member') return u;

      if (u.membership?.start_date) {
        const expiryDate = calculateMemberTermExpiry(u.membership.start_date, u.membership.plan_duration || 'monthly');
        const isPastDue = now >= expiryDate;

        if (isPastDue) {
          return {
            ...u,
            is_active: false,
            membership: {
              ...u.membership,
              end_date: expiryDate.toISOString().slice(0, 10),
              status: 'expired' as const,
            },
          };
        }
      }
      return u;
    });
  };

  const INITIAL_OFFERS: OfferPlan[] = [];

  // State initialization - no hardcoded mock users
  const [users, setUsers] = useState<User[]>(() => {
    const loaded = loadLocal('users', INITIAL_USERS);
    return evaluateMemberInactivity(loaded);
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadLocal<User | null>('current_user', null));
  const [offers, setOffers] = useState<OfferPlan[]>(() => loadLocal('offers', INITIAL_OFFERS));

  // Safe hash-based MPA router initialization
  const getInitialTab = (): string => {
    try {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      return hash || 'dashboard';
    } catch {
      return 'dashboard';
    }
  };

  const [selectedCenter, setSelectedCenter] = useState<CenterType | 'All'>('All');
  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  const isShopRoute = (tab: string) => tab === 'shop' || tab === 'shop/cart' || tab === 'cart';

  // Navigation sidebar collapse state: collapsed by default on shop/supplements or mobile, open by default on other desktop views
  const [isNavOpen, setIsNavOpen] = useState<boolean>(() => !isShopRoute(getInitialTab()));

  // Auto-collapse navigation menu when entering shop and supplements so product cards get full horizontal space
  useEffect(() => {
    if (isShopRoute(activeTab)) {
      setIsNavOpen(false);
    }
  }, [activeTab]);

  const toggleNav = () => {
    setIsNavOpen(prev => !prev);
  };

  // Sync activeTab with URL hash for MPA experience & back/forward history navigation
  useEffect(() => {
    const handleHashAndPopState = () => {
      try {
        const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
        const tab = rawHash || 'dashboard';
        setActiveTabState(tab);
      } catch (e) {
        console.error('Hash route parse error:', e);
      }
    };

    window.addEventListener('hashchange', handleHashAndPopState);
    window.addEventListener('popstate', handleHashAndPopState);

    // If initial load has no hash, establish #/dashboard in history
    if (!window.location.hash || window.location.hash === '#') {
      window.history.replaceState(null, '', '#/dashboard');
    }

    return () => {
      window.removeEventListener('hashchange', handleHashAndPopState);
      window.removeEventListener('popstate', handleHashAndPopState);
    };
  }, []);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    const targetHash = `#/${tab}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
  };

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadLocal('attendance', INITIAL_ATTENDANCE));
  const [products, setProducts] = useState<MerchandiseItem[]>(() => loadLocal('products', INITIAL_PRODUCTS));
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => loadLocal('catalog', INITIAL_CATALOG));
  const [cart, setCart] = useState<CartItem[]>(() => loadLocal('cart', []));
  const [orders, setOrders] = useState<Order[]>(() => loadLocal('orders', INITIAL_ORDERS));
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadLocal('messages', INITIAL_MESSAGES));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => loadLocal('announcements', INITIAL_ANNOUNCEMENTS));
  const [payments, setPayments] = useState<PaymentRecord[]>(() => loadLocal('payments', INITIAL_PAYMENTS));
  const [refunds, setRefunds] = useState<RefundRecord[]>(() => loadLocal('refunds', []));
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>(() => loadLocal('workout_plan', INITIAL_WORKOUT_PLAN));
  const [dietPlan, setDietPlan] = useState<DietPlan>(() => loadLocal('diet_plan', INITIAL_DIET_PLAN));
  const [fitnessMetrics, setFitnessMetrics] = useState<FitnessMetricEntry[]>(() => loadLocal('metrics', INITIAL_METRICS));
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogEntry[]>(() => loadLocal('workout_logs', []));

  const [theme, setTheme] = useState<'dark' | 'light'>(() => loadLocal('theme', 'dark'));
  const [language, setLanguageState] = useState<Language>(() => loadLocal('language', 'en'));
  const [environmentMode, setEnvironmentModeState] = useState<EnvironmentMode>(() => loadLocal<EnvironmentMode>('environment_mode', 'auto'));

  // Auto Member ID Counter Engine
  // Stores monotonic sequential counters for branch and programme categories (e.g., RG-GYM: 1, CD-KRT: 1)
  const [memberCounters, setMemberCounters] = useState<Record<string, number>>(() => {
    return loadLocal<Record<string, number>>('member_counters', {
      'RG-GYM': 1,
      'RG-KRT': 1,
      'RG-YGA': 1,
      'RG-CRF': 1,
      'RG-KID': 1,
      'CD-GYM': 1,
      'CD-KRT': 1,
      'CD-YGA': 1,
      'CD-CRF': 1,
      'CD-KID': 1,
      'MD-GYM': 1,
      'MD-KRT': 1,
      'MD-YGA': 1,
      'MD-CRF': 1,
      'MD-KID': 1,
    });
  });

  useEffect(() => {
    saveLocal('member_counters', memberCounters);
  }, [memberCounters]);

  const getNextMemberId = useCallback(
    (center?: CenterType | string, prog?: EnrollmentProgramme | string): string => {
      const branch = getBranchCode(center || selectedCenter || 'Ranaghat');
      const programme = getProgrammeCode(prog || 'Gym');
      const key = `${branch}-${programme}`;
      const currentVal = memberCounters[key] ?? 1;
      return formatMemberId(branch, programme, currentVal);
    },
    [memberCounters, selectedCenter]
  );

  const incrementMemberCounter = useCallback(
    (center?: CenterType | string, prog?: EnrollmentProgramme | string) => {
      const branch = getBranchCode(center || selectedCenter || 'Ranaghat');
      const programme = getProgrammeCode(prog || 'Gym');
      const key = `${branch}-${programme}`;
      setMemberCounters((prev) => {
        const current = prev[key] ?? 1;
        const updated = {
          ...prev,
          [key]: current + 1,
        };
        saveLocal('member_counters', updated);
        return updated;
      });
    },
    [selectedCenter]
  );

  const setEnvironmentMode = (mode: EnvironmentMode) => {
    setEnvironmentModeState(mode);
    saveLocal('environment_mode', mode);
  };

  const currentAtmosphere = getEnvironmentalAtmosphere(environmentMode);

  // Sync / Connection state
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Branch isolation: lock non-admin users to their assigned center
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      setSelectedCenter(currentUser.center);
    }
  }, [currentUser]);

  const handleSetSelectedCenter = (center: CenterType | 'All') => {
    if (currentUser && currentUser.role !== 'admin') {
      setSelectedCenter(currentUser.center);
    } else {
      setSelectedCenter(center);
    }
  };

  // Sync to local storage
  useEffect(() => { saveLocal('users', users); }, [users]);
  useEffect(() => { saveLocal('current_user', currentUser); }, [currentUser]);
  useEffect(() => { saveLocal('attendance', attendance); }, [attendance]);
  useEffect(() => { saveLocal('products', products); }, [products]);
  useEffect(() => { saveLocal('cart', cart); }, [cart]);
  useEffect(() => { saveLocal('orders', orders); }, [orders]);
  useEffect(() => { saveLocal('messages', messages); }, [messages]);
  useEffect(() => { saveLocal('announcements', announcements); }, [announcements]);
  useEffect(() => { saveLocal('payments', payments); }, [payments]);
  useEffect(() => { saveLocal('offers', offers); }, [offers]);
  useEffect(() => { saveLocal('refunds', refunds); }, [refunds]);
  useEffect(() => { saveLocal('workout_plan', workoutPlan); }, [workoutPlan]);
  useEffect(() => { saveLocal('diet_plan', dietPlan); }, [dietPlan]);
  useEffect(() => { saveLocal('metrics', fitnessMetrics); }, [fitnessMetrics]);
  useEffect(() => { saveLocal('workout_logs', workoutLogs); }, [workoutLogs]);
  useEffect(() => { saveLocal('theme', theme); }, [theme]);
  useEffect(() => { saveLocal('language', language); }, [language]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  const setLanguage = (lang: Language) => setLanguageState(lang);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  // Sync with MongoDB Atlas through live backend
  const syncWithBackend = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch live members & profiles
      try {
        const liveMembers = await webApi.getMembers();
        if (Array.isArray(liveMembers)) {
          const normalized = liveMembers.map((m: any) => ({
            id: m.id || m._id,
            member_id: m.member_id || m.admission_number || m.memberId,
            email: m.email || '',
            phone: m.phone || '',
            full_name: m.full_name || 'Member',
            role: m.role || 'member',
            center: m.center || 'Ranaghat',
            date_of_birth: m.date_of_birth,
            created_at: m.created_at || new Date().toISOString(),
            is_active: m.is_active ?? true,
            approval_status: m.approval_status || 'approved',
            profile_image: m.profile_image,
            is_primary_admin: m.is_primary_admin,
            achievements: m.achievements || [],
            assigned_trainer_id: m.assigned_trainer_id,
            admission_type: m.admission_type,
            guardian_name: m.guardian_name,
            guardian_phone: m.guardian_phone,
            profession: m.profession,
            present_address: m.present_address || m.address,
            permanent_address: m.permanent_address,
            body_weight: m.body_weight,
            body_height: m.body_height,
            health_problems: m.health_problems || m.medical_notes,
            enrollment_programme: m.enrollment_programme || m.programme,
            enrollment_category: m.enrollment_category || m.category,
            trainer_specialties: m.trainer_specialties || m.specialties,
            trainer_certifications: m.trainer_certifications || m.certifications,
            trainer_experience: m.trainer_experience || m.experience,
            membership: m.membership,
          }));
          setUsers(normalized);
          setBackendConnected(true);
        }
      } catch (e) {
        console.log('Backend members fetch notice:', e);
      }

      // 2. Fetch live attendance records
      try {
        const liveAtt = await webApi.getTodayAttendance();
        if (Array.isArray(liveAtt)) {
          const normalizedAtt = liveAtt.map((a: any) => ({
            id: a.id || a._id,
            user_id: a.user_id,
            user_name: a.user_name || a.member_name || 'Member',
            user_role: a.user_role || 'member',
            center: a.center || 'Ranaghat',
            date: a.date || a.check_in_time?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            check_in_time: a.check_in_time || new Date().toISOString(),
            check_out_time: a.check_out_time,
            method: a.method || 'manual',
            duration_minutes: a.duration_minutes,
          }));
          setAttendance(normalizedAtt);
          setBackendConnected(true);
        }
      } catch (e) {
        console.log('Attendance fetch notice:', e);
      }

      // 3. Fetch announcements
      try {
        const liveAnn = await webApi.getAnnouncements();
        if (Array.isArray(liveAnn)) {
          setAnnouncements(liveAnn);
        }
      } catch {}

      // 4. Fetch merchandise catalog
      try {
        const liveProd = await webApi.getMerchandise();
        if (Array.isArray(liveProd)) {
          const normalizedProd: MerchandiseItem[] = liveProd.map((p: any) => {
            const isSupp = p.category === 'Supplements' || p.category?.toLowerCase() === 'supplements';
            let flavours = p.flavours;
            let sizes = p.sizes;

            if (isSupp) {
              sizes = [];
              if (!flavours || !Array.isArray(flavours) || flavours.length === 0 || flavours.every((f: string) => ['S', 'M', 'L', 'XL', 'XXL', 'XS'].includes(f))) {
                if (p.flavours_or_choices && Array.isArray(p.flavours_or_choices) && !p.flavours_or_choices.every((f: string) => ['S', 'M', 'L', 'XL'].includes(f))) {
                  flavours = p.flavours_or_choices;
                } else if (p.name?.toLowerCase().includes('tiger') || p.name?.toLowerCase().includes('pre')) {
                  flavours = ['Fruit Punch', 'Watermelon Blast', 'Blue Raspberry'];
                } else {
                  flavours = ['Double Rich Chocolate', 'Vanilla Ice Cream', 'Café Mocha'];
                }
              }
            } else {
              flavours = [];
              if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
                sizes = p.flavours_or_choices || ['S', 'M', 'L', 'XL'];
              }
            }

            return {
              ...p,
              id: p.id || p._id || `prod-${Math.random()}`,
              category: p.category || 'Supplements',
              flavours: isSupp ? flavours : undefined,
              sizes: !isSupp ? sizes : undefined,
              available_centers: p.available_centers || ['All'],
            };
          });
          setProducts(normalizedProd);
        }
      } catch {}

      // 5. Fetch Master Catalog
      try {
        const liveCatalog = await webApi.getMasterCatalog();
        if (Array.isArray(liveCatalog) && liveCatalog.length > 0) {
          const normalizedCat = liveCatalog.map((c: any) => ({
            ...c,
            id: c.id || c._id || `cat-${Math.random()}`,
            variants: c.variants || (c.category === 'Supplements' ? ['Double Rich Chocolate', 'Vanilla Ice Cream'] : ['S', 'M', 'L', 'XL']),
          }));
          setCatalog(normalizedCat);
        }
      } catch (catErr) {
        console.log('Catalog sync note:', catErr);
      }

      // 6. Fetch workout logs
      try {
        const liveLogs = await webApi.getWorkoutLogs();
        if (Array.isArray(liveLogs)) {
          setWorkoutLogs(liveLogs);
        }
      } catch {}

      setBackendConnected(true);
    } catch (err) {
      console.warn('Backend sync note:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Validate active auth token on startup & sync with MongoDB Atlas
  useEffect(() => {
    const token = webApi.getToken();
    if (token) {
      webApi
        .getMe()
        .then((res: any) => {
          if (res && res.id) {
            const liveUser: User = {
              id: res.id,
              email: res.email || '',
              phone: res.phone || '',
              full_name: res.full_name || 'Member',
              role: res.role || 'member',
              center: res.center || 'Ranaghat',
              created_at: res.created_at || new Date().toISOString(),
              is_active: res.is_active ?? true,
              approval_status: res.approval_status || 'approved',
              profile_image: res.profile_image,
              is_primary_admin: res.is_primary_admin,
              achievements: res.achievements,
              assigned_trainer_id: res.assigned_trainer_id,
              membership: res.membership,
            };
            setCurrentUser(liveUser);
            setBackendConnected(true);
          }
        })
        .catch(() => {
          // Token expired or invalid
          webApi.setToken(null);
          setCurrentUser(null);
        });
    }

    syncWithBackend();
    const interval = setInterval(syncWithBackend, 30000);
    return () => clearInterval(interval);
  }, [syncWithBackend]);

  // Auth Operations matching Mobile Version with offline/demo fallback
  const login = async (identifier: string, pass: string): Promise<boolean> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/\D/g, '').slice(-10);

    // 1. Try Live Backend (if active and reachable)
    try {
      const authRes = await webApi.login(identifier, pass);
      if (authRes?.user) {
        const liveUser: User = {
          id: authRes.user.id,
          email: authRes.user.email || '',
          phone: authRes.user.phone || '',
          full_name: authRes.user.full_name || 'Member',
          role: authRes.user.role || 'member',
          center: authRes.user.center || 'Ranaghat',
          created_at: authRes.user.created_at || new Date().toISOString(),
          is_active: authRes.user.is_active ?? true,
          approval_status: authRes.user.approval_status || 'approved',
          profile_image: authRes.user.profile_image,
          is_primary_admin: authRes.user.is_primary_admin,
          achievements: authRes.user.achievements,
          assigned_trainer_id: authRes.user.assigned_trainer_id,
          membership: authRes.user.membership,
        };
        setCurrentUser(liveUser);
        setBackendConnected(true);
        await syncWithBackend();
        return true;
      }
    } catch (err: any) {
      console.warn('Live backend unreachable, falling back to local credentials:', err?.message);
    }

    // 2. Fallback to Local Database if backend unreachable
    const matchedUser = users.find(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uPhone = (u.phone || '').replace(/\D/g, '').slice(-10);
      const uMemId = (u.member_id || '').toLowerCase();

      return (
        uEmail === cleanId ||
        (cleanPhone.length >= 8 && uPhone.endsWith(cleanPhone)) ||
        uMemId === cleanId
      );
    });

    if (matchedUser) {
      setCurrentUser(matchedUser);
      return true;
    }

    // 3. Fallback for Quick Demo Logins (Admin, Trainer, Member)
    if (cleanId === 'admin@herculesgym.in' || cleanId === 'admin') {
      const adminUser: User = {
        id: 'user-admin-1',
        email: 'admin@herculesgym.in',
        phone: '+91 98300 11223',
        full_name: 'Sourav Ghosh (Admin)',
        role: 'admin',
        center: 'Ranaghat',
        created_at: new Date().toISOString(),
        is_active: true,
        approval_status: 'approved',
        is_primary_admin: true,
        member_id: 'HG-ADMIN-001',
      };
      setCurrentUser(adminUser);
      return true;
    } else if (cleanId === 'trainer@herculesgym.in' || cleanId === 'trainer') {
      const trainerUser: User = {
        id: 'user-trainer-1',
        email: 'trainer@herculesgym.in',
        phone: '+91 98300 44556',
        full_name: 'Rajesh Trainer',
        role: 'trainer',
        center: 'Ranaghat',
        created_at: new Date().toISOString(),
        is_active: true,
        approval_status: 'approved',
        member_id: 'HG-TRN-001',
        trainer_specialties: ['Strength', 'Hypertrophy', 'Diet'],
      };
      setCurrentUser(trainerUser);
      return true;
    } else if (cleanId === 'member@herculesgym.in' || cleanId === 'member') {
      const memberUser: User = {
        id: 'user-member-1',
        email: 'member@herculesgym.in',
        phone: '+91 98300 77889',
        full_name: 'Rounak Saha (Member)',
        role: 'member',
        center: 'Ranaghat',
        created_at: new Date().toISOString(),
        is_active: true,
        approval_status: 'approved',
        member_id: 'HG-RAN-1001',
        membership: {
          plan_name: 'Quarterly Strength Blast',
          start_date: '2026-01-01',
          end_date: '2026-12-31',
          status: 'active',
          fee_paid: 1500,
          due_amount: 0,
        },
      };
      setCurrentUser(memberUser);
      return true;
    }

    throw new Error('Invalid credentials. Please verify your email or phone number.');
  };

  const register = async (data: Partial<User> & { password?: string }) => {
    try {
      const res = await webApi.register({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role || 'member',
        center: data.center || 'Ranaghat',
        date_of_birth: data.date_of_birth,
        profile_image: data.profile_image,
        member_id: data.member_id,
        admission_type: data.admission_type,
        guardian_name: data.guardian_name,
        guardian_phone: data.guardian_phone,
        profession: data.profession,
        present_address: data.present_address,
        permanent_address: data.permanent_address,
        body_weight: data.body_weight,
        body_height: data.body_height,
        health_problems: data.health_problems,
        enrollment_programme: data.enrollment_programme,
        enrollment_category: data.enrollment_category,
        trainer_specialties: data.trainer_specialties,
        trainer_certifications: data.trainer_certifications,
        trainer_experience: data.trainer_experience,
      });
      setBackendConnected(true);
      await syncWithBackend();
      return res;
    } catch (err: any) {
      console.warn('Backend register offline, creating user locally:', err?.message);
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: data.email || '',
        phone: data.phone || '',
        full_name: data.full_name || 'Member',
        role: data.role || 'member',
        center: data.center || 'Ranaghat',
        created_at: new Date().toISOString(),
        is_active: true,
        approval_status: 'approved',
        profile_image: data.profile_image,
        member_id: data.member_id || `HG-${(data.center || 'RAN').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        admission_type: data.admission_type,
        profession: data.profession,
        present_address: data.present_address,
        permanent_address: data.permanent_address,
        body_weight: data.body_weight,
        body_height: data.body_height,
        health_problems: data.health_problems,
        enrollment_programme: data.enrollment_programme,
        enrollment_category: data.enrollment_category,
        membership: {
          plan_name: 'Monthly Standard',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          status: 'active',
          fee_paid: 800,
          due_amount: 0,
        },
      };
      setUsers(prev => [newUser, ...prev]);
      setCurrentUser(newUser);
      return { message: 'Registered successfully', user: newUser };
    }
  };

  const logout = () => {
    webApi.logout();
    setCurrentUser(null);
  };

  const switchDemoUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      await webApi.approveRequest(userId);
      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, approval_status: 'approved' as const, is_active: true } : u
        )
      );
      setBackendConnected(true);
      await syncWithBackend();
    } catch (e: any) {
      console.error('Backend approval error:', e);
      throw e;
    }
  };

  const rejectUser = async (userId: string, reason?: string) => {
    try {
      await webApi.rejectRequest(userId, reason);
      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, approval_status: 'rejected' as const, is_active: false } : u
        )
      );
      setBackendConnected(true);
      await syncWithBackend();
    } catch (e: any) {
      console.error('Backend rejection error:', e);
      throw e;
    }
  };

  const updateUserProfile = (userId: string, data: Partial<User>) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, ...data } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser(prev => (prev ? { ...prev, ...data } : null));
    }
    webApi.updateMember(userId, data).catch((e: any) => console.log('Update profile backend sync:', e));
  };

  const addUser = (userData: Partial<User>) => {
    const newId = userData.id || `user-${Date.now()}`;
    const centerPrefix = userData.center ? userData.center.slice(0, 3).toUpperCase() : 'RAN';
    const autoMemberId = userData.member_id || `HG-${centerPrefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newUser: User = {
      id: newId,
      member_id: autoMemberId,
      email: userData.email || `${userData.phone || newId}@herculesgym.in`,
      phone: userData.phone || '',
      full_name: userData.full_name || 'Member',
      role: userData.role || 'member',
      center: userData.center || 'Ranaghat',
      date_of_birth: userData.date_of_birth,
      created_at: new Date().toISOString(),
      is_active: true,
      approval_status: 'approved',
      profile_image: userData.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      admission_type: userData.admission_type || 'New Admission',
      guardian_name: userData.guardian_name,
      guardian_phone: userData.guardian_phone,
      profession: userData.profession,
      present_address: userData.present_address,
      permanent_address: userData.permanent_address,
      body_weight: userData.body_weight,
      body_height: userData.body_height,
      health_problems: userData.health_problems,
      enrollment_programme: userData.enrollment_programme || (userData.role === 'trainer' ? undefined : 'Gym'),
      enrollment_category: userData.enrollment_category || (userData.role === 'trainer' ? undefined : 'Ladies & Gents'),
      trainer_specialties: userData.trainer_specialties,
      trainer_certifications: userData.trainer_certifications,
      trainer_experience: userData.trainer_experience,
      membership: userData.membership || (userData.role === 'trainer' ? undefined : {
        plan_name: `${userData.enrollment_programme || 'Gym'} Membership`,
        plan_duration: 'monthly',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'active',
        fee_paid: 1900,
        due_amount: 0,
      }),
      ...userData,
    };

    setUsers(prev => [newUser, ...prev]);

    webApi.createMember({
      ...userData,
      member_id: autoMemberId,
      date_of_birth: userData.date_of_birth || '2000-01-01',
    }).then(() => {
      syncWithBackend();
    }).catch((e: any) => console.log('Add member backend sync:', e));
  };

  const deleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
    try {
      await webApi.deleteMember?.(userId);
      setBackendConnected(true);
      await syncWithBackend();
    } catch (e: any) {
      console.log('Member delete sync notice:', e?.message);
    }
  };

  const refundMember = (refundData: Omit<RefundRecord, 'id' | 'refund_date' | 'status'>): RefundRecord => {
    const refundRecord: RefundRecord = {
      ...refundData,
      id: `ref-${Date.now()}`,
      refund_date: new Date().toISOString(),
      status: 'approved',
    };

    setRefunds(prev => [refundRecord, ...prev]);

    // Update user record with refund notification receipt and deactivate membership
    setUsers(prev =>
      prev.map(u => {
        if (u.id === refundData.user_id) {
          return {
            ...u,
            refund_record: refundRecord,
            membership: u.membership
              ? {
                  ...u.membership,
                  status: 'expired' as const,
                  due_amount: 0,
                }
              : undefined,
          };
        }
        return u;
      })
    );

    if (currentUser?.id === refundData.user_id) {
      setCurrentUser(prev =>
        prev
          ? {
              ...prev,
              refund_record: refundRecord,
              membership: prev.membership
                ? {
                    ...prev.membership,
                    status: 'expired' as const,
                    due_amount: 0,
                  }
                : undefined,
            }
          : null
      );
    }

    return refundRecord;
  };

  // Attendance
  const todayStr = new Date().toISOString().slice(0, 10);
  const activeCheckIn = attendance.find(
    a => a.user_id === currentUser?.id && a.date === todayStr && !a.check_out_time
  ) || null;

  const isCheckedIn = Boolean(activeCheckIn);

  const checkIn = async (center: CenterType, method: 'qr_scanner' | 'admin_scan' | 'manual' | 'geofence' = 'qr_scanner') => {
    if (!currentUser || isCheckedIn) return;

    try {
      await webApi.checkIn({
        center: center || currentUser.center,
        method,
        user_id: currentUser.id,
      });
      setBackendConnected(true);
      await syncWithBackend();
    } catch (e: any) {
      console.error('Check-in error:', e);
      throw e;
    }
  };

  const checkOut = async () => {
    if (!activeCheckIn || !currentUser) return;
    try {
      await webApi.checkOut(currentUser.id);
      setBackendConnected(true);
      await syncWithBackend();
    } catch (e: any) {
      console.error('Checkout error:', e);
      throw e;
    }
  };

  const manualCheckIn = async (userId: string, center: CenterType) => {
    try {
      await webApi.checkIn({
        user_id: userId,
        center,
        method: 'admin_scan',
      });
      setBackendConnected(true);
      await syncWithBackend();
    } catch (e: any) {
      console.error('Manual checkin error:', e);
      throw e;
    }
  };

  // Workout & Diet
  const saveWorkoutPlan = (plan: WorkoutPlan) => {
    setWorkoutPlan(plan);
  };

  const saveDietPlan = (plan: DietPlan) => {
    setDietPlan(plan);
  };

  const addFitnessMetric = (metric: Omit<FitnessMetricEntry, 'id'>) => {
    const newEntry: FitnessMetricEntry = {
      ...metric,
      id: `met-${Date.now()}`,
    };
    setFitnessMetrics(prev => [...prev, newEntry]);
  };

  // Workout Logger (Mobile Parity)
  const fetchWorkoutLogs = async () => {
    try {
      const data = await webApi.getWorkoutLogs();
      if (Array.isArray(data)) {
        setWorkoutLogs(data);
      }
    } catch (e: any) {
      console.log('Error fetching workout logs', e);
    }
  };

  const logWorkout = async (items: WorkoutLogItem[]) => {
    try {
      await webApi.createWorkoutLog(items);
      setBackendConnected(true);
      await fetchWorkoutLogs();
    } catch (e: any) {
      console.error('Workout log error:', e);
      throw e;
    }
  };

  // AI Assistant (HG.AI)
  const chatWithAi = async (
    msgs: Array<{ role: 'user' | 'assistant'; content: string }>,
    context?: { member_name?: string; branch?: string }
  ): Promise<string> => {
    try {
      const res = await webApi.chatWithAI(msgs, context);
      if (res?.response) {
        setBackendConnected(true);
        return res.response;
      }
    } catch (err: any) {
      console.log('AI backend response notice:', err?.message);
    }

    const lastMsg = msgs[msgs.length - 1]?.content.toLowerCase() || '';
    if (lastMsg.includes('push') || lastMsg.includes('pull') || lastMsg.includes('split')) {
      return `### 🏋️‍♂️ Recommended 3-Day Push-Pull-Legs Split (Hercules Gym)\n\n**Day 1: Push (Chest, Shoulders, Triceps)**\n- Flat Barbell Bench Press: 4 sets x 8-10 reps\n- Incline Dumbbell Press: 3 sets x 10-12 reps\n- Standing Dumbbell Lateral Raises: 4 sets x 15 reps\n- Overhead Rope Tricep Extensions: 3 sets x 12 reps\n\n**Day 2: Pull (Back, Rear Delts, Biceps)**\n- Barbell Lat Pulldowns or Pull-ups: 4 sets x 8-10 reps\n- Seated Cable Rows: 3 sets x 10 reps\n- Face Pulls: 4 sets x 15 reps\n- Incline Dumbbell Bicep Curls: 3 sets x 12 reps\n\n**Day 3: Legs & Abs**\n- Barbell Squats: 4 sets x 8 reps\n- Romanian Deadlifts: 3 sets x 10 reps\n- Leg Press or Walking Lunges: 3 sets x 12 reps per leg\n- Standing Calf Raises: 4 sets x 15 reps\n- Hanging Knee Raises: 3 sets x 15 reps`;
    }
    if (lastMsg.includes('veg') || lastMsg.includes('diet') || lastMsg.includes('protein')) {
      return `### 🥗 High-Protein Vegetarian Meal Blueprint (140g+ Target)\n\n- **Breakfast (8:30 AM)**: 300ml Soy Milk + 1 scoop plant protein or 100g Paneer bhurji with 2 whole wheat rotis + handful of soaked almonds.\n- **Mid-Morning Snack (11:30 AM)**: Sprouted green moong dal salad with chopped cucumbers, tomatoes, lemon juice, and black pepper.\n- **Lunch (1:30 PM)**: 150g Low-fat Paneer curry or Soya chunks curry (50g raw soya chunks) + 1 bowl thick Dal + 1 cup brown rice/2 chapatis + green salad.\n- **Pre-Workout (5:00 PM)**: 1 medium banana + 1 cup black coffee or 2 brown bread slices with 1 tbsp peanut butter.\n- **Dinner (8:30 PM)**: Grilled tofu/paneer stir-fry with broccoli, bell peppers, beans + 1 bowl mixed dal tadka.`;
    }
    return `Hello ${currentUser?.full_name || 'Champion'}! As your HG.AI fitness coach at Hercules Gym, I am fully equipped to customize your training split, calorie deficit, supplement protocol, and recovery strategy. What specific goal are we conquering today?`;
  };

  // Shop & Cart
  const addToCart = (product: MerchandiseItem, quantity = 1, size?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selected_size === size);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.selected_size === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selected_size: size }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  const placeOrder = (paymentMethod: 'upi' | 'cash_at_desk' | 'card'): Order => {
    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const newOrder: Order = {
      id: `ord-${Date.now().toString().slice(-6)}`,
      user_id: currentUser?.id || 'guest',
      user_name: currentUser?.full_name || 'Member',
      center: currentUser?.center || 'Ranaghat',
      items: cart.map(c => ({
        product_id: c.product.id,
        name: c.product.name,
        price: c.product.price,
        quantity: c.quantity,
        size: c.selected_size,
      })),
      total_amount: total,
      status: paymentMethod === 'cash_at_desk' ? 'pending' : 'completed',
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cash_at_desk' ? 'pending' : 'paid',
      created_at: new Date().toISOString(),
    };

    setOrders(prev => [newOrder, ...prev]);
    
    // Decrement inventory stock count for ordered items
    setProducts(prev =>
      prev.map(p => {
        const boughtItem = cart.find(c => c.product.id === p.id);
        if (boughtItem) {
          return { ...p, stock: Math.max(0, p.stock - boughtItem.quantity) };
        }
        return p;
      })
    );

    clearCart();

    webApi.createOrder(newOrder).catch((e: any) => console.log('Order backend sync:', e));
    return newOrder;
  };

  const addProduct = (prod: Omit<MerchandiseItem, 'id'>): MerchandiseItem => {
    const newProd: MerchandiseItem = {
      ...prod,
      id: `prod-${Date.now()}`,
    };
    setProducts(prev => [newProd, ...prev]);
    webApi.createMerchandise(newProd).then(() => {
      syncWithBackend();
    }).catch((e: any) => console.log('Merchandise backend sync:', e));
    return newProd;
  };

  const updateProduct = async (productId: string, data: Partial<MerchandiseItem>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId || (p as any)._id === productId) {
          return { ...p, ...data };
        }
        return p;
      })
    );
    // Update any items in cart referencing this product
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId || (item.product as any)._id === productId) {
          return {
            ...item,
            product: {
              ...item.product,
              ...data,
            },
          };
        }
        return item;
      })
    );
    try {
      await webApi.updateMerchandise(productId, data);
    } catch (e: any) {
      console.log('Update merchandise sync note:', e);
    }
  };

  const deleteProduct = async (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId && (p as any)._id !== productId));
    setCart(prev => prev.filter(item => item.product.id !== productId && (item.product as any)._id !== productId));
    try {
      await webApi.deleteMerchandise(productId);
    } catch (e: any) {
      console.log('Delete merchandise sync note:', e);
    }
  };

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p))
    );
  };

  // Master Catalog Management (Admin only for add/edit/delete)
  const addCatalogItem = async (item: Omit<CatalogItem, 'id' | 'created_at'>): Promise<CatalogItem> => {
    const newCatalogItem: CatalogItem = {
      ...item,
      id: `cat-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setCatalog(prev => [newCatalogItem, ...prev]);
    try {
      const res = await webApi.createCatalogItem(newCatalogItem);
      if (res && res.id) {
        setCatalog(prev => prev.map(c => (c.id === newCatalogItem.id ? { ...c, ...res } : c)));
      }
      syncWithBackend();
    } catch (e: any) {
      console.log('Master Catalog backend sync:', e);
    }
    return newCatalogItem;
  };

  const updateCatalogItem = async (id: string, data: Partial<CatalogItem>) => {
    setCatalog(prev =>
      prev.map(c => {
        if (c.id === id || (c as any)._id === id) {
          return { ...c, ...data };
        }
        return c;
      })
    );
    try {
      await webApi.updateCatalogItem(id, data);
    } catch (e: any) {
      console.log('Update catalog item sync note:', e);
    }
  };

  const deleteCatalogItem = async (id: string) => {
    setCatalog(prev => prev.filter(c => c.id !== id && (c as any)._id !== id));
    try {
      await webApi.deleteCatalogItem(id);
    } catch (e: any) {
      console.log('Delete catalog item sync note:', e);
    }
  };

  // Messages
  const sendMessage = async (content: string, recipientId?: string, channelId?: string) => {
    if (!currentUser || !content.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      sender_role: currentUser.role,
      recipient_id: recipientId,
      channel_id: channelId || (recipientId ? undefined : 'general'),
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);

    if (recipientId) {
      try {
        await webApi.sendMessage(recipientId, content.trim());
      } catch (e: any) {
        console.log('Message backend sync:', e?.message);
      }
    }
  };

  // Announcements
  const createAnnouncement = async (ann: Omit<Announcement, 'id' | 'created_at'>) => {
    try {
      await webApi.createAnnouncement({
        title: ann.title,
        content: ann.content,
        target: ann.target_center,
        category: ann.category,
        is_pinned: ann.is_pinned,
      });
      setBackendConnected(true);
      await syncWithBackend();
    } catch (e: any) {
      console.error('Announcement creation error:', e);
      throw e;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    try {
      await webApi.deleteAnnouncement(id);
      setBackendConnected(true);
      await syncWithBackend();
    } catch (e: any) {
      console.log('Delete announcement error:', e?.message);
    }
  };

  // Payments
  const recordPayment = (p: Omit<PaymentRecord, 'id' | 'receipt_no'>) => {
    const receiptNo = `HG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPay: PaymentRecord = {
      ...p,
      id: `pay-${Date.now()}`,
      receipt_no: receiptNo,
      verification_status: p.verification_status || 'pending_verification',
    };
    setPayments(prev => [newPay, ...prev]);
  };

  const verifyPayment = (paymentId: string, status: 'verified' | 'rejected') => {
    let targetPayment: PaymentRecord | undefined;
    
    setPayments(prev =>
      prev.map(p => {
        if (p.id === paymentId) {
          targetPayment = {
            ...p,
            status: status === 'verified' ? 'paid' : 'pending',
            verification_status: status,
            verified_at: new Date().toISOString(),
            verified_by: currentUser?.full_name || 'Admin',
          };
          return targetPayment;
        }
        return p;
      })
    );

    if (status === 'verified' && targetPayment) {
      const pay = targetPayment;
      const planName = pay.plan_name || 'Monthly Standard';
      const lower = planName.toLowerCase();

      let months = 1;
      let plan_duration: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' = 'monthly';

      if (lower.includes('annual') || lower.includes('year')) {
        months = 12;
        plan_duration = 'annual';
      } else if (lower.includes('half') || lower.includes('semi') || lower.includes('6 month')) {
        months = 6;
        plan_duration = 'semi_annual';
      } else if (lower.includes('quarter') || lower.includes('3 month')) {
        months = 3;
        plan_duration = 'quarterly';
      } else {
        months = 1;
        plan_duration = 'monthly';
      }

      // Plans are strictly effective from the approval date
      const approvalDate = new Date();
      const startDateStr = approvalDate.toISOString().slice(0, 10);
      
      const expiryDate = new Date(approvalDate);
      expiryDate.setMonth(expiryDate.getMonth() + months);
      const endDateStr = expiryDate.toISOString().slice(0, 10);

      const reminderDate = new Date(expiryDate);
      reminderDate.setDate(reminderDate.getDate() - 5);
      const reminderDateStr = reminderDate.toISOString().slice(0, 10);

      const newMembership = {
        plan_name: planName,
        plan_duration,
        start_date: startDateStr,
        end_date: endDateStr,
        status: 'active' as const,
        fee_paid: pay.amount,
        due_amount: 0,
        approved_at: approvalDate.toISOString(),
        reminder_frequency: plan_duration,
        next_reminder_date: reminderDateStr,
      };

      setUsers(prev =>
        prev.map(u => {
          if (u.id === pay.user_id) {
            return {
              ...u,
              membership: newMembership,
            };
          }
          return u;
        })
      );

      if (currentUser?.id === pay.user_id) {
        setCurrentUser(prev => (prev ? { ...prev, membership: newMembership } : null));
      }
    }
  };

  // Offers Management
  const addOffer = (offerData: Omit<OfferPlan, 'id' | 'created_at'>): OfferPlan => {
    const newOffer: OfferPlan = {
      ...offerData,
      id: `off-${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: currentUser?.full_name || 'Admin',
    };
    setOffers(prev => [newOffer, ...prev]);
    return newOffer;
  };

  const updateOffer = (id: string, updates: Partial<OfferPlan>) => {
    setOffers(prev => prev.map(o => (o.id === id ? { ...o, ...updates } : o)));
  };

  const deleteOffer = (id: string) => {
    setOffers(prev => prev.filter(o => o.id !== id));
  };

  const toggleOfferStatus = (id: string) => {
    setOffers(prev => prev.map(o => (o.id === id ? { ...o, is_active: !o.is_active } : o)));
  };

  // Member & Trainer Activation / Inactivation & Re-admission
  const toggleUserActiveStatus = (userId: string, targetStatus?: boolean) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const nextActive = targetStatus !== undefined ? targetStatus : !u.is_active;
          return {
            ...u,
            is_active: nextActive,
          };
        }
        return u;
      })
    );

    if (currentUser?.id === userId) {
      setCurrentUser(prev =>
        prev ? { ...prev, is_active: targetStatus !== undefined ? targetStatus : !prev.is_active } : null
      );
    }
  };

  const executeReAdmission = (
    userId: string,
    reAdmissionData: Partial<User> & { plan_duration?: string; fee_paid?: number; plan_name?: string }
  ) => {
    const now = new Date();
    let months = 1;
    if (reAdmissionData.plan_duration === 'annual') months = 12;
    else if (reAdmissionData.plan_duration === 'semi_annual') months = 6;
    else if (reAdmissionData.plan_duration === 'quarterly') months = 3;

    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + months);

    const updatedMembership = {
      plan_name: reAdmissionData.plan_name || `${reAdmissionData.enrollment_programme || 'Gym'} Membership`,
      plan_duration: (reAdmissionData.plan_duration as any) || 'monthly',
      start_date: now.toISOString().slice(0, 10),
      end_date: expiryDate.toISOString().slice(0, 10),
      status: 'active' as const,
      fee_paid: reAdmissionData.fee_paid || 1900,
      due_amount: 0,
      approved_at: now.toISOString(),
      reminder_frequency: (reAdmissionData.plan_duration as any) || 'monthly',
      next_reminder_date: expiryDate.toISOString().slice(0, 10),
    };

    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            ...reAdmissionData,
            admission_type: 'Re-admission',
            is_active: true,
            approval_status: 'approved',
            membership: updatedMembership,
            refund_record: undefined, // Clear discharge if re-admitted
          };
        }
        return u;
      })
    );

    const target = users.find(u => u.id === userId);
    if (target) {
      recordPayment({
        user_id: target.id,
        user_name: target.full_name,
        center: target.center,
        plan_name: `[Re-admission] ${updatedMembership.plan_name}`,
        amount: reAdmissionData.fee_paid || 1900,
        payment_date: now.toISOString().slice(0, 10),
        due_date: expiryDate.toISOString().slice(0, 10),
        status: 'paid',
        payment_method: 'UPI',
        verification_status: 'verified',
        verified_at: now.toISOString(),
        verified_by: currentUser?.full_name || 'Admin',
      });
    }
  };

  const adminRegisterPayment = (params: {
    userId: string;
    category: 'gym_fees' | 'gym_item' | 'others';
    paymentMode: 'online' | 'offline';
    moneyPaid: number;
    reason: string;
    note?: string;
    orderId?: string;
  }): PaymentRecord => {
    const targetUser = users.find(u => u.id === params.userId);
    const receiptNo = `HG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    let normalAmount = 0;
    let fineAmount = 0;
    let planName = params.reason;

    if (params.category === 'gym_fees' && targetUser) {
      const planDuration = targetUser.membership?.plan_duration || 'monthly';
      const normalFee = getPlanStandardFee(targetUser.membership?.plan_name || planDuration);
      planName = targetUser.membership?.plan_name || `${planDuration.toUpperCase()} Gym Membership`;

      if (params.moneyPaid <= normalFee) {
        normalAmount = params.moneyPaid;
        fineAmount = 0;
      } else {
        normalAmount = normalFee;
        fineAmount = params.moneyPaid - normalFee;
      }

      // Calculate new term expiration (1st of next renewal term month)
      const newExpiry = calculateMemberTermExpiry(todayStr, planDuration);
      const newExpiryStr = newExpiry.toISOString().slice(0, 10);

      const updatedMembership = {
        plan_name: planName,
        plan_duration: planDuration,
        start_date: todayStr,
        end_date: newExpiryStr,
        status: 'active' as const,
        fee_paid: normalAmount,
        due_amount: 0,
        approved_at: now.toISOString(),
        reminder_frequency: planDuration,
        next_reminder_date: newExpiryStr,
      };

      setUsers(prev =>
        prev.map(u => {
          if (u.id === params.userId) {
            return {
              ...u,
              is_active: true,
              days_overdue: 0,
              membership: updatedMembership,
            };
          }
          return u;
        })
      );

      if (currentUser?.id === params.userId) {
        setCurrentUser(prev => (prev ? { ...prev, is_active: true, days_overdue: 0, membership: updatedMembership } : null));
      }
    } else if (params.category === 'gym_item') {
      normalAmount = 0;
      fineAmount = 0;
      planName = params.reason || 'Gym Store / Merchandise Item Payment';
      if (params.orderId) {
        setOrders(prev =>
          prev.map(o => (o.id === params.orderId ? { ...o, status: 'completed', payment_status: 'paid' } : o))
        );
      }
    } else {
      // others
      normalAmount = 0;
      fineAmount = 0;
      planName = params.reason || 'Other Revenue / Misc Gym Payment';
    }

    const newPaymentRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      user_id: params.userId,
      user_name: targetUser?.full_name || 'Member',
      center: targetUser?.center || 'Ranaghat',
      plan_name: planName,
      amount: params.moneyPaid,
      normal_amount: normalAmount,
      fine_amount: fineAmount,
      revenue_category: params.category,
      payment_for: params.reason,
      payment_date: todayStr,
      due_date: todayStr,
      status: 'paid',
      payment_method: params.paymentMode === 'online' ? 'UPI' : 'Cash',
      payment_mode: params.paymentMode,
      receipt_no: receiptNo,
      verification_status: 'verified',
      verified_at: now.toISOString(),
      verified_by: currentUser?.full_name || 'Admin',
      offline_note: params.note,
    };

    setPayments(prev => [newPaymentRecord, ...prev]);
    return newPaymentRecord;
  };

  return (
    <GymContext.Provider
      value={{
        currentUser,
        selectedCenter,
        setSelectedCenter: handleSetSelectedCenter,
        activeTab,
        setActiveTab,
        isNavOpen,
        setIsNavOpen,
        toggleNav,
        getCenterTheme: (center) => getCenterTheme(center || selectedCenter, theme),
        backendConnected,
        isSyncing,
        syncWithBackend,
        users,
        login,
        register,
        logout,
        switchDemoUser,
        approveUser,
        rejectUser,
        updateUserProfile,
        addUser,
        deleteUser,
        refundMember,
        refunds,
        attendance,
        checkIn,
        checkOut,
        isCheckedIn,
        activeCheckIn,
        manualCheckIn,
        workoutPlan,
        dietPlan,
        saveWorkoutPlan,
        saveDietPlan,
        fitnessMetrics,
        addFitnessMetric,
        workoutLogs,
        logWorkout,
        fetchWorkoutLogs,
        chatWithAi,
        products,
        catalog,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        orders,
        placeOrder,
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductStock,
        addCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
        messages,
        sendMessage,
        announcements,
        createAnnouncement,
        deleteAnnouncement,
        payments,
        recordPayment,
        verifyPayment,
        adminRegisterPayment,
        calculateMemberDue,
        offers,
        addOffer,
        updateOffer,
        deleteOffer,
        toggleOfferStatus,
        toggleUserActiveStatus,
        executeReAdmission,
        theme,
        toggleTheme,
        language,
        setLanguage,
        t,
        environmentMode,
        setEnvironmentMode,
        currentAtmosphere,
        memberCounters,
        getNextMemberId,
        incrementMemberCounter,
      }}
    >
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
};
