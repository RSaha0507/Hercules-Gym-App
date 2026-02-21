import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [memberProfile, setMemberProfile] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadProfile = useCallback(async () => {
    if (user?.role === 'member' && user?.id) {
      try {
        const data = await api.getMember(user.id);
        setMemberProfile(data.profile);
      } catch (error) {
        console.log('Error loading profile:', error);
      }
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const MenuItem = ({ icon, label, onPress, color, showArrow = true, badge }: {
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
    showArrow?: boolean;
    badge?: string;
  }) => (
    <TouchableOpacity 
      style={[styles.menuItem, { backgroundColor: theme.card }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: (color || theme.primary) + '15' }]}>
        <Ionicons name={icon as any} size={22} color={color || theme.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: color || theme.text }]}>{label}</Text>
      {badge && (
        <View style={[styles.menuBadge, { backgroundColor: theme.primary }]}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      {showArrow && <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
          <TouchableOpacity 
            style={[styles.settingsButton, { backgroundColor: theme.card }]}
            onPress={toggleTheme}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
          <View style={styles.avatarContainer}>
            {user?.profile_image ? (
              <Image source={{ uri: user.profile_image }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.inputBg }]}>
                <Text style={[styles.avatarText, { color: theme.text }]}>
                  {user?.full_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.full_name}</Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.primary + '18' }]}>
            <Text style={[styles.roleText, { color: theme.primary }]}>
              {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
              {user?.is_primary_admin && ' (Primary)'}
            </Text>
          </View>

          {user?.center && (
            <View style={[styles.centerRow, { borderTopColor: theme.border }]}>
              <Ionicons name="location" size={16} color={theme.primary} />
              <Text style={[styles.centerText, { color: theme.text }]}>{user.center} Center</Text>
            </View>
          )}

          {memberProfile?.member_id && (
            <View style={styles.memberIdRow}>
              <Ionicons name="card" size={16} color={theme.textSecondary} />
              <Text style={[styles.memberIdText, { color: theme.textSecondary }]}>ID: {memberProfile.member_id}</Text>
            </View>
          )}
        </View>

        {/* Membership Status for Members */}
        {user?.role === 'member' && memberProfile?.membership && (
          <View style={[styles.membershipCard, { 
            backgroundColor: theme.card,
            borderLeftColor: memberProfile.membership.is_active ? theme.success : theme.error,
          }]}>
            <View style={styles.membershipHeader}>
              <View style={[
                styles.membershipStatus, 
                { backgroundColor: memberProfile.membership.is_active ? theme.success + '20' : theme.error + '20' }
              ]}>
                <Ionicons 
                  name={memberProfile.membership.is_active ? 'checkmark-circle' : 'alert-circle'} 
                  size={16} 
                  color={memberProfile.membership.is_active ? theme.success : theme.error} 
                />
                <Text style={[
                  styles.membershipStatusText, 
                  { color: memberProfile.membership.is_active ? theme.success : theme.error }
                ]}>
                  {memberProfile.membership.is_active ? 'Active' : 'Expired'}
                </Text>
              </View>
              <Text style={[styles.membershipPlan, { color: theme.text }]}>
                {memberProfile.membership.plan_name}
              </Text>
            </View>
            <View style={styles.membershipDates}>
              <View style={styles.membershipDate}>
                <Text style={[styles.membershipDateLabel, { color: theme.textSecondary }]}>Start</Text>
                <Text style={[styles.membershipDateValue, { color: theme.text }]}>
                  {new Date(memberProfile.membership.start_date).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.membershipDivider, { backgroundColor: theme.border }]} />
              <View style={styles.membershipDate}>
                <Text style={[styles.membershipDateLabel, { color: theme.textSecondary }]}>Expires</Text>
                <Text style={[styles.membershipDateValue, { color: theme.text }]}>
                  {new Date(memberProfile.membership.end_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        {user?.role === 'member' && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <Ionicons name="calendar" size={24} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {memberProfile?.attendance_count || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Visits</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <Ionicons name="flame" size={24} color="#F59E0B" />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {memberProfile?.streak || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Day Streak</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <Ionicons name="trophy" size={24} color="#10B981" />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {memberProfile?.goals_achieved || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Goals</Text>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Account</Text>
          <MenuItem icon="person-outline" label="Edit Profile" onPress={() => router.push('/profile/edit')} />
          {user?.role === 'member' && (
            <>
              <MenuItem icon="qr-code-outline" label="QR Check-In" onPress={() => router.push('/profile/checkin-qr' as any)} />
              <MenuItem icon="body-outline" label="Body Metrics" onPress={() => router.push('/profile/metrics' as any)} />
              <MenuItem icon="barbell-outline" label="My Workouts" onPress={() => router.push('/profile/workouts' as any)} />
              <MenuItem icon="nutrition-outline" label="My Diet Plan" onPress={() => router.push('/profile/diet' as any)} />
            </>
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Preferences</Text>
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.card }]} 
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={22} color={theme.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: theme.text }]}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
            <View style={[styles.toggle, { backgroundColor: isDark ? theme.primary : theme.inputBg }]}>
              <View style={[
                styles.toggleDot, 
                { backgroundColor: '#FFF', marginLeft: isDark ? 22 : 2 }
              ]} />
            </View>
          </TouchableOpacity>
          <MenuItem icon="notifications-outline" label="Notifications" onPress={() => router.push('/profile/notifications')} />
          <MenuItem icon="language-outline" label="Language" onPress={() => router.push('/profile/language' as any)} badge="English" />
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Support</Text>
          <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => router.push('/profile/help')} />
          <MenuItem icon="document-text-outline" label="Terms of Service" onPress={() => router.push('/profile/terms' as any)} />
          <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => router.push('/profile/privacy' as any)} />
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: theme.error + '10' }]} 
            onPress={() => setShowLogoutModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color={theme.error} />
            <Text style={[styles.logoutText, { color: theme.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={[styles.version, { color: theme.textSecondary }]}>Hercules Gym v1.0.0</Text>
          <Text style={[styles.copyright, { color: theme.textSecondary }]}>© 2024 Hercules Fitness</Text>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: theme.error + '15' }]}>
              <Ionicons name="log-out-outline" size={48} color={theme.error} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Logout</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Are you sure you want to logout from your account?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: theme.border }]}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: theme.error }]}
                onPress={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Logout</Text>
                )}
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  profileCard: {
    marginHorizontal: 20,
    padding: 22,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF2',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
  },
  userName: {
    fontSize: 34,
    fontWeight: '800',
    marginTop: 14,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 4,
  },
  roleBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    width: '100%',
    justifyContent: 'center',
  },
  centerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  memberIdText: {
    fontSize: 14,
  },
  membershipCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  membershipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membershipStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  membershipStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  membershipPlan: {
    fontSize: 16,
    fontWeight: '600',
  },
  membershipDates: {
    flexDirection: 'row',
    marginTop: 16,
  },
  membershipDate: {
    flex: 1,
  },
  membershipDateLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  membershipDateValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  membershipDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  menuSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: 14,
    fontWeight: '500',
  },
  menuBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  menuBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  version: {
    fontSize: 13,
  },
  copyright: {
    fontSize: 11,
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
    textAlign: 'center',
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
});
