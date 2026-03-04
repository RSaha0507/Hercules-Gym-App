import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { useLanguage } from '../src/context/LanguageContext';

export default function Index() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <LinearGradient colors={[theme.primary, theme.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Image source={require('../assets/images/hercules-logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>HERCULES GYM</Text>
        <Text style={styles.subtitle}>CHANGE YOUR BODY, CHANGE YOUR MIND</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>OPEN INSTANTLY, TRAIN CONSISTENTLY</Text>
          <Text style={styles.infoText}>
            {t("Welcome to your hometown's first ever gym digital app services presented to you by Hercules Gym - We stand strong with Fitness, Discipline and Progress !!")}
          </Text>
        </View>

        {user ? (
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#0F2238' }]} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.primaryButtonText}>{t('Continue to Dashboard')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.authActions}>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#0F2238' }]} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.primaryButtonText}>{t('Login')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.secondaryButtonText}>{t('Register')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,12,20,0.18)',
  },
  content: {
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#F5FCFF',
    letterSpacing: 1.6,
  },
  subtitle: {
    color: '#E4F4FF',
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  infoCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(8,22,38,0.22)',
    padding: 14,
    marginTop: 6,
    gap: 6,
  },
  infoTitle: {
    color: '#F3FCFF',
    fontSize: 16,
    fontWeight: '800',
  },
  infoText: {
    color: '#CFE7F8',
    fontSize: 13,
    lineHeight: 19,
  },
  authActions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#F4FBFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  secondaryButtonText: {
    color: '#F1FAFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
