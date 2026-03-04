import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { useLanguage } from '../src/context/LanguageContext';
import { api } from '../src/services/api';

interface Trainer {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  center?: string;
  member_count?: number;
}

export default function TrainersScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const loadTrainers = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const data = await api.getTrainers();
      setTrainers(data);
      setFilteredTrainers(data);
    } catch (error) {
      console.log('Error loading trainers:', error);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  useFocusEffect(
    useCallback(() => {
      loadTrainers();
    }, [loadTrainers])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      loadTrainers();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadTrainers]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredTrainers(trainers);
      return;
    }

    const query = searchQuery.toLowerCase();
    setFilteredTrainers(
      trainers.filter(
        (trainer) =>
          trainer.full_name.toLowerCase().includes(query) ||
          trainer.email.toLowerCase().includes(query) ||
          (trainer.center || '').toLowerCase().includes(query)
      )
    );
  }, [searchQuery, trainers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTrainers();
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (user?.role === 'member') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{t('Trainers')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={56} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('Access denied')}</Text>
        </View>
      </SafeAreaView>
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#EAF8FF" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('Trainers')}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#EAF8FF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={20} color="#D8EEFF" />
            <TextInput
              style={styles.searchText}
              placeholder={t('Search trainers...')}
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
      </LinearGradient>

      <FlatList
        data={filteredTrainers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cardRailRow}
            onPress={() => router.push(`/trainer/${item.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.cardRail}>
              <View style={[styles.cardNode, { backgroundColor: theme.primary }]} />
              <View style={[styles.cardLine, { backgroundColor: theme.border }]} />
            </View>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {item.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{item.full_name}</Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.email}</Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {item.center || t('No center')} - {item.member_count || 0} {t('members')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={56} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery ? t('No trainers found') : t('No trainers available')}
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
    top: 80,
    left: -36,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(98, 210, 255, 0.14)',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    color: '#F3FCFF',
    fontSize: 24,
    fontWeight: '800',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(8,20,38,0.2)',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
  },
  searchText: {
    flex: 1,
    fontSize: 15,
    color: '#F3FCFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 14,
  },
  cardRailRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 10,
  },
  cardRail: {
    width: 18,
    alignItems: 'center',
  },
  cardNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 24,
  },
  cardLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#0D192B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
