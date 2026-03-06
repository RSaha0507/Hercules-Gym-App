import React, { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
  Modal,
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
import { api, GYM_CENTERS } from '../../src/services/api';
import { socketService } from '../../src/services/socket';
import { formatDateDDMMYYYY, toSystemDate } from '../../src/utils/time';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

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
  today_workout_count?: number;
  member_id?: string;
  payment_due?: boolean;
  payment_due_info?: {
    due_date_iso?: string;
    base_amount?: number;
    late_fee?: number;
    total_amount?: number;
    days_late?: number;
  };
  unread_notifications?: number;
  approval_status?: string;
}

const HERO_SLIDE_INTERVAL_MS = 3000;
const HOME_REFRESH_INTERVAL_MS = 30000;
const HOME_CACHE_TTL_MS = 5 * 60 * 1000;
const HOME_ANNOUNCEMENTS_LIMIT = 5;
const DEFAULT_HERO_SLIDE_WIDTH = Dimensions.get('window').width - 64;
const HERO_IMAGE_MAX_DATA_URI_LENGTH = 620000;
const HERO_IMAGE_MAX_DIMENSION = 1280;
const HERO_IMAGE_MIN_COMPRESSION = 0.24;

const toUnreadCount = (value: unknown) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) return 0;
  return Math.floor(value);
};

interface HomeCacheSnapshot {
  cached_at: number;
  dashboard: DashboardData | null;
  announcements: any[];
  hero_gallery?: { id: string; title: string; uri: string }[];
}

interface HomeSeenState {
  announcement_signature: string;
  unread_messages: number;
  unread_notifications: number;
}

interface HomeSignal {
  type: 'announcement' | 'message' | 'notification';
  title: string;
  body: string;
  signature: string;
}

const DEFAULT_HERO_GALLERY = [
  {
    id: 'hero-1',
    title: 'Strength Zone',
    uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'hero-2',
    title: 'Cardio Bay',
    uri: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'hero-3',
    title: 'Functional Training',
    uri: 'https://images.unsplash.com/photo-1598971639058-a63a5f6b6f32?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'hero-4',
    title: 'Free Weight Arena',
    uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'hero-5',
    title: 'Athlete Corner',
    uri: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1400&q=80',
  },
];

