import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

interface QrPayloadResponse {
  code?: string;
  qr_value?: string;
}

const buildQrImageUrl = (value: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=640x640&margin=0&data=${encodeURIComponent(value)}`;

export default function AttendanceQrScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [payload, setPayload] = useState<QrPayloadResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQrPayload = useCallback(async () => {
    if (user?.role !== 'admin') {
      setIsLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const result = await api.getQrCode();
      setPayload(result || null);
    } catch (error) {
      console.log('Error loading attendance QR payload:', error);
      setPayload(null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadQrPayload();
  }, [loadQrPayload]);

  const onRefresh = () => {
    setRefreshing(true);
    loadQrPayload();
  };

  const qrValue = payload?.qr_value || payload?.code || '';

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.roundButton}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('Attendance QR')}</Text>
          <View style={styles.roundButton} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('Access denied')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.roundButton}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('Attendance QR')}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.roundButton}>
            <Ionicons name="refresh" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
          {t('Use this single QR for both check-in and check-out.')}
        </Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{t('Attendance QR')}</Text>
          {qrValue ? (
            <>
              <Image source={{ uri: buildQrImageUrl(qrValue) }} style={styles.qrImage} resizeMode="contain" />
              <Text style={[styles.codeText, { color: theme.textSecondary }]}>{qrValue}</Text>
            </>
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('Unable to load attendance QR')}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  subTitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  qrImage: {
    width: 260,
    height: 260,
  },
  codeText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
