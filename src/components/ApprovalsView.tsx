import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  ShieldAlert,
  Search,
} from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const { users, approveUser, rejectUser, theme, t } = useGym();
  const [filterTab, setFilterTab] = useState<'pending' | 'history'>('pending');

  const pendingUsers = users.filter(u => u.approval_status === 'pending');
  const historyUsers = users.filter(u => u.approval_status !== 'pending');

  const displayList = filterTab === 'pending' ? pendingUsers : historyUsers;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Member & Trainer Approvals</h2>
          <p className="text-xs text-zinc-400">
            Review registration requests across Ranaghat, Chakdah, and Madanpur centers
          </p>
        </div>

        {/* Tab Toggle */}
        <div className={`p-1 rounded-2xl border flex items-center gap-1 ${
          theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-300'
        }`}>
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingUsers.length})</span>
          </button>

          <button
            onClick={() => setFilterTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === 'history'
                ? 'bg-zinc-800 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>History ({historyUsers.length})</span>
          </button>
        </div>
      </div>

      {/* Approvals List */}
      {displayList.length === 0 ? (
        <div className={`p-12 rounded-3xl border text-center space-y-3 ${
          theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Pending Approvals</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            All member and trainer registrations have been reviewed. New submissions will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayList.map(user => (
            <div
              key={user.id}
              className={`p-5 rounded-3xl border space-y-4 ${
                theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <img
                    src={user.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'}
                    alt={user.full_name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-zinc-800 shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">{user.full_name}</h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>{user.center} Center</span>
                      <span>•</span>
                      <span className="capitalize font-semibold text-rose-400">{user.role}</span>
                    </div>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  user.approval_status === 'pending'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : user.approval_status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {user.approval_status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{user.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Applied on {new Date(user.created_at).toLocaleString()}</span>
                </div>
              </div>

              {user.approval_status === 'pending' && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => rejectUser(user.id)}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-red-950/50 hover:text-red-400 border border-zinc-700 text-zinc-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => approveUser(user.id)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Activate</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
