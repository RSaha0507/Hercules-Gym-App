import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';

const TERMS_SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content:
      'By creating an account or using the Hercules Gym App, you agree to these Terms of Service and all applicable gym policies.',
  },
  {
    title: '2. Eligibility and Account Responsibility',
    content:
      'You must provide accurate registration details and keep credentials secure. You are responsible for all activity under your account.',
  },
  {
    title: '3. Role-Based Access',
    content:
      'App features are controlled by account role (admin, trainer, member). Any attempt to bypass permissions or access unauthorized data is prohibited.',
  },
  {
    title: '4. Acceptable Use',
    content:
      '- Do not abuse chat, announcements, or member data.\n- Do not upload harmful, illegal, or misleading content.\n- Do not disrupt app performance, security, or service availability.',
  },
  {
    title: '5. Membership, Billing, and Service Rules',
    content:
      'Membership plans, check-in rules, class/workout assignment, and billing terms are governed by gym management and may vary by branch.',
  },
  {
    title: '6. Health and Fitness Notice',
    content:
      'Workout and diet content is for general fitness guidance and does not replace medical advice. Consult a qualified professional for medical conditions.',
  },
  {
    title: '7. Communications',
    content:
      'You agree to receive service-related communications such as approvals, reminders, workout updates, and operational notices within the app.',
  },
  {
    title: '8. Intellectual Property',
    content:
      'The app, brand assets, software, and content are owned by Hercules Gym or its licensors. Unauthorized copying, resale, or reverse engineering is not allowed.',
  },
  {
    title: '9. Suspension and Termination',
    content:
      'We may suspend or terminate access for policy violations, abuse, fraud risk, legal compliance, or operational security requirements.',
  },
  {
    title: '10. Warranty Disclaimer',
    content:
      'Services are provided on an "as is" and "as available" basis. We do not guarantee uninterrupted or error-free operation at all times.',
  },
  {
    title: '11. Limitation of Liability',
    content:
      'To the extent permitted by law, Hercules Gym is not liable for indirect, incidental, or consequential losses arising from app use or temporary service issues.',
  },
  {
    title: '12. Governing Law and Disputes',
    content:
      'These terms are governed by applicable Indian law. Any disputes will be handled under the jurisdiction defined by gym management policy.',
  },
  {
    title: '13. Changes to Terms',
    content:
      'We may update these terms periodically. Continued use after updates constitutes acceptance of the revised terms.',
  },
  {
    title: '14. Contact',
    content:
      'For questions about these terms, contact gym administration via the in-app support section or your branch front desk.',
  },
];

export default function TermsScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.heading, { color: theme.text }]}>Hercules Gym App Terms</Text>
          <Text style={[styles.intro, { color: theme.textSecondary }]}>
            Please read these terms carefully before using the app. They define your rights, responsibilities, and acceptable use of the platform.
          </Text>

          {TERMS_SECTIONS.map((section) => (
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
