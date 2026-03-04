import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { formatDateDDMMYYYY, toSystemDate } from '../../src/utils/time';

interface PaymentRecord {
  id: string;
  amount: number;
  payment_method?: string;
  payment_date: string;
  payment_type?: 'membership' | 'merchandise';
  status?: 'pending' | 'completed' | 'failed';
  proof_image?: string;
  verification_note?: string;
}

interface MembershipDueInfo {
  due_date_iso?: string;
  base_amount?: number;
  late_fee?: number;
  total_amount?: number;
}

export default function MemberPaymentsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [membershipDue, setMembershipDue] = useState<MembershipDueInfo | null>(null);
  const [membershipHistory, setMembershipHistory] = useState<PaymentRecord[]>([]);
  const [shopHistory, setShopHistory] = useState<PaymentRecord[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<PaymentRecord[]>([]);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofPreviewUri, setProofPreviewUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingMembership, setPayingMembership] = useState(false);

  const loadPaymentSummary = useCallback(async () => {
    if (user?.role !== 'member') {
      setIsLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const paymentSummary = await api.getMyPaymentSummary();
      setMembershipDue(paymentSummary.membership_due || null);
      setMembershipHistory(paymentSummary.membership_history || []);
      setShopHistory(paymentSummary.shop_history || []);
      setPendingSubmissions(paymentSummary.pending_submissions || []);
    } catch (error) {
      console.log('Error loading member payments:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadPaymentSummary();
  }, [loadPaymentSummary]);

  useFocusEffect(
    useCallback(() => {
      loadPaymentSummary();
    }, [loadPaymentSummary]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPaymentSummary();
  };

  const pickPaymentProof = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('Error'), t('Gallery permission is required to upload screenshot.'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.65,
        base64: true,
      });

      if (result.canceled || !result.assets.length) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert(t('Error'), t('Could not process selected image. Please try another screenshot.'));
        return;
      }

      const mime = asset.mimeType || 'image/jpeg';
      setProofImage(`data:${mime};base64,${asset.base64}`);
      setProofPreviewUri(asset.uri);
    } catch (error) {
      console.log('Error selecting payment screenshot:', error);
      Alert.alert(t('Error'), t('Failed to select screenshot'));
    }
  };

  const handleSubmitMembershipProof = async () => {
    if (!proofImage) {
      Alert.alert(t('Error'), t('Please upload payment screenshot first'));
      return;
    }

    setPayingMembership(true);
    try {
      await api.payMembership('upi', proofImage);
      setProofImage(null);
      setProofPreviewUri(null);
      Alert.alert(t('Success'), t('Payment screenshot submitted. Awaiting admin confirmation.'));
      await loadPaymentSummary();
    } catch (error: any) {
      Alert.alert(t('Error'), error.response?.data?.detail || t('Failed to submit membership payment proof'));
    } finally {
      setPayingMembership(false);
    }
  };

  const renderHistoryRow = (payment: PaymentRecord, index: number, total: number, accent: string) => (
    <View key={payment.id} style={styles.timelineHistoryRow}>
      <View style={styles.historyRail}>
        <View style={[styles.historyDot, { backgroundColor: accent }]} />
        {index < total - 1 && <View style={[styles.historyLine, { backgroundColor: theme.border }]} />}
      </View>
      <View style={[styles.historyDetail, { borderBottomColor: theme.border }]}>
        <View style={styles.rowTop}>
          <Text style={[styles.paymentHistoryAmount, { color: theme.text }]}>
            {t('Rs.{amount}', { amount: Math.round(payment.amount || 0) })}
          </Text>
          <Text style={[styles.paymentHistoryMeta, { color: theme.textSecondary }]}>
            {formatDateDDMMYYYY(payment.payment_date)}
          </Text>
        </View>
        {payment.proof_image ? (
          <Image source={{ uri: payment.proof_image }} style={styles.historyProof} resizeMode="cover" />
        ) : (
          <Text style={[styles.paymentHistoryMeta, { color: theme.textSecondary }]}>{t('Screenshot not available')}</Text>
        )}
      </View>
    </View>
  );

  if (user?.role !== 'member') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.roundButton}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('Payments')}</Text>
          <View style={styles.roundButton} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={56} color={theme.textSecondary} />
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>{t('Access denied')}</Text>
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.roundButton, styles.heroButton]}>
              <Ionicons name="arrow-back" size={22} color="#EAF8FF" />
            </TouchableOpacity>
            <Text style={styles.heroTitle}>{t('Payments')}</Text>
            <TouchableOpacity onPress={onRefresh} style={[styles.roundButton, styles.heroButton]}>
              <Ionicons name="refresh" size={20} color="#EAF8FF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroSubtitle}>{t('Membership Payment')}</Text>
        </LinearGradient>

        <View style={[styles.sectionCard, styles.timelineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionCardHeader}>
            <Ionicons name="card-outline" size={18} color={theme.error} />
            <Text style={[styles.sectionCardTitle, { color: theme.text }]}>{t('Membership Payment')}</Text>
          </View>

          {membershipDue?.due_date_iso ? (
            <>
              <View style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineNode, { backgroundColor: theme.success }]} />
                  <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                  <View style={[styles.timelineNode, { backgroundColor: theme.warning }]} />
                  <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                  <View style={[styles.timelineNode, { backgroundColor: theme.error }]} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.sectionCardText, { color: theme.textSecondary }]}>{t('1-7: Standard fee Rs.700')}</Text>
                  <Text style={[styles.sectionCardText, { color: theme.textSecondary }]}>{t('8+: Rs.5/day late fee')}</Text>
                  <Text style={[styles.sectionCardText, { color: theme.textSecondary }]}>
                    {t('Due Date: {date}', { date: formatDateDDMMYYYY(membershipDue.due_date_iso) })}
                  </Text>
                  <Text style={[styles.sectionCardText, { color: (membershipDue.late_fee || 0) > 0 ? theme.error : theme.textSecondary }]}>
                    {t('Late Fee: Rs.{amount}', { amount: Math.round(membershipDue.late_fee || 0) })}
                  </Text>
                  <Text style={[styles.paymentTotalText, { color: theme.text }]}>
                    {t('Total Payable: Rs.{amount}', { amount: Math.round(membershipDue.total_amount || 0) })}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.uploadButton, { borderColor: theme.primary }]} onPress={pickPaymentProof}>
                <Ionicons name="image-outline" size={18} color={theme.primary} />
                <Text style={[styles.uploadButtonText, { color: theme.primary }]}>
                  {proofImage ? t('Change screenshot') : t('Upload payment screenshot')}
                </Text>
              </TouchableOpacity>

              {proofPreviewUri ? <Image source={{ uri: proofPreviewUri }} style={styles.proofPreview} resizeMode="cover" /> : null}

              <TouchableOpacity
                style={[styles.payButton, { backgroundColor: theme.primary }]}
                onPress={handleSubmitMembershipProof}
                disabled={payingMembership}
              >
                {payingMembership ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.payButtonText}>{t('Submit for Verification')}</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={[styles.sectionCardText, { color: theme.textSecondary }]}>{t('No payment due right now')}</Text>
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionCardHeader}>
            <Ionicons name="hourglass-outline" size={18} color={theme.warning} />
            <Text style={[styles.sectionCardTitle, { color: theme.text }]}>{t('Pending Verification')}</Text>
          </View>
          {pendingSubmissions.length === 0 ? (
            <Text style={[styles.sectionCardText, { color: theme.textSecondary }]}>{t('No pending submissions')}</Text>
          ) : (
            pendingSubmissions.map((payment) => (
              <View key={payment.id} style={[styles.pendingCard, { borderColor: theme.border }]}>
                <View style={styles.rowTop}>
                  <Text style={[styles.paymentHistoryAmount, { color: theme.text }]}>
                    {payment.payment_type === 'membership' ? t('Membership') : t('Shop')} - Rs.{Math.round(payment.amount || 0)}
                  </Text>
                  <View
                    style={[
                      styles.pendingBadge,
                      { backgroundColor: payment.status === 'failed' ? `${theme.error}22` : `${theme.warning}22` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pendingBadgeText,
                        { color: payment.status === 'failed' ? theme.error : theme.warning },
                      ]}
                    >
                      {payment.status === 'failed' ? t('Payment Error') : t('Under Review')}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.paymentHistoryMeta, { color: theme.textSecondary }]}>
                  {toSystemDate(payment.payment_date).toLocaleString()}
                </Text>
                {payment.proof_image ? (
                  <Image source={{ uri: payment.proof_image }} style={styles.historyProof} resizeMode="cover" />
                ) : null}
                {payment.verification_note ? (
                  <Text style={[styles.sectionCardText, { color: theme.error }]}>{payment.verification_note}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionCardHeader}>
            <Ionicons name="receipt-outline" size={18} color={theme.primary} />
            <Text style={[styles.sectionCardTitle, { color: theme.text }]}>{t('Last 3 Membership Payments')}</Text>
          </View>
          {membershipHistory.length === 0 ? (
            <Text style={[styles.sectionCardText, { color: theme.textSecondary }]}>{t('No membership payment history')}</Text>
          ) : (
            membershipHistory.map((payment, index) =>
              renderHistoryRow(payment, index, membershipHistory.length, theme.primary),
            )
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionCardHeader}>
            <Ionicons name="cart-outline" size={18} color={theme.success} />
            <Text style={[styles.sectionCardTitle, { color: theme.text }]}>{t('Last 3 Shop Payments')}</Text>
          </View>
          {shopHistory.length === 0 ? (
            <Text style={[styles.sectionCardText, { color: theme.textSecondary }]}>{t('No shop payment history')}</Text>
          ) : (
            shopHistory.map((payment, index) => renderHistoryRow(payment, index, shopHistory.length, theme.success))
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  hero: {
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  roundButton: {
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
  heroTitle: {
    color: '#F5FCFF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#D7EEFF',
    fontSize: 14,
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyStateText: {
    fontSize: 15,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  timelineCard: {
    borderRadius: 20,
    shadowColor: '#102238',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 8,
  },
  timelineRail: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    width: 2,
    height: 28,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    gap: 7,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionCardText: {
    fontSize: 13,
    lineHeight: 20,
  },
  paymentTotalText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  uploadButton: {
    marginTop: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  proofPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 10,
  },
  payButton: {
    marginTop: 12,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pendingCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  pendingBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  timelineHistoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyRail: {
    width: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyLine: {
    width: 2,
    minHeight: 22,
    marginTop: 3,
  },
  historyDetail: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    gap: 6,
  },
  paymentHistoryAmount: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  paymentHistoryMeta: {
    fontSize: 12,
  },
  historyProof: {
    width: '100%',
    height: 110,
    borderRadius: 10,
  },
});
