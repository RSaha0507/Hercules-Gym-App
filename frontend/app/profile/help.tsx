import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';

export default function HelpSupportScreen() {
  const { theme } = useTheme();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const faqs = [
    {
      question: 'How do I check in for attendance?',
      answer: 'Go to the Attendance tab and tap the "Check In" button. Make sure you are at the gym when checking in. Your trainer can also mark your attendance.',
    },
    {
      question: 'How do I renew my membership?',
      answer: 'Contact your gym admin or visit the front desk to renew your membership. You will receive payment reminders before your membership expires.',
    },
    {
      question: 'Can I change my assigned trainer?',
      answer: 'Yes, please contact the gym admin to request a trainer change. They will help you find a trainer that suits your fitness goals.',
    },
    {
      question: 'How do I order merchandise?',
      answer: 'Go to the Shop tab, browse products, select your size, add to cart and place your order. You can pick up and pay at the gym.',
    },
    {
      question: 'How do I message my trainer?',
      answer: 'Go to the Chat tab and start a conversation with your assigned trainer. You can also message the admin for general queries.',
    },
  ];

  const contactOptions = [
    {
      icon: 'call',
      title: 'Call Us',
      subtitle: '+91 98765 43210',
      action: () => Linking.openURL('tel:+919876543210'),
    },
    {
      icon: 'mail',
      title: 'Email Us',
      subtitle: 'support@herculesgym.com',
      action: () => Linking.openURL('mailto:support@herculesgym.com'),
    },
    {
      icon: 'logo-whatsapp',
      title: 'WhatsApp',
      subtitle: 'Quick support',
      action: () => Linking.openURL('https://wa.me/919876543210'),
    },
  ];

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }
    Alert.alert(
      'Thank You!',
      'Your feedback has been submitted. We appreciate your input!',
      [{ text: 'OK', onPress: () => setFeedbackText('') }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Welcome Card */}
        <View style={[styles.welcomeCard, { backgroundColor: theme.primary }]}>
          <Ionicons name="help-buoy" size={40} color="#FFF" />
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>How can we help?</Text>
            <Text style={styles.welcomeSubtitle}>
              Find answers or contact our support team
            </Text>
          </View>
        </View>

        {/* Contact Options */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Contact Us</Text>
        <View style={styles.contactGrid}>
          {contactOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.contactCard, { backgroundColor: theme.card }]}
              onPress={option.action}
            >
              <View style={[styles.contactIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name={option.icon as any} size={24} color={theme.primary} />
              </View>
              <Text style={[styles.contactTitle, { color: theme.text }]}>{option.title}</Text>
              <Text style={[styles.contactSubtitle, { color: theme.textSecondary }]}>
                {option.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQs */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.faqItem, { backgroundColor: theme.card }]}
            onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQuestion, { color: theme.text }]}>{faq.question}</Text>
              <Ionicons
                name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.textSecondary}
              />
            </View>
            {expandedFaq === index && (
              <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Feedback */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Send Feedback</Text>
        <View style={[styles.feedbackCard, { backgroundColor: theme.card }]}>
          <TextInput
            style={[styles.feedbackInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
            placeholder="Share your thoughts, suggestions, or report issues..."
            placeholderTextColor={theme.textSecondary}
            value={feedbackText}
            onChangeText={setFeedbackText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.feedbackButton, { backgroundColor: theme.primary }]}
            onPress={handleSendFeedback}
          >
            <Ionicons name="send" size={18} color="#FFF" />
            <Text style={styles.feedbackButtonText}>Send Feedback</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={[styles.appInfo, { backgroundColor: theme.card }]}>
          <Text style={[styles.appName, { color: theme.text }]}>Hercules Gym</Text>
          <Text style={[styles.appVersion, { color: theme.textSecondary }]}>Version 1.0.0</Text>
          <TouchableOpacity onPress={() => router.push('/profile/privacy' as any)}>
            <Text style={[styles.privacyLink, { color: theme.primary }]}>Privacy Policy</Text>
          </TouchableOpacity>
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
    paddingBottom: 40,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 16,
    marginBottom: 24,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  contactCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactSubtitle: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  faqItem: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  feedbackInput: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 100,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  feedbackButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 14,
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  appVersion: {
    fontSize: 12,
    marginTop: 4,
  },
  privacyLink: {
    fontSize: 13,
    marginTop: 12,
  },
});
