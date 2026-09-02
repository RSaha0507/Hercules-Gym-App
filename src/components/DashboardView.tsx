import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import {
  Users,
  CalendarCheck2,
  CheckCircle2,
  TrendingUp,
  Flame,
  Dumbbell,
  Apple,
  ShoppingBag,
  Bell,
  ArrowRight,
  ShieldCheck,
  Trophy,
  Activity,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenQrModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenQrModal }) => {
  const {
    currentUser,
    selectedCenter,
    users,
    attendance,
    announcements,
    workoutPlan,
    dietPlan,
    setActiveTab,
    t,
    theme,
    isCheckedIn,
    activeCheckIn,
    checkOut,
  } = useGym();

  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Filtered statistics based on center selection
  const filteredUsers = users.filter(u =>
    u.approval_status === 'approved' &&
    (selectedCenter === 'All' || u.center === selectedCenter)
  );

  const activeMembersCount = filteredUsers.filter(u => u.role === 'member').length;
  const trainersCount = filteredUsers.filter(u => u.role === 'trainer').length;

  const todayAttendanceList = attendance.filter(a =>
    a.date === todayStr &&
    (selectedCenter === 'All' || a.center === selectedCenter)
  );

  const currentlyInGymCount = todayAttendanceList.filter(a => !a.check_out_time).length;
  const pendingApprovalsCount = users.filter(u => u.approval_status === 'pending').length;

  // Day of week for workout split
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[new Date().getDay()];
  const todayWorkoutSplit = workoutPlan.days.find(d => d.day === todayDayName) || workoutPlan.days[0];

  const visibleAnnouncements = announcements.filter(a =>
    a.target_center === 'All' || selectedCenter === 'All' || a.target_center === selectedCenter
  );

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Hero Motivational Banner with Live Gym Pulse */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-rose-950/40 border border-zinc-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 w-56 h-56 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>
                {selectedCenter === 'All' ? 'Ranaghat • Chakdah • Madanpur Network' : `${selectedCenter} Center Floor Live`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              {t('welcomeBack')}, <span className="text-rose-500">{currentUser?.full_name || 'Lifter'}</span>!
            </h1>

            <p className="text-sm text-zinc-300 leading-relaxed">
              {currentUser?.role === 'admin'
                ? `Overseeing 3 premier gym centers in Nadia, West Bengal. Live member flow, attendance logs, approvals, and trainers on duty.`
                : currentUser?.role === 'trainer'
                ? `Ready to coach athletes today at ${currentUser.center} center. Assign workout splits, monitor progress, and review nutrition.`
                : `Today is ${todayDayName}: ${todayWorkoutSplit.title}. Push your limits and track your macro recovery!`}
            </p>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              {isCheckedIn ? (
                <button
                  onClick={checkOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs hover:bg-emerald-500/30 transition-all"
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Currently Inside ({activeCheckIn?.center}) • Check Out</span>
                </button>
              ) : (
                <button
                  onClick={onOpenQrModal}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-900/40 transition-all active:scale-95"
                >
                  <CalendarCheck2 className="w-4 h-4" />
                  <span>Instant QR Check-In</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('workouts')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-900/80 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                    : 'bg-white/80 border-zinc-300 text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                <Dumbbell className="w-4 h-4 text-rose-500" />
                <span>Today's Workout</span>
              </button>

              <button
                onClick={() => setActiveTab('shop')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-900/80 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                    : 'bg-white/80 border-zinc-300 text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-rose-500" />
                <span>Order Whey & Gear</span>
              </button>
            </div>
          </div>

          {/* Member Card / Live Center Status Box */}
          <div className="shrink-0 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-md w-full md:w-64 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
              <span>LIVE FLOOR COUNT</span>
              <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Real-Time
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{currentlyInGymCount}</span>
              <span className="text-xs text-zinc-400">Athletes training right now</span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Ranaghat Center</span>
                <span className="font-semibold text-white">
                  {attendance.filter(a => a.date === todayStr && a.center === 'Ranaghat' && !a.check_out_time).length} in
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Chakdah Center</span>
                <span className="font-semibold text-white">
                  {attendance.filter(a => a.date === todayStr && a.center === 'Chakdah' && !a.check_out_time).length} in
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Madanpur Center</span>
                <span className="font-semibold text-white">
                  {attendance.filter(a => a.date === todayStr && a.center === 'Madanpur' && !a.check_out_time).length} in
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] cursor-pointer ${
            theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Total Check-Ins Today</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{todayAttendanceList.length}</div>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-bold">+{todayAttendanceList.length * 3}%</span> vs yesterday
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] cursor-pointer ${
            theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Registered Members</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{activeMembersCount}</div>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            Across {selectedCenter === 'All' ? 'all 3 centers' : selectedCenter}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] cursor-pointer ${
            theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{pendingApprovalsCount}</div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {pendingApprovalsCount > 0 ? 'Requires admin review' : 'All accounts verified'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] cursor-pointer ${
            theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Certified Trainers</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{trainersCount}</div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Personal & group coaching
          </p>
        </button>
      </div>

      {/* Main Grid: Workout of Day & Announcements & Recent Check-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workout Focus & Nutrition Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scheduled Workout Split */}
          <div className={`p-6 rounded-3xl border ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-600/15 text-rose-500 border border-rose-500/30">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {todayDayName}'s Workout: {todayWorkoutSplit.title}
                  </h3>
                  <p className="text-xs text-zinc-400">{todayWorkoutSplit.focus}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('workouts')}
                className="text-xs font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1"
              >
                Full Routine <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {todayWorkoutSplit.exercises.length > 0 ? (
                todayWorkoutSplit.exercises.map((ex, index) => (
                  <div
                    key={ex.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                      theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">{ex.name}</div>
                        <div className="text-[11px] text-zinc-400">{ex.target_muscle}</div>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <div className="font-bold text-rose-400">{ex.sets} sets × {ex.reps}</div>
                      <div className="text-[10px] text-zinc-400">Rest: {ex.rest_seconds}s</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-400 text-xs">
                  Rest & Muscle Recovery Day! Replenish protein and hydrate.
                </div>
              )}
            </div>
          </div>

          {/* Daily Nutrition & Hydration Tracker Preview */}
          <div className={`p-6 rounded-3xl border ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Daily Fuel & Macros Target</h3>
                  <p className="text-xs text-zinc-400">Target: {dietPlan.daily_calories_target} kcal • {dietPlan.daily_protein_target}g Protein</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('workouts')}
                className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1"
              >
                Diet Plan <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-2xl border text-center ${
                theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="text-[11px] text-zinc-400 font-semibold">Calories</div>
                <div className="text-lg font-black text-rose-500">{dietPlan.daily_calories_target}</div>
                <div className="text-[10px] text-zinc-400">kcal target</div>
              </div>

              <div className={`p-3 rounded-2xl border text-center ${
                theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="text-[11px] text-zinc-400 font-semibold">Protein</div>
                <div className="text-lg font-black text-emerald-400">{dietPlan.daily_protein_target}g</div>
                <div className="text-[10px] text-zinc-400">lean building</div>
              </div>

              <div className={`p-3 rounded-2xl border text-center ${
                theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="text-[11px] text-zinc-400 font-semibold">Water</div>
                <div className="text-lg font-black text-blue-400">{dietPlan.daily_water_target_liters}L</div>
                <div className="text-[10px] text-zinc-400">hydration</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Gym Announcements & Live Attendance Feed */}
        <div className="space-y-6">
          {/* Announcements Feed */}
          <div className={`p-6 rounded-3xl border space-y-4 ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Gym Notices
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400 font-bold">{visibleAnnouncements.length} Posts</span>
            </div>

            <div className="space-y-3">
              {visibleAnnouncements.slice(0, 3).map(ann => (
                <div
                  key={ann.id}
                  className={`p-3.5 rounded-2xl border space-y-1.5 ${
                    ann.is_pinned
                      ? 'bg-rose-950/20 border-rose-800/40 ring-1 ring-rose-500/20'
                      : theme === 'dark'
                      ? 'bg-zinc-950/60 border-zinc-800/80'
                      : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-extrabold">
                      {ann.category}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {ann.target_center === 'All' ? 'All Centers' : ann.target_center}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-snug">{ann.title}</h4>
                  <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">{ann.content}</p>
                  <div className="text-[10px] text-zinc-400 pt-1 flex items-center justify-between">
                    <span>By {ann.author_name}</span>
                    <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Recent Check-Ins */}
          <div className={`p-6 rounded-3xl border space-y-4 ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Recent Check-Ins
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('attendance')}
                className="text-xs font-bold text-rose-500 hover:text-rose-400"
              >
                View Log
              </button>
            </div>

            <div className="space-y-2.5">
              {todayAttendanceList.slice(0, 4).map(att => (
                <div
                  key={att.id}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs ${
                    theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${att.check_out_time ? 'bg-zinc-500' : 'bg-emerald-500 animate-pulse'}`} />
                    <div>
                      <div className="font-bold text-white">{att.user_name}</div>
                      <div className="text-[10px] text-zinc-400">{att.center} • {att.user_role}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-zinc-300">
                      {new Date(att.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px] text-emerald-400">
                      {att.check_out_time ? 'Checked Out' : 'Active On Floor'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
