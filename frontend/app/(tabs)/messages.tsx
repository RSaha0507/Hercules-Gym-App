import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';
import { socketService } from '../../src/services/socket';
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

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationCard, { backgroundColor: theme.card }]}
      onPress={() => router.push(`/chat/${item.user_id}`)}
    >
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
              {item.user_role}
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
            {formatDistanceToNow(new Date(item.last_message_time), { addSuffix: true })}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
        <TouchableOpacity
          style={[styles.newChatButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/chat/new')}
        >
          <Ionicons name="create-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: theme.card }]}>
        <Ionicons name="information-circle" size={20} color={theme.primary} />
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          {user?.role === 'member'
            ? 'You can message your assigned trainers and gym admin'
            : user?.role === 'trainer'
            ? 'You can message your assigned members and admin'
            : 'You can message all members and trainers'}
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
              No conversations yet
            </Text>
            <TouchableOpacity
              style={[styles.startChatButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/chat/new')}
            >
              <Text style={styles.startChatText}>Start a conversation</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
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
