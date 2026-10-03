import React, { useState, useEffect } from 'react';
import { useGym, getBranchCode, getProgrammeCode } from '../context/GymContext';
import {
  User,
  CenterType,
  AdmissionType,
  ProfessionType,
  EnrollmentProgramme,
  EnrollmentCategory,
  RevenueCategory,
} from '../types';
import {
  Search,
  UserPlus,
  UserCheck,
  CreditCard,
  Building2,
  X,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface LocalGymPlan {
  id: string;
  name: string;
  price: number;
  duration: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  features: string[];
}

export const MembersView: React.FC = () => {
  const {
    users,
    currentUser,
    deleteUser,
    updateUserProfile,
    refundMember,
    selectedCenter,
    adminRegisterPayment,
    calculateMemberDue,
    getCenterTheme,
    getNextMemberId,
    incrementMemberCounter,
  } = useGym();

  const centerTheme = getCenterTheme(selectedCenter);
  const isUserAdmin = currentUser?.role === 'admin';

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'member' | 'trainer'>('all');
  const [centerFilter, setCenterFilter] = useState<'all' | CenterType>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Success Notice for Refund / Payment
  const [refundSuccessNotice, setRefundSuccessNotice] = useState<string | null>(null);
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<string | null>(null);

  // 1 & 2. Full Page Add Member Multi-Slide Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberFormSlide, setMemberFormSlide] = useState<1 | 2>(1);

  // Form State for Add Member
  const [memberForm, setMemberForm] = useState({
    admission_type: 'New Admission' as AdmissionType,
    full_name: '',
    member_id: '',
    phone: '',
    email: '',
    center: (selectedCenter === 'All' ? 'Ranaghat' : selectedCenter) as CenterType,
    date_of_birth: '',
    profession: 'Student' as ProfessionType,
    guardian_name: '',
    guardian_phone: '',
    present_address: '',
    permanent_address: '',
    body_weight: '70',
    body_height: "5'8''",
    health_problems: '',
    enrollment_category: 'Ladies & Gents' as EnrollmentCategory,
    enrollment_programme: 'Gym' as EnrollmentProgramme,
    batch_shift: 'General Batch (Morning/Evening)',
    profile_image: '',
    selected_plan_name: 'Quarterly Pro Tier',
    selected_plan_duration: 'quarterly' as 'monthly' | 'quarterly' | 'semi_annual' | 'annual',
    fee_paid: 1900,
  });

  const [admissionPaymentMode, setAdmissionPaymentMode] = useState<'online' | 'offline'>('offline');
  const [admissionNote, setAdmissionNote] = useState('');

  // 1. Full Page Add Trainer Modal State
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [trainerForm, setTrainerForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    center: (selectedCenter === 'All' ? 'Ranaghat' : selectedCenter) as CenterType,
    specialties: 'Strength & Conditioning, Powerlifting',
    certifications: 'Certified Fitness Coach',
    experience: '3+ Years',
  });

  // 6 & 7. Admin Register Payment Modal State (for member cards)
  const [showAdminPaymentModal, setShowAdminPaymentModal] = useState(false);
  const [paymentTargetUser, setPaymentTargetUser] = useState<User | null>(null);
  const [paymentFormCategory, setPaymentFormCategory] = useState<RevenueCategory>('gym_fees');
  const [paymentFormMode, setPaymentFormMode] = useState<'online' | 'offline'>('online');
  const [paymentFormAmount, setPaymentFormAmount] = useState<number>(1900);
  const [paymentFormReason, setPaymentFormReason] = useState<string>('Quarterly gym fees payment');
  const [paymentFormNote, setPaymentFormNote] = useState<string>('');

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundTargetUser, setRefundTargetUser] = useState<User | null>(null);
  const [refundPercent, setRefundPercent] = useState<number>(100);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [refundDays, setRefundDays] = useState(7);
  const [alsoDeleteProfile, setAlsoDeleteProfile] = useState(false);

  // Four Official Gym Membership Plans for Slide 2
  const OFFICIAL_GYM_PLANS: LocalGymPlan[] = [
    {
      id: 'plan-1',
      name: 'Monthly Standard',
      price: 700,
      duration: 'monthly',
      features: ['Full gym access', 'Locker access', 'Trainer guidance', 'Cardio & Strength equipment'],
    },
    {
      id: 'plan-2',
      name: 'Quarterly Pro Tier',
      price: 1900,
      duration: 'quarterly',
      features: ['Full multi-branch gym access', 'Free customized diet chart', 'Locker & steam bath', 'Priority trainer support'],
    },
    {
      id: 'plan-3',
      name: 'Half-Yearly Elite',
      price: 3500,
      duration: 'semi_annual',
      features: ['Multi-branch access across 3 centers', 'Personalized hypertrophy roadmap', 'Supplement discount card', 'Dedicated locker'],
    },
    {
      id: 'plan-4',
      name: 'Annual Champion Pass',
      price: 6500,
      duration: 'annual',
      features: ['365 Days unlimited all-center access', 'VIP coach induction', 'Complimentary official jersey', '2 Guest passes / month'],
    },
  ];

  // Auto set member ID when center or enrollment programme changes
  useEffect(() => {
    if (showAddMemberModal && memberForm.admission_type === 'New Admission') {
      const nextId = getNextMemberId(memberForm.center, memberForm.enrollment_programme);
      setMemberForm((prev) => ({
        ...prev,
        member_id: nextId,
      }));
    }
  }, [memberForm.center, memberForm.enrollment_programme, showAddMemberModal, getNextMemberId]);

  // Filter roster by search, role, and branch
  const filtered = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.member_id && u.member_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesCenter =
      centerFilter === 'all'
        ? selectedCenter === 'All' || u.center === selectedCenter
        : u.center === centerFilter;

    return matchesSearch && matchesRole && matchesCenter;
  });

  // Open Admin Payment Modal
  const openAdminPaymentModal = (user: User, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPaymentTargetUser(user);

    const due = calculateMemberDue(user);
    const initialAmount = due.totalDue > 0 ? due.totalDue : 1900;

    setPaymentFormCategory('gym_fees');
    setPaymentFormMode('online');
    setPaymentFormAmount(initialAmount);
    setPaymentFormReason(`Term fees for ${user.full_name} (${user.membership?.plan_name || 'Gym Plan'})`);
    setPaymentFormNote('Front-desk clearance');
    setShowAdminPaymentModal(true);
  };

  const handleAdminPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetUser) return;

    adminRegisterPayment({
      userId: paymentTargetUser.id,
      category: paymentFormCategory,
      paymentMode: paymentFormMode,
      moneyPaid: paymentFormAmount,
      reason: paymentFormReason || 'Payment recorded',
      note: paymentFormNote,
    });

    setPaymentSuccessNotice(
      `Payment of ₹${paymentFormAmount.toLocaleString()} successfully registered for ${paymentTargetUser.full_name}. Member is now ACTIVE.`
    );

    setShowAdminPaymentModal(false);
    setPaymentTargetUser(null);
  };

  // Open Full-Page Add Member Modal
  const openAddMemberModal = () => {
    const defaultCenter = (selectedCenter === 'All' ? 'Ranaghat' : selectedCenter) as CenterType;
    const defaultProgramme: EnrollmentProgramme = 'Gym';
    const initialId = getNextMemberId(defaultCenter, defaultProgramme);

    setMemberForm({
      admission_type: 'New Admission',
      full_name: '',
      member_id: initialId,
      phone: '',
      email: '',
      center: defaultCenter,
      date_of_birth: '',
      profession: 'Student',
      guardian_name: '',
      guardian_phone: '',
      present_address: '',
      permanent_address: '',
      body_weight: '70',
      body_height: "5'8''",
      health_problems: '',
      enrollment_category: 'Ladies & Gents',
      enrollment_programme: defaultProgramme,
      batch_shift: 'General Batch (Morning/Evening)',
      profile_image: '',
      selected_plan_name: 'Quarterly Pro Tier',
      selected_plan_duration: 'quarterly',
      fee_paid: 1900,
    });
    setMemberFormSlide(1);
    setShowAddMemberModal(true);
  };

  // Open Re-admission Modal
  const openReAdmissionModal = (user: User) => {
    setMemberForm({
      admission_type: 'Re-admission',
      full_name: user.full_name,
      member_id: user.member_id || user.id,
      phone: user.phone || '',
      email: user.email || '',
      center: user.center,
      date_of_birth: user.date_of_birth || '',
      profession: (user.profession as any) || 'Student',
      guardian_name: user.guardian_name || '',
      guardian_phone: user.guardian_phone || '',
      present_address: user.present_address || '',
      permanent_address: user.permanent_address || '',
      body_weight: String(user.body_weight || '70'),
      body_height: String(user.body_height || "5'8''"),
      health_problems: user.health_problems || '',
      enrollment_category: (user.enrollment_category as any) || 'Ladies & Gents',
      enrollment_programme: (user.enrollment_programme as any) || 'Gym',
      batch_shift: 'General Batch (Morning/Evening)',
      profile_image: user.profile_image || '',
      selected_plan_name: user.membership?.plan_name || 'Quarterly Pro Tier',
      selected_plan_duration: (user.membership?.plan_duration as any) || 'quarterly',
      fee_paid: 1900,
    });
    setMemberFormSlide(1);
    setShowAddMemberModal(true);
  };

  // Complete Admission Flow from Slide 2
  const handleCompleteAdmission = () => {
    if (!memberForm.full_name || !memberForm.phone) {
      alert('Full name and contact number are required.');
      return;
    }

    const newUserId = `usr-${Date.now()}`;
    const todayStr = new Date().toISOString().slice(0, 10);

    const newUser: User = {
      id: newUserId,
      member_id: memberForm.member_id,
      full_name: memberForm.full_name,
      email: memberForm.email || `${memberForm.full_name.toLowerCase().replace(/\s+/g, '')}@herculesgym.in`,
      phone: memberForm.phone,
      role: 'member',
      center: memberForm.center,
      admission_type: memberForm.admission_type,
      profession: memberForm.profession,
      guardian_name: memberForm.guardian_name,
      guardian_phone: memberForm.guardian_phone,
      present_address: memberForm.present_address,
      permanent_address: memberForm.permanent_address,
      body_weight: Number(memberForm.body_weight) || 70,
      body_height: memberForm.body_height,
      health_problems: memberForm.health_problems,
      enrollment_category: memberForm.enrollment_category,
      enrollment_programme: memberForm.enrollment_programme,
      profile_image: memberForm.profile_image,
      approval_status: 'approved',
      is_active: true,
      created_at: todayStr,
      membership: {
        plan_name: memberForm.selected_plan_name,
        plan_duration: memberForm.selected_plan_duration,
        start_date: todayStr,
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'active',
        fee_paid: memberForm.fee_paid,
        due_amount: 0,
      },
    };

    updateUserProfile(newUserId, newUser);

    // Increment auto counter for this category & branch
    if (memberForm.admission_type === 'New Admission') {
      incrementMemberCounter(memberForm.center, memberForm.enrollment_programme);
    }

    adminRegisterPayment({
      userId: newUserId,
      category: 'gym_fees',
      paymentMode: admissionPaymentMode,
      moneyPaid: memberForm.fee_paid,
      reason: `Admission Fee & ${memberForm.selected_plan_name}`,
      note: admissionNote || 'Initial Admission at branch',
    });

    setPaymentSuccessNotice(
      `Member ${memberForm.full_name} (${memberForm.member_id}) registered and activated successfully with ${memberForm.selected_plan_name}.`
    );

    setShowAddMemberModal(false);
  };

  // Open Full-Page Add Trainer Modal
  const openAddTrainerModal = () => {
    setTrainerForm({
      full_name: '',
      phone: '',
      email: '',
      center: (selectedCenter === 'All' ? 'Ranaghat' : selectedCenter) as CenterType,
      specialties: 'Strength & Conditioning, Powerlifting',
      certifications: 'Certified Fitness Coach',
      experience: '3+ Years',
    });
    setShowAddTrainerModal(true);
  };

  const handleTrainerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerForm.full_name || !trainerForm.phone) {
      alert('Trainer name and phone are required.');
      return;
    }

    const trainerId = `TR-${trainerForm.center.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newTrainer: User = {
      id: `usr-${Date.now()}`,
      member_id: trainerId,
      full_name: trainerForm.full_name,
      email: trainerForm.email || `${trainerForm.full_name.toLowerCase().replace(/\s+/g, '')}@herculesgym.in`,
      phone: trainerForm.phone,
      role: 'trainer',
      center: trainerForm.center,
      approval_status: 'approved',
      is_active: true,
      trainer_specialties: trainerForm.specialties.split(',').map((s: string) => s.trim()),
      trainer_certifications: trainerForm.certifications,
      trainer_experience: trainerForm.experience,
      created_at: new Date().toISOString().slice(0, 10),
    };

    updateUserProfile(newTrainer.id, newTrainer);
    setPaymentSuccessNotice(`Trainer ${trainerForm.full_name} registered successfully.`);
    setShowAddTrainerModal(false);
  };

  // Refund Flow Handlers
  const handleOpenRefundModal = (user: User) => {
    setRefundTargetUser(user);
    const fee = user.membership?.fee_paid || 1900;
    setRefundPercent(100);
    setRefundAmount(fee);
    setRefundReason('Relocation / Medical condition');
    setRefundDays(7);
    setAlsoDeleteProfile(false);
    setShowRefundModal(true);
  };

  const handlePercentChange = (pct: number) => {
    setRefundPercent(pct);
    const originalFee = refundTargetUser?.membership?.fee_paid || 1900;
    setRefundAmount(Math.round((originalFee * pct) / 100));
  };

  const handleProcessRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetUser) return;
    const originalFee = refundTargetUser.membership?.fee_paid || 1900;

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

  return (
    <div className="w-full space-y-6 pb-20 md:pb-8">
      {/* Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Members & Trainers Roster</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Registry across Ranaghat, Chakdah, and Madanpur branches ({filtered.length} total active / registered)
          </p>
        </div>

        {isUserAdmin && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Add Trainer Button */}
            <button
              onClick={openAddTrainerModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/[0.06] text-zinc-200 text-xs font-semibold transition-all active:scale-95 shrink-0"
            >
              <UserCheck className="w-4 h-4" />
              <span>Add Trainer</span>
            </button>

            {/* Add Member Button */}
            <button
              onClick={openAddMemberModal}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r ${centerTheme.gradient} text-white font-semibold text-xs shadow-lg shadow-black/30 hover:opacity-95 transition-all active:scale-95 shrink-0`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notice Banners */}
      {refundSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{refundSuccessNotice}</span>
          </div>
          <button onClick={() => setRefundSuccessNotice(null)} className="text-zinc-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {paymentSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{paymentSuccessNotice}</span>
          </div>
          <button onClick={() => setPaymentSuccessNotice(null)} className="text-zinc-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Smart Search & Filter Toolbar (Shadcn-styled glass surface) */}
      <div className="p-3.5 rounded-3xl bg-zinc-900/25 backdrop-blur-2xl border border-white/[0.04] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roster by name, member ID, phone, or email..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-zinc-900/40 border border-white/[0.04] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Filter */}
          <div className="flex items-center bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-1 text-xs">
            {(['all', 'member', 'trainer'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-xl font-medium capitalize transition-all ${
                  roleFilter === r ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {r === 'all' ? 'All Roles' : `${r}s`}
              </button>
            ))}
          </div>

          {/* Center Filter */}
          <div className="flex items-center bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-1 text-xs">
            {(['all', 'Ranaghat', 'Chakdah', 'Madanpur'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCenterFilter(c)}
                className={`px-3 py-1 rounded-xl font-medium transition-all ${
                  centerFilter === c ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {c === 'all' ? 'All Centers' : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roster Cards Grid (Shadcn-styled responsive glass cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((user) => {
          const dueInfo = calculateMemberDue(user);
          const isMember = user.role === 'member';

          return (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="group p-5 rounded-3xl bg-zinc-900/20 hover:bg-zinc-900/40 backdrop-blur-2xl border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Card Top Row */}
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.full_name}
                        className="w-13 h-13 rounded-2xl object-cover ring-1 ring-white/[0.08] group-hover:ring-rose-500/50 transition-all"
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-2xl bg-zinc-900/80 border border-white/[0.06] text-rose-400 flex items-center justify-center font-bold text-base">
                        {user.full_name?.charAt(0)?.toUpperCase() || 'M'}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-900 ${
                        user.is_active && !dueInfo.isExpired ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-sm font-bold text-white truncate font-['Outfit']">{user.full_name}</h3>
                      <span className="text-[10px] font-medium uppercase text-zinc-400">
                        {user.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                      <span className="font-mono text-[11px] text-zinc-300">
                        {user.member_id || user.id}
                      </span>
                      <span>·</span>
                      <span>{user.center}</span>
                      <span>·</span>
                      {user.is_active && !dueInfo.isExpired ? (
                        <span className="text-emerald-400 font-medium text-[11px]">Active</span>
                      ) : (
                        <span className="text-rose-400 font-medium text-[11px]">Due</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fine & Due Money Notification on Member Card */}
                {isMember && dueInfo.isExpired && (
                  <div className="mt-3 p-3 rounded-2xl bg-rose-950/25 border border-rose-800/40 text-xs text-rose-300 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Due: ₹{dueInfo.totalDue.toLocaleString()}</div>
                      <div className="text-[11px] text-zinc-400">
                        Fee ₹{dueInfo.normalFee} {dueInfo.fine > 0 ? `+ ₹${dueInfo.fine} Fine (${dueInfo.daysLate}d)` : ''}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">
                      UNPAID
                    </span>
                  </div>
                )}
              </div>

              {/* Card Bottom Actions: Register Payment Button for Admin */}
              <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between gap-2 text-xs">
                {isUserAdmin && isMember ? (
                  <button
                    onClick={(e) => openAdminPaymentModal(user, e)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Register Payment</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-zinc-400 truncate">
                    {user.membership?.plan_name || 'Gym Roster'}
                  </div>
                )}

                <span className="text-zinc-400 hover:text-white font-medium text-[11px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  View <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 1, 2, 3. FULL-PAGE MULTI-SLIDE ADD NEW MEMBER MODAL */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl p-3 sm:p-6 lg:p-8 flex justify-center items-center overflow-y-auto">
          <div className="w-full max-w-6xl my-auto rounded-3xl border border-white/[0.06] bg-zinc-900/90 text-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col justify-between backdrop-blur-2xl">
            {/* Modal Header Bar with Slide Tabs */}
            <div className="p-5 sm:p-6 border-b border-white/[0.04] flex items-center justify-between shrink-0 bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl bg-gradient-to-r ${centerTheme.gradient} text-white`}>
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
                    {memberForm.admission_type === 'Re-admission' ? 'Member Re-admission & Renewal' : 'New Member Registration'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Comprehensive full-profile gym admission across Ranaghat, Chakdah, and Madanpur
                  </p>
                </div>
              </div>

              {/* Step Navigation Pill */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMemberFormSlide(1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    memberFormSlide === 1 ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  1. Profile Fillup
                </button>
                <button
                  type="button"
                  onClick={() => setMemberFormSlide(2)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    memberFormSlide === 2 ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  2. Fees & Plan Selection
                </button>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Container (Slide 1 vs Slide 2) */}
            <div className="p-6 overflow-y-auto flex-1 text-xs">
              {memberFormSlide === 1 ? (
                /* SLIDE 1: FORM FILLUP (FULL PAGE SPACE UTILIZATION ACROSS 3 STRUCTURED COLUMNS) */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1: Personal & Basic Info */}
                  <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/30 border border-white/[0.04]">
                    <h4 className="font-bold text-sm text-zinc-200 uppercase tracking-wider">
                      Personal & Basic Info
                    </h4>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={memberForm.full_name}
                        onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })}
                        placeholder="e.g. Sourav Mukherjee"
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white focus:border-rose-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={memberForm.phone}
                        onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                        placeholder="e.g. 9876543210"
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white focus:border-rose-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Email Address</label>
                      <input
                        type="email"
                        value={memberForm.email}
                        onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                        placeholder="member@herculesgym.in"
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={memberForm.date_of_birth}
                        onChange={(e) => setMemberForm({ ...memberForm, date_of_birth: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Profession</label>
                      <select
                        value={memberForm.profession}
                        onChange={(e) => setMemberForm({ ...memberForm, profession: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                      >
                        <option value="Student">Student</option>
                        <option value="Service">Service / Professional</option>
                        <option value="Business">Business</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                  </div>

                  {/* Column 2: Guardianship & Address */}
                  <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/30 border border-white/[0.04]">
                    <h4 className="font-bold text-sm text-zinc-200 uppercase tracking-wider">
                      Guardian & Address
                    </h4>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Father / Guardian Name</label>
                      <input
                        type="text"
                        value={memberForm.guardian_name}
                        onChange={(e) => setMemberForm({ ...memberForm, guardian_name: e.target.value })}
                        placeholder="e.g. Subir Mukherjee"
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Guardian Contact Phone</label>
                      <input
                        type="tel"
                        value={memberForm.guardian_phone}
                        onChange={(e) => setMemberForm({ ...memberForm, guardian_phone: e.target.value })}
                        placeholder="Emergency contact"
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Present Address</label>
                      <textarea
                        rows={2}
                        value={memberForm.present_address}
                        onChange={(e) => setMemberForm({ ...memberForm, present_address: e.target.value })}
                        placeholder="House / Street / Town"
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Permanent Address</label>
                      <textarea
                        rows={2}
                        value={memberForm.permanent_address}
                        onChange={(e) => setMemberForm({ ...memberForm, permanent_address: e.target.value })}
                        placeholder="Permanent native address"
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Health Problems / Injuries</label>
                      <input
                        type="text"
                        value={memberForm.health_problems}
                        onChange={(e) => setMemberForm({ ...memberForm, health_problems: e.target.value })}
                        placeholder="e.g. Lower back pain, asthma, none"
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                      />
                    </div>
                  </div>

                  {/* Column 3: Metrics & Enrollment (Assigned Member ID moved here) */}
                  <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/30 border border-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-zinc-200 uppercase tracking-wider">
                        Metrics & Enrollment
                      </h4>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-500/30">
                        {getBranchCode(memberForm.center)} · {getProgrammeCode(memberForm.enrollment_programme)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Center Branch *</label>
                      <select
                        value={memberForm.center}
                        onChange={(e) => {
                          const newCenter = e.target.value as CenterType;
                          const newId = getNextMemberId(newCenter, memberForm.enrollment_programme);
                          setMemberForm({ ...memberForm, center: newCenter, member_id: newId });
                        }}
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white font-bold"
                      >
                        <option value="Ranaghat">Ranaghat Center (RG)</option>
                        <option value="Chakdah">Chakdah Center (CD)</option>
                        <option value="Madanpur">Madanpur Center (MD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">
                        Enrollment Programme (5 Options) *
                      </label>
                      <select
                        value={memberForm.enrollment_programme}
                        onChange={(e) => {
                          const newProg = e.target.value as EnrollmentProgramme;
                          const newId = getNextMemberId(memberForm.center, newProg);
                          setMemberForm({ ...memberForm, enrollment_programme: newProg, member_id: newId });
                        }}
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white font-semibold"
                      >
                        <option value="Gym">GYM - Gym / Bodybuilding & Strength</option>
                        <option value="Karate">KRT - Karate & Self Defense</option>
                        <option value="Yoga">YGA - Yoga & Mobility</option>
                        <option value="Crossfit">CRF - Crossfit & Functional</option>
                        <option value="Kidsfit">KID - Kidsfit (Junior Athlete)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Enrollment Category / Shift</label>
                      <select
                        value={memberForm.enrollment_category}
                        onChange={(e) => setMemberForm({ ...memberForm, enrollment_category: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                      >
                        <option value="Ladies & Gents">Ladies & Gents (General Shift)</option>
                        <option value="Ladies">Ladies Special Hours</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-zinc-300 font-bold">Assigned Member ID (Editable)</label>
                        <span className="text-[10px] text-zinc-400 font-mono">Format: XX-YYY-NNNN</span>
                      </div>
                      <input
                        type="text"
                        value={memberForm.member_id}
                        onChange={(e) => setMemberForm({ ...memberForm, member_id: e.target.value })}
                        placeholder="e.g. RG-GYM-0001"
                        className="w-full p-2.5 rounded-xl bg-zinc-900/80 border border-rose-500/40 font-mono text-rose-300 font-black tracking-wide focus:border-rose-400 focus:ring-1 focus:ring-rose-400/40"
                      />
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Auto-maintained sequential counter for each branch & category.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-400 font-medium mb-1">Weight (kg)</label>
                        <input
                          type="text"
                          value={memberForm.body_weight}
                          onChange={(e) => setMemberForm({ ...memberForm, body_weight: e.target.value })}
                          placeholder="e.g. 72"
                          className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 font-medium mb-1">Height</label>
                        <input
                          type="text"
                          value={memberForm.body_height}
                          onChange={(e) => setMemberForm({ ...memberForm, body_height: e.target.value })}
                          placeholder="e.g. 5'9''"
                          className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-medium mb-1">Profile Photo URL</label>
                      <input
                        type="text"
                        value={memberForm.profile_image}
                        onChange={(e) => setMemberForm({ ...memberForm, profile_image: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* SLIDE 2: FEES & MEMBERSHIP PLAN SELECTION */
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-bold text-white font-['Outfit']">
                      Select Gym Membership Plan
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Standard membership tiers across all 3 center branches
                    </p>
                  </div>

                  {/* 4 Official Plans Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {OFFICIAL_GYM_PLANS.map((plan: LocalGymPlan) => {
                      const isSelected = memberForm.selected_plan_name === plan.name;

                      return (
                        <div
                          key={plan.id}
                          onClick={() => {
                            setMemberForm({
                              ...memberForm,
                              selected_plan_name: plan.name,
                              selected_plan_duration: plan.duration,
                              fee_paid: plan.price,
                            });
                          }}
                          className={`p-5 rounded-3xl cursor-pointer transition-all duration-300 border flex flex-col justify-between ${
                            isSelected
                              ? 'border-emerald-500/60 bg-zinc-900/80 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/40'
                              : 'bg-zinc-900/30 hover:bg-zinc-900/60 border-white/[0.04]'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                {plan.duration}
                              </span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            </div>

                            <div>
                              <h5 className="text-lg font-bold text-white font-['Outfit']">{plan.name}</h5>
                              <div className="text-2xl font-black text-white mt-1">
                                ₹{plan.price.toLocaleString()}
                              </div>
                            </div>

                            <ul className="space-y-1.5 pt-2 border-t border-white/[0.04] text-[11px] text-zinc-300">
                              {plan.features.map((f: string, i: number) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/[0.04]">
                            <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`}>
                              {isSelected ? 'Selected Plan' : 'Select Tier'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment Registration Sub-card */}
                  <div className="p-5 rounded-3xl bg-zinc-900/30 border border-white/[0.04] space-y-4">
                    <h5 className="font-bold text-sm text-white">
                      Initial Admission Payment Record
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Payment Mode */}
                      <div>
                        <label className="block text-zinc-400 font-medium mb-1">Payment Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAdmissionPaymentMode('online')}
                            className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                              admissionPaymentMode === 'online'
                                ? 'bg-zinc-800 text-white shadow-sm'
                                : 'bg-zinc-900/60 text-zinc-400 border border-white/[0.04]'
                            }`}
                          >
                            Online (UPI)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdmissionPaymentMode('offline')}
                            className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                              admissionPaymentMode === 'offline'
                                ? 'bg-zinc-800 text-white shadow-sm'
                                : 'bg-zinc-900/60 text-zinc-400 border border-white/[0.04]'
                            }`}
                          >
                            Offline (Cash)
                          </button>
                        </div>
                      </div>

                      {/* Money Paid */}
                      <div>
                        <label className="block text-zinc-400 font-medium mb-1">Money Paid (₹)</label>
                        <input
                          type="number"
                          value={memberForm.fee_paid}
                          onChange={(e) => setMemberForm({ ...memberForm, fee_paid: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white font-mono font-bold text-base focus:border-rose-500/60"
                        />
                      </div>

                      {/* Admin Note */}
                      <div>
                        <label className="block text-zinc-400 font-medium mb-1">Reference / Note</label>
                        <input
                          type="text"
                          value={admissionNote}
                          onChange={(e) => setAdmissionNote(e.target.value)}
                          placeholder="e.g. Paid at desk, receipt issued"
                          className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 sm:p-6 border-t border-white/[0.04] flex items-center justify-between shrink-0 bg-zinc-900/40">
              {memberFormSlide === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="px-5 py-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 font-medium text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!memberForm.full_name || !memberForm.phone) {
                        alert('Please fill in Member Full Name and Phone Number to continue.');
                        return;
                      }
                      setMemberFormSlide(2);
                    }}
                    className={`px-6 py-2.5 rounded-2xl bg-gradient-to-r ${centerTheme.gradient} text-white font-semibold text-xs shadow-lg transition-all flex items-center gap-2`}
                  >
                    <span>Next: Fees & Membership Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setMemberFormSlide(1)}
                    className="px-5 py-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 font-medium text-xs flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Profile Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteAdmission}
                    className="px-8 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Admission & Activate</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. FULL-PAGE ADD NEW TRAINER MODAL */}
      {showAddTrainerModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl p-3 sm:p-6 lg:p-8 flex justify-center items-center overflow-y-auto">
          <div className="w-full max-w-4xl my-auto rounded-3xl border border-white/[0.06] bg-zinc-900/90 text-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col justify-between backdrop-blur-2xl">
            <div className="p-5 sm:p-6 border-b border-white/[0.04] flex items-center justify-between shrink-0 bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-zinc-800 text-white">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-['Outfit']">Add New Trainer Staff</h3>
                  <p className="text-xs text-zinc-400">
                    Register fitness instructor & assign branch credentials
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddTrainerModal(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTrainerSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Trainer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={trainerForm.full_name}
                    onChange={(e) => setTrainerForm({ ...trainerForm, full_name: e.target.value })}
                    placeholder="e.g. Rahul Sen"
                    className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={trainerForm.phone}
                    onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                    placeholder="e.g. 9830112233"
                    className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={trainerForm.email}
                    onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                    placeholder="trainer@herculesgym.in"
                    className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Assigned Center Branch</label>
                  <select
                    value={trainerForm.center}
                    onChange={(e) => setTrainerForm({ ...trainerForm, center: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white font-bold"
                  >
                    <option value="Ranaghat">Ranaghat Center</option>
                    <option value="Chakdah">Chakdah Center</option>
                    <option value="Madanpur">Madanpur Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Specialties (Comma Separated)</label>
                  <input
                    type="text"
                    value={trainerForm.specialties}
                    onChange={(e) => setTrainerForm({ ...trainerForm, specialties: e.target.value })}
                    placeholder="Strength, Powerlifting, Diet"
                    className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Certifications & Accreditations</label>
                  <input
                    type="text"
                    value={trainerForm.certifications}
                    onChange={(e) => setTrainerForm({ ...trainerForm, certifications: e.target.value })}
                    placeholder="e.g. NSCA-CPT, K11 Certified"
                    className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 font-medium mb-1">Experience Level</label>
                  <input
                    type="text"
                    value={trainerForm.experience}
                    onChange={(e) => setTrainerForm({ ...trainerForm, experience: e.target.value })}
                    placeholder="e.g. 5+ Years in Strength Coaching"
                    className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-zinc-800 text-zinc-300 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-all"
                >
                  Register Trainer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6 & 7. ADMIN PAYMENT REGISTRATION MODAL WITH FINE SPLITTING ENGINE */}
      {showAdminPaymentModal && paymentTargetUser && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-2xl p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.06] bg-zinc-900/90 text-white shadow-2xl p-6 relative space-y-4 backdrop-blur-2xl">
            <button
              onClick={() => setShowAdminPaymentModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white font-['Outfit']">Register & Approve Payment</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Payment receipt gateway for <strong>{paymentTargetUser.full_name}</strong> ({paymentTargetUser.member_id || paymentTargetUser.id})
              </p>
            </div>

            <form onSubmit={handleAdminPaymentSubmit} className="space-y-4 text-xs">
              {/* Category */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1.5">Payment Category *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentFormCategory('gym_fees');
                      const due = calculateMemberDue(paymentTargetUser);
                      setPaymentFormAmount(due.totalDue > 0 ? due.totalDue : 1900);
                      setPaymentFormReason(`Term fees for ${paymentTargetUser.full_name}`);
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                      paymentFormCategory === 'gym_fees'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'bg-zinc-900/60 text-zinc-400 border border-white/[0.04]'
                    }`}
                  >
                    Gym Fees
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentFormCategory('gym_item');
                      setPaymentFormAmount(1200);
                      setPaymentFormReason('Store Merchandise / Supplement Order');
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                      paymentFormCategory === 'gym_item'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'bg-zinc-900/60 text-zinc-400 border border-white/[0.04]'
                    }`}
                  >
                    Gym Item Order
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentFormCategory('others');
                      setPaymentFormAmount(500);
                      setPaymentFormReason('Other Gym Misc Service');
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                      paymentFormCategory === 'others'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'bg-zinc-900/60 text-zinc-400 border border-white/[0.04]'
                    }`}
                  >
                    Others
                  </button>
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1.5">Payment Mode *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentFormMode('online')}
                    className={`p-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      paymentFormMode === 'online'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'bg-zinc-900/60 text-zinc-400 border border-white/[0.04]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Online (UPI / QR)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentFormMode('offline')}
                    className={`p-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      paymentFormMode === 'offline'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'bg-zinc-900/60 text-zinc-400 border border-white/[0.04]'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Offline (Cash at Desk)</span>
                  </button>
                </div>
              </div>

              {/* Money Paid & Live Splitting Engine */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Money Paid (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={paymentFormAmount}
                  onChange={(e) => setPaymentFormAmount(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl bg-zinc-900/60 border border-white/[0.06] text-white font-mono font-bold text-lg focus:border-rose-500/60"
                />
              </div>

              {/* Dynamic Splitting Visual Box for Gym Fees */}
              {paymentFormCategory === 'gym_fees' && (
                <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/[0.04] space-y-2">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Base Standard Fee:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ₹{Math.min(paymentFormAmount, calculateMemberDue(paymentTargetUser).normalFee || 1900).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Late Fine Portion (₹5/day past 7th):</span>
                    <span className="font-mono text-rose-400 font-bold">
                      ₹{Math.max(0, paymentFormAmount - (calculateMemberDue(paymentTargetUser).normalFee || 1900)).toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-white font-bold">
                    <span>Total Money Paid:</span>
                    <span className="font-mono text-sm">₹{Number(paymentFormAmount).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Payment Description / Notes</label>
                <input
                  type="text"
                  value={paymentFormReason}
                  onChange={(e) => setPaymentFormReason(e.target.value)}
                  placeholder="e.g. Quarterly membership payment"
                  className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPaymentModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-zinc-800 text-zinc-300 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95"
                >
                  Approve & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBER DETAILS DRAWER MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl overflow-y-auto p-3 sm:p-6 md:p-8 flex justify-center items-start sm:items-center">
          <div className="w-full max-w-3xl my-auto rounded-3xl border border-white/[0.06] bg-zinc-900/90 text-white shadow-2xl overflow-hidden max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col backdrop-blur-2xl">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-white/[0.04] flex items-start justify-between shrink-0 bg-zinc-900/40">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {selectedUser.profile_image ? (
                    <img
                      src={selectedUser.profile_image}
                      alt={selectedUser.full_name}
                      className="w-16 h-16 rounded-2xl object-cover ring-1 ring-white/[0.1] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/[0.06] text-rose-400 flex items-center justify-center font-bold text-xl shrink-0">
                      {selectedUser.full_name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${
                      selectedUser.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="text-lg font-bold text-white font-['Outfit']">{selectedUser.full_name}</h3>
                    <span className="text-[10px] font-medium uppercase text-zinc-400">
                      {selectedUser.role}
                    </span>
                    {selectedUser.is_active ? (
                      <span className="text-emerald-400 text-[11px] font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="text-rose-400 text-[11px] font-medium">
                        Inactive / Due
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-zinc-400">
                    <span className="font-mono text-zinc-300">
                      ID: {selectedUser.member_id || selectedUser.id}
                    </span>
                    <span>·</span>
                    <span>{selectedUser.center} Center</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/[0.04] space-y-2">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Contact & Basic</span>
                  <p><strong>Phone:</strong> {selectedUser.phone}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>DOB:</strong> {selectedUser.date_of_birth || 'Not recorded'}</p>
                  <p><strong>Guardian:</strong> {selectedUser.guardian_name || 'N/A'} ({selectedUser.guardian_phone || 'N/A'})</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/[0.04] space-y-2">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Enrollment & Health Metrics</span>
                  <p><strong>Member ID:</strong> <span className="font-mono text-rose-300 font-bold">{selectedUser.member_id || selectedUser.id}</span></p>
                  <p><strong>Programme:</strong> {selectedUser.enrollment_programme || 'Gym'} ({selectedUser.enrollment_category || 'Ladies & Gents'})</p>
                  <p><strong>Plan:</strong> {selectedUser.membership?.plan_name || 'None'}</p>
                  <p><strong>Expiry:</strong> {selectedUser.membership?.end_date || 'N/A'}</p>
                  <p><strong>Health Notes:</strong> {selectedUser.health_problems || 'None'}</p>
                  <p><strong>Weight / Height:</strong> {selectedUser.body_weight || 'N/A'} kg / {selectedUser.body_height || 'N/A'}</p>
                </div>
              </div>

              {/* Action Buttons inside Drawer */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                {isUserAdmin && selectedUser.role === 'member' && (
                  <button
                    onClick={() => {
                      const u = selectedUser;
                      setSelectedUser(null);
                      openAdminPaymentModal(u);
                    }}
                    className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Register Payment</span>
                  </button>
                )}

                {isUserAdmin && selectedUser.role === 'member' && (
                  <button
                    onClick={() => openReAdmissionModal(selectedUser)}
                    className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs"
                  >
                    Re-admission
                  </button>
                )}

                {isUserAdmin && selectedUser.role === 'member' && (
                  <button
                    onClick={() => handleOpenRefundModal(selectedUser)}
                    className="px-4 py-2 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300 font-medium text-xs"
                  >
                    Discharge & Refund
                  </button>
                )}

                {isUserAdmin && (
                  <button
                    onClick={() => handleDeleteUserDirect(selectedUser)}
                    className="px-4 py-2 rounded-2xl bg-zinc-800/60 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 font-medium text-xs ml-auto"
                  >
                    Delete User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {showRefundModal && refundTargetUser && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-2xl p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.06] bg-zinc-900/90 text-white shadow-2xl p-6 relative space-y-4 backdrop-blur-2xl">
            <button
              onClick={() => setShowRefundModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">Discharge & Refund Member</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Issue reimbursement receipt for <strong>{refundTargetUser.full_name}</strong>
              </p>
            </div>

            <form onSubmit={handleProcessRefundSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Refund Percentage</label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handlePercentChange(pct)}
                      className={`p-2 rounded-xl font-bold ${
                        refundPercent === pct ? 'bg-amber-500 text-black' : 'bg-zinc-900/60 text-zinc-400 border border-white/[0.04]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Calculated Refund Amount (₹)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Reason for Withdrawal</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoDeleteProfile}
                    onChange={(e) => setAlsoDeleteProfile(e.target.checked)}
                  />
                  <span>Permanently delete profile after issuing refund</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 rounded-2xl bg-zinc-800 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
