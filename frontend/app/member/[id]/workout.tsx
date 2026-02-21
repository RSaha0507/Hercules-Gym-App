import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { useTheme } from '../../../src/context/ThemeContext';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  notes?: string;
}

interface WorkoutDay {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export default function MemberWorkoutScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [selectedDay, setSelectedDay] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sample workout data - in real app, fetch from API
  const [workoutPlan] = useState<WorkoutDay[]>([
    {
      day: 'Monday',
      focus: 'Chest & Triceps',
      exercises: [
        { id: '1', name: 'Bench Press', sets: 4, reps: '10-12', weight: '60kg' },
        { id: '2', name: 'Incline Dumbbell Press', sets: 3, reps: '12', weight: '20kg' },
        { id: '3', name: 'Cable Flyes', sets: 3, reps: '15', weight: '15kg' },
        { id: '4', name: 'Tricep Pushdown', sets: 4, reps: '12-15', weight: '25kg' },
        { id: '5', name: 'Overhead Tricep Extension', sets: 3, reps: '12', weight: '15kg' },
      ],
    },
    {
      day: 'Tuesday',
      focus: 'Back & Biceps',
      exercises: [
        { id: '6', name: 'Deadlift', sets: 4, reps: '6-8', weight: '100kg' },
        { id: '7', name: 'Lat Pulldown', sets: 4, reps: '10-12', weight: '50kg' },
        { id: '8', name: 'Seated Row', sets: 3, reps: '12', weight: '45kg' },
        { id: '9', name: 'Barbell Curl', sets: 4, reps: '10-12', weight: '25kg' },
        { id: '10', name: 'Hammer Curls', sets: 3, reps: '12', weight: '12kg' },
      ],
    },
    {
      day: 'Wednesday',
      focus: 'Rest / Cardio',
      exercises: [
        { id: '11', name: 'Treadmill', sets: 1, reps: '20 mins', notes: 'Moderate pace' },
        { id: '12', name: 'Stretching', sets: 1, reps: '15 mins' },
      ],
    },
    {
      day: 'Thursday',
      focus: 'Shoulders & Abs',
      exercises: [
        { id: '13', name: 'Overhead Press', sets: 4, reps: '10', weight: '40kg' },
        { id: '14', name: 'Lateral Raises', sets: 4, reps: '15', weight: '10kg' },
        { id: '15', name: 'Front Raises', sets: 3, reps: '12', weight: '10kg' },
        { id: '16', name: 'Plank', sets: 3, reps: '60 secs' },
        { id: '17', name: 'Cable Crunches', sets: 4, reps: '20', weight: '30kg' },
      ],
    },
    {
      day: 'Friday',
      focus: 'Legs',
      exercises: [
        { id: '18', name: 'Squats', sets: 4, reps: '8-10', weight: '80kg' },
        { id: '19', name: 'Leg Press', sets: 4, reps: '12', weight: '150kg' },
        { id: '20', name: 'Leg Curls', sets: 3, reps: '12', weight: '35kg' },
        { id: '21', name: 'Leg Extension', sets: 3, reps: '15', weight: '40kg' },
        { id: '22', name: 'Calf Raises', sets: 4, reps: '20', weight: '60kg' },
      ],
    },
    {
      day: 'Saturday',
      focus: 'Full Body / HIIT',
      exercises: [
        { id: '23', name: 'Burpees', sets: 4, reps: '15' },
        { id: '24', name: 'Kettlebell Swings', sets: 4, reps: '20', weight: '16kg' },
        { id: '25', name: 'Box Jumps', sets: 3, reps: '12' },
        { id: '26', name: 'Battle Ropes', sets: 3, reps: '30 secs' },
      ],
    },
    {
      day: 'Sunday',
      focus: 'Rest',
      exercises: [],
    },
  ]);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      Alert.alert('Success', 'Workout plan saved successfully!');
    }, 1000);
  };

  const currentDay = workoutPlan[selectedDay];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Workout Plan</Text>
        {(user?.role === 'admin' || user?.role === 'trainer') && (
          <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)}>
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons 
                name={isEditing ? 'checkmark' : 'create-outline'} 
                size={24} 
                color={theme.primary} 
              />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Day Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daySelector}
      >
        {workoutPlan.map((day, index) => (
          <TouchableOpacity
            key={day.day}
            style={[
              styles.dayChip,
              {
                backgroundColor: selectedDay === index ? theme.primary : theme.card,
                borderColor: selectedDay === index ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setSelectedDay(index)}
          >
            <Text
              style={[
                styles.dayChipText,
                { color: selectedDay === index ? '#FFF' : theme.text },
              ]}
            >
              {day.day.slice(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Day Header */}
        <View style={[styles.dayHeader, { backgroundColor: theme.primary + '15' }]}>
          <View>
            <Text style={[styles.dayTitle, { color: theme.text }]}>{currentDay.day}</Text>
            <Text style={[styles.dayFocus, { color: theme.primary }]}>{currentDay.focus}</Text>
          </View>
          <View style={[styles.exerciseCount, { backgroundColor: theme.primary }]}>
            <Text style={styles.exerciseCountText}>{currentDay.exercises.length}</Text>
            <Text style={styles.exerciseCountLabel}>Exercises</Text>
          </View>
        </View>

        {/* Exercises */}
        {currentDay.exercises.length === 0 ? (
          <View style={[styles.restDay, { backgroundColor: theme.card }]}>
            <Ionicons name="bed" size={60} color={theme.textSecondary} />
            <Text style={[styles.restDayTitle, { color: theme.text }]}>Rest Day</Text>
            <Text style={[styles.restDaySubtitle, { color: theme.textSecondary }]}>
              Take time to recover and prepare for the next session
            </Text>
          </View>
        ) : (
          currentDay.exercises.map((exercise, index) => (
            <View key={exercise.id} style={[styles.exerciseCard, { backgroundColor: theme.card }]}>
              <View style={styles.exerciseNumber}>
                <Text style={[styles.exerciseNumberText, { color: theme.primary }]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.exerciseContent}>
                <Text style={[styles.exerciseName, { color: theme.text }]}>
                  {exercise.name}
                </Text>
                <View style={styles.exerciseDetails}>
                  <View style={[styles.detailBadge, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.detailText, { color: theme.primary }]}>
                      {exercise.sets} sets
                    </Text>
                  </View>
                  <View style={[styles.detailBadge, { backgroundColor: theme.secondary + '20' }]}>
                    <Text style={[styles.detailText, { color: theme.secondary }]}>
                      {exercise.reps} reps
                    </Text>
                  </View>
                  {exercise.weight && (
                    <View style={[styles.detailBadge, { backgroundColor: theme.success + '20' }]}>
                      <Text style={[styles.detailText, { color: theme.success }]}>
                        {exercise.weight}
                      </Text>
                    </View>
                  )}
                </View>
                {exercise.notes && (
                  <Text style={[styles.exerciseNotes, { color: theme.textSecondary }]}>
                    Note: {exercise.notes}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}

        {/* Tips Section */}
        {currentDay.exercises.length > 0 && (
          <View style={[styles.tipsCard, { backgroundColor: theme.warning + '15' }]}>
            <Ionicons name="bulb" size={24} color={theme.warning} />
            <View style={styles.tipsContent}>
              <Text style={[styles.tipsTitle, { color: theme.text }]}>Tips</Text>
              <Text style={[styles.tipsText, { color: theme.textSecondary }]}>
                • Rest 60-90 seconds between sets{"\n"}
                • Stay hydrated throughout{"\n"}
                • Focus on proper form over heavy weights
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontWeight: 'bold',
  },
  daySelector: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dayFocus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  exerciseCount: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  exerciseCountText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  exerciseCountLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
  restDay: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    gap: 12,
  },
  restDayTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  restDaySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  exerciseCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  exerciseNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exerciseNotes: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  tipsCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    gap: 14,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    lineHeight: 22,
  },
});
