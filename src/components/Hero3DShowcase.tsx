import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import {
  Flame,
  QrCode,
  CheckCircle2,
  MapPin,
  Sparkles,
  Dumbbell,
  Activity,
} from 'lucide-react';

interface Hero3DShowcaseProps {
  onOpenQrModal: () => void;
}

export const Hero3DShowcase: React.FC<Hero3DShowcaseProps> = ({ onOpenQrModal }) => {
  const {
    currentUser,
    selectedCenter,
    setSelectedCenter,
    attendance,
    isCheckedIn,
    checkOut,
    setActiveTab,
  } = useGym();

  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredAttendance = attendance.filter(
    (a) => a.date === todayStr && (selectedCenter === 'All' || a.center === selectedCenter)
  );
  const currentlyOnFloor = filteredAttendance.filter((a) => !a.check_out_time).length;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[new Date().getDay()];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-zinc-800 bg-gradient-to-b from-zinc-900/95 via-zinc-950/98 to-black shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-6 sm:p-8 lg:p-10">
      {/* Background Volumetric Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-transparent to-transparent pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(244,63,94,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(244,63,94,0.15) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Headline, Branch Switcher & Quick Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Pill Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-500/20 to-amber-500/20 border border-rose-500/40 text-amber-300 text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-950/30">
              <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>
                {selectedCenter === 'All'
                  ? 'Ranaghat • Chakdah • Madanpur'
                  : `${selectedCenter} Center`}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-bold">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentlyOnFloor} Active on Floor</span>
            </div>
          </div>

          {/* Main Hero Typography */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/hercules-logo-removebg-preview.png"
                alt="Hercules Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-[0_2px_10px_rgba(244,63,94,0.4)]"
              />
              <span className="text-xl sm:text-2xl font-black tracking-wider bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 bg-clip-text text-transparent">
                HERCULES GYM
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              CHANGE YOUR BODY, <br />
              <span className="bg-gradient-to-r from-amber-400 via-rose-500 to-rose-600 bg-clip-text text-transparent drop-shadow-[0_4px_15px_rgba(244,63,94,0.4)]">
                CHANGE YOUR MIND.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 font-medium max-w-xl leading-relaxed">
              Official digital ecosystem for Hercules Gym. Access workout splits, nutrition targets, instant QR check-ins, and unified membership across all branches.
            </p>
          </div>

          {/* Branch Display / Switcher */}
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              {currentUser && currentUser.role !== 'admin' ? 'Your Branch:' : 'Select Branch:'}
            </p>
            <div className={`grid ${currentUser && currentUser.role !== 'admin' ? 'grid-cols-1' : 'grid-cols-3'} gap-2`}>
              {(currentUser && currentUser.role !== 'admin'
                ? [currentUser.center]
                : (['Ranaghat', 'Chakdah', 'Madanpur'] as const)
              ).map((branch) => {
                const count = attendance.filter(
                  (a) => a.date === todayStr && a.center === branch && !a.check_out_time
                ).length;
                const isSelected = selectedCenter === branch;

                return (
                  <button
                    key={branch}
                    onClick={() => {
                      if (!currentUser || currentUser.role === 'admin') {
                        setSelectedCenter(isSelected ? 'All' : branch);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all duration-200 ${
                      isSelected || (currentUser && currentUser.role !== 'admin')
                        ? 'bg-gradient-to-br from-rose-600/30 to-amber-500/20 border-rose-500 text-white shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/50'
                        : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{branch} {currentUser && currentUser.role !== 'admin' ? 'Center' : ''}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          count > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {count} on floor
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {currentUser ? (
              isCheckedIn ? (
                <button
                  onClick={checkOut}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-black flex items-center gap-2.5 shadow-xl shadow-emerald-950/50 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Checked In ({todayName}) • Tap to Check Out</span>
                </button>
              ) : (
                <button
                  onClick={onOpenQrModal}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs sm:text-sm font-black flex items-center gap-2.5 shadow-xl shadow-rose-950/60 transition-all active:scale-95 group"
                >
                  <QrCode className="w-5 h-5 transition-transform group-hover:rotate-12" />
                  <span>1-Tap QR Check-In</span>
                </button>
              )
            ) : null}

            <button
              onClick={() => setActiveTab('workouts')}
              className="px-5 py-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs sm:text-sm font-bold transition-all flex items-center gap-2"
            >
              <Dumbbell className="w-4 h-4 text-amber-400" />
              <span>Today's Split</span>
            </button>

            <button
              onClick={() => setActiveTab('hg-ai')}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-zinc-900 to-rose-950/50 hover:to-rose-900/50 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-black transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Launch HG.AI Coach</span>
            </button>
          </div>
        </div>

        {/* Right Column: 3D HG Logo Centerpiece Showcase */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div
            className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-square rounded-3xl p-3 bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-black border border-zinc-700/80 shadow-[0_20px_60px_rgba(244,63,94,0.25)] flex flex-col items-center justify-between group overflow-hidden"
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            {/* Center: Official 3D HG Logo Image with 3D Float and Frame */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center bg-black">
              {/* Neon Glow Aura Behind Logo */}
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/20 via-transparent to-amber-500/10 pointer-events-none z-10" />

              {/* 3D HG Logo Image */}
              <img
                src="/hercules-3d-logo.png"
                alt="Hercules Gym 3D Render"
                className={`w-full h-full object-cover filter contrast-105 brightness-105 transition-transform duration-700 ease-out select-none ${
                  isLogoHovered
                    ? 'scale-105'
                    : 'scale-100'
                }`}
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute(
                    'src',
                    '/hercules-logo-removebg-preview.png'
                  );
                }}
              />

              {/* Bottom Stage Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <div>
                    <p className="text-xs font-black text-white leading-none">HERCULES GYM</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Ranaghat • Chakdah • Madanpur</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-600/80 text-white uppercase shadow-sm">
                  Official 3D
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
