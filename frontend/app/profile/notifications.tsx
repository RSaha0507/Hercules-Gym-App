import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  
  const [settings, setSettings] = useState({
    pushEnabled: true,
    announcements: true,
    messages: true,
    workoutReminders: true,
    paymentReminders: true,
    promotions: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const NotificationItem = ({ 
    icon, 
    title, 
    description, 
    settingKey 
  }: { 
    icon: string; 
    title: string; 
    description: string; 
    settingKey: keyof typeof settings;
  }) => (
    <View style={[styles.item, { backgroundColor: theme.card }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
        <Ionicons name={icon as any} size={22} color={theme.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.itemDescription, { color: theme.textSecondary }]}>{description}</Text>
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={() => toggleSetting(settingKey)}
        trackColor={{ false: theme.border, true: theme.primary + '60' }}
        thumbColor={settings[settingKey] ? theme.primary : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Master Toggle */}
        <View style={[styles.masterToggle, { backgroundColor: theme.primary + '10' }]}>
          <View style={styles.masterContent}>
            <View style={[styles.masterIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="notifications" size={24} color="#FFF" />
            </View>
            <View>
              <Text style={[styles.masterTitle, { color: theme.text }]}>Push Notifications</Text>
              <Text style={[styles.masterDescription, { color: theme.textSecondary }]}>
                {settings.pushEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
          <Switch
            value={settings.pushEnabled}
            onValueChange={() => toggleSetting('pushEnabled')}
            trackColor={{ false: theme.border, true: theme.primary + '60' }}
            thumbColor={settings.pushEnabled ? theme.primary : '#f4f3f4'}
          />
        </View>

        {/* Notification Types */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Notification Types</Text>
        
        <NotificationItem
          icon="megaphone-outline"
          title="Announcements"
          description="Gym updates and important news"
          settingKey="announcements"
        />
        
        <NotificationItem
          icon="chatbubble-outline"
          title="Messages"
          description="New messages from trainers or admin"
          settingKey="messages"
        />
        
        <NotificationItem
          icon="fitness-outline"
          title="Workout Reminders"
          description="Daily workout and training reminders"
          settingKey="workoutReminders"
        />
        
        <NotificationItem
          icon="card-outline"
          title="Payment Reminders"
          description="Subscription renewal alerts"
          settingKey="paymentReminders"
        />
        
        <NotificationItem
          icon="pricetag-outline"
          title="Promotions"
          description="Special offers and discounts"
          settingKey="promotions"
        />

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: theme.card }]}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Push notifications work best when you allow notifications in your device settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  masterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  masterIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  masterTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  masterDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 14,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
