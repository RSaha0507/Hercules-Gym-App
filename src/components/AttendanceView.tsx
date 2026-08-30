import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { CenterType } from '../types';
import {
  CalendarCheck2,
  QrCode,
  MapPin,
  Clock,
  UserCheck,
  CheckCircle2,
  Activity,
  Flame,
  Search,
  Filter,
  ShieldCheck,
  Users,
  Award,
} from 'lucide-react';

interface AttendanceViewProps {
  onOpenQrModal: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ onOpenQrModal }) => {
  const {
    attendance,
    currentUser,
    users,
    selectedCenter,
    checkIn,
    checkOut,
    isCheckedIn,
    activeCheckIn,
    manualCheckIn,
    theme,
  } = useGym();

  const [searchFilter, setSearchFilter] = useState('');
  const [centerFilter, setCenterFilter] = useState<CenterType | 'All'>(selectedCenter);
  const [selectedUserForCheckIn, setSelectedUserForCheckIn] = useState('');
  const [manualCenter, setManualCenter] = useState<CenterType>('Ranaghat');

  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredLogs = attendance.filter(a => {
    const matchesSearch =
      a.user_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.center.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesCenter = centerFilter === 'All' || a.center === centerFilter;

    return matchesSearch && matchesCenter;
  });

  const todayLogs = filteredLogs.filter(a => a.date === todayStr);
  const liveAthletes = todayLogs.filter(a => !a.check_out_time);

  // User monthly streak calculation
  const userAttendances = attendance.filter(a => a.user_id === currentUser?.id);
  const totalVisitsCount = userAttendances.length;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForCheckIn) return;
    manualCheckIn(selectedUserForCheckIn, manualCenter);
    setSelectedUserForCheckIn('');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Attendance & Floor Tracker</h2>
          <p className="text-xs text-zinc-400">
            Real-time biometric & QR check-in records across all 3 Nadia centers
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCheckedIn ? (
            <button
              onClick={checkOut}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Checked in at {activeCheckIn?.center} • Check Out</span>
            </button>
          ) : (
            <button
              onClick={onOpenQrModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Check-In Pass</span>
            </button>
          )}
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-3xl border ${
          theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Currently On Gym Floor</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{liveAthletes.length}</div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live across selected center
          </p>
        </div>

        <div className={`p-5 rounded-3xl border ${
          theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Total Check-Ins Today</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{todayLogs.length}</div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Peak hours: 6:00 AM - 9:00 AM & 5:00 PM - 9:00 PM
          </p>
        </div>

        <div className={`p-5 rounded-3xl border ${
          theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">My Lifetime Gym Visits</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400">{totalVisitsCount} Sessions</div>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1 font-semibold">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Consistency Tier: Dedicated Lifter
          </p>
        </div>
      </div>

      {/* Admin Front-Desk Quick Manual Check-In Bar */}
      {currentUser?.role === 'admin' && (
        <div className={`p-5 rounded-3xl border space-y-3 ${
          theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-300'
        }`}>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-500">
            <ShieldCheck className="w-4 h-4" />
            <span>Front Desk Reception Manual Check-in</span>
          </div>

          <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedUserForCheckIn}
              onChange={e => setSelectedUserForCheckIn(e.target.value)}
              className="flex-1 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium text-white focus:outline-none"
            >
              <option value="">Select athlete to check in...</option>
              {users
                .filter(u => u.approval_status === 'approved')
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role} - {u.center})
                  </option>
                ))}
            </select>

            <select
              value={manualCenter}
              onChange={e => setManualCenter(e.target.value as CenterType)}
              className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium text-white focus:outline-none"
            >
              <option value="Ranaghat">Ranaghat Center</option>
              <option value="Chakdah">Chakdah Center</option>
              <option value="Madanpur">Madanpur Center</option>
            </select>

            <button
              type="submit"
              disabled={!selectedUserForCheckIn}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shrink-0"
            >
              Check In Athlete
            </button>
          </form>
        </div>
      )}

      {/* Attendance Logs Table */}
      <div className={`rounded-3xl border overflow-hidden ${
        theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        <div className="p-4 sm:p-6 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-extrabold text-white">Attendance Activity Logs</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search athlete..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
              />
            </div>

            <select
              value={centerFilter}
              onChange={e => setCenterFilter(e.target.value as any)}
              className="p-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none font-medium"
            >
              <option value="All">All Centers</option>
              <option value="Ranaghat">Ranaghat</option>
              <option value="Chakdah">Chakdah</option>
              <option value="Madanpur">Madanpur</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 ${
              theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}>
              <tr>
                <th className="px-6 py-3.5">Athlete</th>
                <th className="px-6 py-3.5">Center</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Check-In</th>
                <th className="px-6 py-3.5">Check-Out / Duration</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredLogs.map(record => (
                <tr
                  key={record.id}
                  className={`transition-colors ${
                    theme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{record.user_name}</div>
                    <div className="text-[10px] text-zinc-400 capitalize">{record.user_role}</div>
                  </td>

                  <td className="px-6 py-4 font-semibold text-zinc-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{record.center}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-zinc-400">
                    {record.date}
                  </td>

                  <td className="px-6 py-4 font-mono font-semibold text-zinc-200">
                    {new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>

                  <td className="px-6 py-4">
                    {record.check_out_time ? (
                      <div className="font-mono text-zinc-300">
                        {new Date(record.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="text-[10px] text-zinc-500 ml-1.5">({record.duration_minutes}m)</span>
                      </div>
                    ) : (
                      <span className="text-emerald-400 font-bold text-[11px] animate-pulse">
                        Active In Gym
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      record.check_out_time
                        ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {record.check_out_time ? 'Completed' : 'On Floor'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
