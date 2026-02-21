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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
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
  method: 'qr' | 'manual' | 'self';
}

export default function AttendanceScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [myHistory, setMyHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

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
        const history = await api.getAttendanceHistory(user.id);
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

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCheckIn = async () => {
    if (!user?.id) return;
    
    setCheckingIn(true);
    try {
      await api.checkIn(user.id, 'self');
      setIsCheckedIn(true);
      Alert.alert('Success', 'You have been checked in!');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to check in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user?.id) return;
    
    setCheckingIn(true);
    try {
      await api.checkOut(user.id);
      setIsCheckedIn(false);
      Alert.alert('Success', 'You have been checked out!');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to check out');
    } finally {
      setCheckingIn(false);
    }
  };

  const renderTodayItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={[styles.attendanceCard, { backgroundColor: theme.card }]}>
      <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
        <Text style={[styles.avatarText, { color: theme.primary }]}>
          {(item.user_name || 'U').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.attendanceInfo}>
        <Text style={[styles.attendanceName, { color: theme.text }]}>
          {item.user_name || 'Unknown'}
        </Text>
        <Text style={[styles.attendanceTime, { color: theme.textSecondary }]}>
          In: {format(toSystemDate(item.check_in_time), 'hh:mm a')}
          {item.check_out_time && ` • Out: ${format(toSystemDate(item.check_out_time), 'hh:mm a')}`}
        </Text>
      </View>
      <View style={[styles.methodBadge, { backgroundColor: getMethodColor(item.method) + '20' }]}>
        <Text style={[styles.methodText, { color: getMethodColor(item.method) }]}>
          {item.method.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={[styles.historyCard, { backgroundColor: theme.card }]}>
      <View style={styles.historyDate}>
        <Text style={[styles.historyDay, { color: theme.text }]}>
          {format(toSystemDate(item.check_in_time), 'dd')}
        </Text>
        <Text style={[styles.historyMonth, { color: theme.textSecondary }]}>
          {format(toSystemDate(item.check_in_time), 'MMM')}
        </Text>
      </View>
      <View style={styles.historyInfo}>
        <Text style={[styles.historyTime, { color: theme.text }]}>
          {format(toSystemDate(item.check_in_time), 'hh:mm a')} - 
          {item.check_out_time ? format(toSystemDate(item.check_out_time), ' hh:mm a') : ' Present'}
        </Text>
        <Text style={[styles.historyDuration, { color: theme.textSecondary }]}>
          {item.check_out_time ? 
            `Duration: ${calculateDuration(item.check_in_time, item.check_out_time)}` : 
            'Still checked in'}
        </Text>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Attendance</Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {format(new Date(), 'EEEE, MMMM d')}
        </Text>
      </View>

      {/* Check In/Out Button for Members */}
      {user?.role === 'member' && (
        <View style={styles.checkInContainer}>
          <TouchableOpacity
            style={[
              styles.checkInButton,
              { backgroundColor: isCheckedIn ? theme.error : theme.success },
            ]}
            onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={checkingIn}
          >
            {checkingIn ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons 
                  name={isCheckedIn ? 'log-out' : 'log-in'} 
                  size={28} 
                  color="#FFF" 
                />
                <Text style={styles.checkInText}>
                  {isCheckedIn ? 'Check Out' : 'Check In'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={[styles.checkInStatus, { color: theme.textSecondary }]}>
            {isCheckedIn ? 'You are currently checked in' : 'Tap to check in'}
          </Text>
        </View>
      )}

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
            Today ({todayAttendance.length})
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
              My History
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
                No attendance records for today
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
                No attendance history
              </Text>
            </View>
          }
        />
      )}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  checkInContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: 200,
    height: 60,
    borderRadius: 30,
  },
  checkInText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  checkInStatus: {
    marginTop: 12,
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
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
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  historyDate: {
    width: 50,
    alignItems: 'center',
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
});
