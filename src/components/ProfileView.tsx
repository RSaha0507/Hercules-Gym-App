import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import {
  UserCircle2,
  QrCode,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { currentUser, theme } = useGym();

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-zinc-400">
        Please sign in or choose a demo persona to view profile.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Athlete Profile & Digital Pass</h2>
        <p className="text-xs text-zinc-400">
          Official Hercules Gym identification, membership credential, and center protocols
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Digital Membership ID Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-rose-950/60 to-zinc-950 border border-rose-500/40 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                  HERCULES GYM PASS
                </span>
                <div className="text-xs text-zinc-400">Nadia Fitness Network</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase">
                {currentUser.membership?.status || 'Active'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={currentUser.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                alt={currentUser.full_name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-rose-500"
              />
              <div className="min-w-0">
                <h3 className="text-base font-black text-white truncate">{currentUser.full_name}</h3>
                <div className="text-xs text-rose-400 font-bold capitalize">{currentUser.role}</div>
                <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  <span>{currentUser.center} Home Branch</span>
                </div>
              </div>
            </div>

            {/* QR Pass Code */}
            <div className="p-3.5 rounded-2xl bg-white text-zinc-950 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                  MEMBER ID
                </div>
                <div className="font-mono text-xs font-black tracking-tight">{currentUser.id}</div>
                <div className="text-[9px] text-zinc-500">Scan at entrance turnstile</div>
              </div>

              <div className="w-12 h-12 border-2 border-zinc-900 p-1 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-2.5 h-2.5 bg-zinc-900" />
                  <div className="w-2.5 h-2.5 bg-zinc-900" />
                </div>
                <div className="flex justify-between">
                  <div className="w-2.5 h-2.5 bg-zinc-900" />
                  <div className="w-2.5 h-2.5 bg-zinc-900" />
                </div>
              </div>
            </div>

            {currentUser.membership && (
              <div className="text-[10px] text-zinc-400 flex justify-between border-t border-zinc-800 pt-3">
                <span>Tier: {currentUser.membership.plan_name}</span>
                <span>Exp: {currentUser.membership.end_date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Details & Center Protocols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className={`p-6 rounded-3xl border space-y-4 ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <h3 className="text-base font-extrabold text-white">Contact & Profile Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px]">Email Address</span>
                <div className="font-bold text-white mt-0.5">{currentUser.email}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px]">Registered Phone</span>
                <div className="font-bold text-white mt-0.5">{currentUser.phone}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px]">Home Center</span>
                <div className="font-bold text-white mt-0.5">{currentUser.center} Branch</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px]">Account Status</span>
                <div className="font-bold text-emerald-400 mt-0.5">Verified & Approved</div>
              </div>
            </div>
          </div>

          {/* Gym Center Timings & Rules */}
          <div className={`p-6 rounded-3xl border space-y-4 ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-extrabold text-white">Center Operating Hours</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="font-bold text-rose-400">Ranaghat Center</div>
                <div className="text-zinc-300 mt-1">Mon - Sat: 5:30 AM - 10:00 PM</div>
                <div className="text-zinc-500 text-[10px]">Sunday: 6:00 AM - 1:00 PM</div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="font-bold text-rose-400">Chakdah Center</div>
                <div className="text-zinc-300 mt-1">Mon - Sat: 6:00 AM - 9:30 PM</div>
                <div className="text-zinc-500 text-[10px]">Sunday: 6:00 AM - 12:00 PM</div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="font-bold text-rose-400">Madanpur Center</div>
                <div className="text-zinc-300 mt-1">Mon - Sat: 6:00 AM - 9:30 PM</div>
                <div className="text-zinc-500 text-[10px]">Sunday: 7:00 AM - 12:00 PM</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                Floor Rules & Etiquette
              </div>
              <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[11px] leading-relaxed">
                <li>Always re-rack dumbbells and bumper plates after finishing your working sets.</li>
                <li>Carry a clean workout towel and sanitize equipment benches after use.</li>
                <li>Proper athletic footwear is mandatory at all times on the gym floor.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
