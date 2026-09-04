import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { toSystemDate } from '../../src/utils/time';
import { format } from 'date-fns';

const MEMBER_HISTORY_MONTHS = 5;

interface AttendanceRecord {
  id: string;
  check_in_time: string;
  check_out_time?: string;
}

export default function MemberDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id || '';
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [memberData, setMemberData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAchievementEditor, setShowAchievementEditor] = useState(false);
  const [achievementsInput, setAchievementsInput] = useState('');
  const [savingAchievements, setSavingAchievements] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [attendanceHistoryLoading, setAttendanceHistoryLoading] = useState(false);

  // Monthly Weight & Progress Analytics
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightMonth, setWeightMonth] = useState(new Date().toISOString().slice(0, 7));
  const [weightValue, setWeightValue] = useState('');
  const [weightNotes, setWeightNotes] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const loadMonthlyWeights = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getMemberProgressAnalytics(id);
      setAnalyticsData(data);
    } catch (err) {
      console.log('Error loading progress analytics for member:', err);
    }
  }, [id]);

  const loadMember = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getMember(id);
      setMemberData(data);
      setAchievementsInput((data?.user?.achievements || data?.achievements || []).join('\n'));
      loadMonthlyWeights();
    } catch (error) {
      console.log('Error loading member:', error);
      Alert.alert('Error', 'Failed to load member details');
    } finally {
      setIsLoading(false);
    }
  }, [id, loadMonthlyWeights]);

  const handleSaveMonthlyWeight = async () => {
    const val = parseFloat(weightValue);
    if (!weightMonth.trim() || isNaN(val) || val < 20 || val > 350) {
      Alert.alert('Invalid Input', 'Please enter a valid month (YYYY-MM, e.g. 2026-09) and weight between 20 and 350 kg.');
      return;
    }
    setSavingWeight(true);
    try {
      await api.logMemberMonthlyWeight(id, {
        month: weightMonth.trim(),
        weight_kg: val,
        notes: weightNotes.trim(),
      });
      Alert.alert('Success', `Recorded ${val} kg for ${weightMonth}`);
      setShowWeightModal(false);
      setWeightValue('');
      setWeightNotes('');
      loadMember();
      loadMonthlyWeights();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to log monthly weight');
    } finally {
      setSavingWeight(false);
    }
  };

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  const loadAttendanceHistory = useCallback(async () => {
    if (user?.role !== 'admin' && user?.role !== 'trainer') return;
    setAttendanceHistoryLoading(true);
    try {
      const records = await api.getAttendanceHistory(id, undefined, undefined, MEMBER_HISTORY_MONTHS);
      setAttendanceHistory(records || []);
    } catch (error: any) {
      console.log('Error loading member attendance history:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load attendance history');
    } finally {
      setAttendanceHistoryLoading(false);
    }
  }, [id, user?.role]);

  useEffect(() => {
    loadAttendanceHistory();
  }, [loadAttendanceHistory]);

  const handlePermanentDelete = () => {
    Alert.alert(
      'Delete Member Forever',
      'This will permanently delete this member account and all related records. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteMember(id);
              Alert.alert('Success', 'Member deleted permanently');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete member');
            }
          },
        },
      ]
    );
  };

  const handleToggleActivation = async () => {
    const isActive = Boolean(memberData?.user?.is_active);
    const title = isActive ? 'Deactivate Member' : 'Activate Member';
    const message = isActive
      ? 'This will keep the member in list but stop login and pause payment cycle. Continue?'
      : 'This will reactivate login and restart the payment cycle from today. Continue?';
    const actionText = isActive ? 'Deactivate' : 'Activate';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: actionText,
        style: 'default',
        onPress: async () => {
          try {
            if (isActive) {
              await api.deactivateMember(id);
              Alert.alert('Success', 'Member deactivated successfully');
            } else {
              await api.activateMember(id);
              Alert.alert('Success', 'Member activated and payment cycle restarted');
            }
            await loadMember();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || `Failed to ${actionText.toLowerCase()} member`);
          }
        },
      },
    ]);
  };

  const InfoRow = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
      <Ionicons name={icon as any} size={20} color={theme.textSecondary} />
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!memberData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.text }]}>Member not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: theme.primary }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { user: memberUser, profile } = memberData;
  const achievements = memberUser?.achievements || [];

  const saveAchievements = async () => {
    if (!memberUser?.id) return;
    setSavingAchievements(true);
    try {
      const parsed = achievementsInput
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
      await api.updateUserAchievements(memberUser.id, parsed);
      await loadMember();
      setShowAchievementEditor(false);
      Alert.alert('Success', 'Achievements updated');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update achievements');
    } finally {
      setSavingAchievements(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Member Details</Text>
        {user?.role === 'admin' && (
          <TouchableOpacity onPress={handlePermanentDelete}>
            <Ionicons name="trash-outline" size={24} color={theme.error} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {memberUser.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.memberName, { color: theme.text }]}>{memberUser.full_name}</Text>
          <Text style={[styles.memberId, { color: theme.textSecondary }]}>{profile?.member_id}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: memberUser.is_active ? theme.success + '20' : theme.error + '20' }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: memberUser.is_active ? theme.success : theme.error }
            ]}>
              {memberUser.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Membership Info */}
        {profile?.membership && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Membership</Text>
            <InfoRow 
              icon="card-outline" 
              label="Plan" 
              value={profile.membership.plan_name} 
            />
            <InfoRow 
              icon="calendar-outline" 
              label="Start Date" 
              value={format(toSystemDate(profile.membership.start_date), 'MMM d, yyyy')} 
            />
            <InfoRow 
              icon="calendar" 
              label="End Date" 
              value={format(toSystemDate(profile.membership.end_date), 'MMM d, yyyy')} 
            />
            <InfoRow 
              icon="cash-outline" 
              label="Amount" 
              value={`₹${profile.membership.amount}`} 
            />
          </View>
        )}

        {/* Contact Info */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Information</Text>
          <InfoRow icon="mail-outline" label="Email" value={memberUser.email} />
          <InfoRow icon="call-outline" label="Phone" value={memberUser.phone} />
          <InfoRow icon="location-outline" label="Address" value={profile?.address} />
        </View>

        {/* Emergency Contact */}
        {profile?.emergency_contact && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Emergency Contact</Text>
            <InfoRow icon="person-outline" label="Name" value={profile.emergency_contact.name} />
            <InfoRow icon="call-outline" label="Phone" value={profile.emergency_contact.phone} />
            <InfoRow icon="heart-outline" label="Relationship" value={profile.emergency_contact.relationship} />
          </View>
        )}

        {/* Medical Notes */}
        {profile?.medical_notes && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Medical Notes</Text>
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>
              {profile.medical_notes}
            </Text>
          </View>
        )}

        {/* Goals */}
        {profile?.goals && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Fitness Goals</Text>
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>
              {profile.goals}
            </Text>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Achievements</Text>
            {user?.role === 'admin' && (
              <TouchableOpacity onPress={() => setShowAchievementEditor(true)}>
                <Ionicons name="create-outline" size={18} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>
          {achievements.length === 0 ? (
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>No achievements yet</Text>
          ) : (
            achievements.map((achievement: string, index: number) => (
              <View key={`${achievement}-${index}`} style={styles.achievementRow}>
                <Ionicons name="star" size={14} color={theme.warning} />
                <Text style={[styles.notesText, { color: theme.text }]}>{achievement}</Text>
              </View>
            ))
          )}
        </View>

        {(user?.role === 'admin' || user?.role === 'trainer') && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Attendance ({t('Last {count} Months', { count: MEMBER_HISTORY_MONTHS })})
              </Text>
              <TouchableOpacity onPress={loadAttendanceHistory} disabled={attendanceHistoryLoading}>
                <Ionicons name="refresh" size={18} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {attendanceHistoryLoading ? (
              <View style={styles.inlineLoader}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : attendanceHistory.length === 0 ? (
              <Text style={[styles.notesText, { color: theme.textSecondary }]}>No attendance history</Text>
            ) : (
              attendanceHistory.map((record) => (
                <View key={record.id} style={[styles.attendanceRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.attendanceDateWrap}>
                    <Text style={[styles.attendanceDate, { color: theme.text }]}>
                      {format(toSystemDate(record.check_in_time), 'MMM d, yyyy')}
                    </Text>
                    <Text style={[styles.attendanceTime, { color: theme.textSecondary }]}>
                      In: {format(toSystemDate(record.check_in_time), 'hh:mm a')}
                    </Text>
                    <Text style={[styles.attendanceTime, { color: theme.textSecondary }]}>
                      Out: {record.check_out_time ? format(toSystemDate(record.check_out_time), 'hh:mm a') : 'N/A'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Monthly Weight & Progress Analytics Section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Monthly Weight & Progress Analytics
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                Official weight check-ins logged by trainers & member workout progress
              </Text>
            </View>
            {(user?.role === 'admin' || user?.role === 'trainer') && (
              <TouchableOpacity
                style={{
                  backgroundColor: theme.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
                onPress={() => setShowWeightModal(true)}
              >
                <Ionicons name="scale-outline" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>+ Log Weight</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Metrics Bar */}
          <View style={{ flexDirection: 'row', gap: 10, marginVertical: 12 }}>
            <View style={{ flex: 1, backgroundColor: theme.inputBg, padding: 10, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>Start Weight</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginTop: 2 }}>
                {analyticsData?.weight_summary?.starting_weight ? `${analyticsData.weight_summary.starting_weight} kg` : '--'}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.inputBg, padding: 10, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>Current Weight</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.primary, marginTop: 2 }}>
                {analyticsData?.weight_summary?.current_weight ? `${analyticsData.weight_summary.current_weight} kg` : '--'}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.inputBg, padding: 10, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>Total Workouts</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#8b5cf6', marginTop: 2 }}>
                {analyticsData?.workout_summary?.total_sessions || 0}
              </Text>
            </View>
          </View>

          {/* Monthly Weights Logged */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginTop: 6, marginBottom: 8 }}>
            Trainer Check-in History
          </Text>
          {(!analyticsData?.monthly_weights || analyticsData.monthly_weights.length === 0) ? (
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>
              No monthly weight logged yet. Tap "+ Log Weight" above to record this month's check-in.
            </Text>
          ) : (
            analyticsData.monthly_weights.map((w: any, idx: number) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: theme.primary + '18', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primary }}>{w.month}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{w.weight_kg} kg</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>Recorded by {w.logged_by_name}</Text>
                  </View>
                </View>
                {w.notes ? (
                  <Text style={{ fontSize: 12, color: theme.textSecondary, fontStyle: 'italic', maxWidth: '40%', textAlign: 'right' }}>
                    "{w.notes}"
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push(`/chat/${memberUser.id}`)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Message</Text>
          </TouchableOpacity>
          {(user?.role === 'admin' || user?.role === 'trainer') && (
            <>
              {user?.role === 'admin' && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: memberUser.is_active ? theme.warning : theme.success },
                  ]}
                  onPress={handleToggleActivation}
                >
                  <Ionicons name={memberUser.is_active ? 'pause-circle-outline' : 'play-circle-outline'} size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>{memberUser.is_active ? 'Deactivate' : 'Activate'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.secondary }]}
                onPress={() => router.push(`/member/${id}/workout`)}
              >
                <Ionicons name="barbell-outline" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Workouts</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.warning }]}
                onPress={() => router.push(`/member/${id}/diet`)}
              >
                <Ionicons name="nutrition-outline" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Diet</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.success }]}
                onPress={() => router.push(`/member/${id}/metrics`)}
              >
                <Ionicons name="analytics-outline" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Metrics</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <Modal visible={showAchievementEditor} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Achievements</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Add one achievement per line
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBg }]}
              value={achievementsInput}
              onChangeText={setAchievementsInput}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.border }]}
                onPress={() => setShowAchievementEditor(false)}
                disabled={savingAchievements}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={saveAchievements}
                disabled={savingAchievements}
              >
                {savingAchievements ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Monthly Weight Check-In Modal (Trainer / Admin Only) */}
      <Modal visible={showWeightModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Ionicons name="scale-outline" size={20} color={theme.primary} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>Log Monthly Weight</Text>
            </View>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Official trainer measurement for {memberUser?.full_name || 'Member'}
            </Text>

            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, marginBottom: 4, marginTop: 6 }}>
              Check-In Month (YYYY-MM):
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  minHeight: 44,
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.inputBg,
                  marginBottom: 10,
                },
              ]}
              value={weightMonth}
              onChangeText={setWeightMonth}
              placeholder="2026-09"
              placeholderTextColor={theme.textSecondary}
            />

            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, marginBottom: 4 }}>
              Body Weight (kg):
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  minHeight: 44,
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.inputBg,
                  marginBottom: 10,
                },
              ]}
              value={weightValue}
              onChangeText={setWeightValue}
              placeholder="e.g. 74.5"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />

            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, marginBottom: 4 }}>
              Trainer Notes / Progress Remarks (optional):
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  minHeight: 70,
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.inputBg,
                  marginBottom: 10,
                },
              ]}
              value={weightNotes}
              onChangeText={setWeightNotes}
              placeholder="e.g. Noticeable muscle tone, body fat down ~1%"
              placeholderTextColor={theme.textSecondary}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.border }]}
                onPress={() => setShowWeightModal(false)}
                disabled={savingWeight}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveMonthlyWeight}
                disabled={savingWeight}
              >
                {savingWeight ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Save Weight</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
  },
  backLink: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
  },
  memberId: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 16,
    marginTop: 2,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inlineLoader: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  attendanceRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  attendanceDateWrap: {
    gap: 2,
  },
  attendanceDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  attendanceTime: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  actionButton: {
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 130,
    padding: 10,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  modalButton: {
    minWidth: 90,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
