import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';

export default function LogWorkoutScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const [exercise, setExercise] = useState('Bench Press');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('60');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      // Create ad-hoc api call since we didn't add it to api.ts yet
      const res = await api.client.get('/workout-logs');
      setLogs(res.data);
    } catch (e) {
      console.log('Error fetching logs', e);
    }
  };

  const logWorkout = async () => {
    try {
      await api.client.post('/workout-logs', {
        items: [{ exercise, sets: parseInt(sets), reps: parseInt(reps), weight: parseFloat(weight) }]
      });
      alert('Workout logged successfully!');
      fetchLogs();
    } catch (e) {
      console.log('Error logging', e);
    }
  };

  // Prepare chart data
  const chartData = logs
    .flatMap(l => l.items)
    .filter(i => i.exercise.toLowerCase() === exercise.toLowerCase())
    .map(i => i.weight)
    .reverse();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>Workout Logger</Text>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <TextInput 
            style={[styles.input, { borderColor: theme.border, color: theme.text }]} 
            placeholder="Exercise (e.g. Bench Press)"
            placeholderTextColor={theme.textSecondary}
            value={exercise} onChangeText={setExercise} 
          />
          <View style={styles.row}>
            <TextInput 
              style={[styles.input, styles.half, { borderColor: theme.border, color: theme.text }]} 
              placeholder="Sets" keyboardType="numeric"
              placeholderTextColor={theme.textSecondary}
              value={sets} onChangeText={setSets} 
            />
            <TextInput 
              style={[styles.input, styles.half, { borderColor: theme.border, color: theme.text }]} 
              placeholder="Reps" keyboardType="numeric"
              placeholderTextColor={theme.textSecondary}
              value={reps} onChangeText={setReps} 
            />
          </View>
          <TextInput 
            style={[styles.input, { borderColor: theme.border, color: theme.text }]} 
            placeholder="Weight (kg)" keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
            value={weight} onChangeText={setWeight} 
          />

          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={logWorkout}>
            <Text style={styles.buttonText}>Log Set</Text>
          </TouchableOpacity>
        </View>

        {chartData.length > 0 && (
          <View style={{ marginTop: 30 }}>
            <Text style={[styles.subtitle, { color: theme.text }]}>{exercise} Progress</Text>
            <LineChart
              data={{
                labels: chartData.map((_, i) => \`#\${i+1}\`),
                datasets: [{ data: chartData }]
              }}
              width={Dimensions.get('window').width - 40}
              height={220}
              yAxisSuffix="kg"
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 1,
                color: (opacity = 1) => theme.primary,
                labelColor: (opacity = 1) => theme.text,
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
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
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  card: { padding: 20, borderRadius: 12 },
  input: { borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  button: { padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
