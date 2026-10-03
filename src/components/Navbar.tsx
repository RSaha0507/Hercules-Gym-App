import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { CenterType } from '../types';
import {
  Moon,
  Sun,
  Globe,
  QrCode,
  LogOut,
  CheckCircle2,
  User,
  LayoutDashboard,
  Users,
  CalendarCheck2,
  ShoppingBag,
  MessageSquare,
  CreditCard,
  UserCircle2,
  Sparkles,
  Dumbbell,
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
    logout,
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    isCheckedIn,
    activeCheckIn,
    checkOut,
    backendConnected,
    isSyncing,
    syncWithBackend,
    activeTab,
    setActiveTab,
    users,
    cart,
    getCenterTheme,
    environmentMode,
    setEnvironmentMode,
    currentAtmosphere,
  } = useGym();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showEnvMenu, setShowEnvMenu] = useState(false);

  const centerTheme = getCenterTheme(selectedCenter);
  const centers: (CenterType | 'All')[] = ['All', 'Ranaghat', 'Chakdah', 'Madanpur'];

  const pendingApprovalsCount = users.filter((u) => u.approval_status === 'pending').length;
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      roles: ['admin', 'trainer', 'member'],
    },
    {
      id: 'members',
      label: 'Members & Trainers',
      icon: Users,
      roles: ['admin', 'trainer'],
    },
    {
      id: 'approvals',
      label: t('approvals'),
      icon: CheckCircle2,
      roles: ['admin'],
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: 'bg-amber-400 text-black',
    },
    {
      id: 'attendance',
      label: t('attendance'),
      icon: CalendarCheck2,
      roles: ['admin', 'trainer', 'member'],
    },
    {
      id: 'workouts',
      label: 'Workouts & Diet',
      icon: Dumbbell,
      roles: ['admin', 'trainer', 'member'],
    },
    {
      id: 'hg-ai',
      label: 'HG.AI Coach',
      icon: Sparkles,
      roles: ['admin', 'trainer', 'member'],
    },
    {
      id: 'shop',
      label: 'Store',
      icon: ShoppingBag,
      roles: ['admin', 'trainer', 'member'],
      badge: cartItemsCount > 0 ? cartItemsCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'messages',
      label: t('messages'),
      icon: MessageSquare,
      roles: ['admin', 'trainer', 'member'],
    },
    {
      id: 'revenues',
      label: 'Revenue Record',
      icon: CreditCard,
      roles: ['admin', 'member', 'trainer'],
    },
    {
      id: 'profile',
      label: t('profile'),
      icon: UserCircle2,
      roles: ['admin', 'trainer', 'member'],
    },
  ];

  const currentRole = currentUser?.role || 'member';
  const visibleItems = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-zinc-950/60 backdrop-blur-2xl text-zinc-100 transition-colors">
      {/* Top Brand Bar */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Brand Logo & Typography */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab('dashboard')}>
          <img
            src="/hercules-logo-removebg-preview.png"
            alt="Hercules Gym"
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain transition-transform hover:scale-105 shrink-0"
          />
          <div>
            <div className="font-black text-xl sm:text-2xl tracking-tight text-white uppercase font-['Outfit'] leading-none">
              HERCULES <span className={`bg-gradient-to-r ${centerTheme.textGradient} bg-clip-text text-transparent`}>GYM</span>
            </div>
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mt-0.5">
              {centerTheme.name}
            </div>
          </div>
        </div>

        {/* Center Quick Switcher & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Segmented Center Selector */}
          {currentUser && currentUser.role !== 'admin' ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-zinc-900/30 border border-white/[0.04] text-xs text-zinc-300">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: centerTheme.accentHex }} />
              <span className="font-medium">{currentUser.center} Branch</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center bg-zinc-900/40 p-1 rounded-2xl border border-white/[0.04]">
              {centers.map((center) => {
                const isSelected = selectedCenter === center;
                const cTheme = getCenterTheme(center);
                return (
                  <button
                    key={center}
                    onClick={() => setSelectedCenter(center)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? `bg-gradient-to-r ${cTheme.gradient} text-white shadow-sm font-semibold`
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {center === 'All' ? t('allCenters') : center}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Attendance Check-in CTA Button */}
          {currentUser && (
            isCheckedIn ? (
              <button
                onClick={checkOut}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Inside {activeCheckIn?.center}</span>
                <span className="text-[10px] uppercase font-bold">Check Out</span>
              </button>
            ) : (
              <button
                onClick={onOpenQrModal}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r ${centerTheme.gradient} text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-all active:scale-95`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('qrCheckIn')}</span>
              </button>
            )
          )}

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="px-2.5 py-1.5 rounded-2xl border border-white/[0.04] bg-zinc-900/30 text-zinc-300 hover:text-white flex items-center gap-1 text-xs font-medium transition-colors"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span className="uppercase text-[11px] font-semibold">{language}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-32 rounded-2xl border border-white/[0.06] bg-zinc-900/90 text-zinc-200 shadow-2xl py-1.5 z-50 backdrop-blur-2xl">
                {(['en', 'bn', 'hi'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLanguage(l);
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs font-medium hover:bg-white/[0.06] flex items-center justify-between ${
                      language === l ? 'text-white font-semibold' : 'text-zinc-400'
                    }`}
                  >
                    <span>{l === 'en' ? 'English' : l === 'bn' ? 'বাংলা' : 'हिंदी'}</span>
                    {language === l && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Atmospheric Theming / Circadian Prism Selector */}
          <div className="relative">
            <button
              onClick={() => setShowEnvMenu(!showEnvMenu)}
              className="px-2.5 py-1.5 rounded-2xl border border-white/[0.05] bg-zinc-900/30 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-medium transition-colors"
              title="Environmental Lighting & Circadian Atmosphere"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline text-[11px] font-semibold capitalize">
                {currentAtmosphere?.name.split(' ')[0] || 'Atmosphere'}
              </span>
            </button>

            {showEnvMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/[0.08] bg-zinc-900/95 text-zinc-200 shadow-2xl p-2 z-50 backdrop-blur-2xl space-y-1">
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
                    className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-medium hover:bg-white/[0.06] flex items-center justify-between transition-colors ${
                      environmentMode === item.id ? 'bg-white/[0.08] text-white font-bold' : 'text-zinc-400'
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

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-2xl border border-white/[0.04] bg-zinc-900/30 text-zinc-400 hover:text-white transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Account / Avatar */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl border border-white/[0.04] bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                    {currentUser.full_name}
                  </div>
                  <div className="text-[10px] text-zinc-400 capitalize font-normal">
                    {currentUser.role} · {currentUser.center}
                  </div>
                </div>
                {currentUser.profile_image ? (
                  <img
                    src={currentUser.profile_image}
                    alt={currentUser.full_name}
                    className="w-7 h-7 rounded-xl object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${centerTheme.gradient} text-white flex items-center justify-center font-bold text-xs`}>
                    {currentUser.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/[0.06] bg-zinc-900/95 text-zinc-200 shadow-2xl p-2 z-50 backdrop-blur-2xl space-y-1">
                  <div className="px-3 py-2 border-b border-white/[0.04]">
                    <div className="text-xs font-bold text-white truncate">{currentUser.full_name}</div>
                    <div className="text-[11px] text-zinc-400 truncate">{currentUser.email || currentUser.phone}</div>
                    <div className="text-[10px] text-emerald-400 font-mono mt-0.5 uppercase">
                      {currentUser.member_id || currentUser.role}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-white/[0.06] rounded-xl flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t('myProfile')}</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>{t('signOut')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Desktop & Tablet Navigation Strip */}
      <nav className="w-full mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto border-t border-white/[0.04] scrollbar-none py-1.5 flex items-center gap-1.5">
        {visibleItems.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'shop' && activeTab.startsWith('shop'));
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 relative ${
                isActive
                  ? 'bg-zinc-800/80 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
              <span>{item.label}</span>

              {item.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-rose-500 text-white'}`}>
                  {item.badge}
                </span>
              )}

              {isActive && (
                <span
                  className="absolute bottom-0 inset-x-3 h-[2px] rounded-full"
                  style={{ backgroundColor: centerTheme.accentHex }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
