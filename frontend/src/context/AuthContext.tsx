import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { api, CenterType } from '../services/api';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: 'admin' | 'trainer' | 'member';
  center?: CenterType;
  created_at: string;
  is_active: boolean;
  profile_image?: string;
  is_primary_admin: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  push_token?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: 'admin' | 'trainer' | 'member';
  center?: CenterType;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  useEffect(() => {
    loadStoredAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerForPushNotifications = async () => {
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

      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: 'hercules-gym', // Replace with your project ID
      });

      // Update push token in backend
      await api.updatePushToken(pushToken.data);
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

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.setToken(storedToken);
        
        // Verify token is still valid
        try {
          const response = await api.getMe();
          setUser(response);
          await AsyncStorage.setItem('user', JSON.stringify(response));
          
          // Register for push notifications
          await registerForPushNotifications();
        } catch {
          // Token invalid, clear storage
          await logout();
        }
      }
    } catch (error) {
      console.log('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      const { access_token, user: userData } = response;
      
      setToken(access_token);
      setUser(userData);
      api.setToken(access_token);
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Register for push notifications
      await registerForPushNotifications();
      
      router.replace('/(tabs)');
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.register(data);
      const { access_token, user: userData } = response;
      
      setToken(access_token);
      setUser(userData);
      api.setToken(access_token);
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Register for push notifications
      await registerForPushNotifications();
      
      router.replace('/(tabs)');
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      api.setToken(null);
      
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      router.replace('/(auth)/login');
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    try {
      const response = await api.getMe();
      setUser(response);
      await AsyncStorage.setItem('user', JSON.stringify(response));
    } catch (error) {
      console.log('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser, refreshUser }}>
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
