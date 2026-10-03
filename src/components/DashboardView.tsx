import React, { useState, useEffect } from 'react';
import { useGym } from '../context/GymContext';
import { Hero3DShowcase } from './Hero3DShowcase';
import { KineticBentoCard } from './KineticBentoCard';
import {
  Sparkles,
  ChevronRight,
  Receipt,
  Users,
  CalendarCheck2,
  Dumbbell,
  ShieldCheck,
  CreditCard,
  ArrowUpRight,
  Activity,
  Flame,
  Clock,
  TrendingUp,
  Award,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenQrModal: () => void;
}

const HERO_GALLERY = [
  {
    id: 'hero-1',
    title: 'Precision Free Weights & Olympic Platforms',
    subtitle: 'Calibrated power racks, barbells and dumbbell arrays',
    tag: 'Ranaghat & Chakdah',
    uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'hero-2',
    title: 'Cardio & Conditioning Interval Line',
    subtitle: 'High-incline runners, air bikes, and interval training stations',
    tag: 'All 3 Centers',
    uri: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'hero-3',
    title: 'Functional Turf & Mobility Grid',
    subtitle: 'Sled lanes, kettlebells, gymnastic rings, and agility boxes',
    tag: 'Madanpur Center',
    uri: 'https://images.unsplash.com/photo-1598971639058-a63a5f6b6f32?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'hero-4',
    title: 'Plate-Loaded Machine Line',
    subtitle: 'Biomechanically aligned isolation and compound machinery',
    tag: 'Ranaghat Main',
    uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80',
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenQrModal }) => {
  const {
    selectedCenter,
    users,
    attendance,
    workoutPlan,
    payments,
    setActiveTab,
    currentUser,
    getCenterTheme,
  } = useGym();

  const centerTheme = getCenterTheme(selectedCenter);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto slide carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_GALLERY.length);
    }, 5500);
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

  // Center breakdowns
  const ranaghatMembers = users.filter((u) => u.center === 'Ranaghat' && u.role === 'member' && u.approval_status === 'approved').length;
  const chakdahMembers = users.filter((u) => u.center === 'Chakdah' && u.role === 'member' && u.approval_status === 'approved').length;
  const madanpurMembers = users.filter((u) => u.center === 'Madanpur' && u.role === 'member' && u.approval_status === 'approved').length;

  const todayAttendanceList = attendance.filter(
    (a) => a.date === todayStr && (selectedCenter === 'All' || a.center === selectedCenter)
  );

  const currentlyInGymCount = todayAttendanceList.filter((a) => !a.check_out_time).length;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[new Date().getDay()];
  const todayWorkoutSplit =
    workoutPlan.days.find((d) => d.day === todayDayName) || workoutPlan.days[0] || null;

  // Center revenue pulse & 4-Pool breakdown
  const centerPayments = payments.filter(
    (p) => selectedCenter === 'All' || p.center === selectedCenter
  );
  const totalRevenue = centerPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const normalFeeTotal = centerPayments
    .filter((p) => p.revenue_category === 'gym_fees' || (!p.revenue_category && p.payment_for !== 'Gym Item Order Payment'))
    .reduce((sum, p) => sum + (p.normal_amount || p.amount || 0), 0);
  
  const fineTotal = centerPayments
    .reduce((sum, p) => sum + (p.fine_amount || 0), 0);

  const shopTotal = centerPayments
    .filter((p) => p.revenue_category === 'gym_item' || p.payment_for === 'Gym Item Order Payment')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const otherTotal = centerPayments
    .filter((p) => p.revenue_category === 'others' || (p.payment_for && p.payment_for !== 'Gym Fees Payment' && p.payment_for !== 'Gym Item Order Payment'))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. Hero Showcase with Integrated Center Switcher */}
      <Hero3DShowcase onOpenQrModal={onOpenQrModal} />

      {/* Official Refund Notice Banner (if applicable) */}
      {currentUser?.refund_record && (
        <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-800/40 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-white">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-400">
                Official Gym Discharge & Refund Notice (Ref: {currentUser.refund_record.id})
              </div>
              <p className="text-zinc-300 mt-0.5">
                Total Refund: <strong>₹{currentUser.refund_record.amount.toLocaleString()}</strong> ({currentUser.refund_record.percentage}% of fee) · Disbursed within {currentUser.refund_record.days_to_refund} business days.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('revenues')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0"
          >
            View Details
          </button>
        </div>
      )}

      {/* 2. ADAPTIVE BENTO-GRID SYSTEM (Asymmetric 12-Column Responsive Matrix with Kinetic Morphing Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* BENTO TILE 1 (Large 7-Col): Kinetic Morphing Roster & Athlete Matrix */}
        <KineticBentoCard
          colSpan="col-span-12 md:col-span-7"
          kicker="ATHLETES & ROSTER METRICS"
          title="Active Membership Density"
          metric={activeMembersCount}
          metricLabel={`Active Members · ${selectedCenter === 'All' ? 'All Centers' : selectedCenter}`}
          isMorphable={true}
          isInitiallyExpanded={false}
          icon={<Users className="w-5 h-5" />}
          actionButton={
            <button
              onClick={() => setActiveTab('members')}
              className="p-2 rounded-2xl bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold"
              title="Open Roster Directory"
            >
              <span>View Roster</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          }
          expandedContent={
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Branch Distribution Matrix
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-zinc-950/40 border border-white/[0.03]">
                  <div className="text-zinc-400 text-[11px]">Ranaghat</div>
                  <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">{ranaghatMembers}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Main Facility</div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/40 border border-white/[0.03]">
                  <div className="text-zinc-400 text-[11px]">Chakdah</div>
                  <div className="text-lg font-bold text-purple-400 font-mono mt-0.5">{chakdahMembers}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Split Branch</div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/40 border border-white/[0.03]">
                  <div className="text-zinc-400 text-[11px]">Madanpur</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{madanpurMembers}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Turf Arena</div>
                </div>
              </div>
            </div>
          }
        >
          <div className="mt-4 pt-4 border-t border-white/[0.04] grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-[11px] text-zinc-400">Coaching Staff</div>
              <div className="text-base font-bold text-white font-mono mt-0.5">{trainersCount || 3} Coaches</div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400">Multi-Branch</div>
              <div className="text-base font-bold text-white font-mono mt-0.5">3 Locations</div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400">Verification</div>
              <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">100% KYC</div>
            </div>
          </div>
        </KineticBentoCard>

        {/* BENTO TILE 2 (Medium 5-Col): Kinetic Live Attendance & Floor Presence */}
        <KineticBentoCard
          colSpan="col-span-12 md:col-span-5"
          kicker={
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE ATTENDANCE
            </span>
          }
          title="Floor Occupancy Pulse"
          metric={currentlyInGymCount}
          metricLabel="Athletes On Floor Right Now"
          isMorphable={true}
          icon={<CalendarCheck2 className="w-5 h-5" />}
          actionButton={
            <button
              onClick={() => setActiveTab('attendance')}
              className="p-2 rounded-2xl bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold"
            >
              <span>Live Log</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          }
          expandedContent={
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Facility Capacity Ratio</span>
                <span className="font-mono font-bold text-emerald-400">
                  {Math.min(100, Math.round((currentlyInGymCount / 40) * 100))}% Load
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(15, (currentlyInGymCount / 40) * 100))}%` }}
                />
              </div>
              <div className="text-[10px] text-zinc-500 flex justify-between">
                <span>Optimal Training Flow</span>
                <span>Max Safe Threshold: 40</span>
              </div>
            </div>
          }
        >
          <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-400">
            <span>Dynamic QR Check-in System</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Operational
            </span>
          </div>
        </KineticBentoCard>

        {/* BENTO TILE 3 (Medium 5-Col): Smart HG.AI Intelligence Kinetic Bento */}
        <KineticBentoCard
          colSpan="col-span-12 md:col-span-5"
          kicker={
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Sparkles className="w-3.5 h-3.5" style={{ color: centerTheme.accentHex }} />
              HG.AI COACH INTELLIGENCE
            </span>
          }
          title="Automated Routine & Diet Guidance"
          isMorphable={true}
          actionButton={
            <button
              onClick={() => setActiveTab('hg-ai')}
              className="p-2 rounded-2xl bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold"
            >
              <span>Open AI</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          }
          expandedContent={
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-white/[0.03] flex items-center justify-between">
                <span className="text-zinc-300">Hypertrophy Volume Check</span>
                <span className="text-amber-400 font-mono text-[11px]">Optimal (18 sets)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-white/[0.03] flex items-center justify-between">
                <span className="text-zinc-300">Protein Target Recommendation</span>
                <span className="text-emerald-400 font-mono text-[11px]">2.2g / kg BW</span>
              </div>
            </div>
          }
        >
          <p className="text-xs text-zinc-400 leading-relaxed my-2">
            Generates personalized bodybuilding splits, hypertrophy progressions, and macro targets calibrated for athletes.
          </p>

          <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Instant Assistant</span>
            <span
              onClick={() => setActiveTab('hg-ai')}
              className="text-white font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              Ask Coach AI <ChevronRight className="w-3 h-3 text-zinc-400" />
            </span>
          </div>
        </KineticBentoCard>

        {/* BENTO TILE 4 (Large 7-Col): Kinetic Fiscal Ledger & Revenue Record */}
        <KineticBentoCard
          colSpan="col-span-12 md:col-span-7"
          kicker="REVENUE RECORD & FISCAL LEDGER"
          title="Multi-Category Revenue Collections"
          metric={`₹${totalRevenue.toLocaleString()}`}
          metricLabel="Total Recorded in System"
          isMorphable={true}
          icon={<CreditCard className="w-5 h-5" />}
          actionButton={
            <button
              onClick={() => setActiveTab('revenues')}
              className="p-2 rounded-2xl bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold"
            >
              <span>Ledger</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          }
          expandedContent={
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Fiscal Waterfall Allocation
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-950/50 border border-white/[0.04]">
                  <div className="text-zinc-400 text-[10px]">Normal Fees</div>
                  <div className="font-mono font-bold text-white text-sm mt-0.5">₹{normalFeeTotal.toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950/50 border border-rose-500/20">
                  <div className="text-rose-400 text-[10px]">Late Fines</div>
                  <div className="font-mono font-bold text-rose-400 text-sm mt-0.5">₹{fineTotal.toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950/50 border border-white/[0.04]">
                  <div className="text-zinc-400 text-[10px]">Gym Items</div>
                  <div className="font-mono font-bold text-white text-sm mt-0.5">₹{shopTotal.toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950/50 border border-white/[0.04]">
                  <div className="text-zinc-400 text-[10px]">Other Misc</div>
                  <div className="font-mono font-bold text-white text-sm mt-0.5">₹{otherTotal.toLocaleString()}</div>
                </div>
              </div>
            </div>
          }
        >
          <div className="mt-4 pt-3 border-t border-white/[0.04] grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-zinc-900/40 border border-white/[0.03]">
              <div className="text-[10px] text-zinc-400">Normal Fees</div>
              <div className="font-mono font-bold text-white text-[11px] mt-0.5">₹{normalFeeTotal.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/40 border border-white/[0.03]">
              <div className="text-[10px] text-rose-400">Late Fines</div>
              <div className="font-mono font-bold text-rose-400 text-[11px] mt-0.5">₹{fineTotal.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/40 border border-white/[0.03]">
              <div className="text-[10px] text-zinc-400">Gym Items</div>
              <div className="font-mono font-bold text-white text-[11px] mt-0.5">₹{shopTotal.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/40 border border-white/[0.03]">
              <div className="text-[10px] text-zinc-400">Other Misc</div>
              <div className="font-mono font-bold text-white text-[11px] mt-0.5">₹{otherTotal.toLocaleString()}</div>
            </div>
          </div>
        </KineticBentoCard>
      </div>

      {/* 3. FACILITY SHOWCASE & ROUTINE SCHEDULE KINETIC BENTO ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Gallery Carousel Bento (8-Col) with Kinetic 3D container */}
        <div className="lg:col-span-8 relative rounded-3xl overflow-hidden bg-zinc-900/25 backdrop-blur-2xl border border-white/[0.04] min-h-[300px] flex flex-col justify-between p-6 sm:p-8 kinetic-card-glow group">
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

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />

          {/* Top Bar inside Gallery */}
          <div className="relative z-10 flex items-center justify-between gap-2 text-xs text-zinc-400 font-medium">
            <span>{HERO_GALLERY[activeSlide].tag}</span>

            <div className="flex items-center gap-1.5">
              {HERO_GALLERY.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeSlide ? 'w-6 bg-white' : 'w-2 bg-zinc-700'
                  }`}
                  title={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Gallery Content */}
          <div className="relative z-10 space-y-2 max-w-xl my-auto pt-6">
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
              {HERO_GALLERY[activeSlide].title}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 font-normal leading-relaxed">
              {HERO_GALLERY[activeSlide].subtitle}
            </p>

            <div className="pt-2">
              <button
                onClick={() => setActiveTab('workouts')}
                className="px-4 py-2 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/90 border border-white/[0.05] text-zinc-200 text-xs font-medium transition-all flex items-center gap-2"
              >
                <Dumbbell className="w-3.5 h-3.5 text-zinc-400" />
                <span>Today's Split ({todayDayName})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Today's Workout Split Bento Widget (4-Col) */}
        <KineticBentoCard
          colSpan="col-span-12 lg:col-span-4"
          kicker={`TODAY'S SCHEDULE · ${todayDayName.toUpperCase()}`}
          title={todayWorkoutSplit ? todayWorkoutSplit.title : 'General Fitness Induction'}
          isMorphable={false}
        >
          <p className="text-xs text-zinc-400 mb-3">
            {todayWorkoutSplit?.focus ? `Target Focus: ${todayWorkoutSplit.focus}` : 'Structured conditioning warmup'}
          </p>

          {todayWorkoutSplit && todayWorkoutSplit.exercises.length > 0 && (
            <div className="space-y-2 border-t border-white/[0.04] pt-3 my-3">
              {todayWorkoutSplit.exercises.slice(0, 3).map((ex, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-zinc-300">
                  <span className="font-medium text-white truncate max-w-[180px]">{ex.name}</span>
                  <span className="font-mono text-zinc-400 text-[11px]">{ex.sets} × {ex.reps}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-white/[0.04]">
            <button
              onClick={() => setActiveTab('workouts')}
              className="w-full py-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/[0.05] text-white font-medium text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>View Full Workout Plan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </KineticBentoCard>
      </div>
    </div>
  );
};
