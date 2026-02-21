import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { user } = useAuth();
  const { theme } = useTheme();
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
      <View style={[styles.iconContainer, focused && { backgroundColor: theme.primary + '20' }]}>
        <Ionicons name={iconName} size={22} color={focused ? theme.primary : theme.textSecondary} />
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
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => getTabBarIcon('index', focused),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Members',
          tabBarIcon: ({ focused }) => getTabBarIcon('members', focused),
          href: showMembersTab ? '/(tabs)/members' : null,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarIcon: ({ focused }) => getTabBarIcon('approvals', focused),
          href: showApprovalsTab ? '/(tabs)/approvals' : null,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ focused }) => getTabBarIcon('attendance', focused),
        }}
      />
      <Tabs.Screen
        name="merchandise"
        options={{
          title: 'Shop',
          tabBarIcon: ({ focused }) => getTabBarIcon('merchandise', focused),
          href: showMerchandiseTab ? '/(tabs)/merchandise' : null,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused }) => getTabBarIcon('messages', focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => getTabBarIcon('profile', focused),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    padding: 4,
    borderRadius: 10,
  },
});
