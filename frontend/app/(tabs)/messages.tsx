import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
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
import { socketService } from '../../src/services/socket';
import { toSystemDate } from '../../src/utils/time';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  user_id: string;
  user_name: string;
  user_role: string;
  profile_image?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const loadConversations = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (error) {
      console.log('Error loading conversations:', error);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();

    // Connect socket and listen for new messages
    if (user?.id) {
      socketService.connect(user.id);
      socketService.onMessage(() => {
        loadConversations();
      });
    }

    return () => {
      socketService.offMessage();
    };
  }, [loadConversations, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 6000);

    return () => clearInterval(interval);
  }, [loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return theme.error;
      case 'trainer': return theme.warning;
      default: return theme.primary;
    }
  };

  const localizeRole = (role: string) => {
    if (role === 'admin') return t('Admin');
    if (role === 'trainer') return t('Trainer');
    return t('Member');
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationRailRow}
      onPress={() => router.push(`/chat/${item.user_id}`)}
      onLongPress={() => {
        Alert.alert(
          t('Delete chat'),
          t('Delete all messages with {name}?', { name: item.user_name }),
          [
            { text: t('Cancel'), style: 'cancel' },
            {
              text: t('Delete'),
              style: 'destructive',
              onPress: async () => {
                try {
                  await api.deleteConversation(item.user_id);
                  setConversations((prev) => prev.filter((c) => c.user_id !== item.user_id));
                } catch (error: any) {
                  Alert.alert(t('Failed'), error.response?.data?.detail || t('Failed to delete conversation'));
                }
              },
            },
          ]
        );
      }}
    >
      <View style={styles.conversationRail}>
        <View style={[styles.conversationNode, { backgroundColor: item.unread_count > 0 ? theme.primary : theme.border }]} />
        <View style={[styles.conversationLine, { backgroundColor: theme.border }]} />
      </View>
      <View style={[styles.conversationCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: theme.primary }]}>
            {item.user_name.charAt(0).toUpperCase()}
          </Text>
          {item.unread_count > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.error }]}>
              <Text style={styles.unreadText}>{item.unread_count > 9 ? '9+' : item.unread_count}</Text>
            </View>
          )}
        </View>
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, { color: theme.text }]}>{item.user_name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.user_role) + '20' }]}>
              <Text style={[styles.roleText, { color: getRoleBadgeColor(item.user_role) }]}>
                {localizeRole(item.user_role)}
              </Text>
            </View>
          </View>
          {item.last_message && (
            <Text style={[styles.lastMessage, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.last_message}
            </Text>
          )}
          {item.last_message_time && (
            <Text style={[styles.messageTime, { color: theme.textSecondary }]}>
              {formatDistanceToNow(toSystemDate(item.last_message_time), { addSuffix: true })}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </View>
    </TouchableOpacity>
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
          <Text style={styles.title}>{t('Messages')}</Text>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => router.push('/chat/new')}
          >
            <Ionicons name="create-outline" size={20} color="#EAF8FF" />
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#EAF8FF" />
          <Text style={styles.infoText}>
            {user?.role === 'member'
              ? t('You can message admin, trainers, and members from your branch')
              : user?.role === 'trainer'
              ? t('You can message all members and trainers in your branch, and all admins')
              : t('You can message all members and trainers')}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.streamHintWrap}>
        <Text style={[styles.streamHint, { color: theme.textSecondary }]}>
          {t('Long press a chat to delete conversation history')}
        </Text>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t('No conversations yet')}
              </Text>
              <TouchableOpacity
                style={[styles.startChatButton, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/chat/new')}
              >
                <Text style={styles.startChatText}>{t('Start a conversation')}</Text>
              </TouchableOpacity>
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
  glassBlobTop: {
    position: 'absolute',
    top: 84,
    right: -36,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(122, 201, 255, 0.14)',
  },
  glassBlobBottom: {
    position: 'absolute',
    bottom: 150,
    left: -46,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(255, 170, 230, 0.12)',
  },
  heroPane: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 28,
    overflow: 'hidden',
    paddingBottom: 12,
    shadowColor: '#0B1626',
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
    color: '#F3FCFF',
    fontSize: 28,
    fontWeight: '800',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(8, 20, 38, 0.2)',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    padding: 12,
    borderRadius: 14,
    gap: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#E6F5FF',
  },
  streamHintWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  streamHint: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  conversationRailRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 12,
  },
  conversationRail: {
    width: 18,
    alignItems: 'center',
  },
  conversationNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 24,
  },
  conversationLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  conversationCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#0E1A2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
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
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 4,
  },
  messageTime: {
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
  startChatButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  startChatText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
