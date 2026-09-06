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

  // Backend Sync Status
  backendConnected: boolean;
  isSyncing: boolean;
  syncWithBackend: () => Promise<void>;

  // Users & Auth
  users: User[];
  login: (identifier: string, pass: string) => Promise<boolean>;
  register: (data: Partial<User> & { password?: string }) => Promise<void>;
  logout: () => void;
  switchDemoUser: (userId: string) => void;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  updateUserProfile: (userId: string, data: Partial<User>) => void;
  addUser: (userData: Partial<User>) => void;

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
  addProduct: (product: Omit<MerchandiseItem, 'id'>) => void;
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

  // Theme & Language
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export const GymProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Safe localStorage helper
  const loadLocal = <T,>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(`hercules_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveLocal = <T,>(key: string, val: T) => {
    try {
      localStorage.setItem(`hercules_${key}`, JSON.stringify(val));
    } catch (e) {
      console.error(e);
    }
  };

  // State initialization
  const [users, setUsers] = useState<User[]>(() => loadLocal('users', INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = loadLocal<User | null>('current_user', null);
    if (saved) return saved;
    return INITIAL_USERS[0];
  });

  const [selectedCenter, setSelectedCenter] = useState<CenterType | 'All'>('All');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadLocal('attendance', INITIAL_ATTENDANCE));
  const [products, setProducts] = useState<MerchandiseItem[]>(() => loadLocal('products', INITIAL_PRODUCTS));
  const [cart, setCart] = useState<CartItem[]>(() => loadLocal('cart', []));
  const [orders, setOrders] = useState<Order[]>(() => loadLocal('orders', INITIAL_ORDERS));
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadLocal('messages', INITIAL_MESSAGES));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => loadLocal('announcements', INITIAL_ANNOUNCEMENTS));
  const [payments, setPayments] = useState<PaymentRecord[]>(() => loadLocal('payments', INITIAL_PAYMENTS));
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>(() => loadLocal('workout_plan', INITIAL_WORKOUT_PLAN));
  const [dietPlan, setDietPlan] = useState<DietPlan>(() => loadLocal('diet_plan', INITIAL_DIET_PLAN));
  const [fitnessMetrics, setFitnessMetrics] = useState<FitnessMetricEntry[]>(() => loadLocal('metrics', INITIAL_METRICS));
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogEntry[]>(() => loadLocal('workout_logs', []));

  const [theme, setTheme] = useState<'dark' | 'light'>(() => loadLocal('theme', 'dark'));
  const [language, setLanguageState] = useState<Language>(() => loadLocal('language', 'en'));

  // Sync / Connection state
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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

  // Sync With Live Backend
  const syncWithBackend = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch live members
      try {
        const liveMembers = await webApi.getMembers();
        if (Array.isArray(liveMembers) && liveMembers.length > 0) {
          setUsers(prev => {
            const map = new Map(prev.map(u => [u.id, u]));
            liveMembers.forEach(m => {
              const existing = map.get(m.id);
              map.set(m.id, {
                ...existing,
                ...m,
                // normalize fields
                role: m.role || existing?.role || 'member',
                approval_status: m.approval_status || existing?.approval_status || 'approved',
                center: m.center || existing?.center || 'Ranaghat',
              });
            });
            return Array.from(map.values());
          });
          setBackendConnected(true);
        }
      } catch (e) {
        console.log('Backend members fetch note:', e);
      }

      // 2. Fetch live attendance
      try {
        const liveAtt = await webApi.getTodayAttendance();
        if (Array.isArray(liveAtt)) {
          setAttendance(prev => {
            const map = new Map(prev.map(a => [a.id, a]));
            liveAtt.forEach((a: any) => {
              map.set(a.id, {
                id: a.id,
                user_id: a.user_id,
                user_name: a.user_name || a.member_name || 'Member',
                user_role: a.user_role || 'member',
                center: a.center || 'Ranaghat',
                date: a.date || a.check_in_time?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                check_in_time: a.check_in_time || new Date().toISOString(),
                check_out_time: a.check_out_time,
                method: a.method || 'manual',
                duration_minutes: a.duration_minutes,
              });
            });
            return Array.from(map.values());
          });
          setBackendConnected(true);
        }
      } catch (e) {
        console.log('Attendance fetch note:', e);
      }

      // 3. Fetch announcements
      try {
        const liveAnn = await webApi.getAnnouncements();
        if (Array.isArray(liveAnn) && liveAnn.length > 0) {
          setAnnouncements(prev => {
            const map = new Map(prev.map(a => [a.id, a]));
            liveAnn.forEach(a => map.set(a.id, a));
            return Array.from(map.values());
          });
        }
      } catch {}

      // 4. Fetch merchandise
      try {
        const liveProd = await webApi.getMerchandise();
        if (Array.isArray(liveProd) && liveProd.length > 0) {
          setProducts(prev => {
            const map = new Map(prev.map(p => [p.id, p]));
            liveProd.forEach(p => map.set(p.id, p));
            return Array.from(map.values());
          });
        }
      } catch {}

      // 5. Fetch workout logs
      try {
        const liveLogs = await webApi.getWorkoutLogs();
        if (Array.isArray(liveLogs) && liveLogs.length > 0) {
          setWorkoutLogs(liveLogs);
        }
      } catch {}

      setBackendConnected(true);
    } catch (err) {
      console.warn('Backend sync deferred (cold-start or offline):', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial load sync
  useEffect(() => {
    syncWithBackend();
    // Refresh periodic check every 30 seconds
    const interval = setInterval(syncWithBackend, 30000);
    return () => clearInterval(interval);
  }, [syncWithBackend]);

  // Auth operations
  const login = async (identifier: string, pass: string): Promise<boolean> => {
    const trimmed = identifier.trim().toLowerCase();

    // 1. Try real live backend login
    try {
      const authRes = await webApi.login(identifier, pass);
      if (authRes?.user) {
        const liveUser: User = {
          id: authRes.user.id,
          email: authRes.user.email || '',
          phone: authRes.user.phone || '',
          full_name: authRes.user.full_name || 'Admin',
          role: authRes.user.role || 'admin',
          center: authRes.user.center || 'Ranaghat',
          created_at: authRes.user.created_at || new Date().toISOString(),
          is_active: authRes.user.is_active ?? true,
          approval_status: authRes.user.approval_status || 'approved',
          profile_image: authRes.user.profile_image,
          is_primary_admin: authRes.user.is_primary_admin,
          achievements: authRes.user.achievements,
        };
        setCurrentUser(liveUser);
        setBackendConnected(true);
        // Sync fresh data after logging in
        syncWithBackend();
        return true;
      }
    } catch (backendErr: any) {
      console.log('Backend login attempt:', backendErr?.message);
    }

    // 2. Local fallback for demo accounts
    const found = users.find(u => u.email.toLowerCase() === trimmed || u.phone.includes(trimmed));
    if (found) {
      if (found.approval_status === 'rejected') {
        alert('Your registration request was rejected. Please contact gym administration.');
        return false;
      }
      setCurrentUser(found);
      return true;
    }

    // 3. Fallback demo user
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: trimmed.includes('@') ? trimmed : `${trimmed}@gmail.com`,
      phone: trimmed,
      full_name: trimmed.split('@')[0],
      role: 'member',
      center: 'Ranaghat',
      created_at: new Date().toISOString(),
      is_active: true,
      approval_status: 'approved',
      membership: {
        plan_name: 'Monthly Pass',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        status: 'active',
        fee_paid: 700,
        due_amount: 0,
      },
    };
    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    return true;
  };

  const register = async (data: Partial<User> & { password?: string }) => {
    // 1. Try real backend register
    try {
      await webApi.register({
        email: data.email || `user${Date.now()}@gmail.com`,
        password: data.password || 'Hercules@123',
        full_name: data.full_name || 'New Member',
        phone: data.phone || '+91 98300 00000',
        role: data.role || 'member',
        center: data.center || 'Ranaghat',
        date_of_birth: data.date_of_birth,
        profile_image: data.profile_image,
      });
      setBackendConnected(true);
    } catch (err: any) {
      console.log('Backend register note:', err?.message);
    }

    // 2. Optimistic local state
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email || `user${Date.now()}@gmail.com`,
      phone: data.phone || '+91 98300 00000',
      full_name: data.full_name || 'New Member',
      role: data.role || 'member',
      center: data.center || 'Ranaghat',
      date_of_birth: data.date_of_birth,
      created_at: new Date().toISOString(),
      is_active: false,
      approval_status: 'pending',
      profile_image: data.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    };
    setUsers(prev => [newUser, ...prev]);
    alert('Registration submitted successfully! Your account is pending admin approval.');
  };

  const logout = () => {
    webApi.setToken(null);
    setCurrentUser(null);
  };

  const switchDemoUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const approveUser = async (userId: string) => {
    // Optimistic UI update
    setUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? {
              ...u,
              approval_status: 'approved' as const,
              is_active: true,
              membership: u.role === 'member' ? {
                plan_name: 'Monthly Pass',
                start_date: new Date().toISOString().slice(0, 10),
                end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                status: 'active' as const,
                fee_paid: 700,
                due_amount: 0,
              } : undefined,
            }
          : u
      )
    );

    // Live backend call
    try {
      await webApi.approveRequest(userId);
      setBackendConnected(true);
    } catch (e: any) {
      console.log('Backend approval sync:', e?.message);
    }
  };

  const rejectUser = async (userId: string) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === userId ? { ...u, approval_status: 'rejected' as const, is_active: false } : u
      )
    );

    try {
      await webApi.rejectRequest(userId);
      setBackendConnected(true);
    } catch (e: any) {
      console.log('Backend rejection sync:', e?.message);
    }
  };

  const updateUserProfile = (userId: string, data: Partial<User>) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, ...data } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser(prev => (prev ? { ...prev, ...data } : null));
    }
    webApi.updateMember(userId, data).catch(e => console.log('Update profile backend sync:', e));
  };

  const addUser = (userData: Partial<User>) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: userData.email || '',
      phone: userData.phone || '',
      full_name: userData.full_name || 'Member',
      role: userData.role || 'member',
      center: userData.center || 'Ranaghat',
      created_at: new Date().toISOString(),
      is_active: true,
      approval_status: 'approved',
      profile_image: userData.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      membership: userData.role === 'member' ? {
        plan_name: 'Monthly Fitness Pass',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        status: 'active',
        fee_paid: 700,
        due_amount: 0,
      } : undefined,
    };
    setUsers(prev => [newUser, ...prev]);
    webApi.createMember(newUser).catch(e => console.log('Add member backend sync:', e));
  };

  // Attendance
  const todayStr = new Date().toISOString().slice(0, 10);
  const activeCheckIn = attendance.find(
    a => a.user_id === currentUser?.id && a.date === todayStr && !a.check_out_time
  ) || null;

  const isCheckedIn = Boolean(activeCheckIn);

  const checkIn = async (center: CenterType, method: 'qr_scanner' | 'admin_scan' | 'manual' | 'geofence' = 'qr_scanner') => {
    if (!currentUser || isCheckedIn) return;

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      user_role: currentUser.role,
      center: center || currentUser.center,
      date: todayStr,
      check_in_time: new Date().toISOString(),
      method,
    };

    setAttendance(prev => [newRecord, ...prev]);

    try {
      await webApi.checkIn({
        center: center || currentUser.center,
        method,
        user_id: currentUser.id,
      });
      setBackendConnected(true);
    } catch (e: any) {
      console.log('Check-in backend sync:', e?.message);
    }
  };

  const checkOut = async () => {
    if (!activeCheckIn) return;
    const now = new Date();
    const checkInTime = new Date(activeCheckIn.check_in_time);
    const duration = Math.round((now.getTime() - checkInTime.getTime()) / (1000 * 60));

    setAttendance(prev =>
      prev.map(a =>
        a.id === activeCheckIn.id
          ? {
              ...a,
              check_out_time: now.toISOString(),
              duration_minutes: Math.max(1, duration),
            }
          : a
      )
    );

    try {
      if (currentUser?.id) {
        await webApi.checkOut(currentUser.id);
      }
    } catch (e: any) {
      console.log('Checkout backend sync:', e?.message);
    }
  };

  const manualCheckIn = async (userId: string, center: CenterType) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      user_id: target.id,
      user_name: target.full_name,
      user_role: target.role,
      center,
      date: todayStr,
      check_in_time: new Date().toISOString(),
      method: 'admin_scan',
    };
    setAttendance(prev => [newRecord, ...prev]);

    try {
      await webApi.checkIn({
        user_id: target.id,
        center,
        method: 'admin_scan',
      });
      setBackendConnected(true);
    } catch (e: any) {
      console.log('Manual checkin backend sync:', e?.message);
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
    const newEntry: WorkoutLogEntry = {
      id: `wl-${Date.now()}`,
      user_id: currentUser?.id,
      created_at: new Date().toISOString(),
      items,
    };
    setWorkoutLogs(prev => [newEntry, ...prev]);

    try {
      await webApi.createWorkoutLog(items);
      setBackendConnected(true);
    } catch (e: any) {
      console.log('Workout log backend sync:', e?.message);
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
      console.log('AI backend response note:', err?.message);
    }

    // Intelligent fallback in case of cold-start or temporary network delay
    const lastMsg = msgs[msgs.length - 1]?.content.toLowerCase() || '';
    if (lastMsg.includes('push') || lastMsg.includes('pull') || lastMsg.includes('split')) {
      return `### 🏋️‍♂️ Recommended 3-Day Push-Pull-Legs Split (Hercules Gym)\n\n**Day 1: Push (Chest, Shoulders, Triceps)**\n- Flat Barbell Bench Press: 4 sets x 8-10 reps (warm up thoroughly)\n- Incline Dumbbell Press: 3 sets x 10-12 reps\n- Standing Dumbbell Lateral Raises: 4 sets x 15 reps\n- Overhead Rope Tricep Extensions: 3 sets x 12 reps\n\n**Day 2: Pull (Back, Rear Delts, Biceps)**\n- Barbell Lat Pulldowns or Pull-ups: 4 sets x 8-10 reps\n- Seated Cable Rows: 3 sets x 10 reps\n- Face Pulls: 4 sets x 15 reps (focus on rotator cuff)\n- Incline Dumbbell Bicep Curls: 3 sets x 12 reps\n\n**Day 3: Legs & Abs**\n- Barbell Squats: 4 sets x 8 reps\n- Romanian Deadlifts: 3 sets x 10 reps\n- Leg Press or Walking Lunges: 3 sets x 12 reps per leg\n- Standing Calf Raises: 4 sets x 15 reps\n- Hanging Knee Raises: 3 sets x 15 reps\n\n*Progressive Overload Rule: Add 1-2.5 kg or 1 rep each week while preserving pristine form!*`;
    }
    if (lastMsg.includes('veg') || lastMsg.includes('diet') || lastMsg.includes('protein')) {
      return `### 🥗 High-Protein Vegetarian Meal Blueprint (140g+ Target)\n\n- **Breakfast (8:30 AM)**: 300ml Soy Milk + 1 scoop plant protein or 100g Paneer bhurji with 2 whole wheat rotis + handful of soaked almonds.\n- **Mid-Morning Snack (11:30 AM)**: Sprouted green moong dal salad with chopped cucumbers, tomatoes, lemon juice, and black pepper.\n- **Lunch (1:30 PM)**: 150g Low-fat Paneer curry or Soya chunks curry (50g raw soya chunks) + 1 bowl thick Dal + 1 cup brown rice/2 chapatis + green salad.\n- **Pre-Workout (5:00 PM)**: 1 medium banana + 1 cup black coffee or 2 brown bread slices with 1 tbsp peanut butter.\n- **Dinner (8:30 PM)**: Grilled tofu/paneer stir-fry with broccoli, bell peppers, beans + 1 bowl mixed dal tadka.\n\n*Hydration Target: 3.5 Liters of water daily.*`;
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
      user_name: currentUser?.full_name || 'Guest User',
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

    setProducts(prev =>
      prev.map(p => {
        const bought = cart.find(c => c.product.id === p.id);
        return bought ? { ...p, stock: Math.max(0, p.stock - bought.quantity) } : p;
      })
    );

    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    webApi.createOrder(newOrder).catch(e => console.log('Order backend sync:', e));
    return newOrder;
  };

  const addProduct = (prod: Omit<MerchandiseItem, 'id'>) => {
    const newProd: MerchandiseItem = {
      ...prod,
      id: `prod-${Date.now()}`,
    };
    setProducts(prev => [newProd, ...prev]);
    webApi.createMerchandise(newProd).catch(e => console.log('Merchandise backend sync:', e));
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
    const newAnn: Announcement = {
      ...ann,
      id: `ann-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setAnnouncements(prev => [newAnn, ...prev]);

    try {
      await webApi.createAnnouncement({
        title: ann.title,
        content: ann.content,
        target: ann.target_center,
        category: ann.category,
        is_pinned: ann.is_pinned,
      });
      setBackendConnected(true);
    } catch (e: any) {
      console.log('Announcement backend sync:', e?.message);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    try {
      await webApi.deleteAnnouncement(id);
    } catch (e: any) {
      console.log('Delete announcement backend sync:', e?.message);
    }
  };

  // Payments
  const recordPayment = (p: Omit<PaymentRecord, 'id' | 'receipt_no'>) => {
    const receiptNo = `HG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPay: PaymentRecord = {
      ...p,
      id: `pay-${Date.now()}`,
      receipt_no: receiptNo,
    };
    setPayments(prev => [newPay, ...prev]);

    setUsers(prev =>
      prev.map(u =>
        u.id === p.user_id
          ? {
              ...u,
              membership: {
                plan_name: p.plan_name,
                start_date: p.payment_date,
                end_date: p.due_date,
                status: 'active',
                fee_paid: p.amount,
                due_amount: 0,
              },
            }
          : u
      )
    );
  };

  return (
    <GymContext.Provider
      value={{
        currentUser,
        selectedCenter,
        setSelectedCenter,
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
        updateProductStock,
        messages,
        sendMessage,
        announcements,
        createAnnouncement,
        deleteAnnouncement,
        payments,
        recordPayment,
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