export default function HomeScreen() {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [heroSlideWidth, setHeroSlideWidth] = useState(DEFAULT_HERO_SLIDE_WIDTH);
  const [heroGallery, setHeroGallery] = useState(DEFAULT_HERO_GALLERY);
  const [showHeroEditor, setShowHeroEditor] = useState(false);
  const [heroDraft, setHeroDraft] = useState(DEFAULT_HERO_GALLERY);
  const [savingHeroGallery, setSavingHeroGallery] = useState(false);
  const [homeSignal, setHomeSignal] = useState<HomeSignal | null>(null);
  const [isSeenStateReady, setIsSeenStateReady] = useState(false);
  const isFetchingRef = useRef(false);
  const dashboardRef = useRef<DashboardData | null>(null);
  const announcementsRef = useRef<any[]>([]);
  const heroGalleryRef = useRef(DEFAULT_HERO_GALLERY);
  const seenStateRef = useRef<HomeSeenState | null>(null);
  const userRef = useRef(user);
  const updateUserRef = useRef(updateUser);
  const heroCarouselRef = useRef<ScrollView>(null);
  const userId = user?.id;
  const userRole = user?.role;
  const userApprovalStatus = user?.approval_status;
  const homeCacheKey = userId ? `home:dashboard:${userId}:${selectedCenter || 'all'}` : null;
  const homeSeenStateKey = userId ? `home:seen-state:${userId}` : null;

  const getAnnouncementSignature = useCallback((list: any[]) => {
    if (!Array.isArray(list) || list.length === 0) return '';
    const latest = list[0] || {};
    return String(latest.id || `${latest.created_at || ''}:${latest.title || ''}`);
  }, []);

  const buildSeenStateSnapshot = useCallback(
    (nextDashboard: DashboardData | null, nextAnnouncements: any[]): HomeSeenState => ({
      announcement_signature: getAnnouncementSignature(nextAnnouncements),
      unread_messages: toUnreadCount(nextDashboard?.unread_messages),
      unread_notifications: toUnreadCount(nextDashboard?.unread_notifications),
    }),
    [getAnnouncementSignature],
  );

  const persistSeenState = useCallback(
    async (next: HomeSeenState) => {
      seenStateRef.current = next;
      if (!homeSeenStateKey) return;
      try {
        await AsyncStorage.setItem(homeSeenStateKey, JSON.stringify(next));
      } catch (error) {
        console.log('Error storing home seen state:', error);
      }
    },
    [homeSeenStateKey],
  );

  const showHomeSignal = useCallback((nextSignal: HomeSignal) => {
    setHomeSignal((prev) => (prev?.signature === nextSignal.signature ? prev : nextSignal));
  }, []);

  const evaluateHomeSignal = useCallback(
    (nextDashboard: DashboardData | null, nextAnnouncements: any[]) => {
      if (!isSeenStateReady) return;

      const snapshot = buildSeenStateSnapshot(nextDashboard, nextAnnouncements);
      const seenState = seenStateRef.current;
      if (!seenState) {
        void persistSeenState(snapshot);
        return;
      }

      // Keep snapshot baseline in sync when unread counters move down after user has viewed content.
      if (
        snapshot.unread_messages < seenState.unread_messages ||
        snapshot.unread_notifications < seenState.unread_notifications
      ) {
        void persistSeenState({
          ...seenState,
          unread_messages: snapshot.unread_messages,
          unread_notifications: snapshot.unread_notifications,
        });
      }

      if (snapshot.unread_messages > seenState.unread_messages) {
        showHomeSignal({
          type: 'message',
          title: t('New Message'),
          body: t('You have a new message.'),
          signature: `message:${snapshot.unread_messages}`,
        });
        return;
      }

      if (snapshot.unread_notifications > seenState.unread_notifications) {
        showHomeSignal({
          type: 'notification',
          title: t('New Notification'),
          body: t('You have a new notification.'),
          signature: `notification:${snapshot.unread_notifications}`,
        });
        return;
      }

      if (
        snapshot.announcement_signature &&
        snapshot.announcement_signature !== seenState.announcement_signature
      ) {
        const latestAnnouncement = Array.isArray(nextAnnouncements) ? nextAnnouncements[0] : null;
        showHomeSignal({
          type: 'announcement',
          title: t('New Announcement'),
          body: latestAnnouncement?.title || t('A new announcement is available.'),
          signature: `announcement:${snapshot.announcement_signature}`,
        });
      }
    },
    [buildSeenStateSnapshot, isSeenStateReady, persistSeenState, showHomeSignal, t],
  );

  const markHomeSignalSeen = useCallback(async (signal?: HomeSignal | null) => {
    const snapshot = buildSeenStateSnapshot(dashboardRef.current, announcementsRef.current);
    const previous = seenStateRef.current;
    if (signal?.type === 'announcement') {
      snapshot.announcement_signature = signal.signature.replace(/^announcement:/, '') || snapshot.announcement_signature;
    } else if (signal?.type === 'message') {
      snapshot.unread_messages = Math.max(
        snapshot.unread_messages,
        (previous?.unread_messages || 0) + 1,
      );
    } else if (signal?.type === 'notification') {
      snapshot.unread_notifications = Math.max(
        snapshot.unread_notifications,
        (previous?.unread_notifications || 0) + 1,
      );
    }
    await persistSeenState(snapshot);
    setHomeSignal(null);
  }, [buildSeenStateSnapshot, persistSeenState]);

  const openHomeSignal = useCallback(async () => {
    const currentSignal = homeSignal;
    if (!currentSignal) return;
    await markHomeSignalSeen(currentSignal);
    if (currentSignal.type === 'message') {
      router.push('/(tabs)/messages');
      return;
    }
    if (currentSignal.type === 'notification') {
      router.push('/profile/notifications' as any);
    }
  }, [homeSignal, markHomeSignalSeen]);

  const localizeRole = (role?: string) => {
    if (role === 'admin') return t('Admin');
    if (role === 'trainer') return t('Trainer');
    if (role === 'member') return t('Member');
    return role || '';
  };

  const openHeroEditor = () => {
    const initial = heroGallery.map((slide, index) => ({ ...slide, id: slide.id || `hero-${index + 1}` }));
    while (initial.length < 5) {
      const next = initial.length + 1;
      initial.push({ id: `hero-${next}`, title: `Slide ${next}`, uri: '' });
    }
    setHeroDraft(initial.slice(0, 10));
    setShowHeroEditor(true);
  };

  const pickHeroImage = async (index: number) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('Error'), t('Gallery permission is required to upload hero image.'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
        base64: false,
      });

      if (result.canceled || !result.assets.length) return;
      const asset = result.assets[0];

      const resizeAction =
        (asset.width || 0) >= (asset.height || 0)
          ? [{ resize: { width: HERO_IMAGE_MAX_DIMENSION } }]
          : [{ resize: { height: HERO_IMAGE_MAX_DIMENSION } }];
      const shouldResize = Math.max(asset.width || 0, asset.height || 0) > HERO_IMAGE_MAX_DIMENSION;

      let compression = 0.58;
      let dataUri: string | null = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const optimized = await ImageManipulator.manipulateAsync(
          asset.uri,
          shouldResize ? resizeAction : [],
          {
            compress: compression,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          },
        );
        if (optimized.base64) {
          const candidate = `data:image/jpeg;base64,${optimized.base64}`;
          if (candidate.length <= HERO_IMAGE_MAX_DATA_URI_LENGTH || compression <= HERO_IMAGE_MIN_COMPRESSION) {
            dataUri = candidate;
            break;
          }
        }
        compression = Math.max(HERO_IMAGE_MIN_COMPRESSION, compression - 0.1);
      }

      if (!dataUri || dataUri.length > HERO_IMAGE_MAX_DATA_URI_LENGTH) {
        Alert.alert(t('Error'), t('Selected hero image is too large. Please choose a smaller image.'));
        return;
      }

      setHeroDraft((prev) => prev.map((item, i) => (i === index ? { ...item, uri: dataUri } : item)));
    } catch {
      Alert.alert(t('Error'), t('Could not process selected image. Please try another hero image.'));
    }
  };

  const saveHeroGallery = async () => {
    const cleaned = heroDraft
      .map((slide, index) => ({
        id: slide.id || `hero-${index + 1}`,
        title: (slide.title || `Slide ${index + 1}`).trim(),
        uri: (slide.uri || '').trim(),
      }))
      .filter((slide) => slide.uri.length > 0);

    if (cleaned.length === 0) {
      Alert.alert(t('Error'), t('Please add at least one hero image URL'));
      return;
    }

    setSavingHeroGallery(true);
    try {
      const response = await api.updateHeroImages(cleaned);
      const nextSlides = Array.isArray(response?.slides) && response.slides.length > 0 ? response.slides : DEFAULT_HERO_GALLERY;
      setHeroGallery(nextSlides);
      setHeroSlideIndex(0);
      heroCarouselRef.current?.scrollTo({ x: 0, animated: false });
      setShowHeroEditor(false);
      Alert.alert(t('Success'), t('Hero images updated'));
    } catch (error: any) {
      Alert.alert(t('Error'), error.response?.data?.detail || t('Failed to update hero images'));
    } finally {
      setSavingHeroGallery(false);
    }
  };

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    updateUserRef.current = updateUser;
  }, [updateUser]);

  useEffect(() => {
    dashboardRef.current = dashboard;
  }, [dashboard]);

  useEffect(() => {
    announcementsRef.current = announcements;
  }, [announcements]);

  useEffect(() => {
    heroGalleryRef.current = heroGallery;
  }, [heroGallery]);

  useEffect(() => {
    setHomeSignal(null);
    setIsSeenStateReady(false);
    seenStateRef.current = null;

    if (!homeSeenStateKey) {
      setIsSeenStateReady(true);
      return;
    }

    let isMounted = true;
    const loadSeenState = async () => {
      try {
        const raw = await AsyncStorage.getItem(homeSeenStateKey);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<HomeSeenState>;
        const normalized: HomeSeenState = {
          announcement_signature: String(parsed.announcement_signature || ''),
          unread_messages: toUnreadCount(parsed.unread_messages),
          unread_notifications: toUnreadCount(parsed.unread_notifications),
        };
        if (isMounted) {
          seenStateRef.current = normalized;
        }
      } catch (error) {
        console.log('Error loading home seen state:', error);
      } finally {
        if (isMounted) {
          setIsSeenStateReady(true);
        }
      }
    };

    loadSeenState();
    return () => {
      isMounted = false;
    };
  }, [homeSeenStateKey]);

  useEffect(() => {
    let isMounted = true;

    const restoreHomeCache = async () => {
      if (!homeCacheKey) return;
      try {
        const rawCache = await AsyncStorage.getItem(homeCacheKey);
        if (!rawCache) return;
        const parsed = JSON.parse(rawCache) as HomeCacheSnapshot;
        if (!parsed || typeof parsed.cached_at !== 'number') return;
        if (Date.now() - parsed.cached_at > HOME_CACHE_TTL_MS) return;
        if (!isMounted) return;
        if (parsed.dashboard) {
          setDashboard(parsed.dashboard);
        }
        if (Array.isArray(parsed.announcements)) {
          setAnnouncements(parsed.announcements.slice(0, HOME_ANNOUNCEMENTS_LIMIT));
        }
        if (Array.isArray(parsed.hero_gallery) && parsed.hero_gallery.length > 0) {
          setHeroGallery(parsed.hero_gallery);
        }
        setIsLoading(false);
      } catch (error) {
        console.log('Error restoring home cache:', error);
      }
    };

    restoreHomeCache();
    return () => {
      isMounted = false;
    };
  }, [homeCacheKey]);

  const loadData = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (!userRole) {
      setIsLoading(false);
      setRefreshing(false);
      return;
    }
    isFetchingRef.current = true;
    try {
      const dashboardRequest =
        userRole === 'admin'
          ? api.getAdminDashboard(selectedCenter || undefined)
          : userRole === 'trainer'
            ? api.getTrainerDashboard()
            : api.getMemberDashboard();

      const [dashboardResult, announcementsResult, heroResult] = await Promise.allSettled([
        dashboardRequest,
        api.getAnnouncements(HOME_ANNOUNCEMENTS_LIMIT),
        api.getHeroImages(),
      ]);

      let latestDashboard = dashboardRef.current;
      let latestAnnouncements = announcementsRef.current;
      let latestHeroGallery = heroGalleryRef.current;

      if (dashboardResult.status === 'fulfilled') {
        const dashboardData = dashboardResult.value;
        latestDashboard = dashboardData;
        setDashboard(dashboardData);

        if (
          userRole === 'member' &&
          userRef.current &&
          dashboardData?.approval_status &&
          userApprovalStatus !== dashboardData.approval_status
        ) {
          updateUserRef.current({ ...userRef.current, approval_status: dashboardData.approval_status });
        }
      } else {
        console.log('Error loading dashboard:', dashboardResult.reason);
      }

      if (announcementsResult.status === 'fulfilled') {
        latestAnnouncements = Array.isArray(announcementsResult.value)
          ? announcementsResult.value.slice(0, HOME_ANNOUNCEMENTS_LIMIT)
          : [];
        setAnnouncements(latestAnnouncements);
      } else {
        console.log('Error loading announcements:', announcementsResult.reason);
      }

      if (heroResult.status === 'fulfilled') {
        const slides = Array.isArray(heroResult.value?.slides) ? heroResult.value.slides : [];
        if (slides.length > 0) {
          latestHeroGallery = slides;
          setHeroGallery(slides);
        }
      } else {
        console.log('Error loading hero gallery:', heroResult.reason);
      }

      if (
        homeCacheKey &&
        (dashboardResult.status === 'fulfilled' || announcementsResult.status === 'fulfilled' || heroResult.status === 'fulfilled')
      ) {
        const snapshot: HomeCacheSnapshot = {
          cached_at: Date.now(),
          dashboard: latestDashboard,
          announcements: latestAnnouncements,
          hero_gallery: latestHeroGallery,
        };
        AsyncStorage.setItem(homeCacheKey, JSON.stringify(snapshot)).catch((error) => {
          console.log('Error caching home data:', error);
        });
      }

      evaluateHomeSignal(latestDashboard, latestAnnouncements);
    } catch (error) {
      console.log('Error loading dashboard:', error);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [evaluateHomeSignal, homeCacheKey, selectedCenter, userApprovalStatus, userRole]);

  useEffect(() => {
    loadData();
    
    // Connect socket
    if (userId) {
      socketService.connect(userId);
      socketService.onAnnouncement((announcement) => {
        setAnnouncements((prev) => [announcement, ...prev.slice(0, HOME_ANNOUNCEMENTS_LIMIT - 1)]);
        showHomeSignal({
          type: 'announcement',
          title: t('New Announcement'),
          body: announcement?.title || t('A new announcement is available.'),
          signature: `announcement:${announcement?.id || announcement?.created_at || Date.now()}`,
        });
      });
      socketService.onMessage((message) => {
        const preview =
          typeof message?.content === 'string' && message.content.trim().length > 0
            ? message.content.trim()
            : t('You have a new message.');
        showHomeSignal({
          type: 'message',
          title: t('New Message'),
          body: preview,
          signature: `message:${message?.id || message?.created_at || Date.now()}`,
        });
      });
      socketService.onNotification((notification) => {
        const rawType = String(notification?.data?.type || '').toLowerCase();
        if (rawType === 'message') return;
        showHomeSignal({
          type: 'notification',
          title: notification?.title || t('New Notification'),
          body: notification?.body || t('You have a new notification.'),
          signature: `notification:${notification?.id || notification?.created_at || Date.now()}`,
        });
      });
    }

    return () => {
      socketService.offAnnouncement();
      socketService.offMessage();
      socketService.offNotification();
    };
  }, [loadData, showHomeSignal, t, userId]);

  useEffect(() => {
    if (!isSeenStateReady) return;
    evaluateHomeSignal(dashboard, announcements);
  }, [announcements, dashboard, evaluateHomeSignal, isSeenStateReady]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, HOME_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (heroGallery.length === 0) return;
    if (heroSlideIndex <= heroGallery.length - 1) return;
    setHeroSlideIndex(0);
    heroCarouselRef.current?.scrollTo({ x: 0, animated: false });
  }, [heroGallery.length, heroSlideIndex]);

  useFocusEffect(
    useCallback(() => {
      if (heroSlideWidth <= 0 || heroGallery.length <= 1) return;
      const interval = setInterval(() => {
        setHeroSlideIndex((prev) => {
          const next = (prev + 1) % heroGallery.length;
          heroCarouselRef.current?.scrollTo({ x: next * heroSlideWidth, animated: true });
          return next;
        });
      }, HERO_SLIDE_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [heroGallery.length, heroSlideWidth]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeleteAnnouncement = (announcementId: string) => {
    Alert.alert(t('Delete Announcement'), t('This announcement will be removed for all users.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteAnnouncement(announcementId);
            setAnnouncements((prev) => prev.filter((item) => item.id !== announcementId));
          } catch (error: any) {
            Alert.alert(t('Error'), error.response?.data?.detail || t('Failed to delete announcement'));
          }
        },
      },
    ]);
  };

  const handleEditAnnouncement = (announcement: any) => {
    router.push({
      pathname: '/announcements/create',
      params: {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        target: announcement.target || 'all',
        target_center: announcement.target_center || '',
      },
    } as any);
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
            <Text style={[styles.pendingTitle, { color: theme.text }]}>{t('Approval Pending')}</Text>
            <Text style={[styles.pendingText, { color: theme.textSecondary }]}>
              {t('Your registration is awaiting approval. You will be notified once it is approved.')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: theme.primary }]}
            onPress={loadData}
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text style={styles.refreshText}>{t('Check Status')}</Text>
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
            {t('All Centers')}
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
        <StatCard icon="people" label={t('Total Members')} value={dashboard?.total_members || 0} color={theme.primary} onPress={() => router.push('/(tabs)/members')} />
        <StatCard icon="checkmark-circle" label={t('Active')} value={dashboard?.active_members || 0} color={theme.success} onPress={() => router.push('/(tabs)/members')} />
        <StatCard icon="fitness" label={t('Trainers')} value={dashboard?.total_trainers || 0} color={theme.secondary} onPress={() => router.push('/trainers' as any)} />
        <StatCard icon="calendar-outline" label={t("Today's Attendance")} value={dashboard?.today_attendance || 0} color={theme.warning} />
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
            <Text style={[styles.alertLabel, { color: theme.textSecondary }]}>{t('Pending Approvals')}</Text>
          </TouchableOpacity>
        )}
        {(dashboard?.pending_orders || 0) > 0 && (
          <TouchableOpacity
            style={[styles.alertCard, { backgroundColor: theme.primary + '20' }]}
            onPress={() => router.push('/merchandise/orders' as any)}
          >
            <Ionicons name="cart" size={24} color={theme.primary} />
            <Text style={[styles.alertValue, { color: theme.text }]}>{dashboard?.pending_orders}</Text>
            <Text style={[styles.alertLabel, { color: theme.textSecondary }]}>{t('Pending Orders')}</Text>
          </TouchableOpacity>
        )}
        {(dashboard?.expiring_memberships || 0) > 0 && (
          <TouchableOpacity
            style={[styles.alertCard, { backgroundColor: theme.error + '20' }]}
            onPress={() => router.push('/(tabs)/members')}
          >
            <Ionicons name="alert-circle" size={24} color={theme.error} />
            <Text style={[styles.alertValue, { color: theme.text }]}>{dashboard?.expiring_memberships}</Text>
            <Text style={[styles.alertLabel, { color: theme.textSecondary }]}>{t('Expiring Soon')}</Text>
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
          {dashboard?.center || user?.center || t('Your Center')}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard 
          icon="people" 
          label={t('Assigned Members')} 
          value={dashboard?.assigned_members || 0} 
          color={theme.primary}
          onPress={() => router.push('/(tabs)/members')}
        />
        <StatCard 
          icon="calendar-outline" 
          label={t("Today's Attendance")} 
          value={dashboard?.today_attendance || 0} 
          color={theme.success} 
        />
        <StatCard 
          icon="chatbubbles" 
          label={t('Unread Messages')} 
          value={dashboard?.unread_messages || 0} 
          color={theme.warning}
          onPress={() => router.push('/(tabs)/messages')}
        />
        {(dashboard?.pending_approvals || 0) > 0 && (
          <StatCard 
            icon="person-add" 
            label={t('Pending Approvals')} 
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
          {dashboard?.center || user?.center || t('Your Center')}
        </Text>
      </View>

      {/* Payment Due Alert */}
      {dashboard?.payment_due && (
        <TouchableOpacity 
          style={[styles.paymentTimelineCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push('/profile/payments' as any)}
        >
          <Text style={[styles.timelineTitle, { color: theme.text }]}>{t('Membership Timeline')}</Text>
          <View style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View style={[styles.timelineNode, { backgroundColor: theme.success }]} />
              <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
              <View style={[styles.timelineNode, { backgroundColor: theme.warning }]} />
              <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
              <View style={[styles.timelineNode, { backgroundColor: theme.error }]} />
            </View>
            <View style={styles.timelineSteps}>
              <Text style={[styles.timelineStepTitle, { color: theme.text }]}>{t('1-7: Standard Fee Rs.700')}</Text>
              <Text style={[styles.timelineStepTitle, { color: theme.text }]}>{t('8+: Rs.5/day late fee')}</Text>
              <Text style={[styles.timelineStepTitle, { color: theme.error }]}>
                {t('Due Date: {date}', {
                  date: dashboard?.payment_due_info?.due_date_iso
                    ? formatDateDDMMYYYY(dashboard.payment_due_info.due_date_iso)
                    : 'N/A',
                })}
              </Text>
              <Text style={[styles.timelineAmountText, { color: theme.text }]}>
                {t('Total Rs.{amount}', { amount: Math.round(dashboard?.payment_due_info?.total_amount || 0) })}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <View style={[styles.membershipCard, { backgroundColor: dashboard?.membership_valid ? theme.success + '20' : theme.error + '20' }]}>
        <View style={styles.membershipHeader}>
          <View style={[styles.membershipBadge, { backgroundColor: dashboard?.membership_valid ? theme.success : theme.error }]}>
            <Ionicons name={dashboard?.membership_valid ? 'checkmark' : 'close'} size={16} color="#FFF" />
          </View>
          <Text style={[styles.membershipTitle, { color: theme.text }]}>
            {dashboard?.membership_valid ? t('Active Membership') : t('Membership Expired')}
          </Text>
        </View>
        {dashboard?.membership_valid && (
          <Text style={[styles.membershipDays, { color: theme.text }]}>
            {t('{days} days remaining', { days: dashboard?.days_remaining || 0 })}
          </Text>
        )}
        <Text style={[styles.memberId, { color: theme.textSecondary }]}>
          {t('Member ID: {id}', { id: dashboard?.member_id || 'N/A' })}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="calendar" label={t('This Month')} value={dashboard?.attendance_this_month || 0} color={theme.primary} />
        <StatCard
          icon="barbell"
          label={t("Today's Workout")}
          value={dashboard?.today_workout_count || 0}
          color={theme.success}
          onPress={() => router.push('/profile/workouts?day=today' as any)}
        />
        <StatCard 
          icon="chatbubbles" 
          label={t('Messages')} 
          value={dashboard?.unread_messages || 0} 
          color={theme.warning}
          onPress={() => router.push('/(tabs)/messages')}
        />
        <StatCard 
          icon="notifications" 
          label={t('Notifications')} 
          value={dashboard?.unread_notifications || 0} 
          color={theme.secondary}
          onPress={() => router.push('/profile/notifications' as any)}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Split Dualpane Hero */}
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroPane}
        >
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{t('Welcome back,')}</Text>
              <Text style={styles.userName}>{user?.full_name}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{localizeRole(user?.role)}</Text>
                </View>
                {user?.is_primary_admin && (
                  <View style={[styles.roleBadge, styles.primaryAdminBadge]}>
                    <Text style={styles.roleText}>{t('Primary Admin')}</Text>
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
          {user?.role === 'admin' && (
            <View style={styles.heroAdminActions}>
              <TouchableOpacity style={styles.heroEditButton} onPress={openHeroEditor}>
                <Ionicons name="images-outline" size={14} color="#E8F9FF" />
                <Text style={styles.heroEditButtonText}>{t('Edit Hero')}</Text>
              </TouchableOpacity>
            </View>
          )}
          {isLoading && (
            <View style={styles.heroLoading}>
              <ActivityIndicator size="small" color="#E8F9FF" />
            </View>
          )}
          {homeSignal && (
            <View style={styles.heroSignalCard}>
              <View style={styles.heroSignalHeader}>
                <View style={styles.heroSignalIconWrap}>
                  <Ionicons
                    name={
                      homeSignal.type === 'message'
                        ? 'chatbubble-ellipses-outline'
                        : homeSignal.type === 'notification'
                          ? 'notifications-outline'
                          : 'megaphone-outline'
                    }
                    size={17}
                    color="#E8F9FF"
                  />
                </View>
                <View style={styles.heroSignalContent}>
                  <Text style={styles.heroSignalTitle}>{homeSignal.title}</Text>
                  <Text numberOfLines={2} style={styles.heroSignalBody}>
                    {homeSignal.body}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => void markHomeSignalSeen(homeSignal)}
                  style={styles.heroSignalCloseButton}
                >
                  <Ionicons name="close" size={18} color="#E8F9FF" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.heroSignalActionButton} onPress={() => void openHomeSignal()}>
                <Text style={styles.heroSignalActionText}>
                  {homeSignal.type === 'announcement' ? t('Seen') : t('Open')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View
            style={styles.heroCarouselWrap}
            onLayout={(event) => {
              const width = Math.round(event.nativeEvent.layout.width);
              if (width > 0 && width !== heroSlideWidth) {
                setHeroSlideWidth(width);
                heroCarouselRef.current?.scrollTo({ x: heroSlideIndex * width, animated: false });
              }
            }}
          >
            <ScrollView
              ref={heroCarouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              bounces={false}
              onMomentumScrollEnd={(event) => {
                const nextIndex = Math.round(event.nativeEvent.contentOffset.x / Math.max(heroSlideWidth, 1));
                const bounded = Math.max(0, Math.min(heroGallery.length - 1, nextIndex));
                setHeroSlideIndex(bounded);
              }}
            >
              {heroGallery.map((slide) => (
                <View key={slide.id} style={[styles.heroSlide, { width: heroSlideWidth }]}>
                  <Image source={{ uri: slide.uri }} style={styles.heroSlideImage} resizeMode="cover" />
                  <LinearGradient
                    colors={['rgba(7,20,35,0.02)', 'rgba(7,20,35,0.72)']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.heroSlideOverlay}
                  >
                    <Text style={styles.heroSlideCaption}>{slide.title}</Text>
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
            <View style={styles.heroDotsRow}>
              {heroGallery.map((slide, index) => (
                <View
                  key={slide.id}
                  style={[styles.heroDot, index === heroSlideIndex && styles.heroDotActive]}
                />
              ))}
            </View>
          </View>
          {user?.role === 'member' && (
            <View style={styles.heroActionStrip}>
              <TouchableOpacity
                style={styles.heroAction}
                onPress={() => router.push('/(tabs)/attendance')}
              >
                <Ionicons name="qr-code-outline" size={18} color="#E8F9FF" />
                <Text style={styles.heroActionText}>{t('Check In')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroAction}
                onPress={() => router.push('/profile/payments' as any)}
              >
                <Ionicons name="card-outline" size={18} color="#E8F9FF" />
                <Text style={styles.heroActionText}>{t('Payments')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroAction}
                onPress={() => router.push('/(tabs)/merchandise')}
              >
                <Ionicons name="shirt-outline" size={18} color="#E8F9FF" />
                <Text style={styles.heroActionText}>{t('Shop')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        <View style={[styles.dualPaneSheet, { backgroundColor: theme.background }]}>
          {/* Dashboard Stats */}
          <View style={styles.dashboardContainer}>
            {user?.role === 'admin' && renderAdminDashboard()}
            {user?.role === 'trainer' && renderTrainerDashboard()}
            {user?.role === 'member' && renderMemberDashboard()}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Quick Actions')}</Text>
            <View style={styles.quickActions}>
              {user?.role === 'member' && (
                <TouchableOpacity
                  style={[styles.quickAction, { backgroundColor: theme.primary }]}
                  onPress={() => router.push('/(tabs)/attendance')}
                >
                  <Ionicons name="qr-code" size={24} color="#FFF" />
                  <Text style={styles.quickActionText}>{t('Check In')}</Text>
                </TouchableOpacity>
              )}
              {(user?.role === 'admin' || user?.role === 'trainer') && (
                <TouchableOpacity
                  style={[styles.quickAction, { backgroundColor: theme.primary }]}
                  onPress={() => router.push('/(tabs)/members')}
                >
                  <Ionicons name="person-add" size={24} color="#FFF" />
                  <Text style={styles.quickActionText}>{t('Members')}</Text>
                </TouchableOpacity>
              )}
              {user?.role !== 'admin' && (
                <TouchableOpacity
                  style={[styles.quickAction, { backgroundColor: theme.secondary }]}
                  onPress={() => router.push('/(tabs)/merchandise')}
                >
                  <Ionicons name="shirt" size={24} color="#FFF" />
                  <Text style={styles.quickActionText}>{t('Shop')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: theme.success }]}
                onPress={() => router.push('/(tabs)/messages')}
              >
                <Ionicons name="chatbubbles" size={24} color="#FFF" />
                <Text style={styles.quickActionText}>{t('Messages')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Announcements */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Announcements')}</Text>
              {user?.role === 'admin' && (
                <TouchableOpacity onPress={() => router.push('/announcements/create')}>
                  <Ionicons name="add-circle" size={24} color={theme.primary} />
                </TouchableOpacity>
              )}
            </View>
            {announcements.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
                <Ionicons name="megaphone-outline" size={40} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('No announcements yet')}</Text>
              </View>
            ) : (
              announcements.map((announcement, index) => (
                <View key={announcement.id || index} style={[styles.announcementCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.announcementHeader}>
                    <Ionicons name="megaphone" size={20} color={theme.primary} />
                    <Text style={[styles.announcementTitle, { color: theme.text }]}>{announcement.title}</Text>
                    {user?.role === 'admin' && (
                      <View style={styles.announcementActions}>
                        <TouchableOpacity onPress={() => handleEditAnnouncement(announcement)} style={styles.announcementActionButton}>
                          <Ionicons name="create-outline" size={18} color={theme.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteAnnouncement(announcement.id)}
                          style={styles.announcementActionButton}
                        >
                          <Ionicons name="trash-outline" size={18} color={theme.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.announcementContent, { color: theme.textSecondary }]} numberOfLines={2}>
                    {announcement.content}
                  </Text>
                  <Text style={[styles.announcementDate, { color: theme.textSecondary }]}>
                    {toSystemDate(announcement.created_at).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showHeroEditor} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.heroEditorCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.heroEditorTitle, { color: theme.text }]}>{t('Edit Hero Images')}</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.heroEditorList}>
              {heroDraft.map((slide, index) => (
                <View key={slide.id || `slide-${index}`} style={styles.heroEditorItem}>
                  <Text style={[styles.heroEditorLabel, { color: theme.textSecondary }]}>
                    {t('Slide {index}', { index: index + 1 })}
                  </Text>
                  {Boolean(slide.uri) && (
                    <Image source={{ uri: slide.uri }} style={styles.heroEditorPreview} resizeMode="cover" />
                  )}
                  <TouchableOpacity
                    style={[styles.heroPickerButton, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
                    onPress={() => pickHeroImage(index)}
                  >
                    <Ionicons name="images-outline" size={16} color={theme.primary} />
                    <Text style={[styles.heroPickerButtonText, { color: theme.text }]}>{t('Pick Hero Image')}</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.heroEditorInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                    value={slide.title}
                    onChangeText={(value) =>
                      setHeroDraft((prev) => prev.map((item, i) => (i === index ? { ...item, title: value } : item)))
                    }
                    placeholder={t('Slide title')}
                    placeholderTextColor={theme.textSecondary}
                  />
                  <TextInput
                    style={[styles.heroEditorInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                    value={slide.uri}
                    onChangeText={(value) =>
                      setHeroDraft((prev) => prev.map((item, i) => (i === index ? { ...item, uri: value } : item)))
                    }
                    placeholder={t('Image URL')}
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.heroEditorActions}>
              <TouchableOpacity
                style={[styles.heroEditorAction, { borderColor: theme.border }]}
                onPress={() => setShowHeroEditor(false)}
                disabled={savingHeroGallery}
              >
                <Text style={[styles.heroEditorActionText, { color: theme.text }]}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.heroEditorAction, { backgroundColor: theme.primary }]}
                onPress={saveHeroGallery}
                disabled={savingHeroGallery}
              >
                {savingHeroGallery ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={[styles.heroEditorActionText, { color: '#FFF' }]}>{t('Save')}</Text>
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
  scrollContent: {
    paddingBottom: 120,
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
  heroPane: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 28,
    overflow: 'hidden',
    paddingBottom: 18,
    shadowColor: '#0B1524',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 7,
  },
  heroGlowOne: {
    position: 'absolute',
    right: -38,
    top: -24,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroGlowTwo: {
    position: 'absolute',
    left: -58,
    bottom: -88,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  heroLoading: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 8,
  },
  heroSignalCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(8, 21, 37, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  heroSignalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroSignalIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroSignalContent: {
    flex: 1,
    gap: 2,
  },
  heroSignalTitle: {
    color: '#F2FBFF',
    fontSize: 12,
    fontWeight: '800',
  },
  heroSignalBody: {
    color: '#CCE4F5',
    fontSize: 11,
    lineHeight: 15,
  },
  heroSignalCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSignalActionButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroSignalActionText: {
    color: '#E8F9FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  greeting: {
    color: '#E5F5FF',
    fontSize: 15,
    fontWeight: '500',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  primaryAdminBadge: {
    backgroundColor: 'rgba(255,214,132,0.26)',
  },
  roleText: {
    color: '#F8FDFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  headerLogo: {
    width: 62,
    height: 62,
    borderRadius: 20,
  },
  heroAdminActions: {
    marginLeft: 20,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  heroEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(7,20,35,0.24)',
  },
  heroEditButtonText: {
    color: '#E8F9FF',
    fontSize: 11,
    fontWeight: '700',
  },
  heroCarouselWrap: {
    marginHorizontal: 18,
    marginTop: 4,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(7,20,35,0.18)',
  },
  heroSlide: {
    height: 170,
    justifyContent: 'flex-end',
  },
  heroSlideImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroSlideOverlay: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'flex-end',
  },
  heroSlideCaption: {
    color: '#F2FAFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroDotsRow: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 5,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(232,249,255,0.45)',
  },
  heroDotActive: {
    width: 16,
    borderRadius: 999,
    backgroundColor: '#E8F9FF',
  },
  heroActionStrip: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 12,
  },
  heroAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    backgroundColor: 'rgba(8, 21, 37, 0.22)',
    borderRadius: 16,
    paddingVertical: 10,
  },
  heroActionText: {
    color: '#E8F9FF',
    fontWeight: '700',
    fontSize: 12,
  },
  dualPaneSheet: {
    marginTop: -10,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingTop: 16,
  },
  dashboardContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  centerFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  centerChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  centerChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  centerBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  centerBadgeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF2',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  statLabel: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 17,
  },
  revenueCard: {
    padding: 20,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  revenueInfo: {},
  revenueValue: {
    fontSize: 28,
    fontWeight: '800',
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
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF2',
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
  paymentTimelineCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#0E1A2A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timelineRail: {
    width: 24,
    alignItems: 'center',
    paddingTop: 2,
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    width: 2,
    height: 30,
    marginVertical: 4,
  },
  timelineSteps: {
    flex: 1,
    paddingLeft: 4,
    gap: 10,
  },
  timelineStepTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  timelineAmountText: {
    fontSize: 16,
    fontWeight: '800',
  },
  membershipCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECEEF2',
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  quickActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 34,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  emptyText: {
    fontSize: 15,
  },
  announcementCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  announcementActions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  announcementActionButton: {
    padding: 2,
  },
  announcementTitle: {
    fontSize: 17,
    fontWeight: '700',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heroEditorCard: {
    width: '100%',
    maxHeight: '86%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  heroEditorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroEditorList: {
    paddingBottom: 8,
    gap: 10,
  },
  heroEditorItem: {
    gap: 6,
  },
  heroEditorPreview: {
    height: 110,
    borderRadius: 10,
    width: '100%',
  },
  heroPickerButton: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroPickerButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroEditorLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroEditorInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  heroEditorActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  heroEditorAction: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEditorActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
