import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { Tab3DIcon, Tab3DType } from './Tab3DIcon';
import { ChevronRight, Sparkles } from 'lucide-react';

interface TabItemConfig {
  id: string;
  type: Tab3DType;
  label: string;
  sublabel: string;
  badge?: string | number;
  badgeColor?: string;
  adminOnly?: boolean;
  trainerOrAdminOnly?: boolean;
}

export const NavigationHub3D: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, users, attendance, cart } = useGym();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const pendingApprovalsCount = users.filter((u) => u.approval_status === 'pending').length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const insideGymCount = attendance.filter((a) => a.date === todayStr && !a.check_out_time).length;
  const cartTotalItems = cart?.reduce((acc, it) => acc + it.quantity, 0) || 0;

  const ALL_TABS: TabItemConfig[] = [
    {
      id: 'dashboard',
      type: 'dashboard',
      label: 'HQ Overview',
      sublabel: 'Command Center',
    },
    {
      id: 'workouts',
      type: 'workouts',
      label: 'Workouts & Split',
      sublabel: '3D Iron Matrix',
      badge: 'PRO',
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'hg-ai',
      type: 'hg-ai',
      label: 'HG.AI Specialist',
      sublabel: 'Neural Coach',
      badge: 'AI 2.5',
      badgeColor: 'bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black',
    },
    {
      id: 'attendance',
      type: 'attendance',
      label: 'Attendance & Pass',
      sublabel: 'QR Scanner',
      badge: insideGymCount > 0 ? `${insideGymCount} Live` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    },
    {
      id: 'shop',
      type: 'shop',
      label: 'Shop & Fuel',
      sublabel: 'Supplements',
      badge: cartTotalItems > 0 ? `${cartTotalItems} items` : undefined,
      badgeColor: 'bg-amber-500 text-zinc-950 font-black',
    },
    {
      id: 'members',
      type: 'members',
      label: 'Athletes & Roster',
      sublabel: 'Nadia Network',
    },
    {
      id: 'revenues',
      type: 'revenues',
      label: 'Passes & Revenue',
      sublabel: 'Financials',
      trainerOrAdminOnly: true,
    },
    {
      id: 'approvals',
      type: 'approvals',
      label: 'Approvals',
      sublabel: 'Verification',
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: 'bg-rose-600 text-white animate-pulse',
      adminOnly: true,
    },
    {
      id: 'messages',
      type: 'messages',
      label: 'Announcements',
      sublabel: 'Broadcasts',
    },
    {
      id: 'profile',
      type: 'profile',
      label: 'Digital NFC Pass',
      sublabel: 'My Health Stats',
    },
  ];

  // Filter tabs based on role
  const visibleTabs = ALL_TABS.filter((tab) => {
    if (tab.adminOnly && currentUser?.role !== 'admin') return false;
    if (tab.trainerOrAdminOnly && currentUser?.role !== 'admin' && currentUser?.role !== 'trainer') {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full relative z-20 my-6">
      {/* Container with High-End 3D Matte Titanium Panel */}
      <div className="rounded-3xl p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative overflow-hidden">
        {/* Subtle Neon Underglow Gradient Line */}
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />
        <div className="absolute -left-20 -top-20 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
              Training Modules
            </span>
          </div>

          <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
            <span className="text-rose-400 font-black">{visibleTabs.length}</span> Hubs
          </div>
        </div>

        {/* Medium Sized 3D Interactive Tabs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isHovered = hoveredTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`group relative rounded-2xl p-3 text-left transition-all duration-300 flex flex-col justify-between min-h-[110px] sm:min-h-[120px] select-none ${
                  isActive
                    ? 'bg-gradient-to-b from-zinc-800/90 via-zinc-900/95 to-zinc-950 border border-rose-500/60 shadow-[0_10px_25px_rgba(225,29,72,0.25)] scale-[1.02]'
                    : 'bg-zinc-900/50 hover:bg-zinc-800/60 border border-zinc-850 hover:border-zinc-700 hover:shadow-lg hover:scale-[1.01]'
                }`}
              >
                {/* Active Neon Rim Indicator */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-rose-600/15 to-transparent pointer-events-none" />
                )}

                {/* Top Row: 3D Mini-Render Sculpture & Badge */}
                <div className="flex items-start justify-between gap-1 w-full relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-rose-500/40 transition-colors">
                    <Tab3DIcon
                      type={tab.type}
                      isActive={isActive}
                      isHovered={isHovered}
                      className="w-12 h-12"
                    />
                  </div>

                  {tab.badge && (
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm ${
                        tab.badgeColor || 'bg-rose-500 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>

                {/* Bottom Row: Label & Subtitle */}
                <div className="mt-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-xs sm:text-sm font-black tracking-tight transition-colors line-clamp-1 ${
                        isActive
                          ? 'text-white'
                          : 'text-zinc-200 group-hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </h4>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isActive
                          ? 'text-rose-400 translate-x-0.5'
                          : 'text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5'
                      }`}
                    />
                  </div>
                  <p
                    className={`text-[10px] font-medium transition-colors ${
                      isActive ? 'text-amber-400 font-semibold' : 'text-zinc-400 group-hover:text-zinc-300'
                    }`}
                  >
                    {tab.sublabel}
                  </p>
                </div>

                {/* Bottom Status Dot */}
                {isActive && (
                  <div className="absolute bottom-1.5 right-2 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
