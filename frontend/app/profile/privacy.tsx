import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';

const POLICY_SECTIONS = [
  {
    title: '1. Scope',
    content:
      'This Privacy Policy explains how Hercules Gym collects, uses, stores, and protects your personal information when you use the mobile app and related services.',
  },
  {
    title: '2. Information We Collect',
    content:
      '- Account data: full name, email, phone number, role, branch, and profile details.\n- Fitness data: attendance, body metrics, assigned workouts, diet plans, and progress logs.\n- Communication data: chat messages, announcements, and support interactions.\n- Technical data: device type, app version, login/session metadata, and basic diagnostics.',
  },
  {
    title: '3. How We Use Data',
    content:
      '- Create and manage user accounts.\n- Deliver core gym features like check-in, workouts, diet plans, and attendance.\n- Enable branch-based role access for admins, trainers, and members.\n- Improve reliability, performance, and security.\n- Send important service updates and notifications.',
  },
  {
    title: '4. Legal Basis and Consent',
    content:
      'By registering and using the app, you consent to this data processing for service delivery, account security, and gym operations. You may withdraw consent by requesting account deletion, subject to legal and operational retention requirements.',
  },
  {
    title: '5. Data Sharing and Disclosure',
    content:
      'We do not sell personal data. Data may be shared only with: (a) authorized gym staff based on role permissions, (b) infrastructure/service providers for hosting, notifications, and monitoring, and (c) authorities when required by law.',
  },
  {
    title: '6. Data Retention',
    content:
      'We keep account and operational records while your account is active and for a limited period afterward for compliance, dispute handling, security audits, and backup recovery.',
  },
  {
    title: '7. Security',
    content:
      'We apply access controls, encrypted transport, role-based authorization, and password hashing. No system is absolutely secure, but we continuously improve safeguards and incident response.',
  },
  {
    title: '8. Your Rights',
    content:
      'You can request access, correction, or deletion of your personal data through gym administration/support. You may also request updates to inaccurate profile information at any time.',
  },
  {
    title: "9. Children's Privacy",
    content:
      'The app is intended for users who meet applicable age requirements under local law. Accounts for minors, where permitted, must be managed under gym and guardian policies.',
  },
  {
    title: '10. International Data Processing',
    content:
      'Your data may be processed on cloud infrastructure across regions with reasonable safeguards for confidentiality and security.',
  },
  {
    title: '11. Policy Updates',
    content:
      'We may update this policy from time to time. Material changes will be reflected in the in-app policy page with a revised effective date.',
  },
  {
    title: '12. Contact',
    content:
      'For privacy requests, contact gym administration from within the app support channel or your registered branch helpdesk.',
  },
];

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
          <Text style={[styles.intro, { color: theme.textSecondary }]}>
            Your privacy matters to us. This policy is written to clearly explain what data is collected, why it is used, and how you can control it.
          </Text>

          {POLICY_SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>{section.content}</Text>
            </View>
          ))}

          <Text style={[styles.updated, { color: theme.textSecondary }]}>
            Effective date: February 22, 2026
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
  intro: {
    fontSize: 14,
    lineHeight: 22,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
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
