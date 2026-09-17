import React from 'react';
import { useGym } from '../context/GymContext';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  CalendarCheck2,
  ShoppingBag,
  MessageSquare,
  Dumbbell,
  CreditCard,
  UserCircle2,
  Sparkles,
  X,
  ChevronLeft,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, users, t, theme, cart, isNavOpen, setIsNavOpen } = useGym();

  const pendingApprovalsCount = users.filter(u => u.approval_status === 'pending').length;
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const isShopView = activeTab === 'shop' || activeTab === 'shop/cart' || activeTab === 'cart';

  const navItems = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      roles: ['admin', 'trainer', 'member'],
    },
    {
      id: 'members',
      label: t('members'),
      icon: Users,
      roles: ['admin', 'trainer'],
    },
    {
      id: 'approvals',
      label: t('approvals'),
      icon: CheckCircle2,
      roles: ['admin'],
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: 'bg-amber-500 text-black',
    },
    {
      id: 'attendance',
      label: t('attendance'),
      icon: CalendarCheck2,
      roles: ['admin', 'trainer', 'member'],
    },
    {
      id: 'workouts',
      label: t('workouts'),
      icon: Dumbbell,
      roles: ['admin', 'trainer', 'member'],
    },
    {
      id: 'hg-ai',
      label: 'HG.AI Coach',
      icon: Sparkles,
      roles: ['admin', 'trainer', 'member'],
      badge: 'AI',
      badgeColor: 'bg-gradient-to-r from-rose-500 to-amber-500 text-white',
    },
    {
      id: 'shop',
      label: t('shop'),
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
      label: t('revenues'),
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
  const visibleItems = navItems.filter(item => item.roles.includes(currentRole));

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    // If in shop view or on overlay mode, close the overlay after selecting
    if (isShopView || window.innerWidth < 1024) {
      setIsNavOpen(false);
    }
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between space-y-4">
      <div className="space-y-1.5 flex-1">
        <div className="px-3 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          <span>Navigation Menu</span>
          <button
            type="button"
            onClick={() => setIsNavOpen(false)}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white lg:hidden"
            title="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHgAi = item.id === 'hg-ai';

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-950/40 font-bold translate-x-1'
                  : theme === 'dark'
                  ? 'hover:bg-zinc-900 hover:text-zinc-100 text-zinc-400'
                  : 'hover:bg-zinc-200 hover:text-zinc-900 text-zinc-600'
              }`}
            >
              <div className="flex items-center gap-3">
                {isHgAi ? (
                  <img
                    src="/hg-ai-logo.png"
                    alt="HG.AI"
                    className={`w-4 h-4 rounded object-cover transition-transform group-hover:scale-110 ${
                      isActive ? 'ring-1 ring-white' : ''
                    }`}
                  />
                ) : (
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-rose-500'
                  }`} />
                )}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Membership Info Box for Members */}
      {currentUser?.membership && (
        <div className={`mt-auto p-3.5 rounded-2xl border ${
          theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Active Pass
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400">
              {currentUser.membership.status === 'active' ? 'Active' : 'Due Soon'}
            </span>
          </div>
          <p className="text-xs font-bold text-zinc-200 truncate">
            {currentUser.membership.plan_name}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Expires on {currentUser.membership.end_date}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 1. Desktop Docked Sidebar (Only shown when NOT in shop view AND isNavOpen is true) */}
      {!isShopView && isNavOpen && (
        <aside className={`hidden md:flex flex-col w-64 border-r p-4 shrink-0 transition-all duration-300 ${
          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
        }`}>
          {navContent}
        </aside>
      )}

      {/* 2. Pop-up Overlay Navigation Menu (When in shop view OR when opened via 3-dash hamburger) */}
      {isNavOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsNavOpen(false)}
          />

          {/* Slide-out Sidebar Drawer */}
          <aside className={`relative z-50 flex flex-col w-72 max-w-[85vw] h-full p-4 border-r shadow-2xl transition-transform duration-300 animate-in slide-in-from-left ${
            theme === 'dark'
              ? 'bg-zinc-950 border-zinc-800 text-zinc-300 shadow-rose-950/30'
              : 'bg-white border-zinc-200 text-zinc-700 shadow-xl'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <img
                  src="/hercules-logo-removebg-preview.png"
                  alt="Hercules Gym"
                  className="w-7 h-7 object-contain"
                />
                <span className="font-extrabold text-sm tracking-tight text-white">
                  HERCULES GYM
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsNavOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title="Close navigation"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {navContent}
            </div>
          </aside>
        </div>
      )}

      {/* 3. Mobile Bottom Navigation Bar (For quick 1-tap navigation on small screens) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-center justify-around px-2 py-2 safe-bottom backdrop-blur-xl ${
        theme === 'dark' ? 'bg-zinc-950/95 border-zinc-800 text-zinc-300' : 'bg-white/95 border-zinc-200 text-zinc-700'
      }`}>
        {visibleItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all relative ${
                isActive ? 'text-rose-500 font-bold scale-105' : 'text-zinc-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] truncate max-w-[56px]">{item.label}</span>
              {item.badge !== undefined && (
                <span className="absolute -top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};

