import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightTheme = {
  primary: '#F59E0B',
  primaryDark: '#f5ee36',
  secondary: '#311212fa',
  background: '#F3F4F6',
  surface: '#ecc079c3',
  card: '#6ebbeadc',
  text: '#1e1335',
  textSecondary: '#5a4f66',
  border: '#8580a8',
  success: '#15e95c',
  warning: '#d48d12',
  error: '#dc2727',
  inputBg: '#ECEEF2',
};

const darkTheme = {
  primary: '#8a3636',
  primaryDark: '#eb8b3d',
  secondary: '#353b80',
  background: '#292525',
  surface: '#261414',
  card: '#3b352d',
  text: '#f1eed1',
  textSecondary: '#9CA3AF',
  border: '#2e3126',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  inputBg: '#3a2d35',
};

type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
