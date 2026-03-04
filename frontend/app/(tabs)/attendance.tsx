import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { toSystemDate } from '../../src/utils/time';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  check_in_time: string;
  check_out_time?: string;
  check_out_method?: 'qr' | 'manual' | 'self' | 'auto_timeout';
  auto_checked_out?: boolean;
  penalty_applied?: boolean;
  penalty_reason?: string;
  penalty_note?: string;
  method: 'qr' | 'manual' | 'self';
}

const MEMBER_HISTORY_MONTHS = 5;

export default function AttendanceScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [myHistory, setMyHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [selectedMemberHistory, setSelectedMemberHistory] = useState<AttendanceRecord[]>([]);
  const [selectedMemberLoading, setSelectedMemberLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const today = await api.getTodayAttendance();
      setTodayAttendance(today);

      // Check if current user is checked in today
      const myCheckIn = today.find((record: AttendanceRecord) => 
        record.user_id === user?.id && !record.check_out_time
      );
      setIsCheckedIn(!!myCheckIn);

      // Load history for members
      if (user?.role === 'member' && user?.id) {
        const history = await api.getAttendanceHistory(user.id, undefined, undefined, MEMBER_HISTORY_MONTHS);
        setMyHistory(history);
      }
    } catch (error) {
      console.log('Error loading attendance:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.role]);

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

  const handleCheckIn = async () => {
    router.push('/profile/checkin-qr' as any);
  };

  const handleCheckOut = async () => {
    router.push('/profile/checkin-qr' as any);
  };

  const openMemberHistory = async (record: AttendanceRecord) => {
    if (user?.role === 'member') return;
    setSelectedMemberName(record.user_name || 'Member');
    setSelectedMemberLoading(true);
    setHistoryModalVisible(true);
    try {
      const history = await api.getAttendanceHistory(record.user_id, undefined, undefined, MEMBER_HISTORY_MONTHS);
      setSelectedMemberHistory(history);
    } catch (error: any) {
      Alert.alert(t('Error'), error.response?.data?.detail || 'Failed to load attendance history');
      setHistoryModalVisible(false);
    } finally {
      setSelectedMemberLoading(false);
    }
  };

  const renderTodayItem = ({ item }: { item: AttendanceRecord }) => (
    <TouchableOpacity
      activeOpacity={user?.role === 'member' ? 1 : 0.85}
      onPress={() => openMemberHistory(item)}
      disabled={user?.role === 'member'}
      style={[styles.attendanceCard, { backgroundColor: theme.card }]}
    >
      <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
        <Text style={[styles.avatarText, { color: theme.primary }]}>
          {(item.user_name || 'U').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.attendanceInfo}>
        <Text style={[styles.attendanceName, { color: theme.text }]}>
          {item.user_name || t('Unknown')}
        </Text>
        <Text style={[styles.attendanceTime, { color: theme.textSecondary }]}>
          {`${t('In')}: ${format(toSystemDate(item.check_in_time), 'hh:mm a')}`}
          {item.check_out_time && ` • ${t('Out')}: ${format(toSystemDate(item.check_out_time), 'hh:mm a')}`}
        </Text>
      </View>
      <View style={[styles.methodBadge, { backgroundColor: getMethodColor(item.method) + '20' }]}>
        <Text style={[styles.methodText, { color: getMethodColor(item.method) }]}>
          {item.method.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.historyRailRow}>
      <View style={styles.historyRailTrack}>
        <View style={[styles.historyNode, { backgroundColor: theme.primary }]} />
        <View style={[styles.historyTrackLine, { backgroundColor: theme.border }]} />
      </View>
      <View style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.historyDate}>
          <Text style={[styles.historyDay, { color: theme.text }]}>
            {format(toSystemDate(item.check_in_time), 'dd')}
          </Text>
          <Text style={[styles.historyMonth, { color: theme.textSecondary }]}>
            {format(toSystemDate(item.check_in_time), 'MMM')}
          </Text>
        </View>
        <Text style={[styles.historyTime, { color: theme.text }]}>
          {format(toSystemDate(item.check_in_time), 'hh:mm a')} - 
          {item.check_out_time ? format(toSystemDate(item.check_out_time), ' hh:mm a') : ` ${t('Present')}`}
        </Text>
        <Text style={[styles.historyDuration, { color: theme.textSecondary }]}>
          {item.check_out_time ? 
            t('Duration: {duration}', { duration: calculateDuration(item.check_in_time, item.check_out_time) }) : 
            t('Still checked in')}
        </Text>
        {(item.auto_checked_out || item.penalty_applied) && (
          <Text style={[styles.penaltyText, { color: theme.error }]}>
            {item.penalty_note || 'Auto check-out applied with warning penalty'}
          </Text>
        )}
      </View>
    </View>
  );

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'qr': return theme.success;
      case 'manual': return theme.warning;
      default: return theme.primary;
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const diff = toSystemDate(end).getTime() - toSystemDate(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('Attendance')}</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>

        {/* Check In/Out Button for Members */}
        {user?.role === 'member' && (
          <View style={styles.checkInContainer}>
            <TouchableOpacity
              style={[
                styles.checkInButton,
                { backgroundColor: isCheckedIn ? 'rgba(255,89,89,0.88)' : 'rgba(52, 220, 167, 0.9)' },
              ]}
              onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
            >
              <>
                <Ionicons name={isCheckedIn ? 'log-out' : 'log-in'} size={28} color="#FFF" />
                <Text style={styles.checkInText}>{isCheckedIn ? t('Check Out') : t('Check In')}</Text>
              </>
            </TouchableOpacity>
            <Text style={styles.checkInStatus}>
              {isCheckedIn ? t('You are currently checked in. Use QR to check out.') : t('Tap to check in')}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'today' && { backgroundColor: theme.primary },
          ]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'today' ? '#FFF' : theme.textSecondary },
          ]}>
            {t('Today ({count})', { count: todayAttendance.length })}
          </Text>
        </TouchableOpacity>
        {user?.role === 'member' && (
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'history' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'history' ? '#FFF' : theme.textSecondary },
            ]}>
              {t('My History')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {activeTab === 'today' ? (
        <FlatList
          data={todayAttendance}
          renderItem={renderTodayItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t('No attendance records for today')}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={myHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t('No attendance history')}
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={historyModalVisible} animationType="slide" transparent={false} onRequestClose={() => setHistoryModalVisible(false)}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {selectedMemberName} - {t('Last {count} Months', { count: MEMBER_HISTORY_MONTHS })}
            </Text>
            <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          {selectedMemberLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <FlatList
              data={selectedMemberHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={60} color={theme.textSecondary} />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No attendance history
                  </Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroBanner: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 28,
    overflow: 'hidden',
    paddingBottom: 16,
    shadowColor: '#0B1626',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  date: {
    color: '#E0F4FF',
    fontSize: 14,
    marginTop: 4,
  },
  checkInContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: 224,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  checkInText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  checkInStatus: {
    color: '#D7F0FF',
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6EBF4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  attendanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6EBF4',
    shadowColor: '#0E1A2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  attendanceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  attendanceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  attendanceTime: {
    fontSize: 12,
    marginTop: 4,
  },
  methodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  methodText: {
    fontSize: 10,
    fontWeight: '600',
  },
  historyRailRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 12,
  },
  historyRailTrack: {
    width: 22,
    alignItems: 'center',
  },
  historyNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 18,
  },
  historyTrackLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  historyCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  historyDate: {
    width: 60,
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDay: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  historyMonth: {
    fontSize: 12,
  },
  historyInfo: {
    flex: 1,
    marginLeft: 16,
  },
  historyTime: {
    fontSize: 16,
    fontWeight: '500',
  },
  historyDuration: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  penaltyText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});
