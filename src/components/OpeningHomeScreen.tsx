import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import {
  MapPin,
  Flame,
  ShieldCheck,
  QrCode,
  Dumbbell,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';

interface OpeningHomeScreenProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const OpeningHomeScreen: React.FC<OpeningHomeScreenProps> = ({
  onOpenLogin,
  onOpenRegister,
}) => {
  const { theme, toggleTheme, language, setLanguage, t } = useGym();
  const [is3DHovered, setIs3DHovered] = useState(false);

  const branches = [
    { name: 'Ranaghat', timing: '5:30 AM - 10:00 PM' },
    { name: 'Chakdah', timing: '6:00 AM - 10:00 PM' },
    { name: 'Madanpur', timing: '6:00 AM - 9:30 PM' },
  ];

  return (
    <div
      className="min-h-screen w-full relative overflow-x-hidden flex flex-col justify-between selection:bg-rose-500 selection:text-white transition-colors duration-300 bg-transparent text-zinc-100"
    >
      {/* Top Background Glow Ambient Spheres */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-rose-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 right-10 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Navigation / Header Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/hercules-logo-removebg-preview.png"
            alt="Hercules Gym Logo"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-[0_4px_15px_rgba(244,63,94,0.4)]"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-wider bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 bg-clip-text text-transparent">
                HERCULES GYM
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 tracking-widest uppercase">
              Ranaghat • Chakdah • Madanpur
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switch */}
          <div className="flex items-center bg-zinc-900/70 backdrop-blur-md rounded-xl p-1 border border-zinc-700/60 text-xs">
            {(['en', 'bn', 'hi'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase transition-all ${
                  language === l
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-900/70 backdrop-blur-md border border-zinc-700/60 text-amber-400 hover:text-amber-300 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-zinc-800" />}
          </button>

          {/* Direct Login CTA */}
          <button
            type="button"
            onClick={onOpenLogin}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-extrabold shadow-lg shadow-rose-950/40 transition-all active:scale-95"
          >
            <span>{t('login')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero Showcase */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Brand Statement & CTA */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-red-500/20 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wide shadow-lg shadow-rose-950/30">
            <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Ranaghat • Chakdah • Madanpur</span>
          </div>

          {/* Hero Typography */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight">
              CHANGE YOUR <span className="bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 bg-clip-text text-transparent drop-shadow-[0_4px_15px_rgba(244,63,94,0.4)]">BODY</span>,<br />
              CHANGE YOUR <span className="bg-gradient-to-r from-rose-500 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_4px_15px_rgba(245,158,11,0.4)]">MIND</span>.
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 font-medium max-w-xl leading-relaxed">
              Experience workout splits, live branch attendance, smart coach advice, and direct trainer guidance built for athletes across Ranaghat, Chakdah, and Madanpur.
            </p>
          </div>

          {/* Official Info Card */}
          <div className="rounded-2xl border border-zinc-700/80 bg-zinc-950/80 backdrop-blur-xl p-5 shadow-2xl relative overflow-hidden space-y-2.5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-black tracking-wider text-amber-400 uppercase">
                HERCULES GYM
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {t("Welcome to your hometown's first ever gym digital app services presented to you by Hercules Gym - We stand strong with Fitness, Discipline and Progress !!")}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onOpenLogin}
              className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm sm:text-base shadow-xl shadow-rose-950/50 hover:shadow-rose-900/60 transition-all flex items-center justify-center gap-2.5 active:scale-95 group"
            >
              <span>{t('login')} / Access Account</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={onOpenRegister}
              className="flex-1 sm:flex-none px-7 py-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('register')} New Member</span>
            </button>
          </div>

          {/* Quick Features */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 backdrop-blur-md flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate">QR Scanner</p>
                <p className="text-[9px] text-zinc-400 truncate">1-Tap Check-in</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 backdrop-blur-md flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                <img src="/hg-ai-logo.png" alt="HG.AI" className="w-5 h-5 rounded object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate">HG.AI Coach</p>
                <p className="text-[9px] text-zinc-400 truncate">Workout & Diets</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 backdrop-blur-md flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate">3 Centers</p>
                <p className="text-[9px] text-zinc-400 truncate">Unified Network</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Emblem Stage */}
        <div
          className="lg:col-span-5 relative flex flex-col items-center justify-center"
          onMouseEnter={() => setIs3DHovered(true)}
          onMouseLeave={() => setIs3DHovered(false)}
        >
          {/* Card Container for 3D View */}
          <div className="w-full aspect-square max-w-[420px] rounded-3xl border border-zinc-700/80 bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-black p-3 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between backdrop-blur-xl">
            {/* Ambient Background Light in 3D box */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* 3D HG Logo Artwork Frame */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center bg-black">
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/20 via-transparent to-amber-500/10 pointer-events-none z-10" />

              <img
                src="/hercules-3d-logo.png"
                alt="Hercules Gym 3D Render"
                className={`w-full h-full object-cover filter contrast-105 brightness-105 transition-transform duration-700 ease-out select-none ${
                  is3DHovered ? 'scale-105' : 'scale-100'
                }`}
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', '/hercules-3d-logo.png');
                }}
              />

              {/* Bottom Caption Overlay */}
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
      </main>

      {/* Network Center Branches Footer Bar */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-zinc-800/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branches.map((b) => (
            <div
              key={b.name}
              className="p-3.5 rounded-2xl bg-zinc-950/70 backdrop-blur-md border border-zinc-800/80 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-600/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">{b.name} Branch</h4>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live
                </span>
                <p className="text-[9px] text-zinc-500">{b.timing}</p>
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
};
