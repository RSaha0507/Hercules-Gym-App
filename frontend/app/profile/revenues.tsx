import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { api, GYM_CENTERS } from '../../src/services/api';
import { toSystemDate } from '../../src/utils/time';

type RevenueHistoryItem = {
  id: string;
  amount: number;
  payment_type: 'membership' | 'merchandise';
  payment_method?: string;
  payment_date: string;
  center?: string;
  description?: string;
  member_name?: string;
  member_code?: string;
};

type RevenueSummaryResponse = {
  center?: string | null;
  totals: {
    membership_revenue: number;
    shop_revenue: number;
    total_revenue: number;
    membership_payments_count: number;
    shop_payments_count: number;
    total_payments_count: number;
  };
  monthly: {
    membership_revenue: number;
    shop_revenue: number;
    total_revenue: number;
    membership_payments_count: number;
    shop_payments_count: number;
    total_payments_count: number;
  };
  history: RevenueHistoryItem[];
  pending_verifications: PendingVerificationItem[];
};

type PendingVerificationItem = {
  id: string;
  amount: number;
  payment_type: 'membership' | 'merchandise';
  payment_date: string;
  payment_method?: string;
  member_name?: string;
  member_code?: string;
  proof_image?: string;
};

const EMPTY_SUMMARY: RevenueSummaryResponse = {
  center: null,
  totals: {
    membership_revenue: 0,
    shop_revenue: 0,
    total_revenue: 0,
    membership_payments_count: 0,
    shop_payments_count: 0,
    total_payments_count: 0,
  },
  monthly: {
    membership_revenue: 0,
    shop_revenue: 0,
    total_revenue: 0,
    membership_payments_count: 0,
    shop_payments_count: 0,
    total_payments_count: 0,
  },
  history: [],
  pending_verifications: [],
};

