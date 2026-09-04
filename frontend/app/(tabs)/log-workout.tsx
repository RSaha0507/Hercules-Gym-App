import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';

const screenWidth = Dimensions.get('window').width;

export default function LogWorkoutScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'log' | 'analytics'>('log');

  // Workout Logger State
  const [exercise, setExercise] = useState('Bench Press');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('60');
  const [logs, setLogs] = useState<any[]>([]);
  const [isLogging, setIsLogging] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await api.getWorkoutLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.log('Error fetching workout logs', e);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const data = await api.getMyProgressAnalytics();
      setAnalytics(data);
    } catch (e: any) {
      console.log('Error fetching progress analytics', e);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchAnalytics();
  }, [fetchLogs, fetchAnalytics]);

  const logWorkout = async () => {
    if (!exercise.trim()) {
      Alert.alert('Validation Error', 'Please enter an exercise name.');
      return;
    }
    setIsLogging(true);
    try {
      await api.createWorkoutLog([
        {
          exercise: exercise.trim(),
          sets: parseInt(sets, 10) || 1,
          reps: parseInt(reps, 10) || 1,
          weight: parseFloat(weight) || 0,
        },
      ]);
      Alert.alert('Logged', 'Workout set recorded successfully!');
      fetchLogs();
      fetchAnalytics();
    } catch (e: any) {
      console.log('Error logging set', e);
      Alert.alert('Error', e.response?.data?.detail || 'Failed to log workout');
    } finally {
      setIsLogging(false);
    }
  };

  // Prepare chart data for single exercise trend
  const exerciseWeights = logs
    .flatMap((l) => l.items || [])
    .filter((i) => i.exercise?.toLowerCase() === exercise.trim().toLowerCase())
    .map((i) => i.weight)
    .reverse();

  // Weight summary helpers
  const monthlyWeights: any[] = analytics?.monthly_weights || [];
  const weightSummary = analytics?.weight_summary || {};
  const monthlyWorkouts: any[] = analytics?.monthly_workouts || [];
  const workoutSummary = analytics?.workout_summary || {};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIcon, { backgroundColor: theme.primary + '18' }]}>
            <Ionicons name="trending-up" size={24} color={theme.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Workout Progress Tracker</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Overload tracking & monthly body analytics
            </Text>
          </View>
        </View>
      </View>

      {/* Segmented Switcher */}
      <View style={[styles.tabSelectorContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[styles.tabSelector, { backgroundColor: theme.inputBg }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'log' && [styles.activeTabBtn, { backgroundColor: theme.primary }],
            ]}
            onPress={() => setActiveTab('log')}
          >
            <Ionicons
              name="barbell-outline"
              size={16}
              color={activeTab === 'log' ? '#FFF' : theme.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'log' ? '#FFF' : theme.textSecondary },
              ]}
            >
              Log Workout
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'analytics' && [styles.activeTabBtn, { backgroundColor: theme.primary }],
            ]}
            onPress={() => {
              setActiveTab('analytics');
              fetchAnalytics();
            }}
          >
            <Ionicons
              name="pie-chart-outline"
              size={16}
              color={activeTab === 'analytics' ? '#FFF' : theme.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'analytics' ? '#FFF' : theme.textSecondary },
              ]}
            >
              Monthly Analytics
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'log' ? (
          <>
            {/* Input Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Log Exercise Set</Text>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBg }]}
                placeholder="Exercise (e.g. Bench Press)"
                placeholderTextColor={theme.textSecondary}
                value={exercise}
                onChangeText={setExercise}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.half, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBg }]}
                  placeholder="Sets"
                  keyboardType="numeric"
                  placeholderTextColor={theme.textSecondary}
                  value={sets}
                  onChangeText={setSets}
                />
                <TextInput
                  style={[styles.input, styles.half, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBg }]}
                  placeholder="Reps"
                  keyboardType="numeric"
                  placeholderTextColor={theme.textSecondary}
                  value={reps}
                  onChangeText={setReps}
                />
              </View>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBg }]}
                placeholder="Weight (kg)"
                keyboardType="numeric"
                placeholderTextColor={theme.textSecondary}
                value={weight}
                onChangeText={setWeight}
              />

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={logWorkout}
                disabled={isLogging}
              >
                {isLogging ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.buttonText}>Save Exercise Set</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Exercise Weight Progression Chart */}
            {exerciseWeights.length > 1 ? (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {exercise} Progression
                  </Text>
                  <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.badgeText, { color: theme.primary }]}>Overload Curve</Text>
                  </View>
                </View>
                <LineChart
                  data={{
                    labels: exerciseWeights.map((_, i) => `#${i + 1}`),
                    datasets: [{ data: exerciseWeights }],
                  }}
                  width={screenWidth - 64}
                  height={180}
                  chartConfig={{
                    backgroundColor: theme.card,
                    backgroundGradientFrom: theme.card,
                    backgroundGradientTo: theme.card,
                    decimalPlaces: 1,
                    color: (opacity = 1) => theme.primary,
                    labelColor: (opacity = 1) => theme.textSecondary,
                    propsForDots: { r: '4', strokeWidth: '2', stroke: theme.primary },
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>
            ) : null}

            {/* Recent Sets History */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 12 }]}>
                Recent Workout Logs
              </Text>
              {logs.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No workout sets logged yet. Record your first set above!
                </Text>
              ) : (
                logs.slice(0, 8).map((log, index) => (
                  <View
                    key={log.id || index}
                    style={[styles.logItem, { borderBottomColor: theme.border }]}
                  >
                    <View>
                      <Text style={[styles.logDate, { color: theme.textSecondary }]}>
                        {log.date ? new Date(log.date).toLocaleDateString() : 'Recent Session'}
                      </Text>
                      {log.items?.map((item: any, i: number) => (
                        <Text key={i} style={[styles.logText, { color: theme.text }]}>
                          • <Text style={{ fontWeight: '700' }}>{item.exercise}</Text>: {item.sets} sets × {item.reps} reps @ <Text style={{ color: theme.primary }}>{item.weight} kg</Text>
                        </Text>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <>
            {/* MONTHLY PROGRESS ANALYTICS VIEW */}
            {loadingAnalytics ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Loading monthly progress analytics...
                </Text>
              </View>
            ) : (
              <>
                {/* Official Trainer Weight Section */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: theme.text }]}>
                        Trainer-Verified Monthly Weight
                      </Text>
                      <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                        Logged by your center's certified trainer
                      </Text>
                    </View>
                    <View style={[styles.verifiedBadge, { backgroundColor: '#10b98120' }]}>
                      <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                      <Text style={[styles.verifiedText, { color: "#10b981" }]}>Official</Text>
                    </View>
                  </View>

                  {/* Summary Metric Strip */}
                  <View style={styles.metricsStrip}>
                    <View style={[styles.metricBox, { backgroundColor: theme.inputBg }]}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Starting</Text>
                      <Text style={[styles.metricValue, { color: theme.text }]}>
                        {weightSummary.starting_weight ? `${weightSummary.starting_weight} kg` : '--'}
                      </Text>
                    </View>
                    <View style={[styles.metricBox, { backgroundColor: theme.inputBg }]}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Current</Text>
                      <Text style={[styles.metricValue, { color: theme.text }]}>
                        {weightSummary.current_weight ? `${weightSummary.current_weight} kg` : '--'}
                      </Text>
                    </View>
                    <View style={[styles.metricBox, { backgroundColor: theme.inputBg }]}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Net Change</Text>
                      <Text
                        style={[
                          styles.metricValue,
                          {
                            color:
                              weightSummary.net_change_kg && weightSummary.net_change_kg < 0
                                ? '#10b981'
                                : weightSummary.net_change_kg && weightSummary.net_change_kg > 0
                                ? '#f59e0b'
                                : theme.text,
                          },
                        ]}
                      >
                        {weightSummary.net_change_kg !== null && weightSummary.net_change_kg !== undefined
                          ? `${weightSummary.net_change_kg > 0 ? '+' : ''}${weightSummary.net_change_kg} kg`
                          : '--'}
                      </Text>
                    </View>
                  </View>

                  {/* Monthly Weight Timeline */}
                  <View style={styles.monthlyList}>
                    {monthlyWeights.length === 0 ? (
                      <View style={styles.noticeBox}>
                        <Ionicons name="information-circle-outline" size={18} color={theme.textSecondary} />
                        <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
                          No monthly weights recorded yet. Your trainer will log your official weight at your monthly check-in.
                        </Text>
                      </View>
                    ) : (
                      monthlyWeights.map((w, idx) => (
                        <View
                          key={idx}
                          style={[styles.weightRow, { borderBottomColor: theme.border }]}
                        >
                          <View style={styles.weightRowLeft}>
                            <View style={[styles.monthTag, { backgroundColor: theme.primary + '15' }]}>
                              <Text style={[styles.monthTagText, { color: theme.primary }]}>
                                {w.month}
                              </Text>
                            </View>
                            <View>
                              <Text style={[styles.weightKg, { color: theme.text }]}>
                                {w.weight_kg} kg
                              </Text>
                              <Text style={[styles.loggedBy, { color: theme.textSecondary }]}>
                                Logged by {w.logged_by_name}
                              </Text>
                            </View>
                          </View>
                          {w.notes ? (
                            <Text style={[styles.weightNote, { color: theme.textSecondary }]}>
                              "{w.notes}"
                            </Text>
                          ) : null}
                        </View>
                      ))
                    )}
                  </View>

                  <View style={[styles.disclaimerCard, { backgroundColor: theme.inputBg }]}>
                    <Ionicons name="lock-closed-outline" size={15} color={theme.textSecondary} />
                    <Text style={[styles.disclaimerBody, { color: theme.textSecondary }]}>
                      Weight check-ins are restricted to center trainers and admins to guarantee measurement precision and adherence.
                    </Text>
                  </View>
                </View>

                {/* Monthly Workout Progress Section */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={[styles.cardTitle, { color: theme.text }]}>
                        Monthly Workout Progress
                      </Text>
                      <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                        Self-logged workouts & progressive overload volume
                      </Text>
                    </View>
                  </View>

                  {/* Overall Workout Totals */}
                  <View style={styles.metricsStrip}>
                    <View style={[styles.metricBox, { backgroundColor: theme.inputBg }]}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Sessions</Text>
                      <Text style={[styles.metricValue, { color: theme.primary }]}>
                        {workoutSummary.total_sessions || 0}
                      </Text>
                    </View>
                    <View style={[styles.metricBox, { backgroundColor: theme.inputBg }]}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Sets</Text>
                      <Text style={[styles.metricValue, { color: theme.text }]}>
                        {workoutSummary.total_sets || 0}
                      </Text>
                    </View>
                    <View style={[styles.metricBox, { backgroundColor: theme.inputBg }]}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Volume</Text>
                      <Text style={[styles.metricValue, { color: '#8b5cf6' }]}>
                        {workoutSummary.total_volume_kg ? `${Math.round(workoutSummary.total_volume_kg / 1000)}t` : '0 kg'}
                      </Text>
                    </View>
                  </View>

                  {/* Monthly Workout History */}
                  <View style={styles.monthlyList}>
                    {monthlyWorkouts.length === 0 ? (
                      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        No workouts logged in the tracker yet. Start logging your sets to view monthly consistency!
                      </Text>
                    ) : (
                      monthlyWorkouts.map((mw, idx) => (
                        <View
                          key={idx}
                          style={[styles.monthWorkoutCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                        >
                          <View style={styles.monthWorkoutHeader}>
                            <Text style={[styles.mwMonthTitle, { color: theme.text }]}>
                              Month: {mw.month}
                            </Text>
                            <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                              <Text style={[styles.badgeText, { color: theme.primary }]}>
                                {mw.sessions_count} sessions
                              </Text>
                            </View>
                          </View>

                          <View style={styles.mwStatsRow}>
                            <Text style={[styles.mwStat, { color: theme.textSecondary }]}>
                              Sets: <Text style={{ color: theme.text, fontWeight: '700' }}>{mw.total_sets}</Text>
                            </Text>
                            <Text style={[styles.mwStat, { color: theme.textSecondary }]}>
                              Volume: <Text style={{ color: theme.text, fontWeight: '700' }}>{Math.round(mw.total_volume_kg).toLocaleString()} kg</Text>
                            </Text>
                          </View>

                          {mw.top_exercises && mw.top_exercises.length > 0 && (
                            <View style={styles.mwTopExercises}>
                              <Text style={[styles.topExTitle, { color: theme.textSecondary }]}>Top Lifts:</Text>
                              {mw.top_exercises.map((te: any, teIdx: number) => (
                                <Text key={teIdx} style={[styles.topExItem, { color: theme.text }]}>
                                  🏋️ {te.exercise}: <Text style={{ fontWeight: '700', color: theme.primary }}>{te.max_weight} kg</Text>
                                </Text>
                              ))}
                            </View>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                </View>
              </>
            )}
          </>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  tabSelectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  activeTabBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  logItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  logDate: {
    fontSize: 11,
    marginBottom: 4,
  },
  logText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  metricsStrip: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  monthlyList: {
    gap: 10,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  noticeText: {
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  weightRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  monthTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  weightKg: {
    fontSize: 15,
    fontWeight: '700',
  },
  loggedBy: {
    fontSize: 11,
  },
  weightNote: {
    fontSize: 11.5,
    fontStyle: 'italic',
    maxWidth: '40%',
    textAlign: 'right',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginTop: 14,
  },
  disclaimerBody: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  monthWorkoutCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  monthWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mwMonthTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  mwStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  mwStat: {
    fontSize: 12.5,
  },
  mwTopExercises: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
    gap: 3,
  },
  topExTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  topExItem: {
    fontSize: 12,
  },
});
