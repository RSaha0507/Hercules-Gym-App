import React, { useState, useRef } from 'react';
import { useGym } from '../context/GymContext';
import { PaymentRecord, CenterType, OfferPlan } from '../types';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Eye,
  Building2,
  QrCode,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  ArrowRight,
  FileCheck,
  Lock,
  Calendar,
  BellRing,
  Receipt,
  Sparkles,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Gift,
  Tag,
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const {
    payments,
    recordPayment,
    verifyPayment,
    offers,
    addOffer,
    updateOffer,
    deleteOffer,
    toggleOfferStatus,
    currentUser,
    selectedCenter,
    theme,
  } = useGym();

  const [activeTab, setActiveTab] = useState<'plans' | 'offers' | 'history' | 'admin_verification'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: number; period: string; months: number; reminder_scheme: string } | null>(null);
  const [paymentMode, setPaymentMode] = useState<'online' | 'offline'>('online');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [offlineNote, setOfflineNote] = useState<string>('');
  const [submittedNotice, setSubmittedNotice] = useState<PaymentRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [filterBranch, setFilterBranch] = useState<CenterType | 'All'>('All');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Admin Offer Creation Form State
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState({
    occasion_name: 'Durga Puja & Festive Special',
    title: 'Festive Mega Pass',
    description: 'Special seasonal fitness plan with unrestricted access across Hercules Gym centers.',
    original_price: 2100,
    offer_price: 1500,
    duration_months: 3,
    plan_duration: 'quarterly' as 'monthly' | 'quarterly' | 'semi_annual' | 'annual',
    applicable_center: 'All' as CenterType | 'All',
    applicable_admission: 'All' as 'All' | 'New Admission' | 'Re-admission',
    valid_until: '2026-11-30',
    discount_badge: 'Save ₹600 (28% OFF)',
    features_input: 'Multi-center access, Induction session, Locker & Shower, Diet blueprint, Free shaker',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 4 Official Membership Plan Tiers
  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Standard',
      price: 700,
      period: '1 Month',
      months: 1,
      popular: false,
      reminder_scheme: 'Monthly automated renewal reminder',
      features: [
        'Access to selected branch facilities',
        'Standard fitness induction & orientation',
        'Locker & shower facilities',
        'Trainer support & guidance',
      ],
    },
    {
      id: 'quarterly',
      name: 'Quarterly Pro Tier',
      price: 1900,
      period: '3 Months',
      months: 3,
      popular: true,
      reminder_scheme: 'Quarterly automated renewal reminder',
      features: [
        'Multi-center access privileges',
        'Personalized workout split design',
        'Monthly body composition assessment',
        '10% supplement discount at store',
      ],
    },
    {
      id: 'half_yearly',
      name: 'Half-Yearly Elite',
      price: 3500,
      period: '6 Months',
      months: 6,
      popular: false,
      reminder_scheme: 'Semi-annual automated renewal reminder',
      features: [
        'Full branch privileges & priority access',
        'Dedicated trainer check-ins & progress review',
        'Custom macro nutrition blueprint',
        'Free Hercules Gym shaker & merchandise pack',
      ],
    },
    {
      id: 'annual',
      name: 'Annual Champion Pass',
      price: 6500,
      period: '12 Months',
      months: 12,
      popular: false,
      reminder_scheme: 'Annual automated renewal reminder',
      features: [
        'Unlimited VIP access across all locations',
        '1-on-1 personal training sessions included',
        'Priority locker assignment',
        '20% flat discount on all shop items',
      ],
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !currentUser) return;
    if (!screenshotData) {
      alert('Please upload a screenshot or receipt image for verification.');
      return;
    }

    setIsSubmitting(true);
    const now = new Date();
    const dueDate = new Date(now.getTime() + selectedPlan.months * 30 * 86400000);

    const paymentData: Omit<PaymentRecord, 'id' | 'receipt_no'> = {
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      center: currentUser.center || 'Ranaghat',
      plan_name: selectedPlan.name,
      amount: selectedPlan.price,
      payment_date: now.toISOString().slice(0, 10),
      due_date: dueDate.toISOString().slice(0, 10),
      status: 'pending',
      payment_method: paymentMode === 'online' ? 'UPI' : 'Cash',
      payment_mode: paymentMode,
      verification_status: 'pending_verification',
      screenshot_url: screenshotData,
      offline_note: paymentMode === 'offline' ? offlineNote || 'Paid at gym desk reception' : undefined,
    };

    recordPayment(paymentData);

    const generatedReceipt: PaymentRecord = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      receipt_no: `HG-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setSubmittedNotice(generatedReceipt);
    setIsSubmitting(false);
    setSelectedPlan(null);
    setScreenshotData(null);
    setOfflineNote('');
  };

  // Filter payments for view
  const userRole = currentUser?.role || 'member';
  const displayedPayments = userRole === 'admin'
    ? payments.filter(p => filterBranch === 'All' || p.center === filterBranch)
    : payments.filter(p => p.user_id === currentUser?.id);

  const pendingVerifications = payments.filter(p => p.verification_status === 'pending_verification');
  const totalVerifiedRevenue = payments
    .filter(p => p.status === 'paid' || p.verification_status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);

  // Check if member has an active protected plan
  const memberShipObj = currentUser?.membership;
  const isMemberActive =
    userRole !== 'admin' &&
    memberShipObj &&
    memberShipObj.status === 'active' &&
    memberShipObj.end_date &&
    new Date(memberShipObj.end_date) >= new Date();

  // Days remaining calculation
  let daysRemaining = 0;
  if (isMemberActive && memberShipObj?.end_date) {
    const end = new Date(memberShipObj.end_date).getTime();
    const now = new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Memberships & Fee Payments</h2>
          <p className="text-xs text-zinc-400">
            Monthly, Quarterly, Semi-Annual, and Annual plans with automated renewal reminder cycles
          </p>
        </div>

        {/* View Switcher */}
        <div className={`p-1 rounded-2xl border flex items-center flex-wrap gap-1 self-start sm:self-auto ${
          theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-300'
        }`}>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'plans'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Membership Plans
          </button>

          <button
            onClick={() => setActiveTab('offers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'offers'
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Occasion & Festive Offers</span>
            {offers.filter(o => o.is_active).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-black">
                {offers.filter(o => o.is_active).length} Active
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Payment History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300 font-bold">
              {displayedPayments.length}
            </span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('admin_verification')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'admin_verification'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Verifications</span>
              {pendingVerifications.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-black animate-pulse">
                  {pendingVerifications.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Refund Notice Banner if member has an approved refund */}
      {currentUser?.refund_record && (
        <div className="p-4 rounded-3xl bg-amber-950/40 border border-amber-800/60 flex items-start justify-between gap-3 text-xs text-white">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-amber-400">
                Official Gym Discharge & Refund Confirmation (Ref: {currentUser.refund_record.id})
              </div>
              <p className="text-zinc-300 mt-0.5">
                Total Refund Amount: <strong>₹{currentUser.refund_record.amount.toLocaleString()}</strong> ({currentUser.refund_record.percentage}% of paid fee). Expected credit window: <strong>within {currentUser.refund_record.days_to_refund} business days</strong>.
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                <strong>Reason:</strong> {currentUser.refund_record.reason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Revenue Overview if Admin */}
      {userRole === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-5 rounded-3xl border ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <span className="text-xs font-semibold text-zinc-400">Verified Revenue</span>
            <div className="text-3xl font-black text-rose-500 mt-1">₹{totalVerifiedRevenue.toLocaleString()}</div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Across Ranaghat, Chakdah, Madanpur</p>
          </div>

          <div className={`p-5 rounded-3xl border ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <span className="text-xs font-semibold text-zinc-400">Pending Submissions</span>
            <div className="text-3xl font-black text-amber-400 mt-1">{pendingVerifications.length}</div>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Awaiting admin screenshot review</p>
          </div>

          <div className={`p-5 rounded-3xl border ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <span className="text-xs font-semibold text-zinc-400">Active Membership Records</span>
            <div className="text-3xl font-black text-white mt-1">{payments.length}</div>
            <p className="text-[11px] text-emerald-400 mt-0.5 font-semibold">100% cloud recorded</p>
          </div>
        </div>
      )}

      {/* Submission Success Banner */}
      {submittedNotice && (
        <div className="p-5 rounded-3xl bg-amber-950/40 border border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                Payment Verification Submitted! Receipt Reference: {submittedNotice.receipt_no}
              </div>
              <div className="text-xs text-zinc-300 mt-0.5">
                {submittedNotice.plan_name} • ₹{submittedNotice.amount} ({submittedNotice.payment_mode === 'online' ? 'Online UPI' : 'Offline Desk'}) • Your branch admin will verify the receipt shortly.
              </div>
            </div>
          </div>

          <button
            onClick={() => setSubmittedNotice(null)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: MEMBERSHIP PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {/* Active Plan Protection Rule: If member has an active paid plan, show ONLY their current plan */}
          {isMemberActive ? (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-rose-950/40 border border-rose-500/50 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-rose-600/20 text-rose-500 border border-rose-500/30">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">{memberShipObj?.plan_name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                          ACTIVE & PROTECTED
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {currentUser?.center} Branch • Effective from approval date
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-zinc-400">Time Remaining</span>
                    <div className="text-2xl font-black text-rose-400">{daysRemaining} Days Left</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                    <div className="text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                      <span>Effective Start Date</span>
                    </div>
                    <div className="font-bold text-white text-sm">{memberShipObj?.start_date}</div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Verified & Approved by Branch Admin</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                    <div className="text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Valid Until (Expiry)</span>
                    </div>
                    <div className="font-bold text-white text-sm">{memberShipObj?.end_date}</div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Full access active through expiry date</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                    <div className="text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Payment Reminder Scheme</span>
                    </div>
                    <div className="font-bold text-emerald-400 text-sm capitalize">
                      {memberShipObj?.reminder_frequency || memberShipObj?.plan_duration || 'Plan'} Reminder
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Next reminder: {memberShipObj?.next_reminder_date || '5 days before renewal'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-zinc-300 flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Your active plan is secured for the entire subscribed cycle. No secondary plan purchases are available until your scheduled renewal window opens.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Active Occasion & Festive Offers Showcase in Plans View */}
              {offers.filter(o => o.is_active && (o.applicable_center === 'All' || o.applicable_center === currentUser?.center)).length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                        Special Occasion & Festive Offers
                      </h4>
                    </div>
                    {userRole === 'admin' && (
                      <button
                        onClick={() => setShowCreateOfferModal(true)}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Offer</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {offers
                      .filter(o => o.is_active && (o.applicable_center === 'All' || o.applicable_center === currentUser?.center))
                      .map(offer => (
                        <div
                          key={offer.id}
                          className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 via-zinc-900 to-rose-950/30 border-2 border-amber-500/60 shadow-xl relative flex flex-col justify-between"
                        >
                          <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-[10px] uppercase tracking-wider shadow-md">
                            {offer.discount_badge || 'Special Festive Deal'}
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                                {offer.occasion_name}
                              </div>
                              <h4 className="text-base font-black text-white mt-0.5">{offer.title}</h4>
                              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{offer.description}</p>
                            </div>

                            <div className="flex items-baseline gap-2 pt-2 border-t border-amber-900/40">
                              <span className="text-2xl font-black text-white">₹{offer.offer_price}</span>
                              {offer.original_price && (
                                <span className="text-xs line-through text-zinc-400">
                                  ₹{offer.original_price}
                                </span>
                              )}
                              <span className="text-xs text-amber-400 font-bold">
                                / {offer.duration_months} Month{offer.duration_months > 1 ? 's' : ''}
                              </span>
                            </div>

                            <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                              <span>For: <strong className="text-zinc-200">{offer.applicable_admission || 'All'}</strong></span>
                              <span>•</span>
                              <span>Valid till: <strong className="text-zinc-200">{offer.valid_until || 'Ongoing'}</strong></span>
                            </div>

                            {offer.features && offer.features.length > 0 && (
                              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 text-xs">
                                {offer.features.map((feat, i) => (
                                  <div key={i} className="flex items-start gap-1.5 text-zinc-300">
                                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <span className="text-[11px] leading-tight">{feat}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {userRole !== 'admin' && userRole !== 'trainer' && (
                            <button
                              onClick={() =>
                                setSelectedPlan({
                                  id: offer.id,
                                  name: `[Offer] ${offer.title}`,
                                  price: offer.offer_price ?? offer.price,
                                  period: `${offer.duration_months} Months`,
                                  months: offer.duration_months,
                                  reminder_scheme: `${offer.occasion_name || offer.occasion || 'Festive'} special offer cycle`,
                                })
                              }
                              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-lg shadow-amber-950/40 transition-all mt-5 flex items-center justify-center gap-2"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Avail Festive Offer</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <h3 className="text-base font-black text-white">Standard Plan Tiers</h3>
                <span className="text-xs text-zinc-400">
                  Branch: <strong className="text-white">{currentUser?.center || 'Ranaghat'} Branch</strong>
                </span>
              </div>

              {/* 4 Plan Cards: Monthly, Quarterly, Semi-Annual, Annual */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    className={`p-6 rounded-3xl border flex flex-col justify-between transition-all relative ${
                      plan.popular
                        ? 'bg-gradient-to-b from-rose-950/30 to-zinc-900 border-rose-500/60 shadow-xl ring-1 ring-rose-500/30'
                        : theme === 'dark'
                        ? 'bg-zinc-900/70 border-zinc-800'
                        : 'bg-white border-zinc-200 shadow-sm'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-md">
                        Most Popular Choice
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-bold text-white">{plan.name}</h4>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-3xl font-black text-white">₹{plan.price}</span>
                          <span className="text-xs text-zinc-400">/ {plan.period}</span>
                        </div>

                        {/* Reminder Scheme Indicator */}
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[10px] text-amber-400 font-bold">
                          <BellRing className="w-3 h-3 text-amber-400" />
                          <span>{plan.reminder_scheme}</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-zinc-800/80 text-xs">
                        {plan.features.map((feat, i) => (
                          <div key={i} className="flex items-start gap-2 text-zinc-300">
                            <Check className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {userRole !== 'admin' && userRole !== 'trainer' && (
                      <button
                        onClick={() => setSelectedPlan(plan)}
                        className={`w-full py-2.5 rounded-2xl font-bold text-xs shadow-lg transition-all mt-6 flex items-center justify-center gap-2 ${
                          plan.popular
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                        }`}
                      >
                        <span>Select & Pay Plan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: OCCASION & FESTIVE OFFERS MANAGER */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Occasion & Festive Special Schemes</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Admin can launch special seasonal discounts for Durga Puja, Diwali, New Year, or summer promotions at any time.
              </p>
            </div>

            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => setShowCreateOfferModal(true)}
                className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Occasion Offer</span>
              </button>
            )}
          </div>

          {offers.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border space-y-3 ${
              theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <Gift className="w-10 h-10 text-amber-400 mx-auto" />
              <div className="text-base font-bold text-white">No Offers Created Yet</div>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Admin can create festive passes and special discount packages here. They will immediately become available in the Add Member/Re-admission form and membership plans!
              </p>
              {userRole === 'admin' && (
                <button
                  onClick={() => setShowCreateOfferModal(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                >
                  Create First Festive Offer
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map(offer => (
                <div
                  key={offer.id}
                  className={`p-6 rounded-3xl border flex flex-col justify-between relative transition-all ${
                    offer.is_active
                      ? 'bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-900 border-amber-500/60 shadow-xl'
                      : theme === 'dark'
                      ? 'bg-zinc-900/40 border-zinc-800/80 opacity-70'
                      : 'bg-zinc-100 border-zinc-200 opacity-80'
                  }`}
                >
                  {/* Status & Discount Pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider border border-amber-500/30">
                      {offer.discount_badge || 'Special Festive Deal'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        offer.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {offer.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div>
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        {offer.occasion_name}
                      </div>
                      <h4 className="text-lg font-black text-white mt-0.5">{offer.title}</h4>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{offer.description}</p>
                    </div>

                    <div className="flex items-baseline gap-2 pt-2 border-t border-zinc-800">
                      <span className="text-2xl font-black text-white">₹{(offer.offer_price ?? offer.price).toLocaleString()}</span>
                      {offer.original_price && (
                        <span className="text-xs line-through text-zinc-400">
                          ₹{offer.original_price.toLocaleString()}
                        </span>
                      )}
                      <span className="text-xs text-amber-400 font-bold">
                        / {offer.duration_months} Month{offer.duration_months > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                      <div>
                        Branch: <strong className="text-zinc-200">{offer.applicable_center}</strong>
                      </div>
                      <div>
                        Admission: <strong className="text-zinc-200">{offer.applicable_admission || 'All'}</strong>
                      </div>
                      <div className="col-span-2">
                        Valid Until: <strong className="text-zinc-200">{offer.valid_until || 'Ongoing'}</strong>
                      </div>
                    </div>

                    {offer.features && offer.features.length > 0 && (
                      <div className="space-y-1.5 pt-1 text-xs">
                        {offer.features.map((feat, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-zinc-300">
                            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-tight">{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-zinc-800 flex flex-col gap-2">
                    {offer.is_active && userRole !== 'admin' && userRole !== 'trainer' && (
                      <button
                        onClick={() =>
                          setSelectedPlan({
                            id: offer.id,
                            name: `[Offer] ${offer.title}`,
                            price: offer.offer_price ?? offer.price,
                            period: `${offer.duration_months} Months`,
                            months: offer.duration_months,
                            reminder_scheme: `${offer.occasion_name || offer.occasion || 'Festive'} offer cycle`,
                          })
                        }
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Avail & Subscribe</span>
                      </button>
                    )}

                    {userRole === 'admin' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => toggleOfferStatus(offer.id)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 ${
                            offer.is_active
                              ? 'bg-amber-950/40 text-amber-300 border-amber-800 hover:bg-amber-900/60'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                          }`}
                        >
                          {offer.is_active ? 'Set Inactive' : 'Activate Offer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete offer "${offer.title}"?`)) {
                              deleteOffer(offer.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-800/60"
                          title="Delete Offer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYMENT HISTORY */}
      {activeTab === 'history' && (
        <div className={`rounded-3xl border overflow-hidden ${
          theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="p-4 sm:p-6 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-extrabold text-white">
                {userRole === 'admin' ? 'All Gym Payments & Invoices' : 'My Payment History'}
              </h3>
            </div>

            {userRole === 'admin' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Filter Branch:</span>
                <select
                  value={filterBranch}
                  onChange={e => setFilterBranch(e.target.value as any)}
                  className="px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
                >
                  <option value="All">All Branches</option>
                  <option value="Ranaghat">Ranaghat Branch</option>
                  <option value="Chakdah">Chakdah Branch</option>
                  <option value="Madanpur">Madanpur Branch</option>
                </select>
              </div>
            )}
          </div>

          <div className="divide-y divide-zinc-800/60">
            {displayedPayments.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No payment transactions recorded yet.
              </div>
            ) : (
              displayedPayments.map(p => (
                <div key={p.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{p.plan_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        p.verification_status === 'verified' || p.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : p.verification_status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {p.verification_status === 'verified' || p.status === 'paid' ? 'VERIFIED & ACTIVE' : p.verification_status || 'PENDING'}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400">
                      Receipt #{p.receipt_no} • {p.user_name} ({p.center} Branch) • Method: {p.payment_method}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-base font-black text-rose-500">₹{p.amount.toLocaleString()}</div>
                      <div className="text-[11px] text-zinc-500">{p.payment_date}</div>
                    </div>

                    {p.screenshot_url && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(p.screenshot_url || null)}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        title="View Receipt Screenshot"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ADMIN VERIFICATION QUEUE */}
      {activeTab === 'admin_verification' && userRole === 'admin' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white">Pending Receipt Verifications ({pendingVerifications.length})</h3>
            <span className="text-xs text-zinc-400">Approve to make plan active from current timestamp</span>
          </div>

          {pendingVerifications.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-zinc-800 bg-zinc-950/60 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="text-sm font-bold text-white">All Payments Up to Date</div>
              <p className="text-xs text-zinc-500">No member submissions currently awaiting receipt verification.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingVerifications.map(item => (
                <div
                  key={item.id}
                  className={`p-5 rounded-3xl border space-y-4 ${
                    theme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase">
                        {item.payment_mode === 'offline' ? 'Offline Desk Payment' : 'Online UPI Payment'}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1.5">{item.user_name}</h4>
                      <p className="text-xs text-zinc-400">
                        {item.center} Branch • {item.plan_name} • Receipt #{item.receipt_no}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-rose-500">₹{item.amount}</div>
                      <div className="text-[10px] text-zinc-400">{item.payment_date}</div>
                    </div>
                  </div>

                  {item.offline_note && (
                    <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
                      <strong className="text-zinc-400">Note:</strong> {item.offline_note}
                    </div>
                  )}

                  {/* Screenshot Preview */}
                  {item.screenshot_url ? (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Uploaded Payment Proof:
                      </span>
                      <div
                        onClick={() => setPreviewImage(item.screenshot_url || null)}
                        className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 cursor-pointer group h-40 flex items-center justify-center"
                      >
                        <img
                          src={item.screenshot_url}
                          alt="Payment Screenshot Proof"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                          <Eye className="w-4 h-4" />
                          <span>Click to Enlarge Proof</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-zinc-950 text-center text-xs text-zinc-500">
                      No screenshot uploaded
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => verifyPayment(item.id, 'rejected')}
                      className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-red-950/60 hover:text-red-400 text-zinc-300 text-xs font-bold transition-all border border-zinc-700"
                    >
                      Reject Proof
                    </button>

                    <button
                      onClick={() => verifyPayment(item.id, 'verified')}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Activate Plan</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PAYMENT MODAL (ONLINE QR & OFFLINE DESK WITH SCREENSHOT VERIFICATION) */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 md:p-8 flex justify-center items-start sm:items-center">
          <div
            className={`w-full max-w-lg my-auto rounded-3xl border shadow-2xl overflow-hidden max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            {/* Modal Header */}
            <div className="shrink-0 p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Complete Plan Payment</h3>
                <p className="text-xs text-zinc-400">
                  {selectedPlan.name} • <strong className="text-rose-400">₹{selectedPlan.price}</strong> ({selectedPlan.period})
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(null);
                  setScreenshotData(null);
                  setOfflineNote('');
                }}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-950 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('online');
                    setScreenshotData(null);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    paymentMode === 'online'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Online Payment (UPI QR)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('offline');
                    setScreenshotData(null);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    paymentMode === 'offline'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Offline (At Gym Desk)</span>
                </button>
              </div>

              {/* OPTION 1: ONLINE PAYMENT (QR CODE, NO VPA, SCREENSHOT UPLOAD) */}
              {paymentMode === 'online' && (
                <div className="space-y-4 text-center">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-300">Scan QR to Pay with Any UPI App</span>
                    <p className="text-[11px] text-zinc-400">
                      Google Pay • PhonePe • Paytm • BHIM UPI
                    </p>
                  </div>

                  {/* Clean QR code without VPA text */}
                  <div className="w-44 h-44 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                    <div className="w-full h-full border-4 border-zinc-900 p-2 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="w-8 h-8 bg-zinc-900" />
                        <div className="w-8 h-8 bg-zinc-900" />
                      </div>
                      <div className="text-[11px] font-mono font-black text-zinc-900 tracking-wider">
                        HERCULES GYM
                      </div>
                      <div className="flex justify-between">
                        <div className="w-8 h-8 bg-zinc-900" />
                        <div className="w-6 h-6 bg-zinc-900 ml-auto" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-left space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Upload Payment Screenshot for Verification</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Once you have completed the payment on your UPI app, take a screenshot and upload it below for fast verification.
                    </p>
                  </div>
                </div>
              )}

              {/* OPTION 2: OFFLINE PAYMENT (VISIT GYM MESSAGE + DESK RECEIPT UPLOAD) */}
              {paymentMode === 'offline' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                      <Building2 className="w-5 h-5" />
                      <span>Visit Gym Branch Desk for Payment</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Please visit the gym branch desk ({currentUser?.center || 'Ranaghat'} Branch) for in-person cash or card payment. Once paid, the reception will issue your physical receipt.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Upload Desk Receipt / Payment Slip Image</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Upload a clear photo of your desk receipt or payment slip below to submit for instant record verification.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Desk / Reference Note (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Paid cash to Receptionist / Trainer"
                      value={offlineNote}
                      onChange={e => setOfflineNote(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              )}

              {/* SHARED SCREENSHOT / RECEIPT IMAGE UPLOAD ZONE */}
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {!screenshotData ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    className="p-6 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-rose-500 bg-zinc-950/60 hover:bg-zinc-950 transition-all cursor-pointer text-center space-y-2"
                  >
                    <Upload className="w-8 h-8 text-rose-500 mx-auto" />
                    <div className="text-xs font-bold text-white">
                      Click or Drag & Drop {paymentMode === 'online' ? 'Payment Screenshot' : 'Desk Receipt Photo'}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Supports JPG, PNG, WEBP (Max 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 p-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={screenshotData}
                        alt="Uploaded Screenshot"
                        className="w-16 h-16 rounded-xl object-cover border border-zinc-800"
                      />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Proof Ready to Submit</span>
                        </div>
                        <p className="text-[10px] text-zinc-400">Click change if you selected wrong image</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setScreenshotData(null)}
                        className="p-1.5 rounded-xl bg-red-950/60 text-red-400 hover:bg-red-900/60"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Submit Actions */}
            <div className="shrink-0 p-4 sm:p-6 border-t border-zinc-800 bg-zinc-950/80 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={!screenshotData || isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit for Verification'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENLARGED PROOF IMAGE MODAL */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md overflow-y-auto p-4 flex justify-center items-center cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] p-2 bg-zinc-900 rounded-3xl border border-zinc-700 my-auto">
            <img
              src={previewImage}
              alt="Enlarged Payment Proof"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/80 text-white hover:bg-red-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ADMIN CREATE OCCASION OFFER MODAL */}
      {showCreateOfferModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 md:p-8 flex justify-center items-start sm:items-center">
          <div
            className={`w-full max-w-xl my-auto rounded-3xl border shadow-2xl overflow-hidden max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="shrink-0 p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Create Occasion / Festive Offer</h3>
                  <p className="text-xs text-zinc-400">Launch custom gym discounts for festivals or special occasions</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateOfferModal(false)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              id="create-offer-form"
              onSubmit={e => {
                e.preventDefault();
                const feats = offerForm.features_input
                  .split(',')
                  .map(f => f.trim())
                  .filter(Boolean);

                const discPct = offerForm.original_price && Number(offerForm.original_price) > 0
                  ? Math.round(((Number(offerForm.original_price) - Number(offerForm.offer_price)) / Number(offerForm.original_price)) * 100)
                  : undefined;

                addOffer({
                  price: Number(offerForm.offer_price),
                  occasion: offerForm.occasion_name,
                  occasion_name: offerForm.occasion_name,
                  occasion_tag: offerForm.occasion_name,
                  title: offerForm.title,
                  description: offerForm.description,
                  original_price: Number(offerForm.original_price),
                  offer_price: Number(offerForm.offer_price),
                  discount_percentage: discPct,
                  duration_months: Number(offerForm.duration_months),
                  plan_duration: offerForm.plan_duration,
                  applicable_center: offerForm.applicable_center,
                  applicable_admission: offerForm.applicable_admission,
                  valid_until: offerForm.valid_until,
                  discount_badge: offerForm.discount_badge,
                  features: feats,
                  is_active: true,
                });

                setShowCreateOfferModal(false);
                setActiveTab('offers');
              }}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Occasion / Festival Name *</label>
                  <input
                    type="text"
                    required
                    value={offerForm.occasion_name}
                    onChange={e => setOfferForm({ ...offerForm, occasion_name: e.target.value })}
                    placeholder="e.g. Durga Puja Special, Diwali Dhamaka"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Offer Title *</label>
                  <input
                    type="text"
                    required
                    value={offerForm.title}
                    onChange={e => setOfferForm({ ...offerForm, title: e.target.value })}
                    placeholder="e.g. Festive Mega Pass"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={offerForm.description}
                  onChange={e => setOfferForm({ ...offerForm, description: e.target.value })}
                  placeholder="Details of the offer and occasion perks..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Offer Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={offerForm.offer_price}
                    onChange={e => setOfferForm({ ...offerForm, offer_price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-black text-sm text-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Regular Price (₹)</label>
                  <input
                    type="number"
                    value={offerForm.original_price}
                    onChange={e => setOfferForm({ ...offerForm, original_price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Duration (Months) *</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={offerForm.duration_months}
                    onChange={e => {
                      const m = Number(e.target.value);
                      let pd: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' = 'monthly';
                      if (m >= 12) pd = 'annual';
                      else if (m >= 6) pd = 'semi_annual';
                      else if (m >= 3) pd = 'quarterly';
                      setOfferForm({ ...offerForm, duration_months: m, plan_duration: pd });
                    }}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Applicable Branch</label>
                  <select
                    value={offerForm.applicable_center}
                    onChange={e => setOfferForm({ ...offerForm, applicable_center: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-bold focus:outline-none"
                  >
                    <option value="All">All Branches</option>
                    <option value="Ranaghat">Ranaghat</option>
                    <option value="Chakdah">Chakdah</option>
                    <option value="Madanpur">Madanpur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Applicable For</label>
                  <select
                    value={offerForm.applicable_admission}
                    onChange={e => setOfferForm({ ...offerForm, applicable_admission: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-bold focus:outline-none"
                  >
                    <option value="All">All (New & Re-admission)</option>
                    <option value="New Admission">New Admission Only</option>
                    <option value="Re-admission">Re-admission Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={offerForm.valid_until}
                    onChange={e => setOfferForm({ ...offerForm, valid_until: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Discount Tag / Badge</label>
                <input
                  type="text"
                  value={offerForm.discount_badge}
                  onChange={e => setOfferForm({ ...offerForm, discount_badge: e.target.value })}
                  placeholder="e.g. Save ₹600 (28% OFF) • Festive Special"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-amber-300 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Features Included (comma-separated)</label>
                <input
                  type="text"
                  value={offerForm.features_input}
                  onChange={e => setOfferForm({ ...offerForm, features_input: e.target.value })}
                  placeholder="e.g. All branches access, Locker included, Nutrition plan, Free shaker"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateOfferModal(false)}
                  className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black shadow-lg shadow-amber-950/40"
                >
                  Publish Occasion Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
