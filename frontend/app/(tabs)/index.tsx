import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { api, GYM_CENTERS } from '../../src/services/api';
import { socketService } from '../../src/services/socket';

interface DashboardData {
  // Admin
  total_members?: number;
  active_members?: number;
  total_trainers?: number;
  today_attendance?: number;
  monthly_revenue?: number;
  expiring_memberships?: number;
  pending_approvals?: number;
  pending_orders?: number;
  centers?: string[];
  // Trainer
  assigned_members?: number;
  unread_messages?: number;
  center?: string;
  // Member
  membership_valid?: boolean;
  days_remaining?: number;
  attendance_this_month?: number;
  has_today_workout?: boolean;
  member_id?: string;
  payment_due?: boolean;
  unread_notifications?: number;
  approval_status?: string;
}

export default function HomeScreen() {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const userRef = useRef(user);
  const updateUserRef = useRef(updateUser);
  const userId = user?.id;
  const userRole = user?.role;
  const userApprovalStatus = user?.approval_status;

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    updateUserRef.current = updateUser;
  }, [updateUser]);

  const loadData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      // Load dashboard data based on role
      let dashboardData;
      if (userRole === 'admin') {
        dashboardData = await api.getAdminDashboard(selectedCenter || undefined);
      } else if (userRole === 'trainer') {
        dashboardData = await api.getTrainerDashboard();
      } else {
        dashboardData = await api.getMemberDashboard();

        // Keep local auth state in sync after approval changes.
        if (
          userRef.current &&
          dashboardData?.approval_status &&
          userApprovalStatus !== dashboardData.approval_status
        ) {
          updateUserRef.current({ ...userRef.current, approval_status: dashboardData.approval_status });
        }
      }
      setDashboard(dashboardData);

      // Load announcements
      const announcementsData = await api.getAnnouncements();
      setAnnouncements(announcementsData.slice(0, 5));
    } catch (error) {
      console.log('Error loading dashboard:', error);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedCenter, userApprovalStatus, userRole]);

  useEffect(() => {
    loadData();
    
    // Connect socket
    if (userId) {
      socketService.connect(userId);
      socketService.onAnnouncement((announcement) => {
        setAnnouncements((prev) => [announcement, ...prev.slice(0, 4)]);
      });
    }

    return () => {
      socketService.offAnnouncement();
    };
  }, [loadData, userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const StatCard = ({ icon, label, value, color, onPress }: { icon: string; label: string; value: string | number; color: string; onPress?: () => void }) => (
    <TouchableOpacity 
      style={[styles.statCard, { backgroundColor: theme.card }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  // Show pending approval message for users awaiting approval
  if (user?.approval_status === 'pending') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.pendingContainer}>
          <Image
            source={require('../../assets/images/hercules-logo.png')}
            style={styles.pendingLogo}
            resizeMode="contain"
          />
          <View style={[styles.pendingCard, { backgroundColor: theme.warning + '20' }]}>
            <Ionicons name="time" size={48} color={theme.warning} />
            <Text style={[styles.pendingTitle, { color: theme.text }]}>Approval Pending</Text>
            <Text style={[styles.pendingText, { color: theme.textSecondary }]}>
              Your registration is awaiting approval. You will be notified once it is approved.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: theme.primary }]}
            onPress={loadData}
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text style={styles.refreshText}>Check Status</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderAdminDashboard = () => (
    <>
      {/* Center Filter */}
      <View style={styles.centerFilter}>
        <TouchableOpacity
          style={[
            styles.centerChip,
            { backgroundColor: !selectedCenter ? theme.primary : theme.inputBg }
          ]}
          onPress={() => setSelectedCenter(null)}
        >
          <Text style={[styles.centerChipText, { color: !selectedCenter ? '#FFF' : theme.text }]}>
            All Centers
          </Text>
        </TouchableOpacity>
        {GYM_CENTERS.map((center) => (
          <TouchableOpacity
            key={center}
            style={[
              styles.centerChip,
              { backgroundColor: selectedCenter === center ? theme.primary : theme.inputBg }
            ]}
            onPress={() => setSelectedCenter(center)}
          >
            <Text style={[styles.centerChipText, { color: selectedCenter === center ? '#FFF' : theme.text }]}>
              {center}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="people" label="Total Members" value={dashboard?.total_members || 0} color={theme.primary} onPress={() => router.push('/(tabs)/members')} />
        <StatCard icon="checkmark-circle" label="Active" value={dashboard?.active_members || 0} color={theme.success} onPress={() => router.push('/(tabs)/members')} />
        <StatCard icon="fitness" label="Trainers" value={dashboard?.total_trainers || 0} color={theme.secondary} onPress={() => router.push('/trainers' as any)} />
        <StatCard icon="calendar-outline" label="Today's Attendance" value={dashboard?.today_attendance || 0} color={theme.warning} />
      </View>

      {/* Revenue Card - Admin Only */}
      <View style={[styles.revenueCard, { backgroundColor: theme.card }]}>
        <View style={styles.revenueHeader}>
          <Ionicons name="cash-outline" size={28} color={theme.success} />
          <View style={styles.revenueInfo}>
            <Text style={[styles.revenueValue, { color: theme.text }]}>
              ₹{(dashboard?.monthly_revenue || 0).toLocaleString()}
            </Text>
            <Text style={[styles.revenueLabel, { color: theme.textSecondary }]}>This Month Revenue</Text>
          </View>
        </View>
      </View>

      {/* Alert Cards */}
      <View style={styles.alertsRow}>
        {(dashboard?.pending_approvals || 0) > 0 && (
          <TouchableOpacity
            style={[styles.alertCard, { backgroundColor: theme.warning + '20' }]}
            onPress={() => router.push('/(tabs)/approvals')}
          >
            <Ionicons name="person-add" size={24} color={theme.warning} />
            <Text style={[styles.alertValue, { color: theme.text }]}>{dashboard?.pending_approvals}</Text>
            <Text style={[styles.alertLabel, { color: theme.textSecondary }]}>Pending Approvals</Text>
          </TouchableOpacity>
        )}
        {(dashboard?.pending_orders || 0) > 0 && (
          <TouchableOpacity
            style={[styles.alertCard, { backgroundColor: theme.primary + '20' }]}
            onPress={() => router.push('/merchandise/orders' as any)}
          >
            <Ionicons name="cart" size={24} color={theme.primary} />
            <Text style={[styles.alertValue, { color: theme.text }]}>{dashboard?.pending_orders}</Text>
            <Text style={[styles.alertLabel, { color: theme.textSecondary }]}>Pending Orders</Text>
          </TouchableOpacity>
        )}
        {(dashboard?.expiring_memberships || 0) > 0 && (
          <TouchableOpacity
            style={[styles.alertCard, { backgroundColor: theme.error + '20' }]}
            onPress={() => router.push('/(tabs)/members')}
          >
            <Ionicons name="alert-circle" size={24} color={theme.error} />
            <Text style={[styles.alertValue, { color: theme.text }]}>{dashboard?.expiring_memberships}</Text>
            <Text style={[styles.alertLabel, { color: theme.textSecondary }]}>Expiring Soon</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const renderTrainerDashboard = () => (
    <>
      {/* Center Badge */}
      <View style={[styles.centerBadgeContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="location" size={20} color={theme.primary} />
        <Text style={[styles.centerBadgeText, { color: theme.text }]}>
          {dashboard?.center || user?.center || 'Your Center'}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard 
          icon="people" 
          label="Assigned Members" 
          value={dashboard?.assigned_members || 0} 
          color={theme.primary}
          onPress={() => router.push('/(tabs)/members')}
        />
        <StatCard 
          icon="calendar-outline" 
          label="Today's Attendance" 
          value={dashboard?.today_attendance || 0} 
          color={theme.success} 
        />
        <StatCard 
          icon="chatbubbles" 
          label="Unread Messages" 
          value={dashboard?.unread_messages || 0} 
          color={theme.warning}
          onPress={() => router.push('/(tabs)/messages')}
        />
        {(dashboard?.pending_approvals || 0) > 0 && (
          <StatCard 
            icon="person-add" 
            label="Pending Approvals" 
            value={dashboard?.pending_approvals || 0} 
            color={theme.error}
            onPress={() => router.push('/(tabs)/approvals')}
          />
        )}
      </View>
    </>
  );

  const renderMemberDashboard = () => (
    <>
      {/* Center Badge */}
      <View style={[styles.centerBadgeContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="location" size={20} color={theme.primary} />
        <Text style={[styles.centerBadgeText, { color: theme.text }]}>
          {dashboard?.center || user?.center || 'Your Center'}
        </Text>
      </View>

      {/* Payment Due Alert */}
      {dashboard?.payment_due && (
        <TouchableOpacity 
          style={[styles.paymentAlert, { backgroundColor: theme.error + '20' }]}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Ionicons name="alert-circle" size={24} color={theme.error} />
          <View style={styles.paymentAlertInfo}>
            <Text style={[styles.paymentAlertTitle, { color: theme.error }]}>Payment Due!</Text>
            <Text style={[styles.paymentAlertText, { color: theme.textSecondary }]}>
              Your subscription payment is due. Please contact the gym.
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={[styles.membershipCard, { backgroundColor: dashboard?.membership_valid ? theme.success + '20' : theme.error + '20' }]}>
        <View style={styles.membershipHeader}>
          <View style={[styles.membershipBadge, { backgroundColor: dashboard?.membership_valid ? theme.success : theme.error }]}>
            <Ionicons name={dashboard?.membership_valid ? 'checkmark' : 'close'} size={16} color="#FFF" />
          </View>
          <Text style={[styles.membershipTitle, { color: theme.text }]}>
            {dashboard?.membership_valid ? 'Active Membership' : 'Membership Expired'}
          </Text>
        </View>
        {dashboard?.membership_valid && (
          <Text style={[styles.membershipDays, { color: theme.text }]}>
            {dashboard?.days_remaining} days remaining
          </Text>
        )}
        <Text style={[styles.memberId, { color: theme.textSecondary }]}>Member ID: {dashboard?.member_id || 'N/A'}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="calendar" label="This Month" value={dashboard?.attendance_this_month || 0} color={theme.primary} />
        <StatCard icon="barbell" label="Today's Workout" value={dashboard?.has_today_workout ? 'Yes' : 'No'} color={theme.success} />
        <StatCard 
          icon="chatbubbles" 
          label="Messages" 
          value={dashboard?.unread_messages || 0} 
          color={theme.warning}
          onPress={() => router.push('/(tabs)/messages')}
        />
        <StatCard 
          icon="notifications" 
          label="Notifications" 
          value={dashboard?.unread_notifications || 0} 
          color={theme.secondary}
          onPress={() => router.push('/notifications' as any)}
        />
      </View>
    </>
  );

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
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: theme.text }]}>{user?.full_name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.roleBadge, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.roleText, { color: theme.primary }]}>
                  {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
                </Text>
              </View>
              {user?.is_primary_admin && (
                <View style={[styles.roleBadge, { backgroundColor: theme.warning + '20' }]}>
                  <Text style={[styles.roleText, { color: theme.warning }]}>Primary Admin</Text>
                </View>
              )}
            </View>
          </View>
          <Image
            source={require('../../assets/images/hercules-logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        {/* Dashboard Stats */}
        <View style={styles.dashboardContainer}>
          {user?.role === 'admin' && renderAdminDashboard()}
          {user?.role === 'trainer' && renderTrainerDashboard()}
          {user?.role === 'member' && renderMemberDashboard()}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {user?.role === 'member' && (
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/(tabs)/attendance')}
              >
                <Ionicons name="qr-code" size={24} color="#FFF" />
                <Text style={styles.quickActionText}>Check In</Text>
              </TouchableOpacity>
            )}
            {(user?.role === 'admin' || user?.role === 'trainer') && (
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/(tabs)/members')}
              >
                <Ionicons name="person-add" size={24} color="#FFF" />
                <Text style={styles.quickActionText}>Members</Text>
              </TouchableOpacity>
            )}
            {user?.role !== 'admin' && (
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: theme.secondary }]}
                onPress={() => router.push('/(tabs)/merchandise')}
              >
                <Ionicons name="shirt" size={24} color="#FFF" />
                <Text style={styles.quickActionText}>Shop</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.success }]}
              onPress={() => router.push('/(tabs)/messages')}
            >
              <Ionicons name="chatbubbles" size={24} color="#FFF" />
              <Text style={styles.quickActionText}>Messages</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Announcements</Text>
            {user?.role === 'admin' && (
              <TouchableOpacity onPress={() => router.push('/announcements/create')}>
                <Ionicons name="add-circle" size={24} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>
          {announcements.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
              <Ionicons name="megaphone-outline" size={40} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No announcements yet</Text>
            </View>
          ) : (
            announcements.map((announcement, index) => (
              <View key={announcement.id || index} style={[styles.announcementCard, { backgroundColor: theme.card }]}>
                <View style={styles.announcementHeader}>
                  <Ionicons name="megaphone" size={20} color={theme.primary} />
                  <Text style={[styles.announcementTitle, { color: theme.text }]}>{announcement.title}</Text>
                </View>
                <Text style={[styles.announcementContent, { color: theme.textSecondary }]} numberOfLines={2}>
                  {announcement.content}
                </Text>
                <Text style={[styles.announcementDate, { color: theme.textSecondary }]}>
                  {new Date(announcement.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))
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
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pendingLogo: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  pendingCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    width: '100%',
    gap: 12,
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  pendingText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  refreshText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerLogo: {
    width: 60,
    height: 60,
  },
  dashboardContainer: {
    paddingHorizontal: 20,
  },
  centerFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  centerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  centerChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  centerBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  centerBadgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  revenueCard: {
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  revenueInfo: {},
  revenueValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  revenueLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  alertsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  alertCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  alertValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6,
  },
  alertLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  paymentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  paymentAlertInfo: {
    flex: 1,
  },
  paymentAlertTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentAlertText: {
    fontSize: 12,
    marginTop: 2,
  },
  membershipCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  membershipBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membershipTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  membershipDays: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  memberId: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyCard: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  announcementCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  announcementContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  announcementDate: {
    fontSize: 12,
    marginTop: 8,
  },
});
