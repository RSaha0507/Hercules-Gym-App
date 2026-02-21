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

interface Meal {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
}

interface DietPlan {
  id: string;
  name: string;
  notes?: string;
  meals: Meal[];
  created_at: string;
}

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

function toMealLines(meals: Meal[] = []): string {
  return meals.map((meal) => `${meal.meal_type}: ${meal.description}`).join('\n');
}

export default function MemberDietScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDietId, setEditingDietId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [mealLines, setMealLines] = useState('');

  const resetForm = () => {
    setName('');
    setNotes('');
    setMealLines('');
    setEditingDietId(null);
  };

  const loadPlans = useCallback(async () => {
    try {
      const response = await api.getDiets(id);
      setPlans(response || []);
    } catch (error) {
      console.log('Error loading diet plans:', error);
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

  const parseMeals = (): Meal[] => {
    return mealLines
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [typeRaw, ...descParts] = line.split(':');
        const mealType = typeRaw?.trim().toLowerCase();
        const description = descParts.join(':').trim();
        if (!VALID_MEAL_TYPES.includes(mealType) || !description) {
          return null;
        }
        return {
          meal_type: mealType as Meal['meal_type'],
          description,
        };
      })
      .filter((meal): meal is Meal => !!meal);
  };

  const handleSaveDiet = async () => {
    const meals = parseMeals();
    if (!name.trim()) {
      Alert.alert('Validation', 'Plan name is required.');
      return;
    }
    if (!meals.length) {
      Alert.alert('Validation', 'Add at least one valid meal line.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        member_id: id,
        name: name.trim(),
        notes: notes.trim() || undefined,
        meals,
      };

      if (editingDietId) {
        await api.updateDiet(editingDietId, payload);
        Alert.alert('Success', 'Diet plan updated successfully.');
      } else {
        await api.createDiet(payload);
        Alert.alert('Success', 'Diet plan assigned successfully.');
      }

      resetForm();
      await loadPlans();
    } catch (error: any) {
      Alert.alert('Failed', error.response?.data?.detail || 'Failed to save diet plan');
    } finally {
      setSaving(false);
    }
  };

  const startEditPlan = (plan: DietPlan) => {
    setEditingDietId(plan.id);
    setName(plan.name || '');
    setNotes(plan.notes || '');
    setMealLines(toMealLines(plan.meals || []));
  };

  const handleDeletePlan = (dietId: string) => {
    Alert.alert('Delete diet plan', 'Delete this diet plan permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteDiet(dietId);
            if (editingDietId === dietId) {
              resetForm();
            }
            await loadPlans();
          } catch (error: any) {
            Alert.alert('Failed', error.response?.data?.detail || 'Failed to delete diet plan');
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
        <Text style={[styles.title, { color: theme.text }]}>Member Diet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.formCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {editingDietId ? 'Edit Diet Plan' : 'Assign Diet Plan'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
            placeholder="Plan name (e.g., Lean Bulk)"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={[
              styles.input,
              styles.multiline,
              { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
            ]}
            placeholder={'Meals (one per line):\nbreakfast: oats + banana\nlunch: rice + chicken\ndinner: fish + vegetables'}
            placeholderTextColor={theme.textSecondary}
            value={mealLines}
            onChangeText={setMealLines}
            multiline
          />

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
              onPress={handleSaveDiet}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.assignButtonText}>{editingDietId ? 'Save Diet' : 'Assign Diet'}</Text>}
            </TouchableOpacity>
            {editingDietId ? (
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Assigned Diet Plans</Text>
          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : plans.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No diet plans assigned yet.</Text>
            </View>
          ) : (
            plans.map((plan) => (
              <View key={plan.id} style={[styles.planCard, { backgroundColor: theme.card }]}>
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: theme.text }]}>{plan.name}</Text>
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
                {(plan.meals || []).map((meal, index) => (
                  <Text key={`${plan.id}-${index}`} style={[styles.mealText, { color: theme.textSecondary }]}>
                    {meal.meal_type}: {meal.description}
                  </Text>
                ))}
                {plan.notes ? (
                  <Text style={[styles.planNotes, { color: theme.textSecondary }]}>{plan.notes}</Text>
                ) : null}
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
  mealText: {
    fontSize: 13,
    lineHeight: 18,
    textTransform: 'capitalize',
  },
  planNotes: {
    fontSize: 13,
  },
});
