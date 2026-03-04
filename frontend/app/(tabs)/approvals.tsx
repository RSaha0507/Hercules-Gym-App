import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { toSystemDate } from '../../src/utils/time';
import { format } from 'date-fns';

interface ApprovalRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  center?: string;
  requested_at: string;
  status: string;
}

export default function ApprovalsScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('Done!');
  const [successMessage, setSuccessMessage] = useState('');
  const [isErrorFeedback, setIsErrorFeedback] = useState(false);
  const isFetchingRef = useRef(false);

  const loadRequests = useCallback(async (): Promise<ApprovalRequest[]> => {
    if (isFetchingRef.current) return [];
    isFetchingRef.current = true;
    try {
      const data = await api.getPendingApprovals();
      setRequests(data);
      return data;
    } catch (error) {
      console.log('Error loading approvals:', error);
      return [];
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      loadRequests();
    }, 8000);

    return () => clearInterval(interval);
  }, [loadRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleApprovePress = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleRejectPress = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;

    const request = selectedRequest;
    setShowApproveModal(false);
    setProcessing(request.id);

    try {
      await api.approveRequest(request.id);
      await loadRequests();
      setSuccessTitle(t('Success'));
      setIsErrorFeedback(false);
      setSuccessMessage(t('{name} has been approved successfully.', { name: request.user_name }));
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Approve error:', error);

      const detail = error?.response?.data?.detail;
      const detailText = typeof detail === 'string' ? detail : 'Failed to approve. Please try again.';
      const isAlreadyProcessed = detailText.toLowerCase().includes('already') || detailText.toLowerCase().includes('not found');

      const latestRequests = await loadRequests();
      const stillPending = latestRequests.some((r) => r.id === request.id);

      if (isAlreadyProcessed || !stillPending) {
        setSuccessTitle(t('Synced'));
        setIsErrorFeedback(false);
        setSuccessMessage(
          stillPending
            ? t('Request was already processed. The list is now up to date.')
            : t('{name} has been approved successfully.', { name: request.user_name }),
        );
      } else {
        setSuccessTitle(t('Action Failed'));
        setIsErrorFeedback(true);
        setSuccessMessage(detailText);
      }

      setShowSuccessModal(true);
    } finally {
      setProcessing(null);
      setSelectedRequest(null);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest) return;

    const request = selectedRequest;
    setShowRejectModal(false);
    setProcessing(request.id);

    try {
      await api.rejectRequest(request.id, rejectReason || undefined);
      await loadRequests();
      setSuccessTitle(t('Success'));
      setIsErrorFeedback(false);
      setSuccessMessage(t('{name} request has been rejected.', { name: request.user_name }));
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Reject error:', error);

      const detail = error?.response?.data?.detail;
      const detailText = typeof detail === 'string' ? detail : 'Failed to reject. Please try again.';
      const isAlreadyProcessed = detailText.toLowerCase().includes('already') || detailText.toLowerCase().includes('not found');

      const latestRequests = await loadRequests();
      const stillPending = latestRequests.some((r) => r.id === request.id);

      if (isAlreadyProcessed || !stillPending) {
        setSuccessTitle(t('Synced'));
        setIsErrorFeedback(false);
        setSuccessMessage(
          stillPending
            ? t('Request was already processed. The list is now up to date.')
            : t('{name} request has been rejected.', { name: request.user_name }),
        );
      } else {
        setSuccessTitle(t('Action Failed'));
        setIsErrorFeedback(true);
        setSuccessMessage(detailText);
      }

      setShowSuccessModal(true);
    } finally {
      setProcessing(null);
      setSelectedRequest(null);
      setRejectReason('');
    }
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          color: '#E63946',
          gradient: ['#E63946', '#831018'] as [string, string],
          icon: 'shield',
          label: t('Admin'),
        };
      case 'trainer':
        return {
          color: '#F59E0B',
          gradient: ['#F59E0B', '#D97706'] as [string, string],
          icon: 'fitness',
          label: t('Trainer'),
        };
      default:
        return {
          color: '#3B82F6',
          gradient: ['#3B82F6', '#1D4ED8'] as [string, string],
          icon: 'person',
          label: t('Member'),
        };
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Stats Card */}
      <LinearGradient
        colors={isDark ? [theme.primary, theme.secondary] : [theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsCard}
      >
        <View style={styles.statsIcon}>
          <Ionicons name="people-outline" size={40} color="rgba(255,255,255,0.3)" />
        </View>
        <View style={styles.statsContent}>
          <Text style={styles.statsNumber}>{requests.length}</Text>
          <Text style={styles.statsLabel}>{t('Pending Approvals')}</Text>
        </View>
        <View style={styles.statsDecor}>
          <Ionicons name="checkmark-circle" size={80} color="rgba(255,255,255,0.1)" />
        </View>
      </LinearGradient>

      {/* Role Info */}
      <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
        <Ionicons name="information-circle" size={24} color={theme.primary} />
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          {user?.is_primary_admin
            ? 'As Primary Admin, you can approve admins, trainers, and members from all centers.'
            : user?.role === 'admin'
            ? 'You can approve member registrations from all centers.'
            : `You can approve members registering for ${user?.center}.`}
        </Text>
      </View>

      <View style={[styles.timelineLegend, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.timelineLegendTitle, { color: theme.text }]}>{t('Approval Flow')}</Text>
        <View style={styles.timelineLegendRow}>
          <View style={[styles.timelineLegendDot, { backgroundColor: theme.warning }]} />
          <Text style={[styles.timelineLegendText, { color: theme.textSecondary }]}>{t('Requested')}</Text>
        </View>
        <View style={styles.timelineLegendRow}>
          <View style={[styles.timelineLegendDot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.timelineLegendText, { color: theme.textSecondary }]}>{t('Under Review')}</Text>
        </View>
        <View style={styles.timelineLegendRow}>
          <View style={[styles.timelineLegendDot, { backgroundColor: theme.success }]} />
          <Text style={[styles.timelineLegendText, { color: theme.textSecondary }]}>{t('Approved')}</Text>
        </View>
      </View>
    </View>
  );

  const renderRequestItem = ({ item }: { item: ApprovalRequest }) => {
    const roleConfig = getRoleConfig(item.user_role);
    const isProcessing = processing === item.id;

    return (
      <View style={styles.requestRailRow}>
        <View style={styles.requestRail}>
          <View style={[styles.requestNode, { backgroundColor: roleConfig.color }]} />
          <View style={[styles.requestLine, { backgroundColor: theme.border }]} />
        </View>

        <View style={[styles.requestCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Card Content */}
          <View style={styles.cardContent}>
            {/* User Avatar & Info */}
            <View style={styles.userRow}>
              <LinearGradient colors={roleConfig.gradient} style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.user_name.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>

              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.text }]}>{item.user_name}</Text>
                <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{item.user_email}</Text>
              </View>
            </View>

            {/* Badges */}
            <View style={styles.badgesRow}>
              <View style={[styles.roleBadge, { backgroundColor: roleConfig.color + '20' }]}>
                <Ionicons name={roleConfig.icon as any} size={14} color={roleConfig.color} />
                <Text style={[styles.roleBadgeText, { color: roleConfig.color }]}>
                  {roleConfig.label}
                </Text>
              </View>

              {item.center && (
                <View style={[styles.centerBadge, { backgroundColor: theme.secondary + '20' }]}>
                  <Ionicons name="location" size={14} color={theme.secondary} />
                  <Text style={[styles.centerBadgeText, { color: theme.secondary }]}>
                    {item.center}
                  </Text>
                </View>
              )}
            </View>

            {/* Time */}
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                {format(toSystemDate(item.requested_at), 'MMM d, yyyy - h:mm a')}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.rejectButton, { borderColor: theme.error }]}
                onPress={() => handleRejectPress(item)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={theme.error} />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color={theme.error} />
                    <Text style={[styles.rejectButtonText, { color: theme.error }]}>{t('Reject')}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.approveButton, { backgroundColor: '#10B981' }]}
                onPress={() => handleApprovePress(item)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.approveButtonText}>{t('Approve')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>{t('Loading approvals...')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View pointerEvents="none" style={styles.glassBlobTop} />
      <View pointerEvents="none" style={styles.glassBlobBottom} />

      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroPane}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('Approvals')}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color="#EAF8FF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.success + '20' }]}>
              <Ionicons name="checkmark-done-circle" size={80} color={theme.success} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('All Caught Up!')}</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {t('No pending approval requests')}
            </Text>
          </View>
        }
      />

      {/* Approve Confirmation Modal */}
      <Modal visible={showApproveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: '#10B981' + '20' }]}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('Approve Registration?')}</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              {t('Welcome {name} to Hercules Gym?', { name: selectedRequest?.user_name || '' })}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: theme.border }]}
                onPress={() => setShowApproveModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.text }]}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: '#10B981' }]}
                onPress={confirmApprove}
              >
                <Text style={styles.modalConfirmText}>{t('Approve')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: theme.error + '20' }]}>
              <Ionicons name="close-circle" size={48} color={theme.error} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('Reject Registration')}</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              {t('Provide a reason (optional)')}
            </Text>
            <TextInput
              style={[
                styles.reasonInput,
                { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
              ]}
              placeholder={t('Enter reason for rejection...')}
              placeholderTextColor={theme.textSecondary}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: theme.border }]}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.text }]}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: theme.error }]}
                onPress={confirmReject}
              >
                <Text style={styles.modalConfirmText}>{t('Reject')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success/Error Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: (isErrorFeedback ? theme.error : theme.primary) + '20' }]}>
              <Ionicons name={isErrorFeedback ? 'alert-circle' : 'checkmark-done'} size={48} color={isErrorFeedback ? theme.error : theme.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{successTitle}</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary, textAlign: 'center' }]}>
              {successMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalSingleButton, { backgroundColor: isErrorFeedback ? theme.error : theme.primary }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalConfirmText}>{t('OK')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glassBlobTop: {
    position: 'absolute',
    top: 94,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(126, 206, 255, 0.14)',
  },
  glassBlobBottom: {
    position: 'absolute',
    bottom: 160,
    left: -48,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(255, 175, 234, 0.12)',
  },
  heroPane: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#0A1626',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  title: {
    color: '#F3FCFF',
    fontSize: 28,
    fontWeight: '800',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(8,20,38,0.2)',
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 16,
  },
  statsCard: {
    borderRadius: 22,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  statsIcon: {
    marginRight: 16,
  },
  statsContent: {},
  statsNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsDecor: {
    position: 'absolute',
    right: -20,
    bottom: -20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E7EBF4',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  timelineLegend: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  timelineLegendTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  timelineLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineLegendText: {
    fontSize: 12,
  },
  requestRailRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16,
  },
  requestRail: {
    width: 18,
    alignItems: 'center',
  },
  requestNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 24,
  },
  requestLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  requestCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1828',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 6px 10px rgba(10, 22, 38, 0.08)',
      },
    }),
  },
  roleStrip: {
    height: 4,
  },
  cardContent: {
    padding: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  centerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  centerBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  timeText: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  approveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  reasonInput: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalSingleButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});
