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

export default function MemberDietScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDietId, setEditingDietId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [evening, setEvening] = useState('');
  const [dinner, setDinner] = useState('');

  const resetForm = () => {
    setName('');
    setNotes('');
    setBreakfast('');
    setLunch('');
    setEvening('');
    setDinner('');
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

  const buildMeals = (): Meal[] => {
    const rawMeals: Meal[] = [
      { meal_type: 'breakfast', description: breakfast.trim() },
      { meal_type: 'lunch', description: lunch.trim() },
      { meal_type: 'snack', description: evening.trim() },
      { meal_type: 'dinner', description: dinner.trim() },
    ];
    return rawMeals.filter((meal) => meal.description.length > 0);
  };

  const handleSaveDiet = async () => {
    const meals = buildMeals();

    setSaving(true);
    try {
      const payload = {
        member_id: id,
        name: name.trim() || 'Diet Plan',
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
    const mappedMeals = (plan.meals || []).reduce(
      (acc, meal) => {
        const description = (meal.description || '').trim();
        if (!description) return acc;
        if (meal.meal_type === 'breakfast') acc.breakfast = description;
        if (meal.meal_type === 'lunch') acc.lunch = description;
        if (meal.meal_type === 'snack') acc.evening = description;
        if (meal.meal_type === 'dinner') acc.dinner = description;
        return acc;
      },
      { breakfast: '', lunch: '', evening: '', dinner: '' },
    );
    setBreakfast(mappedMeals.breakfast);
    setLunch(mappedMeals.lunch);
    setEvening(mappedMeals.evening);
    setDinner(mappedMeals.dinner);
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

          <View style={styles.mealSection}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Meals (all optional)</Text>
            <TextInput
              style={[
                styles.input,
                styles.mealInput,
                { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Breakfast"
              placeholderTextColor={theme.textSecondary}
              value={breakfast}
              onChangeText={setBreakfast}
            />
            <TextInput
              style={[
                styles.input,
                styles.mealInput,
                { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Lunch"
              placeholderTextColor={theme.textSecondary}
              value={lunch}
              onChangeText={setLunch}
            />
            <TextInput
              style={[
                styles.input,
                styles.mealInput,
                { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Evening"
              placeholderTextColor={theme.textSecondary}
              value={evening}
              onChangeText={setEvening}
            />
            <TextInput
              style={[
                styles.input,
                styles.mealInput,
                { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Dinner"
              placeholderTextColor={theme.textSecondary}
              value={dinner}
              onChangeText={setDinner}
            />
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
                {(plan.meals || []).map((meal, index) => {
                  const label =
                    meal.meal_type === 'snack'
                      ? 'Evening'
                      : meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1);
                  return (
                    <Text key={`${plan.id}-${index}`} style={[styles.mealText, { color: theme.textSecondary }]}>
                      {label}: {meal.description}
                    </Text>
                  );
                })}
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  mealSection: {
    gap: 8,
  },
  mealInput: {
    height: 44,
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
