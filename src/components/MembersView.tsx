import React, { useState, useEffect, useRef } from 'react';
import { useGym } from '../context/GymContext';
import {
  User,
  CenterType,
  Role,
  AdmissionType,
  ProfessionType,
  EnrollmentProgramme,
  EnrollmentCategory,
} from '../types';
import {
  Search,
  Filter,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Dumbbell,
  Activity,
  Trophy,
  ChevronRight,
  X,
  CreditCard,
  Trash2,
  DollarSign,
  AlertTriangle,
  Receipt,
  Clock,
  Send,
  UserCheck,
  Award,
  FileText,
  Briefcase,
  HeartPulse,
  Scale,
  Ruler,
  Hash,
  UploadCloud,
  Check,
  Edit3,
  Sparkles,
  Tag,
} from 'lucide-react';

export const MembersView: React.FC = () => {
  const {
    users,
    selectedCenter,
    addUser,
    updateUserProfile,
    deleteUser,
    refundMember,
    offers,
    toggleUserActiveStatus,
    executeReAdmission,
    theme,
    t,
    currentUser,
  } = useGym();

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'all' | 'name' | 'id' | 'phone'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'member' | 'trainer' | 'admin'>('all');
  const [centerFilter, setCenterFilter] = useState<CenterType | 'all'>(
    selectedCenter === 'All' ? 'all' : selectedCenter
  );

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  // Edit Member ID State inside details drawer
  const [isEditingId, setIsEditingId] = useState(false);
  const [customIdInput, setCustomIdInput] = useState('');

  // Dedicated Edit Full Member Profile State
  const [editingMemberUser, setEditingMemberUser] = useState<User | null>(null);
  const [editMemberForm, setEditMemberForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    profession: 'Student' as ProfessionType,
    guardian_name: '',
    guardian_phone: '',
    present_address: '',
    permanent_address: '',
    body_weight: '',
    body_height: '',
    health_problems: 'None',
    profile_image: '',
    member_id: '',
    enrollment_programme: 'Gym' as EnrollmentProgramme,
    enrollment_category: 'Ladies & Gents' as EnrollmentCategory,
    center: 'Ranaghat' as CenterType,
  });
  const [editMemberSuccessMsg, setEditMemberSuccessMsg] = useState<string | null>(null);
  const editMemberImageInputRef = useRef<HTMLInputElement | null>(null);

  const openEditMemberModal = (u: User) => {
    setEditingMemberUser(u);
    setEditMemberSuccessMsg(null);
    setEditMemberForm({
      full_name: u.full_name || '',
      phone: u.phone || '',
      email: u.email || '',
      date_of_birth: u.date_of_birth || '',
      profession: (u.profession || 'Student') as ProfessionType,
      guardian_name: u.guardian_name || '',
      guardian_phone: u.guardian_phone || '',
      present_address: u.present_address || '',
      permanent_address: u.permanent_address || '',
      body_weight: u.body_weight ? String(u.body_weight) : '',
      body_height: u.body_height ? String(u.body_height) : '',
      health_problems: u.health_problems || 'None',
      profile_image: u.profile_image || '',
      member_id: u.member_id ? String(u.member_id) : u.id,
      enrollment_programme: (u.enrollment_programme || (u.membership?.plan_name?.includes('Karate') ? 'Karate' : 'Gym')) as EnrollmentProgramme,
      enrollment_category: (u.enrollment_category || 'Ladies & Gents') as EnrollmentCategory,
      center: u.center || 'Ranaghat',
    });
  };

  const handleEditMemberImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setEditMemberForm(prev => ({
          ...prev,
          profile_image: ev.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemberUser) return;

    const canEditRestricted =
      currentUser?.role === 'admin' ||
      (currentUser?.role === 'trainer' && currentUser?.center === editingMemberUser.center);

    const updatedData: Partial<User> = {
      full_name: editMemberForm.full_name,
      phone: editMemberForm.phone,
      email: editMemberForm.email,
      date_of_birth: editMemberForm.date_of_birth,
      profession: editMemberForm.profession,
      guardian_name: editMemberForm.guardian_name,
      guardian_phone: editMemberForm.guardian_phone,
      present_address: editMemberForm.present_address,
      permanent_address: editMemberForm.permanent_address,
      body_weight: editMemberForm.body_weight ? Number(editMemberForm.body_weight) : undefined,
      body_height: editMemberForm.body_height,
      health_problems: editMemberForm.health_problems,
      profile_image: editMemberForm.profile_image,
    };

    if (canEditRestricted) {
      updatedData.member_id = editMemberForm.member_id;
      updatedData.enrollment_programme = editMemberForm.enrollment_programme;
      updatedData.enrollment_category = editMemberForm.enrollment_category;
      if (currentUser?.role === 'admin') {
        updatedData.center = editMemberForm.center;
      }
    }

    updateUserProfile(editingMemberUser.id, updatedData);

    if (selectedUser && selectedUser.id === editingMemberUser.id) {
      setSelectedUser({
        ...selectedUser,
        ...updatedData,
      });
    }

    setEditMemberSuccessMsg('Profile updated successfully!');
    setTimeout(() => {
      setEditingMemberUser(null);
      setEditMemberSuccessMsg(null);
    }, 900);
  };

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundTargetUser, setRefundTargetUser] = useState<User | null>(null);
  const [refundPercent, setRefundPercent] = useState<number>(100);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('Member voluntary discontinuation / relocation');
  const [refundDays, setRefundDays] = useState<number>(3);
  const [alsoDeleteProfile, setAlsoDeleteProfile] = useState<boolean>(false);
  const [refundSuccessNotice, setRefundSuccessNotice] = useState<string | null>(null);

  // Member Admission Form State (Form-Type Design)
  const [memberForm, setMemberForm] = useState({
    target_user_id: '' as string | undefined,
    admission_type: 'New Admission' as AdmissionType,
    member_id: `HG-RAN-${Math.floor(100 + Math.random() * 900)}`,
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    guardian_name: '',
    guardian_phone: '',
    profession: 'Student' as ProfessionType,
    present_address: '',
    permanent_address: '',
    sameAsPresentAddress: true,
    body_weight: '' as string | number,
    body_height: '',
    health_problems: 'None',
    enrollment_programme: 'Gym' as EnrollmentProgramme,
    enrollment_category: 'Ladies & Gents' as EnrollmentCategory,
    center: 'Ranaghat' as CenterType,
    plan_duration: 'monthly' as 'monthly' | 'quarterly' | 'semi_annual' | 'annual',
    fee_paid: 1900,
    profile_image: '',
  });

  // Trainer Form State
  const [trainerForm, setTrainerForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    center: 'Ranaghat' as CenterType,
    specialties: 'Strength & Conditioning, Powerlifting',
    certifications: 'Certified Fitness Trainer',
    experience: '3+ Years',
    profile_image: '',
  });

  const memberImageInputRef = useRef<HTMLInputElement | null>(null);
  const trainerImageInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize centerFilter whenever selectedCenter changes in context
  useEffect(() => {
    setCenterFilter(selectedCenter === 'All' ? 'all' : selectedCenter);
  }, [selectedCenter]);

  const isUserAdmin = currentUser?.role === 'admin';

  // Smart Search & Filtering Logic
  const filtered = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesCenter = centerFilter === 'all' || u.center === centerFilter;
      return matchesRole && matchesCenter;
    }

    const assignedId = (u.member_id || u.id || '').toLowerCase();
    const name = (u.full_name || '').toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    const email = (u.email || '').toLowerCase();

    let matchesQuery = false;
    if (searchMode === 'id') {
      matchesQuery = assignedId.includes(q);
    } else if (searchMode === 'name') {
      matchesQuery = name.includes(q);
    } else if (searchMode === 'phone') {
      matchesQuery = phone.includes(q);
    } else {
      // 'all'
      matchesQuery =
        assignedId.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q);
    }

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesCenter = centerFilter === 'all' || u.center === centerFilter;

    return matchesQuery && matchesRole && matchesCenter;
  });

  const openAddMemberModal = () => {
    const centerPrefix = selectedCenter !== 'All' ? selectedCenter.slice(0, 3).toUpperCase() : 'RAN';
    setSelectedOfferId(null);
    setMemberForm({
      target_user_id: undefined,
      admission_type: 'New Admission',
      member_id: `HG-${centerPrefix}-${Math.floor(100 + Math.random() * 900)}`,
      full_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      guardian_name: '',
      guardian_phone: '',
      profession: 'Student',
      present_address: '',
      permanent_address: '',
      sameAsPresentAddress: true,
      body_weight: '',
      body_height: '',
      health_problems: 'None',
      enrollment_programme: 'Gym',
      enrollment_category: 'Ladies & Gents',
      center: selectedCenter !== 'All' ? selectedCenter : 'Ranaghat',
      plan_duration: 'monthly',
      fee_paid: 1900,
      profile_image: '',
    });
    setShowAddMemberModal(true);
  };

  const openReAdmissionModal = (user: User) => {
    setSelectedOfferId(null);
    setMemberForm({
      target_user_id: user.id,
      admission_type: 'Re-admission',
      member_id: user.member_id || user.id,
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      date_of_birth: user.date_of_birth || '',
      guardian_name: user.guardian_name || '',
      guardian_phone: user.guardian_phone || '',
      profession: (user.profession as ProfessionType) || 'Student',
      present_address: user.present_address || '',
      permanent_address: user.permanent_address || '',
      sameAsPresentAddress: true,
      body_weight: user.body_weight || '',
      body_height: user.body_height ? String(user.body_height) : '',
      health_problems: user.health_problems || 'None',
      enrollment_programme: (user.enrollment_programme as EnrollmentProgramme) || 'Gym',
      enrollment_category: (user.enrollment_category as EnrollmentCategory) || 'Ladies & Gents',
      center: user.center,
      plan_duration: user.membership?.plan_duration || 'monthly',
      fee_paid: 1900,
      profile_image: user.profile_image || '',
    });
    setSelectedUser(null);
    setShowAddMemberModal(true);
  };

  const openAddTrainerModal = () => {
    setTrainerForm({
      full_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      center: selectedCenter !== 'All' ? selectedCenter : 'Ranaghat',
      specialties: 'Strength Training, HIIT, Weight Management',
      certifications: 'Certified Master Trainer (CPT)',
      experience: '4+ Years',
      profile_image: '',
    });
    setShowAddTrainerModal(true);
  };

  const handleMemberImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMemberForm(prev => ({ ...prev, profile_image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTrainerImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTrainerForm(prev => ({ ...prev, profile_image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.full_name || !memberForm.phone) return;

    const permanentAddr = memberForm.sameAsPresentAddress
      ? memberForm.present_address
      : memberForm.permanent_address;

    const durationDays =
      memberForm.plan_duration === 'annual'
        ? 365
        : memberForm.plan_duration === 'semi_annual'
        ? 180
        : memberForm.plan_duration === 'quarterly'
        ? 90
        : 30;

    const chosenOffer = selectedOfferId ? offers.find(o => o.id === selectedOfferId) : null;
    const planName = chosenOffer
      ? `[Festive Offer] ${chosenOffer.title} (${memberForm.enrollment_programme})`
      : `${memberForm.enrollment_programme} Membership (${memberForm.enrollment_category})`;

    // If re-admission for an existing user
    if (memberForm.target_user_id) {
      executeReAdmission(memberForm.target_user_id, {
        plan_duration: memberForm.plan_duration,
        fee_paid: Number(memberForm.fee_paid) || 1900,
        plan_name: planName,
        enrollment_programme: memberForm.enrollment_programme,
        enrollment_category: memberForm.enrollment_category,
        full_name: memberForm.full_name.trim(),
        email: memberForm.email.trim() || `${memberForm.phone}@herculesgym.in`,
        phone: memberForm.phone.trim(),
        profession: memberForm.profession,
        guardian_name: memberForm.guardian_name.trim() || undefined,
        guardian_phone: memberForm.guardian_phone.trim() || undefined,
        present_address: memberForm.present_address.trim() || undefined,
        permanent_address: permanentAddr?.trim() || undefined,
        body_weight: memberForm.body_weight ? Number(memberForm.body_weight) : undefined,
        body_height: memberForm.body_height ? String(memberForm.body_height) : undefined,
        health_problems: memberForm.health_problems.trim() || 'None',
        admission_type: 'Re-admission',
        is_active: true,
        days_overdue: 0,
      });

      setShowAddMemberModal(false);
      return;
    }

    // New member registration
    addUser({
      member_id: memberForm.member_id.trim(),
      full_name: memberForm.full_name.trim(),
      email: memberForm.email.trim() || `${memberForm.phone}@herculesgym.in`,
      phone: memberForm.phone.trim(),
      role: 'member',
      center: memberForm.center,
      date_of_birth: memberForm.date_of_birth || undefined,
      admission_type: memberForm.admission_type,
      guardian_name: memberForm.guardian_name.trim() || undefined,
      guardian_phone: memberForm.guardian_phone.trim() || undefined,
      profession: memberForm.profession,
      present_address: memberForm.present_address.trim() || undefined,
      permanent_address: permanentAddr?.trim() || undefined,
      body_weight: memberForm.body_weight ? Number(memberForm.body_weight) : undefined,
      body_height: memberForm.body_height ? String(memberForm.body_height) : undefined,
      health_problems: memberForm.health_problems.trim() || 'None',
      enrollment_programme: memberForm.enrollment_programme,
      enrollment_category: memberForm.enrollment_category,
      is_active: true,
      days_overdue: 0,
      profile_image:
        memberForm.profile_image ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      membership: {
        plan_name: planName,
        plan_duration: memberForm.plan_duration,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'active',
        fee_paid: Number(memberForm.fee_paid) || 1900,
        due_amount: 0,
      },
    });

    setShowAddMemberModal(false);
  };

  const handleTrainerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerForm.full_name || !trainerForm.phone) return;

    const centerPrefix = trainerForm.center ? trainerForm.center.slice(0, 3).toUpperCase() : 'RAN';
    const trainerId = `TR-${centerPrefix}-${Math.floor(100 + Math.random() * 900)}`;

    addUser({
      member_id: trainerId,
      full_name: trainerForm.full_name.trim(),
      email: trainerForm.email.trim() || `${trainerForm.phone}@herculesgym.in`,
      phone: trainerForm.phone.trim(),
      role: 'trainer',
      center: trainerForm.center,
      date_of_birth: trainerForm.date_of_birth || undefined,
      trainer_specialties: trainerForm.specialties
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      trainer_certifications: trainerForm.certifications.trim(),
      trainer_experience: trainerForm.experience.trim(),
      profile_image:
        trainerForm.profile_image ||
        'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&auto=format&fit=crop&q=80',
    });

    setShowAddTrainerModal(false);
  };

  const handleOpenRefundModal = (user: User) => {
    setRefundTargetUser(user);
    const originalFee = user.membership?.fee_paid || (user.membership?.status === 'active' ? 1900 : 700);
    setRefundPercent(100);
    setRefundAmount(originalFee);
    setRefundReason('Member voluntary withdrawal / gym discontinuation request');
    setRefundDays(3);
    setAlsoDeleteProfile(false);
    setShowRefundModal(true);
  };

  const handlePercentChange = (pct: number) => {
    setRefundPercent(pct);
    if (!refundTargetUser) return;
    const originalFee = refundTargetUser.membership?.fee_paid || 1900;
    setRefundAmount(Math.round((originalFee * pct) / 100));
  };

  const handleProcessRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetUser) return;

    const originalFee = refundTargetUser.membership?.fee_paid || refundAmount || 1900;

    const refundRec = refundMember({
      user_id: refundTargetUser.id,
      user_name: refundTargetUser.full_name,
      amount: refundAmount,
      total_original_fee: originalFee,
      percentage: refundPercent,
      reason: refundReason.trim(),
      days_to_refund: refundDays,
      processed_by: currentUser?.full_name || 'Admin',
    });

    if (alsoDeleteProfile) {
      deleteUser(refundTargetUser.id);
    }

    setRefundSuccessNotice(
      `Official refund of ₹${refundAmount.toLocaleString()} (${refundPercent}%) issued to ${refundTargetUser.full_name}. Notification dispatched for reimbursement within ${refundDays} business days (Ref: ${refundRec.id}).`
    );

    setShowRefundModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUserDirect = (user: User) => {
    if (confirm(`Are you sure you want to permanently delete the profile for ${user.full_name} from the gym roster?`)) {
      deleteUser(user.id);
      setSelectedUser(null);
    }
  };

  const handleSaveCustomId = (user: User) => {
    if (!customIdInput.trim()) return;
    updateUserProfile(user.id, { member_id: customIdInput.trim() });
    setSelectedUser(prev => (prev ? { ...prev, member_id: customIdInput.trim() } : null));
    setIsEditingId(false);
  };

  return (
    <div className="w-full space-y-6 pb-20 md:pb-8">
      {/* Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Members & Trainers Roster</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Comprehensive member registry across Ranaghat, Chakdah, and Madanpur branches ({filtered.length} total)
          </p>
        </div>

        {isUserAdmin && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Separate Tab/Button for Add Trainer */}
            <button
              onClick={openAddTrainerModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition-all active:scale-95 shrink-0"
            >
              <UserCheck className="w-4 h-4" />
              <span>Add New Trainer</span>
            </button>

            {/* Add Member Button with Redesigned Admission Form */}
            <button
              onClick={openAddMemberModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition-all active:scale-95 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Banner */}
      {refundSuccessNotice && (
        <div className="p-4 rounded-3xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold">Refund Processed & Member Notified</div>
              <div className="text-[11px] text-zinc-300">{refundSuccessNotice}</div>
            </div>
          </div>
          <button
            onClick={() => setRefundSuccessNotice(null)}
            className="text-xs font-bold text-emerald-400 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search by ID, Name, Phone & Filter Toolbar */}
      <div
        className={`p-4 rounded-2xl border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 ${
          theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        {/* Search Mode Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 shrink-0">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Search:
          </span>
          {(
            [
              { id: 'all', label: 'All Fields' },
              { id: 'name', label: 'By Name' },
              { id: 'id', label: 'By Member ID' },
              { id: 'phone', label: 'By Phone' },
            ] as const
          ).map(m => (
            <button
              key={m.id}
              onClick={() => setSearchMode(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                searchMode === m.id
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              searchMode === 'id'
                ? 'Enter Member ID (e.g. HG-RAN-101)...'
                : searchMode === 'name'
                ? 'Enter full name...'
                : searchMode === 'phone'
                ? 'Enter phone number...'
                : 'Search by Member ID, Name, Phone, Email...'
            }
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-rose-500 ${
              theme === 'dark'
                ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
                : 'bg-zinc-50 border-zinc-300 text-zinc-900'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className={`px-3 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none ${
              theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
            }`}
          >
            <option value="all">All Roles</option>
            <option value="member">Members</option>
            <option value="trainer">Trainers</option>
            <option value="admin">Admins</option>
          </select>

          {isUserAdmin ? (
            <select
              value={centerFilter}
              onChange={e => setCenterFilter(e.target.value as any)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none ${
                theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
              }`}
            >
              <option value="all">All Centers</option>
              <option value="Ranaghat">Ranaghat</option>
              <option value="Chakdah">Chakdah</option>
              <option value="Madanpur">Madanpur</option>
            </select>
          ) : (
            <div className={`px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
              theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
            }`}>
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{currentUser?.center || 'Ranaghat'} Branch</span>
            </div>
          )}
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(user => {
          const displayId = user.member_id || `HG-${user.center.slice(0, 3).toUpperCase()}-${user.id.slice(0, 4).toUpperCase()}`;
          const isUserInactive = user.is_active === false || (user.days_overdue !== undefined && user.days_overdue > 60);

          return (
            <div
              key={user.id}
              onClick={() => {
                setSelectedUser(user);
                setCustomIdInput(user.member_id || displayId);
                setIsEditingId(false);
              }}
              className={`p-4 rounded-3xl border transition-all cursor-pointer hover:border-rose-500/50 hover:shadow-xl group relative flex flex-col justify-between ${
                isUserInactive
                  ? 'bg-gradient-to-b from-rose-950/20 to-zinc-900 border-red-900/50 opacity-90'
                  : theme === 'dark'
                  ? 'bg-zinc-900/60 border-zinc-800/80'
                  : 'bg-white border-zinc-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.full_name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-zinc-800 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-950/60 to-zinc-900 border border-zinc-700/60 text-rose-400 flex items-center justify-center font-black text-base shrink-0">
                        {user.full_name?.charAt(0)?.toUpperCase() || 'M'}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${
                        isUserInactive ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      title={isUserInactive ? 'Inactive' : 'Active'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                        {user.full_name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                          user.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : user.role === 'trainer'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>

                    {/* Member ID Tag and Active/Inactive Pill */}
                    <div className="flex items-center flex-wrap gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] font-mono font-black text-rose-400 tracking-wider">
                        ID: {displayId}
                      </span>
                      {user.admission_type && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-800 text-zinc-300">
                          {user.admission_type === 'New Admission' ? 'New' : 'Re-adm'}
                        </span>
                      )}
                      {isUserInactive ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-950/80 text-rose-400 border border-rose-800/80">
                          {user.days_overdue && user.days_overdue > 60 ? 'INACTIVE (2+ Mos Overdue)' : 'INACTIVE'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-1">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{user.center} Center</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                      <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="truncate">{user.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Details Footer */}
              <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                {user.refund_record ? (
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Refunded (₹{user.refund_record.amount})</span>
                  </div>
                ) : user.role === 'trainer' ? (
                  <div className="flex items-center gap-1 text-blue-400 font-medium">
                    <Award className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[130px]">Trainer Staff</span>
                  </div>
                ) : user.membership ? (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate max-w-[130px] font-medium">
                      {user.enrollment_programme || user.membership.plan_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-zinc-500 text-[10px]">Gym Member</span>
                )}

                <span className="text-rose-500 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  View <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Member Details Drawer Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 md:p-8 flex justify-center items-start sm:items-center">
          <div className="w-full max-w-3xl my-auto rounded-3xl border border-zinc-800 bg-zinc-900 text-white shadow-2xl overflow-hidden max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col">
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {selectedUser.profile_image ? (
                    <img
                      src={selectedUser.profile_image}
                      alt={selectedUser.full_name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-rose-500 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-950/70 to-zinc-900 border border-rose-500/50 text-rose-400 flex items-center justify-center font-black text-xl shrink-0">
                      {selectedUser.full_name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${
                      selectedUser.is_active === false || (selectedUser.days_overdue && selectedUser.days_overdue > 60)
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="text-lg font-black text-white">{selectedUser.full_name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 uppercase">
                      {selectedUser.role}
                    </span>
                    {selectedUser.admission_type && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                        {selectedUser.admission_type}
                      </span>
                    )}
                    {selectedUser.is_active === false || (selectedUser.days_overdue && selectedUser.days_overdue > 60) ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-950 text-rose-400 border border-red-800">
                        INACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-400 border border-emerald-800">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Editable Member ID */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {!isEditingId ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs font-black text-rose-400">
                          ID: {selectedUser.member_id || selectedUser.id}
                        </span>
                        {isUserAdmin && (
                          <button
                            onClick={() => {
                              setCustomIdInput(selectedUser.member_id || selectedUser.id);
                              setIsEditingId(true);
                            }}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                            title="Edit / Reassign Member ID"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={customIdInput}
                          onChange={e => setCustomIdInput(e.target.value)}
                          placeholder="e.g. HG-RAN-101"
                          className="px-2 py-1 rounded bg-zinc-950 border border-rose-500 font-mono text-xs font-bold text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveCustomId(selectedUser)}
                          className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                          title="Save ID"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setIsEditingId(false)}
                          className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <span className="text-xs text-zinc-400">• {selectedUser.center} Center</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditMemberModal(selectedUser)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit Profile</span>
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Inactivity & Re-Admission Admin Action Card */}
              {isUserAdmin && (selectedUser.is_active === false || (selectedUser.days_overdue && selectedUser.days_overdue > 60)) && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/60 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Member Inactive Alert (Fees Overdue 2+ Months / Deactivated)</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    This account is marked inactive. As an Admin, you have two direct options to restore this member:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        toggleUserActiveStatus(selectedUser.id, true);
                        setSelectedUser({ ...selectedUser, is_active: true, days_overdue: 0 });
                      }}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Option 1: Activate Profile Once Again</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openReAdmissionModal(selectedUser)}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Option 2: Execute Re-admission</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Personal & Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-400 font-semibold mb-1">Phone Number</div>
                  <div className="font-bold text-white">{selectedUser.phone}</div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-400 font-semibold mb-1">Email Address</div>
                  <div className="font-bold text-white truncate">{selectedUser.email}</div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-400 font-semibold mb-1">Profession</div>
                  <div className="font-bold text-white">{selectedUser.profession || 'Not Specified'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-400 font-semibold mb-1">Date of Birth</div>
                  <div className="font-bold text-white">{selectedUser.date_of_birth || 'Not Specified'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-400 font-semibold mb-1">Guardian Name</div>
                  <div className="font-bold text-white">{selectedUser.guardian_name || 'N/A'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-400 font-semibold mb-1">Guardian Phone</div>
                  <div className="font-bold text-white">{selectedUser.guardian_phone || 'N/A'}</div>
                </div>
              </div>

              {/* Physical Assessment & Health */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-rose-500" />
                    <span>Body Weight</span>
                  </div>
                  <div className="font-bold text-white">
                    {selectedUser.body_weight ? `${selectedUser.body_weight} kg` : 'Not recorded'}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                    <Ruler className="w-3.5 h-3.5 text-rose-500" />
                    <span>Body Height</span>
                  </div>
                  <div className="font-bold text-white">{selectedUser.body_height || 'Not recorded'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Health Problems</span>
                  </div>
                  <div className="font-bold text-white truncate">{selectedUser.health_problems || 'None'}</div>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-400 font-semibold mb-1">Present Address</div>
                  <div className="text-zinc-200">{selectedUser.present_address || 'Not Provided'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-400 font-semibold mb-1">Permanent Address</div>
                  <div className="text-zinc-200">{selectedUser.permanent_address || 'Same as Present'}</div>
                </div>
              </div>

              {/* Enrollment & Membership Details */}
              {selectedUser.role === 'member' && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/30 to-red-950/20 border border-rose-800/40 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-rose-400 uppercase tracking-wider">
                      Programme: {selectedUser.enrollment_programme || 'Gym'} (
                      {selectedUser.enrollment_category || 'Ladies & Gents'})
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      {selectedUser.membership?.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="text-sm font-black text-white">
                    {selectedUser.membership?.plan_name || 'Standard Gym Plan'}
                  </div>
                  {selectedUser.membership && (
                    <div className="text-xs text-zinc-400 flex justify-between">
                      <span>Valid: {selectedUser.membership.start_date}</span>
                      <span>Expires: {selectedUser.membership.end_date}</span>
                    </div>
                  )}
                  {selectedUser.membership?.fee_paid && (
                    <div className="text-xs text-zinc-300 pt-1 border-t border-rose-900/40 flex justify-between">
                      <span>Fee Paid:</span>
                      <span className="font-bold text-white">₹{selectedUser.membership.fee_paid.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Trainer Specific Info */}
              {selectedUser.role === 'trainer' && (
                <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 space-y-2 text-xs">
                  <div className="font-bold text-blue-400 uppercase tracking-wider">Trainer Credentials</div>
                  <div>
                    <span className="text-zinc-400 font-semibold">Specialties: </span>
                    <span className="text-white font-medium">
                      {selectedUser.trainer_specialties?.join(', ') || 'Strength & Conditioning, Functional Fitness'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-semibold">Certifications: </span>
                    <span className="text-white font-medium">
                      {selectedUser.trainer_certifications || 'Certified Gym Instructor'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-semibold">Experience: </span>
                    <span className="text-white font-medium">{selectedUser.trainer_experience || '3+ Years'}</span>
                  </div>
                </div>
              )}

              {/* Refund Notice if previously discharged */}
              {selectedUser.refund_record && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/50 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-amber-400 font-black uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Receipt className="w-4 h-4" />
                      Discharge & Refund Record
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                      {selectedUser.refund_record.percentage}% REFUND
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    ₹{selectedUser.refund_record.amount.toLocaleString()} refunded within{' '}
                    {selectedUser.refund_record.days_to_refund} business days.
                  </div>
                  <div className="text-zinc-300 text-[11px]">
                    <strong>Reason:</strong> {selectedUser.refund_record.reason}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {(isUserAdmin || (currentUser?.role === 'trainer' && currentUser?.center === selectedUser.center)) && selectedUser.role !== 'admin' && (
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Roster & Lifecycle Controls
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditMemberModal(selectedUser)}
                      className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>

                    {isUserAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus = !selectedUser.is_active;
                          toggleUserActiveStatus(selectedUser.id, nextStatus);
                          setSelectedUser({ ...selectedUser, is_active: nextStatus });
                        }}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                          selectedUser.is_active === false
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                        }`}
                      >
                        {selectedUser.is_active === false ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Activate</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-zinc-400" />
                            <span>Deactivate</span>
                          </>
                        )}
                      </button>
                    )}

                    {isUserAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenRefundModal(selectedUser)}
                        className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Issue Refund</span>
                      </button>
                    )}

                    {isUserAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUserDirect(selectedUser)}
                        className="py-2.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/60 font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Add New Member Admission Form Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 md:p-8 flex justify-center items-start sm:items-center">
          <div
            className={`w-full max-w-2xl my-auto rounded-3xl border shadow-2xl overflow-hidden max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Gym Member Admission Form</h3>
                  <p className="text-xs text-zinc-400">Official student and member registration</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMemberSubmit} className="p-5 sm:p-6 space-y-5 text-xs overflow-y-auto flex-1">
              {/* Section 1: Admission & Identity */}
              <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-3">
                <div className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  <span>1. Admission & Identity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Admission Type */}
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Admission Type *</label>
                    <select
                      value={memberForm.admission_type}
                      onChange={e =>
                        setMemberForm({ ...memberForm, admission_type: e.target.value as AdmissionType })
                      }
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="New Admission">New Admission</option>
                      <option value="Re-admission">Re-admission</option>
                    </select>
                  </div>

                  {/* Member ID (Admin Assigned) */}
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">
                      Member ID (Admin Assigned) *
                    </label>
                    <input
                      type="text"
                      required
                      value={memberForm.member_id}
                      onChange={e => setMemberForm({ ...memberForm, member_id: e.target.value })}
                      placeholder="e.g. HG-RAN-101"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-rose-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* Branch / Center */}
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Center / Branch *</label>
                    <select
                      value={memberForm.center}
                      onChange={e => setMemberForm({ ...memberForm, center: e.target.value as CenterType })}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Ranaghat">Ranaghat</option>
                      <option value="Chakdah">Chakdah</option>
                      <option value="Madanpur">Madanpur</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Personal & Contact Details */}
              <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-3">
                <div className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>2. Personal & Contact Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={memberForm.full_name}
                      onChange={e => setMemberForm({ ...memberForm, full_name: e.target.value })}
                      placeholder="e.g. Debojyoti Paul"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={memberForm.phone}
                      onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })}
                      placeholder="+91 98300 12345"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      value={memberForm.email}
                      onChange={e => setMemberForm({ ...memberForm, email: e.target.value })}
                      placeholder="name@gmail.com"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Profession *</label>
                    <select
                      value={memberForm.profession}
                      onChange={e =>
                        setMemberForm({ ...memberForm, profession: e.target.value as ProfessionType })
                      }
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Business">Business</option>
                      <option value="Service">Service</option>
                      <option value="Student">Student</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={memberForm.date_of_birth}
                      onChange={e => setMemberForm({ ...memberForm, date_of_birth: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Upload Photo</label>
                    <input
                      ref={memberImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleMemberImageFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => memberImageInputRef.current?.click()}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-dashed border-zinc-700 text-zinc-300 hover:text-white hover:border-rose-500 flex items-center justify-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4 text-rose-500" />
                      <span>{memberForm.profile_image ? 'Photo Attached ✓' : 'Select from Device'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Guardian Details */}
              <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-3">
                <div className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>3. Guardian Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Guardian Name</label>
                    <input
                      type="text"
                      value={memberForm.guardian_name}
                      onChange={e => setMemberForm({ ...memberForm, guardian_name: e.target.value })}
                      placeholder="e.g. Subrata Paul"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Guardian Mobile No</label>
                    <input
                      type="tel"
                      value={memberForm.guardian_phone}
                      onChange={e => setMemberForm({ ...memberForm, guardian_phone: e.target.value })}
                      placeholder="+91 98300 54321"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Address Details */}
              <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-3">
                <div className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>4. Address Information</span>
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Present Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={memberForm.present_address}
                    onChange={e => setMemberForm({ ...memberForm, present_address: e.target.value })}
                    placeholder="e.g. 12/A Station Road, Ward No. 5, Ranaghat, Nadia - 741201"
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="sameAddr"
                    checked={memberForm.sameAsPresentAddress}
                    onChange={e =>
                      setMemberForm({ ...memberForm, sameAsPresentAddress: e.target.checked })
                    }
                    className="accent-rose-600 rounded"
                  />
                  <label htmlFor="sameAddr" className="text-zinc-300 font-medium cursor-pointer">
                    Permanent Address is same as Present Address
                  </label>
                </div>

                {!memberForm.sameAsPresentAddress && (
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Permanent Address</label>
                    <textarea
                      rows={2}
                      value={memberForm.permanent_address}
                      onChange={e => setMemberForm({ ...memberForm, permanent_address: e.target.value })}
                      placeholder="Permanent residence address"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}
              </div>

              {/* Section 5: Body Measurement & Health Problem */}
              <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-3">
                <div className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>5. Body Measurement & Health Status</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Body Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={memberForm.body_weight}
                      onChange={e => setMemberForm({ ...memberForm, body_weight: e.target.value })}
                      placeholder="e.g. 72.5"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Body Height (cm / ft-in)</label>
                    <input
                      type="text"
                      value={memberForm.body_height}
                      onChange={e => setMemberForm({ ...memberForm, body_height: e.target.value })}
                      placeholder="e.g. 175 cm or 5'9''"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Health Problems / History</label>
                    <input
                      type="text"
                      value={memberForm.health_problems}
                      onChange={e => setMemberForm({ ...memberForm, health_problems: e.target.value })}
                      placeholder="e.g. None, Asthma, High BP"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Enrollment Programme & Category */}
              <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-3">
                <div className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>6. Enrollment Programme & Category</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Enrollment Programme *</label>
                    <select
                      value={memberForm.enrollment_programme}
                      onChange={e =>
                        setMemberForm({
                          ...memberForm,
                          enrollment_programme: e.target.value as EnrollmentProgramme,
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Gym">Gym</option>
                      <option value="Karate">Karate</option>
                      <option value="Yoga">Yoga</option>
                      <option value="Crossfit">Crossfit</option>
                      <option value="Kidsfit">Kidsfit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Enrollment Category *</label>
                    <select
                      value={memberForm.enrollment_category}
                      onChange={e =>
                        setMemberForm({
                          ...memberForm,
                          enrollment_category: e.target.value as EnrollmentCategory,
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Ladies & Gents">Ladies & Gents</option>
                      <option value="Ladies">Ladies</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Membership Plan Duration *</label>
                    <select
                      value={memberForm.plan_duration}
                      onChange={e => {
                        const newDur = e.target.value as any;
                        const defaultPrices: Record<string, number> = {
                          monthly: 700,
                          quarterly: 1800,
                          semi_annual: 3400,
                          annual: 6000,
                        };
                        const admissionFee = memberForm.admission_type === 'New Admission' ? 1200 : 0;
                        setSelectedOfferId(null);
                        setMemberForm({
                          ...memberForm,
                          plan_duration: newDur,
                          fee_paid: (defaultPrices[newDur] || 700) + admissionFee,
                        });
                      }}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="monthly">Monthly (1 Month)</option>
                      <option value="quarterly">Quarterly (3 Months)</option>
                      <option value="semi_annual">Half-Yearly (6 Months)</option>
                      <option value="annual">Annual (12 Months)</option>
                    </select>
                  </div>
                </div>

                {/* Festive & Occasion Offers Box */}
                {(() => {
                  const applicableOffers = offers.filter(
                    o =>
                      o.is_active &&
                      (o.center === 'All' || o.applicable_center === 'All' || o.center === memberForm.center || o.applicable_center === memberForm.center) &&
                      (o.applicable_to === 'all' ||
                        !o.applicable_to ||
                        (memberForm.admission_type === 'New Admission' &&
                          (o.applicable_to === 'new_admission' || o.admission_type_applicable === 'New Admission')) ||
                        (memberForm.admission_type === 'Re-admission' &&
                          (o.applicable_to === 're_admission' || o.admission_type_applicable === 'Re-admission')))
                  );

                  if (applicableOffers.length === 0) return null;

                  return (
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-950/40 via-purple-950/20 to-zinc-950 border border-amber-500/40 space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Special Festive & Occasion Offers Available</span>
                        </div>
                        {selectedOfferId && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOfferId(null);
                              setMemberForm({ ...memberForm, fee_paid: 1900 });
                            }}
                            className="text-[10px] text-zinc-400 hover:text-white underline font-medium"
                          >
                            Reset to Standard Plan
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {applicableOffers.map(offer => {
                          const isSelected = selectedOfferId === offer.id;
                          const offerPrice = offer.offer_price ?? offer.price;
                          const offerPlanDuration = offer.plan_duration ?? (offer.duration_months === 12 ? 'annual' : offer.duration_months === 6 ? 'semi_annual' : offer.duration_months === 3 ? 'quarterly' : 'monthly');
                          const occasionText = offer.occasion_tag || offer.occasion_name || offer.occasion || 'Festive Deal';
                          const discountText = offer.discount_percentage ? `${offer.discount_percentage}% OFF` : offer.discount_badge || 'Special Price';

                          return (
                            <div
                              key={offer.id}
                              onClick={() => {
                                setSelectedOfferId(offer.id);
                                setMemberForm({
                                  ...memberForm,
                                  plan_duration: offerPlanDuration,
                                  fee_paid: offerPrice,
                                });
                              }}
                              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-900/40'
                                  : 'bg-zinc-900/80 border-zinc-800 hover:border-amber-500/50'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">
                                    {occasionText}
                                  </span>
                                  <h4 className="text-xs font-black text-white">{offer.title}</h4>
                                </div>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500 text-white shrink-0">
                                  {discountText}
                                </span>
                              </div>

                              <p className="text-[10px] text-zinc-300 mt-1 line-clamp-1">{offer.description}</p>

                              <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-xs font-black text-amber-300">₹{offerPrice}</span>
                                  {offer.original_price && (
                                    <span className="text-[9px] text-zinc-500 line-through">₹{offer.original_price}</span>
                                  )}
                                </div>
                                <span className={`text-[10px] font-bold ${isSelected ? 'text-amber-300' : 'text-zinc-400'}`}>
                                  {isSelected ? '✓ Applied' : 'Tap to Apply'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-2">
                  <label className="block text-zinc-400 font-bold mb-1">
                    Fee Paid (₹) {selectedOfferId ? <span className="text-amber-400 font-normal">(Offer Applied)</span> : ''}
                  </label>
                  <input
                    type="number"
                    value={memberForm.fee_paid}
                    onChange={e => setMemberForm({ ...memberForm, fee_paid: Number(e.target.value) })}
                    className="w-full sm:w-1/2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black shadow-lg shadow-rose-900/30 transition-all active:scale-95"
                >
                  Complete Admission & Register Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Add New Trainer Modal */}
      {showAddTrainerModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 md:p-8 flex justify-center items-start sm:items-center">
          <div
            className={`w-full max-w-lg my-auto rounded-3xl border shadow-2xl overflow-hidden max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Add New Trainer</h3>
                  <p className="text-xs text-zinc-400">Onboard gym fitness coach & instructor</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTrainerModal(false)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTrainerSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Trainer Full Name *</label>
                <input
                  type="text"
                  required
                  value={trainerForm.full_name}
                  onChange={e => setTrainerForm({ ...trainerForm, full_name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={trainerForm.phone}
                    onChange={e => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                    placeholder="+91 98300 77777"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Center / Branch *</label>
                  <select
                    value={trainerForm.center}
                    onChange={e => setTrainerForm({ ...trainerForm, center: e.target.value as CenterType })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  >
                    <option value="Ranaghat">Ranaghat</option>
                    <option value="Chakdah">Chakdah</option>
                    <option value="Madanpur">Madanpur</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  value={trainerForm.email}
                  onChange={e => setTrainerForm({ ...trainerForm, email: e.target.value })}
                  placeholder="trainer@herculesgym.in"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Specialties (comma separated)</label>
                <input
                  type="text"
                  value={trainerForm.specialties}
                  onChange={e => setTrainerForm({ ...trainerForm, specialties: e.target.value })}
                  placeholder="e.g. Strength Training, Powerlifting, HIIT, Karate"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Certifications</label>
                  <input
                    type="text"
                    value={trainerForm.certifications}
                    onChange={e => setTrainerForm({ ...trainerForm, certifications: e.target.value })}
                    placeholder="e.g. ACE / K11 / National"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Experience</label>
                  <input
                    type="text"
                    value={trainerForm.experience}
                    onChange={e => setTrainerForm({ ...trainerForm, experience: e.target.value })}
                    placeholder="e.g. 5+ Years"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Profile Photo</label>
                <input
                  ref={trainerImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleTrainerImageFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => trainerImageInputRef.current?.click()}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-dashed border-zinc-800 text-zinc-300 hover:text-white hover:border-blue-500 flex items-center justify-center gap-2"
                >
                  <UploadCloud className="w-4 h-4 text-blue-500" />
                  <span>{trainerForm.profile_image ? 'Photo Attached ✓' : 'Upload Trainer Photo'}</span>
                </button>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black shadow-lg shadow-blue-900/30 transition-all active:scale-95"
                >
                  Onboard Trainer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Refund & Discontinuation Modal */}
      {showRefundModal && refundTargetUser && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 md:p-8 flex justify-center items-start sm:items-center">
          <div
            className={`w-full max-w-lg my-auto rounded-3xl border shadow-2xl overflow-hidden max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black">Process Member Refund & Departure</h3>
              </div>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessRefundSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white text-sm">{refundTargetUser.full_name}</div>
                  <div className="text-zinc-400">
                    {refundTargetUser.center} Center • {refundTargetUser.phone}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-400">Total Fee Paid</div>
                  <div className="font-bold text-white">
                    ₹{(refundTargetUser.membership?.fee_paid || 1900).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-zinc-300 font-bold">
                  Select Refund Ratio <span className="text-amber-400">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 75, 50, 25].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handlePercentChange(pct)}
                      className={`p-2 rounded-xl border font-bold text-xs transition-all text-center ${
                        refundPercent === pct
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {pct === 100 ? 'Full (100%)' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">
                  Total Amount to be Refunded (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={refundAmount}
                  onChange={e => {
                    const amt = Number(e.target.value);
                    setRefundAmount(amt);
                    const originalFee = refundTargetUser.membership?.fee_paid || 1900;
                    setRefundPercent(Math.min(100, Math.round((amt / originalFee) * 100)));
                  }}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-black text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">
                  Reason for Refund / Discontinuation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="e.g. Relocating to another district, medical reasons, or voluntary departure"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Disbursement Window (Days) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <input
                      type="number"
                      min={1}
                      max={30}
                      required
                      value={refundDays}
                      onChange={e => setRefundDays(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold focus:outline-none"
                    />
                    <span className="text-zinc-400 shrink-0 font-medium">Days</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer pt-4">
                    <input
                      type="checkbox"
                      checked={alsoDeleteProfile}
                      onChange={e => setAlsoDeleteProfile(e.target.checked)}
                      className="accent-rose-600 rounded"
                    />
                    <span className="text-zinc-300 font-medium">Permanently delete user profile from roster</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black shadow-xl shadow-amber-900/30 transition-all"
                >
                  Issue Refund & Notify Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Profile Modal (RBAC Enforced) */}
      {editingMemberUser && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 md:p-8 flex justify-center items-start sm:items-center">
          <div
            className={`w-full max-w-2xl my-auto rounded-3xl border shadow-2xl overflow-hidden max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Edit Member Profile</h3>
                  <p className="text-xs text-zinc-400">Update member information & enrollment parameters</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMemberUser(null)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editMemberSuccessMsg && (
              <div className="p-3 bg-emerald-950/80 border-b border-emerald-800/80 text-emerald-300 font-bold text-xs text-center">
                {editMemberSuccessMsg}
              </div>
            )}

            <form onSubmit={handleEditMemberSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Profile Photo & Basic Identity */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                <div className="relative shrink-0">
                  {editMemberForm.profile_image ? (
                    <img
                      src={editMemberForm.profile_image}
                      alt={editMemberForm.full_name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-rose-500"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-lg text-zinc-400">
                      {editMemberForm.full_name?.charAt(0) || 'M'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={editMemberImageInputRef}
                    accept="image/*"
                    onChange={handleEditMemberImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editMemberImageInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-2"
                  >
                    <UploadCloud className="w-4 h-4 text-rose-400" />
                    <span>Change Profile Photo</span>
                  </button>
                  <p className="text-[10px] text-zinc-500 mt-1">Accepts JPG, PNG up to 5MB</p>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">Personal Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editMemberForm.full_name}
                      onChange={e => setEditMemberForm({ ...editMemberForm, full_name: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={editMemberForm.phone}
                      onChange={e => setEditMemberForm({ ...editMemberForm, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editMemberForm.email}
                      onChange={e => setEditMemberForm({ ...editMemberForm, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={editMemberForm.date_of_birth}
                      onChange={e => setEditMemberForm({ ...editMemberForm, date_of_birth: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Profession</label>
                    <select
                      value={editMemberForm.profession}
                      onChange={e => setEditMemberForm({ ...editMemberForm, profession: e.target.value as ProfessionType })}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                    >
                      <option value="Student">Student</option>
                      <option value="Employed">Employed / Service</option>
                      <option value="Business">Business</option>
                      <option value="Homemaker">Homemaker</option>
                      <option value="Professional">Professional</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Health Problems / Notes</label>
                    <input
                      type="text"
                      value={editMemberForm.health_problems}
                      onChange={e => setEditMemberForm({ ...editMemberForm, health_problems: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Parameters */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">Physical Parameters</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Body Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editMemberForm.body_weight}
                      onChange={e => setEditMemberForm({ ...editMemberForm, body_weight: e.target.value })}
                      placeholder="e.g. 72"
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Body Height</label>
                    <input
                      type="text"
                      value={editMemberForm.body_height}
                      onChange={e => setEditMemberForm({ ...editMemberForm, body_height: e.target.value })}
                      placeholder="e.g. 5 ft 10 in"
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Guardian & Address */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">Guardian & Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Guardian Name</label>
                    <input
                      type="text"
                      value={editMemberForm.guardian_name}
                      onChange={e => setEditMemberForm({ ...editMemberForm, guardian_name: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Guardian Phone</label>
                    <input
                      type="tel"
                      value={editMemberForm.guardian_phone}
                      onChange={e => setEditMemberForm({ ...editMemberForm, guardian_phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Present Address</label>
                  <input
                    type="text"
                    value={editMemberForm.present_address}
                    onChange={e => setEditMemberForm({ ...editMemberForm, present_address: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Restricted Fields: Member ID, Programme, Batch Category, Center (RBAC Enforced) */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Gym Membership & Admin Parameters</span>
                  </h4>
                  {!(currentUser?.role === 'admin' || (currentUser?.role === 'trainer' && currentUser?.center === editingMemberUser.center)) && (
                    <span className="text-[10px] text-zinc-500 italic">Editable only by Admin or Branch Trainer</span>
                  )}
                </div>

                {currentUser?.role === 'admin' || (currentUser?.role === 'trainer' && currentUser?.center === editingMemberUser.center) ? (
                  <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-amber-400 font-bold mb-1">Member ID</label>
                      <input
                        type="text"
                        value={editMemberForm.member_id}
                        onChange={e => setEditMemberForm({ ...editMemberForm, member_id: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-zinc-950 border border-amber-500/50 text-amber-300 font-mono font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-amber-400 font-bold mb-1">Enrollment Programme</label>
                      <select
                        value={editMemberForm.enrollment_programme}
                        onChange={e => setEditMemberForm({ ...editMemberForm, enrollment_programme: e.target.value as EnrollmentProgramme })}
                        className="w-full p-2.5 rounded-xl bg-zinc-950 border border-amber-500/50 text-white font-bold focus:outline-none"
                      >
                        <option value="Gym">Gym (Fitness & Weight Training)</option>
                        <option value="Karate">Karate (Martial Arts)</option>
                        <option value="Gym + Karate">Gym + Karate Combo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-amber-400 font-bold mb-1">Batch Category</label>
                      <select
                        value={editMemberForm.enrollment_category}
                        onChange={e => setEditMemberForm({ ...editMemberForm, enrollment_category: e.target.value as EnrollmentCategory })}
                        className="w-full p-2.5 rounded-xl bg-zinc-950 border border-amber-500/50 text-white font-bold focus:outline-none"
                      >
                        <option value="Ladies & Gents">Ladies & Gents (Unisex)</option>
                        <option value="Only Ladies">Only Ladies Special Batch</option>
                      </select>
                    </div>

                    {currentUser?.role === 'admin' ? (
                      <div>
                        <label className="block text-amber-400 font-bold mb-1">Assigned Center</label>
                        <select
                          value={editMemberForm.center}
                          onChange={e => setEditMemberForm({ ...editMemberForm, center: e.target.value as CenterType })}
                          className="w-full p-2.5 rounded-xl bg-zinc-950 border border-amber-500/50 text-white font-bold focus:outline-none"
                        >
                          <option value="Ranaghat">Ranaghat</option>
                          <option value="Chakdah">Chakdah</option>
                          <option value="Madanpur">Madanpur</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-zinc-400 font-bold mb-1">Branch Center</label>
                        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-bold">
                          {editMemberForm.center} Center
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500 font-semibold block">Member ID:</span>
                      <span className="font-mono font-bold text-zinc-300">{editMemberForm.member_id}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-semibold block">Programme:</span>
                      <span className="font-bold text-zinc-300">{editMemberForm.enrollment_programme}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-semibold block">Batch:</span>
                      <span className="font-bold text-zinc-300">{editMemberForm.enrollment_category}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 flex gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingMemberUser(null)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black shadow-lg shadow-rose-900/30 transition-all active:scale-95"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
