import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
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

interface Member {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  is_active: boolean;
  member_id: string;
  membership?: {
    plan_name: string;
    end_date: string;
    is_active: boolean;
  };
}

export default function MembersScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const loadMembers = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const data = await api.getMembers();
      setMembers(data);
      setFilteredMembers(data);
    } catch (error) {
      console.log('Error loading members:', error);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      loadMembers();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadMembers]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = members.filter(
        (member) =>
          member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.member_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchQuery, members]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMembers();
  };

  const getMembershipStatus = (member: Member) => {
    if (!member.membership) return { text: t('No Plan'), color: theme.textSecondary };
    const endDate = new Date(member.membership.end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) return { text: t('Expired'), color: theme.error };
    if (daysRemaining <= 7) return { text: t('{days}d left', { days: daysRemaining }), color: theme.warning };
    return { text: t('Active'), color: theme.success };
  };

  const renderMemberItem = ({ item }: { item: Member }) => {
    const status = getMembershipStatus(item);
    
    return (
      <TouchableOpacity
        style={styles.memberRailRow}
        onPress={() => router.push(`/member/${item.id}`)}
      >
        <View style={styles.memberRail}>
          <View style={[styles.memberNode, { backgroundColor: status.color }]} />
          <View style={[styles.memberLine, { backgroundColor: theme.border }]} />
        </View>
        <View style={[styles.memberCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {item.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={[styles.memberName, { color: theme.text }]}>{item.full_name}</Text>
            <Text style={[styles.memberId, { color: theme.textSecondary }]}>{item.member_id}</Text>
            <Text style={[styles.memberEmail, { color: theme.textSecondary }]}>{item.email}</Text>
          </View>
          <View style={styles.memberStatus}>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    );
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
      <View pointerEvents="none" style={styles.glassBlobOne} />
      <View pointerEvents="none" style={styles.glassBlobTwo} />

      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroPane}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('Members')}</Text>
          {user?.role === 'admin' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/member/create')}
            >
              <Ionicons name="add" size={24} color="#EAF8FF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInput, { borderColor: 'rgba(255,255,255,0.28)' }]}>
            <Ionicons name="search" size={20} color="#D8EEFF" />
            <TextInput
              style={styles.searchText}
              placeholder={t('Search members...')}
              placeholderTextColor="#D8EEFF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#D8EEFF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{members.length}</Text>
            <Text style={styles.statLabel}>{t('Total')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#B8FFE7' }]}>
              {members.filter((m) => m.is_active).length}
            </Text>
            <Text style={styles.statLabel}>{t('Active')}</Text>
          </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FFD8D8' }]}>
                {members.filter((m) => !m.is_active).length}
              </Text>
            <Text style={styles.statLabel}>{t('Inactive')}</Text>
            </View>
          </View>
        </LinearGradient>

      {/* Members List */}
      <FlatList
        data={filteredMembers}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {searchQuery ? t('No members found') : t('No members yet')}
              </Text>
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
  glassBlobOne: {
    position: 'absolute',
    top: 78,
    left: -36,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(97, 209, 255, 0.14)',
  },
  glassBlobTwo: {
    position: 'absolute',
    top: 220,
    right: -44,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 176, 232, 0.12)',
  },
  heroPane: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 28,
    overflow: 'hidden',
    paddingBottom: 8,
    shadowColor: '#0A1626',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  title: {
    color: '#F5FCFF',
    fontSize: 28,
    fontWeight: '800',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(8,20,38,0.2)',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    color: '#F3FCFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 18,
  },
  statItem: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(8, 20, 38, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#D8EEFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 16,
  },
  memberRailRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 12,
  },
  memberRail: {
    width: 18,
    alignItems: 'center',
  },
  memberNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 24,
  },
  memberLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  memberCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#0D192B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberId: {
    fontSize: 12,
    marginTop: 2,
  },
  memberEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  memberStatus: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
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
