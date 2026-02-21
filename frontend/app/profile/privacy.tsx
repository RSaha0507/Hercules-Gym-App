import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.heading, { color: theme.text }]}>Hercules Gym App Privacy Policy</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            We collect account details such as name, email, phone, role, and center to provide app features.
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Workout, attendance, chat messages, and membership information are used to operate gym services.
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Data is stored securely on our backend infrastructure. Access is controlled by account role.
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            We do not sell personal information. We may use service providers for hosting, notifications, and analytics.
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            You can contact the gym administrator for data correction or account deletion requests.
          </Text>
          <Text style={[styles.updated, { color: theme.textSecondary }]}>Last updated: February 21, 2026</Text>
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
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
  updated: {
    fontSize: 12,
    marginTop: 8,
  },
});
