import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../src/context/ThemeContext';
import { api } from '../../../src/services/api';

interface BodyMetrics {
  date?: string;
  weight?: number;
  height?: number;
  body_fat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
}

function toNumber(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toInputValue(value?: number): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

export default function MemberMetricsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();

  const [metrics, setMetrics] = useState<BodyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [biceps, setBiceps] = useState('');
  const [thighs, setThighs] = useState('');

  const resetForm = () => {
    setWeight('');
    setHeight('');
    setBodyFat('');
    setChest('');
    setWaist('');
    setHips('');
    setBiceps('');
    setThighs('');
    setEditingIndex(null);
  };

  const loadMetrics = useCallback(async () => {
    try {
      const member = await api.getMember(id);
      const metricList = member?.profile?.body_metrics || [];
      setMetrics(metricList);
    } catch (error) {
      console.log('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useFocusEffect(
    useCallback(() => {
      loadMetrics();
    }, [loadMetrics]),
  );

  const metricsWithIndex = useMemo(
    () => metrics.map((metric, index) => ({ metric, index })).reverse(),
    [metrics],
  );

  const startEditMetric = (metric: BodyMetrics, index: number) => {
    setEditingIndex(index);
    setWeight(toInputValue(metric.weight));
    setHeight(toInputValue(metric.height));
    setBodyFat(toInputValue(metric.body_fat));
    setChest(toInputValue(metric.chest));
    setWaist(toInputValue(metric.waist));
    setHips(toInputValue(metric.hips));
    setBiceps(toInputValue(metric.biceps));
    setThighs(toInputValue(metric.thighs));
  };

  const handleDeleteMetric = (metricIndex: number) => {
    Alert.alert('Delete metrics', 'Delete this metric entry permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteBodyMetrics(id, metricIndex);
            if (editingIndex === metricIndex) {
              resetForm();
            }
            await loadMetrics();
          } catch (error: any) {
            Alert.alert('Failed', error.response?.data?.detail || 'Failed to delete metric entry');
          }
        },
      },
    ]);
  };

  const handleSaveMetrics = async () => {
    const payload = {
      weight: toNumber(weight),
      height: toNumber(height),
      body_fat: toNumber(bodyFat),
      chest: toNumber(chest),
      waist: toNumber(waist),
      hips: toNumber(hips),
      biceps: toNumber(biceps),
      thighs: toNumber(thighs),
    };

    const hasAtLeastOne = Object.values(payload).some((value) => value !== undefined);
    if (!hasAtLeastOne) {
      Alert.alert('Validation', 'Enter at least one metric value.');
      return;
    }

    setSaving(true);
    try {
      if (editingIndex !== null) {
        await api.updateBodyMetrics(id, editingIndex, payload);
        Alert.alert('Success', 'Body metrics updated successfully.');
      } else {
        await api.addBodyMetrics(id, payload);
        Alert.alert('Success', 'Body metrics added successfully.');
      }
      resetForm();
      await loadMetrics();
    } catch (error: any) {
      Alert.alert('Failed', error.response?.data?.detail || 'Failed to save metrics');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Member Metrics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.formCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {editingIndex !== null ? 'Edit Metrics' : 'Upload Metrics'}
          </Text>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Weight (kg)"
              placeholderTextColor={theme.textSecondary}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Height (cm)"
              placeholderTextColor={theme.textSecondary}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Body Fat (%)"
              placeholderTextColor={theme.textSecondary}
              value={bodyFat}
              onChangeText={setBodyFat}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Chest (cm)"
              placeholderTextColor={theme.textSecondary}
              value={chest}
              onChangeText={setChest}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Waist (cm)"
              placeholderTextColor={theme.textSecondary}
              value={waist}
              onChangeText={setWaist}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Hips (cm)"
              placeholderTextColor={theme.textSecondary}
              value={hips}
              onChangeText={setHips}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Biceps (cm)"
              placeholderTextColor={theme.textSecondary}
              value={biceps}
              onChangeText={setBiceps}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Thighs (cm)"
              placeholderTextColor={theme.textSecondary}
              value={thighs}
              onChangeText={setThighs}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveMetrics}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>{editingIndex !== null ? 'Save Metrics' : 'Add Metrics'}</Text>
              )}
            </TouchableOpacity>
            {editingIndex !== null ? (
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={resetForm}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Metrics History</Text>
          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : metrics.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No metrics uploaded yet.</Text>
            </View>
          ) : (
            metricsWithIndex.map(({ metric, index }) => (
              <View key={`${index}-${metric.date || 'metric'}`} style={[styles.metricCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.metricDate, { color: theme.text }]}>
                  {metric.date ? new Date(metric.date).toLocaleDateString() : 'Recorded'}
                </Text>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.primary + '20' }]}
                    onPress={() => startEditMetric(metric, index)}
                  >
                    <Ionicons name="create-outline" size={16} color={theme.primary} />
                    <Text style={[styles.iconButtonText, { color: theme.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.error + '20' }]}
                    onPress={() => handleDeleteMetric(index)}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.error} />
                    <Text style={[styles.iconButtonText, { color: theme.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.metricLine, { color: theme.textSecondary }]}>
                  Weight: {metric.weight ?? '-'} kg | Body Fat: {metric.body_fat ?? '-'}%
                </Text>
                <Text style={[styles.metricLine, { color: theme.textSecondary }]}>
                  Chest: {metric.chest ?? '-'} | Waist: {metric.waist ?? '-'} | Hips: {metric.hips ?? '-'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    paddingVertical: 14,
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700' },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 28,
  },
  formCard: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  formActions: {
    gap: 8,
  },
  saveButton: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historySection: {
    gap: 10,
  },
  loaderWrap: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 14,
  },
  emptyText: {
    fontSize: 14,
  },
  metricCard: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  metricDate: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  iconButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricLine: {
    fontSize: 13,
  },
});
