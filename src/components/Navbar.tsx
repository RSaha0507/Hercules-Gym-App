import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { CenterType } from '../types';
import {
  Dumbbell,
  MapPin,
  Moon,
  Sun,
  Globe,
  UserCheck,
  QrCode,
  LogOut,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface NavbarProps {
  onOpenQrModal: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQrModal, onOpenAuthModal }) => {
  const {
    currentUser,
    selectedCenter,
    setSelectedCenter,
    users,
    switchDemoUser,
    logout,
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    isCheckedIn,
    activeCheckIn,
    checkOut,
  } = useGym();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const centers: (CenterType | 'All')[] = ['All', 'Ranaghat', 'Chakdah', 'Madanpur'];

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
      theme === 'dark'
        ? 'bg-zinc-950/90 border-zinc-800/80 backdrop-blur-md text-zinc-100'
        : 'bg-white/90 border-zinc-200 backdrop-blur-md text-zinc-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-700 via-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-900/30 text-white font-extrabold tracking-wider">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-rose-500 via-red-400 to-orange-400 bg-clip-text text-transparent">
                HERCULES
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                GYM & FITNESS
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
              Ranaghat • Chakdah • Madanpur
            </p>
          </div>
        </div>

        {/* Center Selector & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Center Selector Pill */}
          <div className={`hidden md:flex items-center rounded-xl p-1 border ${
            theme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-100 border-zinc-300'
          }`}>
            <div className="flex items-center gap-1 px-2 text-xs font-semibold text-zinc-400">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
            </div>
            {centers.map(center => (
              <button
                key={center}
                onClick={() => setSelectedCenter(center)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  selectedCenter === center
                    ? 'bg-rose-600 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {center === 'All' ? t('allCenters') : center}
              </button>
            ))}
          </div>

          {/* Quick Check-in Button */}
          {currentUser ? (
            isCheckedIn ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={checkOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition-all animate-pulse"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Inside {activeCheckIn?.center}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10px] uppercase font-bold">
                    Check Out
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenQrModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-rose-900/30 transition-all active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">{t('qrCheckIn')}</span>
              </button>
            )
          ) : null}

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={`p-2 rounded-xl border transition-colors flex items-center gap-1 text-xs font-semibold ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-300 text-zinc-700'
              }`}
              title="Change Language"
            >
              <Globe className="w-4 h-4 text-rose-500" />
              <span className="uppercase text-[11px] font-bold">{language}</span>
            </button>

            {showLangMenu && (
              <div className={`absolute right-0 mt-2 w-32 rounded-xl border shadow-xl py-1 z-50 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
              }`}>
                <button
                  onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-rose-500/10 flex items-center justify-between ${
                    language === 'en' ? 'text-rose-500 font-bold' : ''
                  }`}
                >
                  <span>English</span>
                  {language === 'en' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setLanguage('bn'); setShowLangMenu(false); }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-rose-500/10 flex items-center justify-between ${
                    language === 'bn' ? 'text-rose-500 font-bold' : ''
                  }`}
                >
                  <span>বাংলা</span>
                  {language === 'bn' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setLanguage('hi'); setShowLangMenu(false); }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-rose-500/10 flex items-center justify-between ${
                    language === 'hi' ? 'text-rose-500 font-bold' : ''
                  }`}
                >
                  <span>हिंदी</span>
                  {language === 'hi' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-colors ${
              theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 text-yellow-400 hover:bg-zinc-800'
                : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
            }`}
            title="Toggle Dark/Light Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Demo User Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-xs font-bold transition-all"
              title="Switch demo persona for testing"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">{t('switchRole')}</span>
              <span className="lg:hidden uppercase text-[10px]">Demo</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDemoMenu && (
              <div className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl p-2 z-50 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
              }`}>
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Switch Persona (Demo Accounts)
                </div>
                <div className="space-y-1">
                  {users.slice(0, 5).map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchDemoUser(u.id);
                        setShowDemoMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors ${
                        currentUser?.id === u.id
                          ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                          : 'hover:bg-zinc-800/50'
                      }`}
                    >
                      <img
                        src={u.profile_image}
                        alt={u.full_name}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{u.full_name}</div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                          <span className="capitalize font-semibold text-rose-400">{u.role}</span>
                          <span>•</span>
                          <span>{u.center}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current User Profile / Log in */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border transition-colors ${
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-300'
                }`}
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold leading-tight truncate max-w-[100px]">
                    {currentUser.full_name}
                  </div>
                  <div className="text-[10px] text-zinc-400 capitalize font-medium">
                    {currentUser.role}
                  </div>
                </div>
                <img
                  src={currentUser.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                  alt={currentUser.full_name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-rose-500"
                />
              </button>

              {showUserMenu && (
                <div className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl p-2 z-50 ${
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
                }`}>
                  <div className="p-2 border-b border-zinc-800 mb-1">
                    <p className="text-xs font-bold">{currentUser.full_name}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{currentUser.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 capitalize">
                        {currentUser.role}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300">
                        {currentUser.center}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-900/20"
            >
              {t('login')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
