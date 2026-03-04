import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';

const RULES = [
  'Sign in while entering and leaving the premises.',
  'Pay dues on time (within the 7th of every month). From the 8th day, a Rs.5/day late fee applies.',
  'Do not use exercise equipment without trainer permission.',
  'Inform the trainer in advance if you will be absent.',
  'If absent for more than one month, submit a written application. Otherwise, full monthly fees with applicable fines will be charged.',
  'If you join another gym and later return here, readmission is required.',
  'Avoid using mobile phones during exercise.',
  'Do not enter the gym under the influence of intoxicants.',
  'Keep your phone on silent mode.',
  'Use water responsibly in the bathroom area.',
  'Follow staff instructions and maintain gym discipline.',
  'Avoid unnecessary talking during workouts.',
];

export default function GymRulesScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>{t('Gym Rules')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {RULES.map((rule, index) => (
            <View key={`rule-${index + 1}`} style={[styles.ruleRow, { borderBottomColor: theme.border }]}>
              <View style={[styles.ruleIndexWrap, { backgroundColor: `${theme.primary}22` }]}>
                <Text style={[styles.ruleIndex, { color: theme.primary }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.ruleText, { color: theme.text }]}>{rule}</Text>
            </View>
          ))}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ruleRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  ruleIndexWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  ruleIndex: {
    fontSize: 12,
    fontWeight: '700',
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
