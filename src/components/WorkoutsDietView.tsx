import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { WorkoutDay, Exercise, MealItem } from '../types';
import {
  Dumbbell,
  Apple,
  TrendingUp,
  Flame,
  CheckCircle2,
  Clock,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Droplets,
  Scale,
  LineChart as ChartIcon,
  X,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

export const WorkoutsDietView: React.FC = () => {
  const {
    workoutPlan,
    dietPlan,
    fitnessMetrics,
    addFitnessMetric,
    currentUser,
    theme,
  } = useGym();

  const [activeSubTab, setActiveSubTab] = useState<'workouts' | 'diet' | 'metrics'>('workouts');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [waterGlasses, setWaterGlasses] = useState<number>(10); // 10 x 250ml = 2.5L

  // Rest Timer State
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  // New Metric Form Modal
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [metricForm, setMetricForm] = useState({
    weight_kg: 75.0,
    height_cm: 178,
    body_fat_pct: 14.5,
    chest_in: 41.5,
    waist_in: 31.5,
    biceps_in: 15.8,
    notes: '',
  });

  const toggleExerciseComplete = (id: string) => {
    setCompletedExercises(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const startRestTimer = (seconds: number) => {
    setTimerSeconds(seconds);
    setTimerActive(true);
  };

  React.useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const currentWorkoutDay = workoutPlan.days.find(d => d.day === selectedDay) || workoutPlan.days[0];

  const handleAddMetricSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const heightM = metricForm.height_cm / 100;
    const bmi = Number((metricForm.weight_kg / (heightM * heightM)).toFixed(1));

    addFitnessMetric({
      date: new Date().toISOString().slice(0, 10),
      weight_kg: Number(metricForm.weight_kg),
      height_cm: Number(metricForm.height_cm),
      body_fat_pct: Number(metricForm.body_fat_pct),
      bmi,
      chest_in: Number(metricForm.chest_in),
      waist_in: Number(metricForm.waist_in),
      biceps_in: Number(metricForm.biceps_in),
      notes: metricForm.notes || 'Routine check',
    });

    setShowMetricModal(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Sub-tab navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Workouts, Nutrition & Metrics</h2>
          <p className="text-xs text-zinc-400">
            Personalized progressive training program & macro fuel management
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div className={`p-1 rounded-2xl border flex items-center gap-1 self-start sm:self-auto ${
          theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-300'
        }`}>
          <button
            onClick={() => setActiveSubTab('workouts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'workouts'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Workout Routine</span>
          </button>

          <button
            onClick={() => setActiveSubTab('diet')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'diet'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>Nutrition & Diet</span>
          </button>

          <button
            onClick={() => setActiveSubTab('metrics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'metrics'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Body Metrics</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WORKOUT ROUTINE */}
      {activeSubTab === 'workouts' && (
        <div className="space-y-6">
          {/* Day Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {workoutPlan.days.map(d => (
              <button
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  selectedDay === d.day
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-900/30'
                    : theme === 'dark'
                    ? 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <span>{d.day}</span>
                <span className="text-[10px] opacity-75 font-normal">({d.exercises.length} ex)</span>
              </button>
            ))}
          </div>

          {/* Active Workout Day Header & Rest Timer HUD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`lg:col-span-2 p-6 rounded-3xl border flex items-center justify-between ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">
                  {selectedDay} Split
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">{currentWorkoutDay.title}</h3>
                <p className="text-xs text-zinc-400 mt-1">{currentWorkoutDay.focus}</p>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                  {workoutPlan.level}
                </span>
              </div>
            </div>

            {/* Floating Rest Timer Component */}
            <div className={`p-5 rounded-3xl border flex items-center justify-between ${
              timerActive
                ? 'bg-rose-950/40 border-rose-600/60 ring-2 ring-rose-500/30 animate-pulse'
                : theme === 'dark'
                ? 'bg-zinc-900/80 border-zinc-800'
                : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  Rest Interval Timer
                </span>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {timerSeconds !== null ? `${timerSeconds}s` : 'Ready'}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => startRestTimer(60)}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-bold"
                >
                  60s
                </button>
                <button
                  onClick={() => startRestTimer(90)}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-bold"
                >
                  90s
                </button>
                <button
                  onClick={() => startRestTimer(120)}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-bold"
                >
                  120s
                </button>
              </div>
            </div>
          </div>

          {/* Exercise Checklist Cards */}
          <div className="space-y-3">
            {currentWorkoutDay.exercises.map((ex, idx) => {
              const isDone = Boolean(completedExercises[ex.id]);

              return (
                <div
                  key={ex.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-800/40 opacity-80'
                      : theme === 'dark'
                      ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                      : 'bg-white border-zinc-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleExerciseComplete(ex.id)}
                      className={`w-8 h-8 rounded-2xl flex items-center justify-center font-bold text-xs transition-all shrink-0 mt-0.5 ${
                        isDone
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold ${isDone ? 'line-through text-zinc-400' : 'text-white'}`}>
                          {ex.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400">
                          {ex.target_muscle}
                        </span>
                      </div>
                      {ex.notes && (
                        <p className="text-xs text-zinc-400 mt-1">{ex.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                    <div className="text-right">
                      <div className="text-xs font-black text-rose-400">{ex.sets} Working Sets</div>
                      <div className="text-[11px] text-zinc-400">{ex.reps}</div>
                    </div>

                    <button
                      onClick={() => startRestTimer(ex.rest_seconds)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>{ex.rest_seconds}s Rest</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: NUTRITION & DIET PLAN */}
      {activeSubTab === 'diet' && (
        <div className="space-y-6">
          {/* Macro Targets Ring Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-3xl border ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">Daily Calorie Target</span>
              <div className="text-3xl font-black text-white mt-1">{dietPlan.daily_calories_target}</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">kcal / day</p>
            </div>

            <div className={`p-5 rounded-3xl border ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Protein Goal</span>
              <div className="text-3xl font-black text-emerald-400 mt-1">{dietPlan.daily_protein_target}g</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">2.2g per kg bodyweight</p>
            </div>

            <div className={`p-5 rounded-3xl border ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">Hydration Intake</span>
              <div className="text-3xl font-black text-blue-400 mt-1">{(waterGlasses * 0.25).toFixed(1)}L / {dietPlan.daily_water_target_liters}L</div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setWaterGlasses(prev => prev + 1)}
                  className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold"
                >
                  +250ml Glass
                </button>
              </div>
            </div>

            <div className={`p-5 rounded-3xl border ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">Assigned Coach</span>
              <div className="text-base font-black text-white mt-2">Rahul Das</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Head Nutritionist (Ranaghat)</p>
            </div>
          </div>

          {/* Meals Timeline */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-white">Daily Meal Schedule & Macro Composition</h3>

            <div className="space-y-3">
              {dietPlan.meals.map(meal => (
                <div
                  key={meal.meal_type}
                  className={`p-5 rounded-3xl border ${
                    theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <h4 className="text-sm font-bold text-white">{meal.meal_type}</h4>
                    </div>
                    <span className="text-xs font-mono font-semibold text-zinc-400">{meal.time}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {meal.items.map(item => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-xs space-y-1"
                      >
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="text-[11px] text-zinc-400">Portion: {item.portion}</div>
                        <div className="flex items-center gap-2 pt-1 font-semibold text-[10px]">
                          <span className="text-rose-400">{item.calories} kcal</span>
                          <span>•</span>
                          <span className="text-emerald-400">{item.protein}g Protein</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BODY METRICS & PROGRESS CHART */}
      {activeSubTab === 'metrics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Physique Transformation & Biometrics</h3>
              <p className="text-xs text-zinc-400">Historical weigh-ins, body fat percentage, and muscle measurements</p>
            </div>

            <button
              onClick={() => setShowMetricModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs shadow-lg shadow-rose-900/30"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Weigh-in</span>
            </button>
          </div>

          {/* Progress Chart */}
          <div className={`p-6 rounded-3xl border ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fitnessMetrics}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E63946" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '16px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight_kg"
                    stroke="#E63946"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#weightGrad)"
                    name="Weight (kg)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metrics History Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fitnessMetrics.slice().reverse().map(met => (
              <div
                key={met.id}
                className={`p-5 rounded-3xl border space-y-3 ${
                  theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-rose-500" />
                    <span className="font-bold text-white text-sm">{met.date}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-black text-xs">
                    {met.weight_kg} kg
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">BMI</div>
                    <div className="font-black text-white">{met.bmi}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">Body Fat</div>
                    <div className="font-black text-emerald-400">{met.body_fat_pct}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">Arms</div>
                    <div className="font-black text-amber-400">{met.biceps_in}"</div>
                  </div>
                </div>

                {met.notes && (
                  <p className="text-[11px] text-zinc-400 italic">"{met.notes}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Metric Modal */}
      {showMetricModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black">Record Body Measurements</h3>
              <button
                onClick={() => setShowMetricModal(false)}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMetricSubmit} className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Body Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={metricForm.weight_kg}
                    onChange={e => setMetricForm({ ...metricForm, weight_kg: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Height (cm)</label>
                  <input
                    type="number"
                    required
                    value={metricForm.height_cm}
                    onChange={e => setMetricForm({ ...metricForm, height_cm: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Body Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={metricForm.body_fat_pct}
                    onChange={e => setMetricForm({ ...metricForm, body_fat_pct: parseFloat(e.target.value) })}
                    className="w-full p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Chest (in)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={metricForm.chest_in}
                    onChange={e => setMetricForm({ ...metricForm, chest_in: parseFloat(e.target.value) })}
                    className="w-full p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Arms (in)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={metricForm.biceps_in}
                    onChange={e => setMetricForm({ ...metricForm, biceps_in: parseFloat(e.target.value) })}
                    className="w-full p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Notes / Target</label>
                <input
                  type="text"
                  placeholder="e.g. Cut phase week 4, feeling energetic"
                  value={metricForm.notes}
                  onChange={e => setMetricForm({ ...metricForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl shadow-rose-900/30 transition-all mt-3"
              >
                Save Measurement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
