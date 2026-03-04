import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';

export default function TrainerDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id || '';
  const { user } = useAuth();
  const { theme } = useTheme();
  const [trainer, setTrainer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAchievementEditor, setShowAchievementEditor] = useState(false);
  const [achievementsInput, setAchievementsInput] = useState('');
  const [savingAchievements, setSavingAchievements] = useState(false);

  const loadTrainer = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getTrainer(id);
      setTrainer(data);
      setAchievementsInput((data?.achievements || data?.user?.achievements || []).join('\n'));
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load trainer');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTrainer();
  }, [loadTrainer]);

  const saveAchievements = async () => {
    if (!trainer?.id) return;
    setSavingAchievements(true);
    try {
      const parsed = achievementsInput
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
      await api.updateUserAchievements(trainer.id, parsed);
      await loadTrainer();
      setShowAchievementEditor(false);
      Alert.alert('Success', 'Achievements updated');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update achievements');
    } finally {
      setSavingAchievements(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!trainer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingWrap}>
          <Text style={{ color: theme.text }}>Trainer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const achievements = trainer.achievements || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Trainer Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {trainer.full_name?.charAt(0)?.toUpperCase() || 'T'}
            </Text>
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{trainer.full_name}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>{trainer.email}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>{trainer.phone}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {trainer.center || 'No center'} - {trainer.member_count || 0} members
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.achievementHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Achievements</Text>
            {user?.role === 'admin' && (
              <TouchableOpacity onPress={() => setShowAchievementEditor(true)}>
                <Ionicons name="create-outline" size={18} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>
          {achievements.length === 0 ? (
            <Text style={[styles.meta, { color: theme.textSecondary }]}>No achievements yet</Text>
          ) : (
            achievements.map((achievement: string, index: number) => (
              <View key={`${achievement}-${index}`} style={styles.achievementRow}>
                <Ionicons name="star" size={14} color={theme.warning} />
                <Text style={[styles.achievementText, { color: theme.text }]}>{achievement}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showAchievementEditor} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Achievements</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Add one achievement per line</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
  },
  meta: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  achievementText: {
    flex: 1,
    fontSize: 14,
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
    minHeight: 140,
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
