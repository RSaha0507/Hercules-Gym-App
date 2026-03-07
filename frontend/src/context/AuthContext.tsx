import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { api, CenterType } from '../services/api';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: 'admin' | 'trainer' | 'member';
  center?: CenterType;
  date_of_birth?: string;
  created_at: string;
  is_active: boolean;
  profile_image?: string;
  is_primary_admin: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  push_token?: string;
  achievements?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  notificationSettings: NotificationSettings;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  updateNotificationSetting: <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: 'admin' | 'trainer' | 'member';
  center?: CenterType;
  date_of_birth?: string;
  profile_image?: string;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  announcements: boolean;
  messages: boolean;
  workoutReminders: boolean;
  paymentReminders: boolean;
  promotions: boolean;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  announcements: true,
  messages: true,
  workoutReminders: true,
  paymentReminders: true,
  promotions: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const NOTIFICATION_SETTINGS_STORAGE_KEY = 'notification_settings';
const MAX_STORED_USER_SIZE_BYTES = 250_000;

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  useEffect(() => {
    (async () => {
      await loadNotificationSettings();
      await loadStoredAuth();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mergeNotificationSettings = (value?: Partial<NotificationSettings> | null): NotificationSettings => ({
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(value || {}),
  });

  const loadNotificationSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<NotificationSettings>;
      setNotificationSettings(mergeNotificationSettings(parsed));
    } catch (error) {
      console.log('Failed to load notification settings:', error);
    }
  };

  const persistNotificationSettings = async (nextSettings: NotificationSettings) => {
    setNotificationSettings(nextSettings);
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
    } catch (error) {
      console.log('Failed to persist notification settings:', error);
    }
  };

  const resolveExpoProjectId = () =>
    Constants.easConfig?.projectId ||
    (Constants.expoConfig as any)?.extra?.eas?.projectId ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  const clearPushTokenInBackend = async () => {
    try {
      await api.updatePushToken('');
      setUser((prev) => (prev ? { ...prev, push_token: '' } : prev));
    } catch (error) {
      console.log('Failed to clear push token in backend:', error);
    }
  };

  const registerForPushNotifications = async () => {
    if (!notificationSettings.pushEnabled) {
      return;
    }

    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      const projectId = resolveExpoProjectId();
      if (!projectId) {
        console.log('EAS projectId not found for push registration');
        return;
      }

      const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });

      // Update push token in backend
      await api.updatePushToken(pushToken.data);
      setUser((prev) => (prev ? { ...prev, push_token: pushToken.data } : prev));
      console.log('Push token registered:', pushToken.data);

      // Android-specific channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E63946',
        });
      }
    } catch (error) {
      console.log('Error registering for push notifications:', error);
    }
  };

  const updateNotificationSetting = async <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) => {
    const nextSettings = {
      ...notificationSettings,
      [key]: value,
    };
    await persistNotificationSettings(nextSettings);

    if (key === 'pushEnabled') {
      if (value) {
        registerForPushNotifications().catch((error) => {
          console.log('Push re-registration failed:', error);
        });
      } else {
        await clearPushTokenInBackend();
      }
    }
  };

  const registerPushInBackground = () => {
    if (!notificationSettings.pushEnabled) {
      return;
    }
    registerForPushNotifications().catch((error) => {
      console.log('Background push registration failed:', error);
    });
  };

  const sanitizeUserForStorage = (userData: User): User => {
    if (!userData?.profile_image) {
      return userData;
    }
    // Avoid persisting large base64 blobs in AsyncStorage which can destabilize startup on some devices.
    if (
      typeof userData.profile_image === 'string' &&
      userData.profile_image.startsWith('data:') &&
      userData.profile_image.length > 4096
    ) {
      return { ...userData, profile_image: '' };
    }
    return userData;
  };

  const setAuthState = (accessToken: string | null, userData: User | null) => {
    setToken(accessToken);
    setUser(userData);
    api.setToken(accessToken);
  };

  const persistAuthState = async (accessToken: string, userData: User) => {
    const safeUser = sanitizeUserForStorage(userData);
    setAuthState(accessToken, safeUser);
    try {
      await AsyncStorage.multiSet([
        ['token', accessToken],
        ['user', JSON.stringify(safeUser)],
      ]);
    } catch (error) {
      console.log('Failed to persist auth state:', error);
    }
  };

  const clearAuthState = async () => {
    setAuthState(null, null);
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
    } catch (error) {
      console.log('Failed to clear auth state:', error);
    }
  };

  const getApiErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.detail || fallback;

  const isTransientApiError = (error: any) => {
    if (!error?.response) return true;
    const statusCode = Number(error.response?.status);
    return [408, 425, 429, 500, 502, 503, 504].includes(statusCode);
  };

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
      ]);
      
      if (storedToken && storedUser) {
        if (storedUser.length > MAX_STORED_USER_SIZE_BYTES) {
          console.log('Stored user payload too large; clearing auth cache');
          await clearAuthState();
          setIsLoading(false);
          api.ping().catch(() => null);
          return;
        }

        let parsedUser: User;
        try {
          parsedUser = sanitizeUserForStorage(JSON.parse(storedUser) as User);
        } catch (parseError) {
          console.log('Stored user payload invalid JSON; clearing auth cache', parseError);
          await clearAuthState();
          setIsLoading(false);
          api.ping().catch(() => null);
          return;
        }

        setAuthState(storedToken, parsedUser);
        setIsLoading(false);
        registerPushInBackground();

        // Refresh auth in background so app opens instantly from cached auth.
        (async () => {
          try {
            const response = await api.getMe();
            setUser(response);
            await AsyncStorage.setItem('user', JSON.stringify(response));
          } catch (error) {
            console.log('Stored session refresh failed:', error);
            if (isTransientApiError(error)) {
              // Keep cached session during temporary backend/database wake-up windows.
              return;
            }
            await clearAuthState();
          }
        })();
        return;
      }

      // Warm backend while user is on auth screen.
      api.ping().catch(() => null);
    } catch (error) {
      console.log('Error loading auth:', error);
    }
    setIsLoading(false);
  };

  const login = async (identifier: string, password: string) => {
    try {
      const response = await api.login(identifier, password);
      const { access_token, user: userData } = response;
      
      await persistAuthState(access_token, userData);
      router.replace('/(tabs)');
      registerPushInBackground();
    } catch (error: any) {
      if (isTransientApiError(error)) {
        throw new Error('Server is waking up. Please try again in a few seconds.');
      }
      throw new Error(getApiErrorMessage(error, 'Login failed'));
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.register(data);
      const { access_token, user: userData } = response;
      
      await persistAuthState(access_token, userData);
      router.replace('/(tabs)');
      registerPushInBackground();
    } catch (error: any) {
      if (isTransientApiError(error)) {
        throw new Error('Server is waking up. Please try again in a few seconds.');
      }
      throw new Error(getApiErrorMessage(error, 'Registration failed'));
    }
  };

  const logout = async () => {
    try {
      await clearPushTokenInBackend();
      setAuthState(null, null);
      router.replace('/(auth)/login');
      AsyncStorage.multiRemove(['token', 'user']).catch((error) => {
        console.log('Failed to clear auth state:', error);
      });
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  const updateUser = (updatedUser: User) => {
    const safeUser = sanitizeUserForStorage(updatedUser);
    setUser(safeUser);
    AsyncStorage.setItem('user', JSON.stringify(safeUser));
  };

  const refreshUser = async () => {
    try {
      const response = await api.getMe();
      const safeUser = sanitizeUserForStorage(response);
      setUser(safeUser);
      await AsyncStorage.setItem('user', JSON.stringify(safeUser));
    } catch (error) {
      console.log('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        notificationSettings,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        updateNotificationSetting,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
