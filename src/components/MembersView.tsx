import React, { useState, useEffect } from 'react';
import { useGym } from '../context/GymContext';
import { User, CenterType, Role } from '../types';
import {
  Search,
  Filter,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Dumbbell,
  Apple,
  Activity,
  Trophy,
  ChevronRight,
  X,
  CreditCard,
} from 'lucide-react';

export const MembersView: React.FC = () => {
  const { users, selectedCenter, addUser, theme, t, currentUser } = useGym();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'member' | 'trainer' | 'admin'>('all');
  const [centerFilter, setCenterFilter] = useState<CenterType | 'all'>(
    selectedCenter === 'All' ? 'all' : selectedCenter
  );

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Synchronize centerFilter whenever selectedCenter changes in context
  useEffect(() => {
    setCenterFilter(selectedCenter === 'All' ? 'all' : selectedCenter);
  }, [selectedCenter]);

  // New member form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'member' as Role,
    center: 'Ranaghat' as CenterType,
    profile_image: '',
  });

  const filtered = users.filter(u => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesCenter = centerFilter === 'all' || u.center === centerFilter;

    return matchesSearch && matchesRole && matchesCenter;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) return;

    addUser({
      ...formData,
      profile_image: formData.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    });

    setShowAddModal(false);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role: 'member',
      center: 'Ranaghat',
      profile_image: '',
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Members & Trainers Roster</h2>
          <p className="text-xs text-zinc-400">
            Directory across Ranaghat, Chakdah, and Madanpur centers ({filtered.length} total)
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition-all active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Member</span>
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-3 ${
        theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone number..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-rose-500 ${
              theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none ${
              theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
            }`}
          >
            <option value="all">All Roles</option>
            <option value="member">Members</option>
            <option value="trainer">Trainers</option>
            <option value="admin">Admins</option>
          </select>

          {/* Center Filter */}
          <select
            value={centerFilter}
            onChange={e => setCenterFilter(e.target.value as any)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none ${
              theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
            }`}
          >
            <option value="all">All Centers</option>
            <option value="Ranaghat">Ranaghat</option>
            <option value="Chakdah">Chakdah</option>
            <option value="Madanpur">Madanpur</option>
          </select>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(user => (
          <div
            key={user.id}
            onClick={() => setSelectedUser(user)}
            className={`p-4 rounded-3xl border transition-all cursor-pointer hover:border-rose-500/50 hover:shadow-xl group relative ${
              theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <img
                src={user.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'}
                alt={user.full_name}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-zinc-800 shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                    {user.full_name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    user.role === 'admin'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : user.role === 'trainer'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {user.role}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  <span>{user.center} Center</span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-1">
                  <Phone className="w-3 h-3 text-zinc-500" />
                  <span className="truncate">{user.phone}</span>
                </div>
              </div>
            </div>

            {/* Membership badge or trainer details */}
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
              {user.membership ? (
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate max-w-[130px] font-medium">{user.membership.plan_name}</span>
                </div>
              ) : (
                <span className="text-zinc-500 text-[10px]">Staff / Management</span>
              )}

              <span className="text-rose-500 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                View <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Member Details Drawer Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-800 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={selectedUser.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'}
                  alt={selectedUser.full_name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-rose-500 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{selectedUser.full_name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 uppercase">
                      {selectedUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    {selectedUser.center} Center • Joined {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Tabs / Info */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-400 font-semibold mb-1">Email Address</div>
                  <div className="font-bold text-white truncate">{selectedUser.email}</div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-400 font-semibold mb-1">Phone Number</div>
                  <div className="font-bold text-white">{selectedUser.phone}</div>
                </div>
              </div>

              {selectedUser.membership && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/30 to-red-950/20 border border-rose-800/40 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-rose-400 uppercase tracking-wider">Membership Plan</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      {selectedUser.membership.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm font-black text-white">{selectedUser.membership.plan_name}</div>
                  <div className="text-xs text-zinc-400 flex justify-between">
                    <span>Valid from: {selectedUser.membership.start_date}</span>
                    <span>Expires: {selectedUser.membership.end_date}</span>
                  </div>
                </div>
              )}

              {selectedUser.achievements && selectedUser.achievements.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Achievements & Milestones
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.achievements.map((ach, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold"
                      >
                        ⚡ {ach}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white">Add New Gym Member</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Debojyoti Paul"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@gmail.com"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98300 12345"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="trainer">Trainer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Center</label>
                  <select
                    value={formData.center}
                    onChange={e => setFormData({ ...formData, center: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  >
                    <option value="Ranaghat">Ranaghat</option>
                    <option value="Chakdah">Chakdah</option>
                    <option value="Madanpur">Madanpur</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold shadow-lg shadow-rose-900/30"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
