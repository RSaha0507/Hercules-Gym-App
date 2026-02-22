import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const getTabBarIcon = (name: string, focused: boolean) => {
    let iconName: keyof typeof Ionicons.glyphMap = 'home';

    switch (name) {
      case 'index':
        iconName = focused ? 'home' : 'home-outline';
        break;
      case 'members':
        iconName = focused ? 'people' : 'people-outline';
        break;
      case 'approvals':
        iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
        break;
      case 'attendance':
        iconName = focused ? 'calendar' : 'calendar-outline';
        break;
      case 'merchandise':
        iconName = focused ? 'shirt' : 'shirt-outline';
        break;
      case 'messages':
        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        break;
      case 'profile':
        iconName = focused ? 'person' : 'person-outline';
        break;
    }

    return (
      <View style={[styles.iconContainer, focused && { backgroundColor: theme.primary }]}>
        <Ionicons name={iconName} size={20} color={focused ? '#FFFFFF' : theme.textSecondary} />
      </View>
    );
  };

  const showMembersTab = user?.role === 'admin' || user?.role === 'trainer';
  const showApprovalsTab = user?.role === 'admin' || user?.role === 'trainer';
  const showMerchandiseTab = user?.role !== 'admin'; // Members and trainers can view/order

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 72 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          marginHorizontal: 12,
          marginBottom: 8,
          borderRadius: 28,
          position: 'absolute',
          shadowColor: '#111827',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('Home'),
          tabBarIcon: ({ focused }) => getTabBarIcon('index', focused),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: t('Members'),
          tabBarIcon: ({ focused }) => getTabBarIcon('members', focused),
          href: showMembersTab ? '/(tabs)/members' : null,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: t('Approvals'),
          tabBarIcon: ({ focused }) => getTabBarIcon('approvals', focused),
          href: showApprovalsTab ? '/(tabs)/approvals' : null,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: t('Attendance'),
          tabBarIcon: ({ focused }) => getTabBarIcon('attendance', focused),
        }}
      />
      <Tabs.Screen
        name="merchandise"
        options={{
          title: t('Shop'),
          tabBarIcon: ({ focused }) => getTabBarIcon('merchandise', focused),
          href: showMerchandiseTab ? '/(tabs)/merchandise' : null,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('Chat'),
          tabBarIcon: ({ focused }) => getTabBarIcon('messages', focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('Profile'),
          tabBarIcon: ({ focused }) => getTabBarIcon('profile', focused),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
