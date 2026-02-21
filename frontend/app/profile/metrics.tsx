import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';

interface BodyMetrics {
  date?: string;
  weight?: number;
  body_fat?: number;
  chest?: number;
  waist?: number;
}

export default function MetricsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState<BodyMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await api.getMember(user.id);
      setMetrics(data?.profile?.body_metrics || []);
    } catch (error) {
      console.log('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useFocusEffect(
    useCallback(() => {
      loadMetrics();
    }, [loadMetrics])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Body Metrics</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={[...metrics].reverse()}
          keyExtractor={(_, index) => `${index}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.date, { color: theme.text }]}>
                {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
              </Text>
              <Text style={[styles.metric, { color: theme.textSecondary }]}>Weight: {item.weight ?? '-'} kg</Text>
              <Text style={[styles.metric, { color: theme.textSecondary }]}>Body Fat: {item.body_fat ?? '-'}%</Text>
              <Text style={[styles.metric, { color: theme.textSecondary }]}>Chest: {item.chest ?? '-'} cm</Text>
              <Text style={[styles.metric, { color: theme.textSecondary }]}>Waist: {item.waist ?? '-'} cm</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No metrics available yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { borderRadius: 14, padding: 14, marginBottom: 10 },
  date: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  metric: { fontSize: 13, marginBottom: 2 },
  emptyText: { fontSize: 14 },
});