export default function RevenuesScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [summary, setSummary] = useState<RevenueSummaryResponse>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isPrimaryAdmin = !!user?.is_primary_admin;

  useEffect(() => {
    if (!isPrimaryAdmin) {
      setSelectedCenter(user?.center || null);
    }
  }, [isPrimaryAdmin, user?.center]);

  const loadData = useCallback(async () => {
    if (user?.role !== 'admin') return;
    try {
      const data = await api.getAdminRevenueSummary(selectedCenter || undefined, 120);
      setSummary(data || EMPTY_SUMMARY);
    } catch (error) {
      console.log('Error loading revenue summary:', error);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedCenter, user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatRs = useCallback((amount: number) => `Rs.${Math.round(amount || 0).toLocaleString()}`, []);

  const handleVerifyPayment = async (paymentId: string, status: 'completed' | 'failed') => {
    const actionLabel = status === 'completed' ? t('confirm') : t('mark error');
    Alert.alert(
      t('Payment Verification'),
      t('Are you sure you want to {action}?', { action: actionLabel }),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Proceed'),
          onPress: async () => {
            try {
              await api.verifyPayment(paymentId, status);
              await loadData();
              Alert.alert(t('Success'), t('Payment verification updated.'));
            } catch (error: any) {
              Alert.alert(t('Error'), error.response?.data?.detail || t('Failed to verify payment'));
            }
          },
        },
      ],
    );
  };

  const totalCards = useMemo(
    () => [
      {
        key: 'total',
        icon: 'cash-outline',
        title: t('Total Revenue'),
        value: formatRs(summary.totals.total_revenue),
        subtitle: t('Total Payments: {count}', { count: summary.totals.total_payments_count }),
        color: theme.primary,
      },
      {
        key: 'membership',
        icon: 'card-outline',
        title: t('Gym Subscription Revenue'),
        value: formatRs(summary.totals.membership_revenue),
        subtitle: t('Payments: {count}', { count: summary.totals.membership_payments_count }),
        color: theme.success,
      },
      {
        key: 'shop',
        icon: 'cart-outline',
        title: t('Shop Revenue'),
        value: formatRs(summary.totals.shop_revenue),
        subtitle: t('Payments: {count}', { count: summary.totals.shop_payments_count }),
        color: theme.warning,
      },
    ],
    [formatRs, summary, t, theme.primary, theme.success, theme.warning],
  );

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{t('Revenues')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={56} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('Access denied')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <FlatList
        data={summary.history}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroPane}
            >
              <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, styles.heroButton]}>
                  <Ionicons name="arrow-back" size={24} color="#EAF8FF" />
                </TouchableOpacity>
                <Text style={styles.heroTitle}>{t('Revenues')}</Text>
                <TouchableOpacity onPress={onRefresh} style={[styles.backButton, styles.heroButton]}>
                  <Ionicons name="refresh" size={22} color="#EAF8FF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.heroSubTitle}>{t('Revenue Summary')}</Text>
            </LinearGradient>

            {isPrimaryAdmin && (
              <View style={styles.centerFilter}>
                <TouchableOpacity
                  style={[
                    styles.centerChip,
                    { backgroundColor: !selectedCenter ? theme.primary : theme.card, borderColor: theme.border },
                  ]}
                  onPress={() => setSelectedCenter(null)}
                >
                  <Text style={[styles.centerChipText, { color: !selectedCenter ? '#FFF' : theme.text }]}>
                    {t('All Centers')}
                  </Text>
                </TouchableOpacity>
                {GYM_CENTERS.map((center) => (
                  <TouchableOpacity
                    key={center}
                    style={[
                      styles.centerChip,
                      { backgroundColor: selectedCenter === center ? theme.primary : theme.card, borderColor: theme.border },
                    ]}
                    onPress={() => setSelectedCenter(center)}
                  >
                    <Text style={[styles.centerChipText, { color: selectedCenter === center ? '#FFF' : theme.text }]}>
                      {center}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!isPrimaryAdmin && !!summary.center && (
              <View style={[styles.centerBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="location-outline" size={16} color={theme.primary} />
                <Text style={[styles.centerBadgeText, { color: theme.text }]}>
                  {t('Center: {center}', { center: summary.center })}
                </Text>
              </View>
            )}

            <View style={styles.summaryCards}>
              {totalCards.map((card) => (
                <View key={card.key} style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={[styles.summaryIcon, { backgroundColor: `${card.color}20` }]}>
                    <Ionicons name={card.icon as any} size={20} color={card.color} />
                  </View>
                  <Text style={[styles.summaryTitle, { color: theme.textSecondary }]}>{card.title}</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>{card.value}</Text>
                  <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>{card.subtitle}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.monthlyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.monthlyTitle, { color: theme.text }]}>{t('Monthly Revenue')}</Text>
              <View style={styles.monthlyRow}>
                <Text style={[styles.monthlyLabel, { color: theme.textSecondary }]}>{t('Gym Subscription Revenue')}</Text>
                <Text style={[styles.monthlyValue, { color: theme.text }]}>{formatRs(summary.monthly.membership_revenue)}</Text>
              </View>
              <View style={styles.monthlyRow}>
                <Text style={[styles.monthlyLabel, { color: theme.textSecondary }]}>{t('Shop Revenue')}</Text>
                <Text style={[styles.monthlyValue, { color: theme.text }]}>{formatRs(summary.monthly.shop_revenue)}</Text>
              </View>
              <View style={[styles.monthlyRow, styles.monthlyRowFinal]}>
                <Text style={[styles.monthlyLabel, { color: theme.text }]}>{t('Total Revenue')}</Text>
                <Text style={[styles.monthlyTotal, { color: theme.primary }]}>{formatRs(summary.monthly.total_revenue)}</Text>
              </View>
            </View>

            <View style={[styles.pendingSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.pendingHeader}>
                <Text style={[styles.pendingTitle, { color: theme.text }]}>{t('Pending Payment Verifications')}</Text>
                <Text style={[styles.pendingCount, { color: theme.textSecondary }]}>
                  {summary.pending_verifications.length}
                </Text>
              </View>
              {summary.pending_verifications.length === 0 ? (
                <Text style={[styles.pendingEmpty, { color: theme.textSecondary }]}>{t('No pending submissions')}</Text>
              ) : (
                summary.pending_verifications.map((item) => (
                  <View key={item.id} style={[styles.pendingCard, { borderColor: theme.border }]}>
                    <View style={styles.pendingTop}>
                      <Text style={[styles.pendingMember, { color: theme.text }]}>
                        {item.member_name || t('Unknown')}
                        {item.member_code ? ` (${item.member_code})` : ''}
                      </Text>
                      <Text style={[styles.pendingAmount, { color: theme.text }]}>{formatRs(item.amount)}</Text>
                    </View>
                    <Text style={[styles.pendingMeta, { color: theme.textSecondary }]}>
                      {item.payment_type === 'membership' ? t('Membership') : t('Shop')} | {toSystemDate(item.payment_date).toLocaleString()}
                    </Text>
                    {item.proof_image ? (
                      <Image source={{ uri: item.proof_image }} style={styles.pendingProof} resizeMode="cover" />
                    ) : (
                      <Text style={[styles.pendingMeta, { color: theme.textSecondary }]}>{t('Screenshot not available')}</Text>
                    )}
                    {isPrimaryAdmin ? (
                      <View style={styles.pendingActions}>
                        <TouchableOpacity
                          style={[styles.pendingBtn, { borderColor: theme.error }]}
                          onPress={() => handleVerifyPayment(item.id, 'failed')}
                        >
                          <Text style={[styles.pendingBtnText, { color: theme.error }]}>{t('Payment Error')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.pendingBtn, { backgroundColor: theme.success }]}
                          onPress={() => handleVerifyPayment(item.id, 'completed')}
                        >
                          <Text style={[styles.pendingBtnText, { color: '#FFF' }]}>{t('Confirm Payment')}</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={[styles.pendingMeta, { color: theme.textSecondary }]}>{t('Primary admin verification required')}</Text>
                    )}
                  </View>
                ))
              )}
            </View>

            <Text style={[styles.historyTitle, { color: theme.text }]}>{t('Payment History')}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMembership = item.payment_type === 'membership';
          const typeColor = isMembership ? theme.success : theme.warning;
          return (
            <View style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.historyTopRow}>
                <View style={[styles.typeBadge, { backgroundColor: `${typeColor}22` }]}>
                  <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                    {isMembership ? t('Membership') : t('Shop')}
                  </Text>
                </View>
                <Text style={[styles.historyAmount, { color: theme.text }]}>{formatRs(item.amount)}</Text>
              </View>
              <Text style={[styles.historyMember, { color: theme.text }]}>
                {item.member_name || t('Unknown')}
                {item.member_code ? ` (${item.member_code})` : ''}
              </Text>
              <Text style={[styles.historyMeta, { color: theme.textSecondary }]}>
                {toSystemDate(item.payment_date).toLocaleString()}
              </Text>
              <Text style={[styles.historyMeta, { color: theme.textSecondary }]}>
                {t('Mode: {method}', { method: (item.payment_method || 'N/A').toUpperCase() })}
                {item.center ? ` | ${t('Center: {center}', { center: item.center })}` : ''}
              </Text>
              {item.description ? (
                <Text style={[styles.historyDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={56} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('No payment history found')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 36,
  },
  heroPane: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 28,
    overflow: 'hidden',
    paddingBottom: 14,
    shadowColor: '#0B1524',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(8,20,38,0.2)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#F5FCFF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubTitle: {
    color: '#D7EEFF',
    fontSize: 14,
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  centerFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 14,
  },
  centerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  centerChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  centerBadge: {
    marginHorizontal: 20,
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryCards: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    marginTop: 3,
    fontSize: 24,
    fontWeight: '800',
  },
  summarySubtitle: {
    marginTop: 4,
    fontSize: 12,
  },
  monthlyCard: {
    marginHorizontal: 20,
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  monthlyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  monthlyRowFinal: {
    borderTopWidth: 1,
    borderTopColor: '#E6EBF4',
    marginTop: 4,
    paddingTop: 10,
  },
  monthlyLabel: {
    fontSize: 13,
  },
  monthlyValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  monthlyTotal: {
    fontSize: 17,
    fontWeight: '800',
  },
  pendingSection: {
    marginHorizontal: 20,
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  pendingCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  pendingEmpty: {
    fontSize: 13,
  },
  pendingCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  pendingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  pendingMember: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  pendingAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  pendingMeta: {
    fontSize: 12,
  },
  pendingProof: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginTop: 2,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  pendingBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyTitle: {
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: '800',
  },
  historyCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  historyMember: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  historyMeta: {
    marginTop: 4,
    fontSize: 12,
  },
  historyDesc: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
