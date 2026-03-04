import React, { useCallback, useEffect, useState } from 'react';
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

interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
}

interface WorkoutPlan {
  id: string;
  name: string;
  day_of_week?: string;
  notes?: string;
  exercises: WorkoutExercise[];
  created_at: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface ExerciseInput {
  id: string;
  name: string;
  sets: string;
  reps: string;
}

const createExerciseInput = (): ExerciseInput => ({
  id: `exercise-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  sets: '',
  reps: '',
});

export default function MemberWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [planName, setPlanName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [notes, setNotes] = useState('');
  const [exerciseItems, setExerciseItems] = useState<ExerciseInput[]>([createExerciseInput()]);

  const resetForm = () => {
    setPlanName('');
    setDayOfWeek('Monday');
    setNotes('');
    setExerciseItems([createExerciseInput()]);
    setEditingPlanId(null);
  };

  const loadPlans = useCallback(async () => {
    try {
      const response = await api.getWorkouts(id);
      setPlans(response || []);
    } catch (error) {
      console.log('Error loading workout plans:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [loadPlans]),
  );

  const buildExercises = (): WorkoutExercise[] => {
    return exerciseItems
      .map((item, idx) => {
        const name = item.name.trim();
        const sets = Number(item.sets || 0);
        const reps = Number(item.reps || 0);
        const hasAnyValue = name.length > 0 || item.sets.trim().length > 0 || item.reps.trim().length > 0;
        if (!hasAnyValue) return null;
        return {
          name: name || `Exercise ${idx + 1}`,
          sets: Number.isFinite(sets) ? Math.max(0, sets) : 0,
          reps: Number.isFinite(reps) ? Math.max(0, reps) : 0,
        };
      })
      .filter((exercise): exercise is WorkoutExercise => !!exercise);
  };

  const updateExercise = (exerciseId: string, key: keyof Omit<ExerciseInput, 'id'>, value: string) => {
    setExerciseItems((prev) =>
      prev.map((item) => (item.id === exerciseId ? { ...item, [key]: value } : item)),
    );
  };

  const addExercise = () => {
    setExerciseItems((prev) => [...prev, createExerciseInput()]);
  };

  const removeExercise = (exerciseId: string) => {
    setExerciseItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== exerciseId);
    });
  };

  const handleSavePlan = async () => {
    const exercises = buildExercises();

    setSaving(true);
    try {
      const payload = {
        name: planName.trim() || 'Workout Plan',
        member_id: id,
        day_of_week: dayOfWeek,
        notes: notes.trim() || undefined,
        exercises,
      };

      if (editingPlanId) {
        await api.updateWorkout(editingPlanId, payload);
        Alert.alert('Success', 'Workout plan updated successfully.');
      } else {
        await api.createWorkout(payload);
        Alert.alert('Success', 'Workout plan assigned successfully.');
      }

      resetForm();
      await loadPlans();
    } catch (error: any) {
      Alert.alert('Failed', error.response?.data?.detail || 'Failed to save workout plan');
    } finally {
      setSaving(false);
    }
  };

  const startEditPlan = (plan: WorkoutPlan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name || '');
    setDayOfWeek(plan.day_of_week || 'Monday');
    setNotes(plan.notes || '');
    const mappedExercises: ExerciseInput[] = (plan.exercises || []).map((exercise, index) => ({
      id: `exercise-edit-${index}-${Date.now()}`,
      name: exercise.name || '',
      sets: exercise.sets ? String(exercise.sets) : '',
      reps: exercise.reps ? String(exercise.reps) : '',
    }));
    setExerciseItems(mappedExercises.length > 0 ? mappedExercises : [createExerciseInput()]);
  };

  const handleDeletePlan = (planId: string) => {
    Alert.alert('Delete workout', 'Delete this workout plan permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteWorkout(planId);
            if (editingPlanId === planId) {
              resetForm();
            }
            await loadPlans();
          } catch (error: any) {
            Alert.alert('Failed', error.response?.data?.detail || 'Failed to delete workout plan');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Member Workouts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.formCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {editingPlanId ? 'Edit Workout Plan' : 'Assign New Workout Plan'}
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
            placeholder="Plan name (e.g., Strength Block A)"
            placeholderTextColor={theme.textSecondary}
            value={planName}
            onChangeText={setPlanName}
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Day of week</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChips}>
            {DAYS.map((day) => {
              const active = day === dayOfWeek;
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    { backgroundColor: active ? theme.primary : theme.inputBg, borderColor: theme.border },
                  ]}
                  onPress={() => setDayOfWeek(day)}
                >
                  <Text style={[styles.dayChipText, { color: active ? '#FFF' : theme.text }]}>{day.slice(0, 3)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.exerciseSection}>
            <View style={styles.exerciseHeader}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Exercises (optional)</Text>
              <TouchableOpacity
                style={[styles.addMoreButton, { borderColor: theme.primary }]}
                onPress={addExercise}
              >
                <Ionicons name="add" size={14} color={theme.primary} />
                <Text style={[styles.addMoreText, { color: theme.primary }]}>Add More</Text>
              </TouchableOpacity>
            </View>
            {exerciseItems.map((exercise, index) => (
              <View key={exercise.id} style={[styles.exerciseCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <View style={styles.exerciseTitleRow}>
                  <Text style={[styles.exerciseTitle, { color: theme.text }]}>Exercise {index + 1}</Text>
                  {exerciseItems.length > 1 ? (
                    <TouchableOpacity onPress={() => removeExercise(exercise.id)}>
                      <Ionicons name="trash-outline" size={16} color={theme.error} />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="Name of exercise"
                  placeholderTextColor={theme.textSecondary}
                  value={exercise.name}
                  onChangeText={(value) => updateExercise(exercise.id, 'name', value)}
                />
                <View style={styles.exerciseStatsRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.exerciseStatInput,
                      { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                    ]}
                    placeholder="Sets"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                    value={exercise.sets}
                    onChangeText={(value) => updateExercise(exercise.id, 'sets', value.replace(/[^0-9]/g, ''))}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      styles.exerciseStatInput,
                      { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                    ]}
                    placeholder="Reps"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                    value={exercise.reps}
                    onChangeText={(value) => updateExercise(exercise.id, 'reps', value.replace(/[^0-9]/g, ''))}
                  />
                </View>
              </View>
            ))}
          </View>

          <TextInput
            style={[
              styles.input,
              styles.multiline,
              { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Notes (optional)"
            placeholderTextColor={theme.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.assignButton, { backgroundColor: theme.primary }]}
              onPress={handleSavePlan}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.assignButtonText}>{editingPlanId ? 'Save Workout' : 'Assign Workout'}</Text>
              )}
            </TouchableOpacity>
            {editingPlanId ? (
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={resetForm}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.planSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Assigned Plans</Text>
          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : plans.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No workout plans assigned yet.</Text>
            </View>
          ) : (
            plans.map((plan) => (
              <View key={plan.id} style={[styles.planCard, { backgroundColor: theme.card }]}>
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: theme.text }]}>{plan.name}</Text>
                  <View style={[styles.dayBadge, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.dayBadgeText, { color: theme.primary }]}>{plan.day_of_week || 'No day'}</Text>
                  </View>
                </View>

                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.primary + '20' }]}
                    onPress={() => startEditPlan(plan)}
                  >
                    <Ionicons name="create-outline" size={16} color={theme.primary} />
                    <Text style={[styles.iconButtonText, { color: theme.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.error + '20' }]}
                    onPress={() => handleDeletePlan(plan.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.error} />
                    <Text style={[styles.iconButtonText, { color: theme.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>

                {plan.notes ? (
                  <Text style={[styles.planNotes, { color: theme.textSecondary }]}>{plan.notes}</Text>
                ) : null}
                {(plan.exercises || []).map((exercise, index) => (
                  <Text key={`${plan.id}-${index}`} style={[styles.exerciseText, { color: theme.textSecondary }]}>
                    {index + 1}. {exercise.name} | {exercise.sets} x {exercise.reps}
                    {exercise.weight ? ` | ${exercise.weight}kg` : ''}
                  </Text>
                ))}
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  exerciseSection: {
    gap: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addMoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  exerciseStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseStatInput: {
    flex: 1,
  },
  dayChips: {
    gap: 8,
    paddingVertical: 2,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
  },
  multiline: {
    height: 88,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  formActions: {
    gap: 8,
  },
  assignButton: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignButtonText: {
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
  planSection: {
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
  planCard: {
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  dayBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dayBadgeText: {
    fontSize: 11,
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
  planNotes: {
    fontSize: 13,
  },
  exerciseText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
