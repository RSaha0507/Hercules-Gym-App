import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';

interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
  completed?: boolean;
}

interface Workout {
  id: string;
  name: string;
  day_of_week?: string;
  notes?: string;
  exercises?: WorkoutExercise[];
  created_at?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function normalizeDay(value?: string): string {
  if (!value) return '';
  return value.trim().toLowerCase();
}

function getTodayName(): string {
  return DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
}

export default function WorkoutsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ day?: string }>();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('All');

  const loadWorkouts = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await api.getWorkouts(user.id);
      setWorkouts(data || []);
    } catch (error) {
      console.log('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts]),
  );

  useEffect(() => {
    if (!params.day) return;
    const requested = String(params.day).trim().toLowerCase();
    if (requested === 'today') {
      setSelectedDay(getTodayName());
      return;
    }
    const found = DAYS.find((day) => day.toLowerCase() === requested);
    if (found) {
      setSelectedDay(found);
    }
  }, [params.day]);

  const workoutsByDay = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    for (const day of DAYS) {
      map[day] = [];
    }
    map.Unassigned = [];

    for (const workout of workouts) {
      const normalized = normalizeDay(workout.day_of_week);
      const matchedDay = DAYS.find((d) => d.toLowerCase() === normalized);
      if (matchedDay) {
        map[matchedDay].push(workout);
      } else {
        map.Unassigned.push(workout);
      }
    }
    return map;
  }, [workouts]);

  const visibleSections = useMemo(() => {
    if (selectedDay !== 'All') {
      if (selectedDay === 'Unassigned') {
        return [{ day: 'Unassigned', items: workoutsByDay.Unassigned }];
      }
      return [{ day: selectedDay, items: workoutsByDay[selectedDay] || [] }];
    }

    const sections = DAYS.map((day) => ({ day, items: workoutsByDay[day] || [] })).filter(
      (section) => section.items.length > 0,
    );
    if (workoutsByDay.Unassigned.length > 0) {
      sections.push({ day: 'Unassigned', items: workoutsByDay.Unassigned });
    }
    return sections;
  }, [selectedDay, workoutsByDay]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>My Workouts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayTabs}
      >
        {['All', ...DAYS, 'Unassigned'].map((day) => {
          const isActive = selectedDay === day;
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayChip,
                {
                  backgroundColor: isActive ? theme.primary : theme.card,
                  borderColor: isActive ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayChipText, { color: isActive ? '#FFF' : theme.text }]}>
                {day === 'Unassigned' ? 'No Day' : day.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {visibleSections.length === 0 ? (
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No workout plans assigned for this day.
              </Text>
            </View>
          ) : (
            visibleSections.map((section) => (
              <View key={section.day} style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.day}</Text>
                {section.items.map((item) => (
                  <View key={item.id} style={[styles.card, { backgroundColor: theme.card }]}>
                    <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                    {item.notes ? (
                      <Text style={[styles.notes, { color: theme.textSecondary }]}>{item.notes}</Text>
                    ) : null}
                    <View style={styles.exerciseWrap}>
                      {(item.exercises || []).map((exercise, index) => (
                        <View key={`${item.id}-${index}`} style={styles.exerciseRow}>
                          <Text style={[styles.exerciseName, { color: theme.text }]}>
                            {index + 1}. {exercise.name}
                          </Text>
                          <Text style={[styles.exerciseMeta, { color: theme.textSecondary }]}>
                            {exercise.sets} x {exercise.reps}
                            {exercise.weight ? ` | ${exercise.weight}kg` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
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
    paddingVertical: 14,
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700' },
  dayTabs: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  dayChip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dayChipText: { fontSize: 13, fontWeight: '600' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  sectionWrap: { gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  card: {
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  name: { fontSize: 16, fontWeight: '700' },
  notes: { fontSize: 13 },
  exerciseWrap: { gap: 8 },
  exerciseRow: { gap: 2 },
  exerciseName: { fontSize: 14, fontWeight: '600' },
  exerciseMeta: { fontSize: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
