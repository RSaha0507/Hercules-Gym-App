import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import {
  MapPin,
  ShieldCheck,
  QrCode,
  Dumbbell,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface OpeningHomeScreenProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const OpeningHomeScreen: React.FC<OpeningHomeScreenProps> = ({
  onOpenLogin,
  onOpenRegister,
}) => {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    environmentMode,
    setEnvironmentMode,
    currentAtmosphere,
  } = useGym();

  const [is3DHovered, setIs3DHovered] = useState(false);
  const [showEnvMenu, setShowEnvMenu] = useState(false);

  const branches = [
    { name: 'Ranaghat', timing: '5:30 AM – 10:00 PM', subtitle: 'Main Strength & Olympic Bay' },
    { name: 'Chakdah', timing: '6:00 AM – 10:00 PM', subtitle: 'Powerlifting & Split Arena' },
    { name: 'Madanpur', timing: '6:00 AM – 9:30 PM', subtitle: 'Functional Turf & Mobility' },
  ];

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden flex flex-col justify-between selection:bg-rose-500 selection:text-white bg-transparent text-zinc-100 font-['Plus_Jakarta_Sans']">
      {/* Dynamic Top Atmospheric Ambient Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full blur-[160px] pointer-events-none transition-all duration-1000 opacity-60 mix-blend-screen"
        style={{
          background: currentAtmosphere?.primaryGlow || 'rgba(244,63,94,0.25)',
        }}
      />

      {/* Header Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <img
            src="/hercules-logo-removebg-preview.png"
            alt="Hercules Gym"
            className="w-10 h-10 object-contain drop-shadow-[0_2px_12px_rgba(244,63,94,0.3)]"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white uppercase font-['Outfit']">
                HERCULES <span className="bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 bg-clip-text text-transparent">GYM</span>
              </span>
            </div>
            <p className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">
              Ranaghat · Chakdah · Madanpur
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Atmospheric Theming / Circadian Prism Selector */}
          <div className="relative">
            <button
              onClick={() => setShowEnvMenu(!showEnvMenu)}
              className="px-3 py-1.5 rounded-xl border border-white/[0.1] bg-zinc-900/90 text-zinc-200 hover:text-white flex items-center gap-1.5 text-xs font-semibold shadow-lg transition-all"
              title="Environmental Lighting & Circadian Atmosphere"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px] capitalize">
                {currentAtmosphere?.name.split(' ')[0] || 'Atmosphere'}
              </span>
            </button>

            {showEnvMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/[0.1] bg-zinc-900/95 text-zinc-200 shadow-2xl p-2 z-50 backdrop-blur-2xl space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Atmospheric Theming
                </div>
                {[
                  { id: 'auto', name: 'Auto (Circadian Time)', hint: 'Adapts to local hour' },
                  { id: 'dawn', name: 'Dawn Freshness', hint: '05:00 - 11:00 AM' },
                  { id: 'midday', name: 'Midday Power Surge', hint: '11:00 AM - 05:00 PM' },
                  { id: 'golden_hour', name: 'Golden Hour Rush', hint: '05:00 - 09:00 PM' },
                  { id: 'midnight', name: 'Midnight Hardcore Iron', hint: '09:00 PM - 05:00 AM' },
                  { id: 'prismatic', name: 'Prismatic Dispersion', hint: 'Full chromatic spectrum' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setEnvironmentMode(item.id as any);
                      setShowEnvMenu(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-medium hover:bg-white/[0.08] flex items-center justify-between transition-colors ${
                      environmentMode === item.id ? 'bg-white/[0.1] text-white font-bold' : 'text-zinc-400'
                    }`}
                  >
                    <div>
                      <div>{item.name}</div>
                      <div className="text-[10px] text-zinc-500 font-normal">{item.hint}</div>
                    </div>
                    {environmentMode === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-zinc-900/90 rounded-xl p-1 border border-white/[0.08] text-xs">
            {(['en', 'bn', 'hi'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase transition-all ${
                  language === l
                    ? 'bg-white text-black shadow-sm'
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
            className="p-2 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-zinc-400 hover:text-white transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Direct Login CTA */}
          <button
            type="button"
            onClick={onOpenLogin}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black shadow-lg transition-all active:scale-95"
          >
            <span>{t('login')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero Showcase */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Brand Statement & Primary Actions */}
        <div className="lg:col-span-7 space-y-7 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Nadia District's Premier Fitness & Athletic Network</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight font-['Outfit']">
              CHANGE YOUR <br />
              <span className="bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 bg-clip-text text-transparent">
                BODY & MIND.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 font-normal max-w-xl leading-relaxed">
              Experience the unified digital ecosystem of Hercules Gym. Multi-center access, real-time QR check-in, elite hypertrophy splits, and structured macro nutrition across Ranaghat, Chakdah, and Madanpur.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={onOpenRegister}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-950/50 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Join Hercules Gym</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenLogin}
              className="px-6 py-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.1] text-zinc-200 font-bold text-xs sm:text-sm transition-all active:scale-95"
            >
              Member / Trainer Login
            </button>
          </div>

          {/* Metric Badges */}
          <div className="pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-4 text-left">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">3</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Physical Branches</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">100%</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Digital Operations</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">24/7</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">System Availability</div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 3D Emblem Stage */}
        <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
          <div
            onMouseEnter={() => setIs3DHovered(true)}
            onMouseLeave={() => setIs3DHovered(false)}
            className="w-full aspect-square max-w-[420px] rounded-3xl border border-white/[0.1] bg-gradient-to-b from-zinc-900/80 via-zinc-950/90 to-black/90 p-4 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between backdrop-blur-2xl transition-transform duration-500 group hover:scale-[1.02]"
          >
            {/* Dynamic Center Ambient Backlight */}
            <div
              className="absolute inset-0 transition-opacity duration-700 pointer-events-none opacity-20 group-hover:opacity-40"
              style={{
                background: currentAtmosphere?.primaryGlow || 'radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 70%)',
              }}
            />

            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.08] shadow-inner flex items-center justify-center bg-black/40">
              <img
                src="/hercules-3d-logo.png"
                alt="Hercules Gym 3D Render"
                className="w-48 sm:w-60 h-auto object-contain transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3 drop-shadow-[0_15px_35px_rgba(244,63,94,0.35)]"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', '/hercules-logo-removebg-preview.png');
                }}
              />

              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <p className="text-xs font-black text-white leading-none">HERCULES GYM</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Ranaghat • Chakdah • Madanpur</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 uppercase">
                  Official 3D
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Branch Bar */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span>Hercules Gym Cloud Ecosystem</span>
          <span aria-hidden="true">·</span>
          <span>Unified Cross-Branch Architecture</span>
        </div>

        <div className="flex items-center gap-6">
          {branches.map((b) => (
            <div key={b.name} className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-zinc-200 font-semibold">{b.name}</span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
};
