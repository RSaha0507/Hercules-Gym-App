import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { CenterType } from '../types';
import {
  Flame,
  QrCode,
  CheckCircle2,
  MapPin,
  Sparkles,
  Dumbbell,
  Activity,
  ChevronRight,
  ShieldCheck,
  Building2,
  Users,
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
    getCenterTheme,
    currentAtmosphere,
  } = useGym();

  const centerTheme = getCenterTheme(selectedCenter);
  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredAttendance = attendance.filter(
    (a) => a.date === todayStr && (selectedCenter === 'All' || a.center === selectedCenter)
  );
  const currentlyOnFloor = filteredAttendance.filter((a) => !a.check_out_time).length;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[new Date().getDay()];

  const centerConfigs = [
    {
      id: 'Ranaghat' as CenterType,
      name: 'Ranaghat',
      fullName: 'Ranaghat Center',
      gradient: 'from-amber-400 via-rose-500 to-red-600',
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/50 shadow-rose-950/60',
      badgeBg: 'bg-rose-950/70 border-rose-500/40 text-amber-300',
      activeBtnGradient: 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600',
      glow: 'shadow-rose-950/50',
    },
    {
      id: 'Chakdah' as CenterType,
      name: 'Chakdah',
      fullName: 'Chakdah Center',
      gradient: 'from-amber-300 via-lime-400 to-emerald-500',
      activeBorder: 'border-lime-400 ring-2 ring-lime-400/40 shadow-neutral-950/80',
      badgeBg: 'bg-neutral-950/90 border-lime-500/30 text-lime-300',
      activeBtnGradient: 'bg-gradient-to-r from-amber-400 via-lime-400 to-emerald-600',
      glow: 'shadow-neutral-950/60',
    },
    {
      id: 'Madanpur' as CenterType,
      name: 'Madanpur',
      fullName: 'Madanpur Center',
      gradient: 'from-emerald-400 via-green-500 to-yellow-400',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-emerald-950/60',
      badgeBg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
      activeBtnGradient: 'bg-gradient-to-r from-emerald-600 via-green-600 to-yellow-500',
      glow: 'shadow-emerald-950/50',
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Main Hero Showcase */}
      <div className={`relative w-full rounded-3xl overflow-hidden border border-white/[0.08] bg-zinc-950/40 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-6 sm:p-8 lg:p-10 transition-colors duration-500`}>
        {/* Background Volumetric Glows dynamically inherited from active Atmosphere */}
        <div
          className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-1000 opacity-30 mix-blend-screen"
          style={{
            background: currentAtmosphere?.primaryGlow || centerTheme.accentHex,
          }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-1000 opacity-25 mix-blend-screen"
          style={{
            background: currentAtmosphere?.secondaryGlow || centerTheme.accentHex,
          }}
        />
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
          {/* Left Column: Headline & Actions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Pill Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ${centerTheme.badgeBg} text-xs font-black uppercase tracking-wider shadow-lg`}>
                <Flame className="w-4 h-4 animate-pulse" style={{ color: centerTheme.accentHex }} />
                <span>
                  {selectedCenter === 'All'
                    ? 'Ranaghat • Chakdah • Madanpur'
                    : `${selectedCenter} Center`}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-700 text-xs font-bold text-zinc-300 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
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
                <span className={`text-2xl sm:text-3xl font-black tracking-wider bg-gradient-to-r ${centerTheme.textGradient} bg-clip-text text-transparent`}>
                  HERCULES GYM
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-4xl font-black text-white tracking-tight leading-[1.1] italic font-fitness">
                  CHANGE YOUR BODY,&nbsp;&nbsp;
                <span className={`bg-gradient-to-r ${centerTheme.textGradient} bg-clip-text text-transparent drop-shadow-[0_4px_15px_rgba(244,63,94,0.4)]`}>
                    CHANGE YOUR MIND.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-300 font-medium max-w-xl leading-relaxed">
                Official digital ecosystem for Hercules Gym. Access workout splits, nutrition targets, instant QR check-ins, and unified membership across Ranaghat, Chakdah, and Madanpur.
              </p>
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
                    className={`px-6 py-3.5 rounded-2xl bg-gradient-to-r ${centerTheme.gradient} hover:opacity-95 text-white text-xs sm:text-sm font-black flex items-center gap-2.5 shadow-xl transition-all active:scale-95 group`}
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
                className={`px-5 py-3.5 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-900 hover:bg-zinc-800 border ${centerTheme.borderAccent} text-zinc-100 text-xs sm:text-sm font-black transition-all flex items-center gap-2`}
              >
                <Sparkles className="w-4 h-4" style={{ color: centerTheme.accentHex }} />
                <span>Ask HG.AI Coach</span>
              </button>
            </div>
          </div>

          {/* Right Column: 3D Emblem Stage */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
            <div className="w-full aspect-square max-w-[380px] rounded-3xl border border-zinc-700/80 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-3 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between backdrop-blur-xl">
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center bg-black">
                <div className={`absolute inset-0 bg-gradient-to-tr opacity-20 pointer-events-none z-10`} />

                <img
                  src="/hercules-3d-logo.png"
                  alt="Hercules Gym 3D Render"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', '/hercules-logo-removebg-preview.png');
                  }}
                />

                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between z-20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <p className="text-xs font-black text-white leading-none">HERCULES GYM</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{selectedCenter === 'All' ? 'Ranaghat • Chakdah • Madanpur' : `${selectedCenter} Center`}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-gradient-to-r ${centerTheme.gradient} text-white uppercase shadow-sm`}>
                    Official 3D
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
