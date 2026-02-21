import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';

const LANGUAGES = ['English', 'Hindi', 'Bengali'] as const;

export default function LanguageScreen() {
  const { theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<(typeof LANGUAGES)[number]>('English');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Language</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Select app language</Text>

        {LANGUAGES.map((language) => {
          const isSelected = language === selectedLanguage;
          return (
            <TouchableOpacity
              key={language}
              style={[
                styles.languageItem,
                { backgroundColor: theme.card, borderColor: isSelected ? theme.primary : theme.border },
              ]}
              onPress={() => setSelectedLanguage(language)}
            >
              <Text style={[styles.languageText, { color: theme.text }]}>{language}</Text>
              {isSelected ? <Ionicons name="checkmark-circle" size={22} color={theme.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
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
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  languageItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
