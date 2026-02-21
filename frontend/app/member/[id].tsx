import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';
import { toSystemDate } from '../../src/utils/time';
import { format } from 'date-fns';

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [memberData, setMemberData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMember = useCallback(async () => {
    try {
      const data = await api.getMember(id);
      setMemberData(data);
    } catch (error) {
      console.log('Error loading member:', error);
      Alert.alert('Error', 'Failed to load member details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  const handleDelete = () => {
    Alert.alert(
      'Deactivate Member',
      'Are you sure you want to deactivate this member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteMember(id);
              Alert.alert('Success', 'Member deactivated');
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to deactivate member');
            }
          },
        },
      ]
    );
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Member Details</Text>
        {user?.role === 'admin' && (
          <TouchableOpacity onPress={handleDelete}>
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
});
