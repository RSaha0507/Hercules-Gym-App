import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';

export default function AIPlanScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const generatePlan = async () => {
    if (!weight.trim() || !goal.trim() || !level.trim()) {
      Alert.alert('Missing Information', 'Please enter weight, goal, and experience level.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.generateAiPlan({ weight, goal, level });
      setPlan(data);
    } catch (e: any) {
      console.log('Error generating plan', e);
      const detail = e.response?.data?.detail;
      const isTimeout = e.code === 'ECONNABORTED' || e.message?.toLowerCase().includes('timeout');
      const errorMessage = detail || (isTimeout 
        ? 'AI generation took longer than expected due to temporary model traffic. Please try again.' 
        : (e.message || 'Unable to generate AI plan. Please try again.'));
      Alert.alert('AI Generation Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (title: string, content: any) => {
    if (!content) return null;
    return (
      <View style={[styles.sectionBlock, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionHeader, { color: theme.primary }]}>{title}</Text>
        {typeof content === 'string' ? (
          <Text style={[styles.planText, { color: theme.text }]}>{content}</Text>
        ) : (
          <Text style={[styles.planText, { color: theme.text }]}>
            {typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>AI Workout & Diet Generator</Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Weight (kg)</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
            placeholder="e.g. 75"
            placeholderTextColor={theme.textSecondary}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Goal</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
            placeholder="e.g. Lose fat, build muscle"
            placeholderTextColor={theme.textSecondary}
            value={goal}
            onChangeText={setGoal}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Experience Level</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
            placeholder="e.g. Beginner, Intermediate"
            placeholderTextColor={theme.textSecondary}
            value={level}
            onChangeText={setLevel}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={generatePlan}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate Plan</Text>}
        </TouchableOpacity>

        {plan && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.planTitle, { color: theme.text }]}>Your Personalized Plan</Text>
            {plan.workout_plan ? renderSection('Workout Plan', plan.workout_plan) : null}
            {plan.diet_plan ? renderSection('Diet & Nutrition Plan', plan.diet_plan) : null}
            {!plan.workout_plan && !plan.diet_plan && (
              <View style={[styles.planCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.planText, { color: theme.textSecondary }]}>
                  {JSON.stringify(plan, null, 2)}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 16, marginBottom: 5 },
  input: { borderWidth: 1, padding: 12, borderRadius: 8, fontSize: 16 },
  button: { padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resultsContainer: { marginTop: 25 },
  planTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  sectionBlock: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  sectionHeader: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  planCard: { padding: 16, borderRadius: 12 },
  planText: { fontSize: 14, lineHeight: 22 }
});
