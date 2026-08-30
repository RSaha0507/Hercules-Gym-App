import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

interface GymContextType {
  currentUser: User | null;
  selectedCenter: CenterType | 'All';
  setSelectedCenter: (center: CenterType | 'All') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Users & Auth
  users: User[];
  login: (identifier: string, pass: string) => boolean;
  register: (data: Partial<User> & { password?: string }) => void;
  logout: () => void;
  switchDemoUser: (userId: string) => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  updateUserProfile: (userId: string, data: Partial<User>) => void;
  addUser: (userData: Partial<User>) => void;

  // Attendance
  attendance: AttendanceRecord[];
  checkIn: (center: CenterType, method?: 'qr_scanner' | 'admin_scan' | 'manual' | 'geofence') => void;
  checkOut: () => void;
  isCheckedIn: boolean;
  activeCheckIn: AttendanceRecord | null;
  manualCheckIn: (userId: string, center: CenterType) => void;

  // Workouts & Diet & Metrics
  workoutPlan: WorkoutPlan;
  dietPlan: DietPlan;
  saveWorkoutPlan: (plan: WorkoutPlan) => void;
  saveDietPlan: (plan: DietPlan) => void;
  fitnessMetrics: FitnessMetricEntry[];
  addFitnessMetric: (metric: Omit<FitnessMetricEntry, 'id'>) => void;

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
  sendMessage: (content: string, recipientId?: string, channelId?: string) => void;
  announcements: Announcement[];
  createAnnouncement: (ann: Omit<Announcement, 'id' | 'created_at'>) => void;
  deleteAnnouncement: (id: string) => void;

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

  const [users, setUsers] = useState<User[]>(() => loadLocal('users', INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = loadLocal<User | null>('current_user', null);
    if (saved) return saved;
    // Default to admin Vikram Sen or Member Rounak Saha
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

  const [theme, setTheme] = useState<'dark' | 'light'>(() => loadLocal('theme', 'dark'));
  const [language, setLanguageState] = useState<Language>(() => loadLocal('language', 'en'));

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
  useEffect(() => { saveLocal('theme', theme); }, [theme]);
  useEffect(() => { saveLocal('language', language); }, [language]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  const setLanguage = (lang: Language) => setLanguageState(lang);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  // Auth operations
  const login = (identifier: string, _pass: string): boolean => {
    const trimmed = identifier.trim().toLowerCase();
    const found = users.find(u => u.email.toLowerCase() === trimmed || u.phone.includes(trimmed));
    if (found) {
      if (found.approval_status === 'rejected') {
        alert('Your registration request was rejected. Please contact gym administration.');
        return false;
      }
      setCurrentUser(found);
      return true;
    }
    // Fallback: create or log in demo user
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

  const register = (data: Partial<User> & { password?: string }) => {
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
    // Auto alert
    alert('Registration submitted successfully! Your account is pending admin approval.');
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchDemoUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const approveUser = (userId: string) => {
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
  };

  const rejectUser = (userId: string) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === userId ? { ...u, approval_status: 'rejected' as const, is_active: false } : u
      )
    );
  };

  const updateUserProfile = (userId: string, data: Partial<User>) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, ...data } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser(prev => (prev ? { ...prev, ...data } : null));
    }
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
  };

  // Attendance checking
  const todayStr = new Date().toISOString().slice(0, 10);
  const activeCheckIn = attendance.find(
    a => a.user_id === currentUser?.id && a.date === todayStr && !a.check_out_time
  ) || null;

  const isCheckedIn = Boolean(activeCheckIn);

  const checkIn = (center: CenterType, method: 'qr_scanner' | 'admin_scan' | 'manual' | 'geofence' = 'qr_scanner') => {
    if (!currentUser) return;
    if (isCheckedIn) return;

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
  };

  const checkOut = () => {
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
  };

  const manualCheckIn = (userId: string, center: CenterType) => {
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

    // Deduct stock
    setProducts(prev =>
      prev.map(p => {
        const bought = cart.find(c => c.product.id === p.id);
        return bought ? { ...p, stock: Math.max(0, p.stock - bought.quantity) } : p;
      })
    );

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const addProduct = (prod: Omit<MerchandiseItem, 'id'>) => {
    const newProd: MerchandiseItem = {
      ...prod,
      id: `prod-${Date.now()}`,
    };
    setProducts(prev => [newProd, ...prev]);
  };

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p))
    );
  };

  // Messages
  const sendMessage = (content: string, recipientId?: string, channelId?: string) => {
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
  };

  // Announcements
  const createAnnouncement = (ann: Omit<Announcement, 'id' | 'created_at'>) => {
    const newAnn: Announcement = {
      ...ann,
      id: `ann-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setAnnouncements(prev => [newAnn, ...prev]);
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
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

    // Update user membership
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
