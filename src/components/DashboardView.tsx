import React, { useState, useEffect } from 'react';
import { useGym } from '../context/GymContext';
import { Hero3DShowcase } from './Hero3DShowcase';
import { NavigationHub3D } from './NavigationHub3D';
import {
  Users,
  CalendarCheck2,
  Dumbbell,
  Apple,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Flame,
  Receipt,
  CreditCard,
  BellRing,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenQrModal: () => void;
}

const HERO_GALLERY = [
  {
    id: 'hero-1',
    title: 'Strength Zone',
    subtitle: 'Olympic barbells, calibrated power racks & heavy dumbbells up to 60kg',
    tag: 'Ranaghat & Chakdah',
    uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'hero-2',
    title: 'Cardio & Conditioning Bay',
    subtitle: 'High-incline treadmills, air bikes, concept rowers & HIIT stations',
    tag: 'All 3 Centers',
    uri: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'hero-3',
    title: 'Functional Turf & Mobility',
    subtitle: 'Sled pushes, kettlebells, gymnastic rings & plyometric boxes',
    tag: 'Madanpur Center',
    uri: 'https://images.unsplash.com/photo-1598971639058-a63a5f6b6f32?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'hero-4',
    title: 'Free Weight Arena',
    subtitle: 'Specialized isolation cables, plate-loaded chest & leg machinery',
    tag: 'Ranaghat Main',
    uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80',
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenQrModal }) => {
  const {
    selectedCenter,
    setSelectedCenter,
    users,
    attendance,
    workoutPlan,
    dietPlan,
    setActiveTab,
    currentUser,
  } = useGym();

  const [activeSlide, setActiveSlide] = useState(0);

  // Auto slide carousel every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_GALLERY.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter statistics based on center selection
  const filteredUsers = users.filter(
    (u) =>
      u.approval_status === 'approved' &&
      (selectedCenter === 'All' || u.center === selectedCenter)
  );

  const activeMembersCount = filteredUsers.filter((u) => u.role === 'member').length;
  const trainersCount = filteredUsers.filter((u) => u.role === 'trainer').length;

  const todayAttendanceList = attendance.filter(
    (a) => a.date === todayStr && (selectedCenter === 'All' || a.center === selectedCenter)
  );

  const currentlyInGymCount = todayAttendanceList.filter((a) => !a.check_out_time).length;

  // Day of week for workout split
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[new Date().getDay()];
  const todayWorkoutSplit =
    workoutPlan.days.find((d) => d.day === todayDayName) || workoutPlan.days[0] || null;

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      {/* 1. Hero Showcase with 3D HG Logo Centerpiece */}
      <Hero3DShowcase onOpenQrModal={onOpenQrModal} />

      {/* Official Refund Notice Banner */}
      {currentUser?.refund_record && (
        <div className="p-5 rounded-3xl bg-amber-950/40 border border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-white shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-400">
                Official Gym Discharge & Refund Notice (Ref: {currentUser.refund_record.id})
              </div>
              <p className="text-zinc-300 mt-0.5">
                Total Refund Amount: <strong>₹{currentUser.refund_record.amount.toLocaleString()}</strong> ({currentUser.refund_record.percentage}% of original fee). Disbursed within <strong>{currentUser.refund_record.days_to_refund} business days</strong>.
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                <strong>Reason:</strong> {currentUser.refund_record.reason}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('payments')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0"
          >
            View Details
          </button>
        </div>
      )}

      {/* Active Membership Status Banner for Members */}
      {currentUser?.membership && currentUser.membership.status === 'active' && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-rose-950/30 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-rose-600/20 text-rose-500 border border-rose-500/30 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{currentUser.membership.plan_name}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                  ACTIVE
                </span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                Valid through: <strong>{currentUser.membership.end_date}</strong> • Reminder Schedule: <span className="text-amber-400 capitalize">{currentUser.membership.reminder_frequency || currentUser.membership.plan_duration}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('payments')}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 shrink-0"
          >
            <span>View Subscription</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Interactive Navigation Hub Tabs */}
      <NavigationHub3D />

      {/* 3. Facility Showcase & 3D Brand Emblem Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Gallery Carousel Card */}
        <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950/90 shadow-2xl min-h-[340px] flex flex-col justify-between p-6 sm:p-8 backdrop-blur-md">
          {/* Background Slide Image with Crossfade */}
          {HERO_GALLERY.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 bg-cover bg-center ${
                idx === activeSlide ? 'opacity-35 scale-105' : 'opacity-0 scale-100'
              }`}
              style={{
                backgroundImage: `url(${slide.uri})`,
                transitionProperty: 'opacity, transform',
                transitionDuration: '1000ms',
              }}
            />
          ))}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-transparent to-transparent" />

          {/* Top Bar inside Gallery */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400">
                {HERO_GALLERY[activeSlide].tag}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {HERO_GALLERY.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeSlide
                      ? 'w-6 bg-rose-500 shadow-md shadow-rose-500/50'
                      : 'w-2 bg-zinc-600 hover:bg-zinc-400'
                  }`}
                  title={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Gallery Content */}
          <div className="relative z-10 space-y-2.5 max-w-xl my-auto pt-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>
                {selectedCenter === 'All'
                  ? 'Ranaghat • Chakdah • Madanpur'
                  : `${selectedCenter} Center`}
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {HERO_GALLERY[activeSlide].title}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">
              {HERO_GALLERY[activeSlide].subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab('workouts')}
                className="px-4 py-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Dumbbell className="w-3.5 h-3.5 text-rose-500" />
                <span>Today's Split ({todayDayName})</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3D Brand Centerpiece Card */}
        <div className="lg:col-span-4 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-black p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-black tracking-wider text-white uppercase">
                HERCULES GYM
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              3 Branches
            </span>
          </div>

          <div className="w-full flex-1 flex items-center justify-center my-auto py-3">
            <div className="relative group flex items-center justify-center w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl">
              <img
                src="/hercules-3d-logo.png"
                alt="Hercules Gym 3D Render"
                className="w-full h-full object-cover filter drop-shadow-[0_15px_30px_rgba(244,63,94,0.4)] transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', '/hercules-logo-removebg-preview.png');
                }}
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between z-10">
            <div>
              <p className="text-xs font-black text-white">Ranaghat • Chakdah • Madanpur</p>
              <p className="text-[10px] text-zinc-400">Unified Access</p>
            </div>
            <button
              onClick={() => setActiveTab('workouts')}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
            >
              Start
            </button>
          </div>
        </div>
      </div>

      {/* 4. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Members Metric */}
        <div
          onClick={() => setActiveTab('members')}
          className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md transition-all cursor-pointer hover:scale-[1.02] hover:border-zinc-700 shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
              Active <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {activeMembersCount}
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-medium">Registered Athletes</p>
        </div>

        {/* Live Attendance Metric */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md transition-all cursor-pointer hover:scale-[1.02] hover:border-emerald-500/40 shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {currentlyInGymCount}
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-medium">Inside Floor Right Now</p>
        </div>

        {/* Certified Trainers */}
        <div
          onClick={() => setActiveTab('members')}
          className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md transition-all cursor-pointer hover:scale-[1.02] hover:border-amber-500/40 shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
              Duty <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {trainersCount || 3}
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-medium">Coaches & Trainers</p>
        </div>

        {/* HG.AI Coach Spotlight */}
        <div
          onClick={() => setActiveTab('hg-ai')}
          className="p-4 sm:p-5 rounded-2xl border border-rose-500/40 bg-gradient-to-br from-zinc-950 via-zinc-900 to-rose-950/40 backdrop-blur-md transition-all cursor-pointer hover:scale-[1.02] hover:border-rose-500/70 shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-rose-500/50 shadow-md">
              <img src="/hg-ai-logo.png" alt="HG.AI" className="w-full h-full object-cover" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm">
              AI PRO
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
            HG.AI Specialist
          </div>
          <p className="text-xs text-rose-400 mt-1 font-semibold flex items-center gap-1">
            Tap for Workout & Diet Coach <ArrowRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* 5. Modules Row: Workout Split, Nutrition Targets & Branch Network */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Workout Split & Nutrition Targets */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Workout Plan Card */}
          <div className="p-5 sm:p-6 rounded-3xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-950/40">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>
                      {todayWorkoutSplit
                        ? `${todayDayName} Split: ${todayWorkoutSplit.title}`
                        : `${todayDayName} Workout Split`}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {todayWorkoutSplit ? (
                      <>Focus: <span className="text-amber-400 font-bold">{todayWorkoutSplit.focus}</span></>
                    ) : (
                      'Assigned by your certified branch trainer'
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('workouts')}
                className="text-xs font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1"
              >
                <span>Full Program</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {todayWorkoutSplit && todayWorkoutSplit.exercises.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {todayWorkoutSplit.exercises.map((ex, idx) => (
                  <div
                    key={ex.id || idx}
                    className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between hover:border-zinc-700 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-white truncate">{ex.name}</p>
                      <p className="text-[10px] text-zinc-400">{ex.target_muscle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-amber-400">{ex.sets} Sets</span>
                      <span className="text-[10px] text-zinc-400 ml-1">× {ex.reps}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-1.5">
                <Dumbbell className="w-6 h-6 text-zinc-600 mx-auto" />
                <p className="text-xs font-bold text-zinc-300">No workout split assigned yet</p>
                <p className="text-[11px] text-zinc-500">Your branch trainer will assign your customized workout split.</p>
              </div>
            )}
          </div>

          {/* Daily Nutrition & Hydration Blueprint */}
          <div className="p-5 sm:p-6 rounded-3xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Daily Nutrition Targets</h3>
                  <p className="text-xs text-zinc-400">Calculated for muscle recovery & athletic performance</p>
                </div>
              </div>

              {dietPlan.daily_calories_target > 0 && (
                <span className="text-xs font-bold text-emerald-400">
                  {dietPlan.daily_calories_target} kcal
                </span>
              )}
            </div>

            {dietPlan.daily_calories_target > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Protein Target</p>
                  <p className="text-lg font-black text-rose-400 mt-0.5">{dietPlan.daily_protein_target}g</p>
                  <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-rose-500 h-full w-4/5" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Hydration</p>
                  <p className="text-lg font-black text-sky-400 mt-0.5">{dietPlan.daily_water_target_liters}L</p>
                  <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-sky-500 h-full w-3/4" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Meals Planned</p>
                  <p className="text-lg font-black text-amber-400 mt-0.5">{dietPlan.meals.length}</p>
                  <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-amber-500 h-full w-full" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-1.5">
                <Apple className="w-6 h-6 text-zinc-600 mx-auto" />
                <p className="text-xs font-bold text-zinc-300">No nutrition targets assigned yet</p>
                <p className="text-[11px] text-zinc-500">Your branch trainer will assign your daily macro targets & meal plan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Branch Network */}
        <div className="lg:col-span-4 space-y-6">
          {/* 3 Centers Clean Branch Network Switcher */}
          <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-black text-white">Branch Network</h3>
            </div>

            <div className="space-y-2.5">
              {(['Ranaghat', 'Chakdah', 'Madanpur'] as const).map((branch) => {
                const count = attendance.filter(
                  (a) => a.date === todayStr && a.center === branch && !a.check_out_time
                ).length;
                const isSelected = selectedCenter === branch;

                return (
                  <button
                    key={branch}
                    onClick={() => setSelectedCenter(branch)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-rose-600/20 to-amber-500/20 border-rose-500/50 text-white shadow-lg shadow-rose-950/30'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{branch} Branch</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Floor Open</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-amber-400">{count} Active</span>
                      <p className="text-[9px] text-zinc-500">on floor</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
