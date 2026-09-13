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
  CartItem,
  Order,
  ChatMessage,
  Announcement,
  PaymentRecord,
  Language,
  WorkoutLogEntry,
  WorkoutLogItem,
  RefundRecord,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_ATTENDANCE,
  INITIAL_PRODUCTS,
  INITIAL_WORKOUT_PLAN,
  INITIAL_DIET_PLAN,
  INITIAL_METRICS,
  INITIAL_MESSAGES,
  INITIAL_PAYMENTS,
  INITIAL_ORDERS,
} from '../data/initialData';
import { translations } from '../utils/translations';
import { webApi } from '../services/api';

interface GymContextType {
  currentUser: User | null;
  selectedCenter: CenterType | 'All';
  setSelectedCenter: (center: CenterType | 'All') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

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

  // Merchandise & Orders
  products: MerchandiseItem[];
  cart: CartItem[];
  addToCart: (product: MerchandiseItem, quantity?: number, size?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  orders: Order[];
  placeOrder: (paymentMethod: 'upi' | 'cash_at_desk' | 'card') => Order;
  addProduct: (product: Omit<MerchandiseItem, 'id'>) => MerchandiseItem;
  updateProduct: (productId: string, data: Partial<MerchandiseItem>) => void;
  deleteProduct: (productId: string) => void;
  updateProductStock: (productId: string, newStock: number) => void;

  // Messages & Announcements
  messages: ChatMessage[];
  sendMessage: (content: string, recipientId?: string, channelId?: string) => Promise<void>;
  announcements: Announcement[];
  createAnnouncement: (ann: Omit<Announcement, 'id' | 'created_at'>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;

  // Payments & Revenues
  payments: PaymentRecord[];
  recordPayment: (payment: Omit<PaymentRecord, 'id' | 'receipt_no'>) => void;
  verifyPayment: (paymentId: string, status: 'verified' | 'rejected') => void;

  // Theme & Language
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export const GymProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Safe localStorage helper with legacy mock data cleanup
  const loadLocal = <T,>(key: string, fallback: T): T => {
    try {
      // Check current v2 storage key first, then fallback to v1
      const stored = localStorage.getItem(`hercules_v2_${key}`) || localStorage.getItem(`hercules_${key}`);
      if (!stored) return fallback;
      const parsed = JSON.parse(stored);

      // Purge legacy mock workout data if present in user browser cache
      if (key === 'workout_plan') {
        if (
          !parsed ||
          parsed.id === 'plan-1' ||
          (Array.isArray(parsed.days) && parsed.days.some((d: any) => d.title?.includes('Push Day') || d.title?.includes('Pull Day')))
        ) {
          localStorage.removeItem('hercules_workout_plan');
          localStorage.removeItem('hercules_v2_workout_plan');
          return fallback;
        }
      }

      // Purge legacy mock diet data if present in user browser cache
      if (key === 'diet_plan') {
        if (
          !parsed ||
          parsed.id === 'diet-1' ||
          parsed.daily_calories_target === 2450 ||
          (Array.isArray(parsed.meals) && parsed.meals.some((m: any) => m.meal_type === 'Breakfast'))
        ) {
          localStorage.removeItem('hercules_diet_plan');
          localStorage.removeItem('hercules_v2_diet_plan');
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
      localStorage.setItem(`hercules_v2_${key}`, JSON.stringify(val));
    } catch (e) {
      console.error(e);
    }
  };

  // State initialization - no hardcoded mock users
  const [users, setUsers] = useState<User[]>(() => loadLocal('users', INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadLocal<User | null>('current_user', null));

  const [selectedCenter, setSelectedCenter] = useState<CenterType | 'All'>('All');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadLocal('attendance', INITIAL_ATTENDANCE));
  const [products, setProducts] = useState<MerchandiseItem[]>(() => loadLocal('products', INITIAL_PRODUCTS));
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
            email: m.email || '',
            phone: m.phone || '',
            full_name: m.full_name || 'Member',
            role: m.role || 'member',
            center: m.center || 'Ranaghat',
            created_at: m.created_at || new Date().toISOString(),
            is_active: m.is_active ?? true,
            approval_status: m.approval_status || 'approved',
            profile_image: m.profile_image,
            is_primary_admin: m.is_primary_admin,
            achievements: m.achievements || [],
            assigned_trainer_id: m.assigned_trainer_id,
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

      // 5. Fetch workout logs
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

  // Auth Operations matching Mobile Version
  const login = async (identifier: string, pass: string): Promise<boolean> => {
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
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      throw err;
    }
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
      });
      setBackendConnected(true);
      await syncWithBackend();
      return res;
    } catch (err: any) {
      console.error('Registration error:', err);
      throw err;
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
    webApi.createMember(userData).then(() => {
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

  const updateProduct = (productId: string, data: Partial<MerchandiseItem>) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, ...data } : p))
    );
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

  return (
    <GymContext.Provider
      value={{
        currentUser,
        selectedCenter,
        setSelectedCenter: handleSetSelectedCenter,
        activeTab,
        setActiveTab,
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
        messages,
        sendMessage,
        announcements,
        createAnnouncement,
        deleteAnnouncement,
        payments,
        recordPayment,
        verifyPayment,
        theme,
        toggleTheme,
        language,
        setLanguage,
        t,
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
