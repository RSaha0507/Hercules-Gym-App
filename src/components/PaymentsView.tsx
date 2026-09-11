import React, { useState, useRef } from 'react';
import { useGym } from '../context/GymContext';
import { PaymentRecord, CenterType } from '../types';
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
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const {
    payments,
    recordPayment,
    verifyPayment,
    currentUser,
    selectedCenter,
    theme,
  } = useGym();

  const [activeTab, setActiveTab] = useState<'plans' | 'history' | 'admin_verification'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: number; period: string; months: number } | null>(null);
  const [paymentMode, setPaymentMode] = useState<'online' | 'offline'>('online');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [offlineNote, setOfflineNote] = useState<string>('');
  const [submittedNotice, setSubmittedNotice] = useState<PaymentRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [filterBranch, setFilterBranch] = useState<CenterType | 'All'>('All');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Standard',
      price: 700,
      period: '1 Month',
      months: 1,
      popular: false,
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

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Memberships & Fee Payments</h2>
          <p className="text-xs text-zinc-400">
            Official memberships, QR UPI payments, offline desk receipts, and automated payment verification
          </p>
        </div>

        {/* View Switcher */}
        <div className={`p-1 rounded-2xl border flex items-center gap-1 self-start sm:self-auto ${
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
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white">Choose Your Plan Tier</h3>
            <span className="text-xs text-zinc-400">
              Branch: <strong className="text-white">{currentUser?.center || 'Ranaghat'} Branch</strong>
            </span>
          </div>

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

                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full py-2.5 rounded-2xl font-bold text-xs shadow-lg transition-all mt-6 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  <span>Pay / Renew Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
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

          <div className="overflow-x-auto">
            {displayedPayments.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs space-y-2">
                <CreditCard className="w-8 h-8 opacity-40 mx-auto" />
                <p>No payment records found.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 ${
                  theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                }`}>
                  <tr>
                    <th className="px-6 py-3.5">Athlete</th>
                    <th className="px-6 py-3.5">Branch</th>
                    <th className="px-6 py-3.5">Plan</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Method</th>
                    <th className="px-6 py-3.5">Receipt No</th>
                    <th className="px-6 py-3.5">Verification</th>
                    <th className="px-6 py-3.5 text-right">Receipt Image</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {displayedPayments.map(item => (
                    <tr key={item.id} className="hover:bg-zinc-800/30">
                      <td className="px-6 py-4 font-bold text-white">{item.user_name}</td>
                      <td className="px-6 py-4 text-zinc-300">{item.center} Branch</td>
                      <td className="px-6 py-4 text-zinc-300">{item.plan_name}</td>
                      <td className="px-6 py-4 font-mono font-bold text-rose-400">₹{item.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.payment_mode === 'offline'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {item.payment_mode === 'offline' ? 'Desk (Offline)' : 'UPI (Online)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-400">{item.receipt_no}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                          item.verification_status === 'verified' || item.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.verification_status === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400 animate-pulse'
                        }`}>
                          {item.verification_status === 'verified' || item.status === 'paid' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </>
                          ) : item.verification_status === 'rejected' ? (
                            <>
                              <X className="w-3 h-3" />
                              Rejected
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Pending Verification
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.screenshot_url ? (
                          <button
                            onClick={() => setPreviewImage(item.screenshot_url || null)}
                            className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3 text-rose-400" />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span className="text-zinc-500 text-[11px] italic">No image</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ADMIN VERIFICATION QUEUE */}
      {activeTab === 'admin_verification' && userRole === 'admin' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white">Pending Payment Screenshot Submissions</h3>
            <span className="text-xs text-zinc-400">
              {pendingVerifications.length} submissions awaiting review
            </span>
          </div>

          {pendingVerifications.length === 0 ? (
            <div className={`p-12 rounded-3xl border text-center space-y-2 ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'
            }`}>
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">All Payments Verified</h4>
              <p className="text-xs">There are no pending screenshot submissions to verify right now.</p>
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
                      <span>Approve & Verify</span>
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-5 my-8 ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-black">Complete Plan Payment</h3>
                <p className="text-xs text-zinc-400">
                  {selectedPlan.name} • <strong className="text-rose-400">₹{selectedPlan.price}</strong> ({selectedPlan.period})
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setScreenshotData(null);
                  setOfflineNote('');
                }}
                className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                <div className="w-48 h-48 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
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

            {/* Modal Submit Actions */}
            <div className="flex gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(null);
                  setScreenshotData(null);
                  setOfflineNote('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={!screenshotData || isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-rose-900/30 flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Submit for Verification</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SIZE IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 p-2">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 hover:bg-black text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Full Size Proof"
              className="max-w-full max-h-[85vh] object-contain mx-auto rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
