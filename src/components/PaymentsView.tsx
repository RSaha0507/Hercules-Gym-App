import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { PaymentRecord, CenterType, OfferPlan, RevenueCategory } from '../types';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Check,
  X,
  Eye,
  Building2,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  Receipt,
  Sparkles,
  Plus,
  Trash2,
  Gift,
  Tag,
  ShoppingBag,
  DollarSign,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const {
    payments,
    offers,
    addOffer,
    updateOffer,
    deleteOffer,
    toggleOfferStatus,
    currentUser,
    selectedCenter,
    theme,
    getCenterTheme,
  } = useGym();

  const centerTheme = getCenterTheme(selectedCenter);
  const isUserAdmin = currentUser?.role === 'admin';

  // Sub-tabs for Revenue Record
  const [activeRevenueTab, setActiveRevenueTab] = useState<'all' | 'fine' | 'normal' | 'gym_item' | 'others' | 'offers'>('all');
  const [filterBranch, setFilterBranch] = useState<CenterType | 'All'>(
    selectedCenter === 'All' ? 'All' : selectedCenter
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  // Admin Offer Creation Modal State
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

  // Filter payments by center & user permissions
  const basePayments = payments.filter((p) => {
    const matchesCenter = filterBranch === 'All' || p.center === filterBranch;
    const matchesUser = isUserAdmin || p.user_id === currentUser?.id;
    return matchesCenter && matchesUser;
  });

  // 4 Revenue Metric Pool Calculations
  const normalRevenue = basePayments.reduce((sum, p) => {
    if (p.revenue_category === 'gym_fees') {
      return sum + (p.normal_amount !== undefined ? p.normal_amount : p.amount);
    }
    // If not categorized but looks like membership
    if (!p.revenue_category && !p.plan_name?.includes('Item') && !p.plan_name?.includes('Other')) {
      return sum + (p.normal_amount !== undefined ? p.normal_amount : p.amount);
    }
    return sum;
  }, 0);

  const fineRevenue = basePayments.reduce((sum, p) => {
    return sum + (p.fine_amount || 0);
  }, 0);

  const gymItemRevenue = basePayments.reduce((sum, p) => {
    if (p.revenue_category === 'gym_item' || p.plan_name?.toLowerCase().includes('item') || p.plan_name?.toLowerCase().includes('store')) {
      return sum + p.amount;
    }
    return sum;
  }, 0);

  const otherRevenue = basePayments.reduce((sum, p) => {
    if (p.revenue_category === 'others' || p.plan_name?.toLowerCase().includes('other')) {
      return sum + p.amount;
    }
    return sum;
  }, 0);

  const totalGrossRevenue = normalRevenue + fineRevenue + gymItemRevenue + otherRevenue;

  // Filtered transactions for the ledger table
  const filteredLedger = basePayments.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.receipt_no.toLowerCase().includes(q) ||
      p.user_name.toLowerCase().includes(q) ||
      p.plan_name.toLowerCase().includes(q) ||
      (p.payment_for && p.payment_for.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (activeRevenueTab === 'fine') {
      return (p.fine_amount || 0) > 0;
    }
    if (activeRevenueTab === 'normal') {
      return p.revenue_category === 'gym_fees' || (!p.revenue_category && !p.plan_name?.includes('Item'));
    }
    if (activeRevenueTab === 'gym_item') {
      return p.revenue_category === 'gym_item' || p.plan_name?.toLowerCase().includes('item');
    }
    if (activeRevenueTab === 'others') {
      return p.revenue_category === 'others' || p.plan_name?.toLowerCase().includes('other');
    }
    return true; // 'all'
  });

  const handleCreateOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const featuresList = offerForm.features_input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    addOffer({
      title: offerForm.title.trim(),
      occasion_name: offerForm.occasion_name.trim(),
      description: offerForm.description.trim(),
      original_price: Number(offerForm.original_price),
      offer_price: Number(offerForm.offer_price),
      price: Number(offerForm.offer_price),
      duration_months: Number(offerForm.duration_months),
      plan_duration: offerForm.plan_duration,
      applicable_center: offerForm.applicable_center,
      center: offerForm.applicable_center,
      applicable_admission: offerForm.applicable_admission,
      valid_until: offerForm.valid_until,
      discount_badge: offerForm.discount_badge.trim(),
      features: featuresList,
      is_active: true,
    });

    setShowCreateOfferModal(false);
  };

  return (
    <div className="w-full space-y-6 pb-20 md:pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-rose-500" />
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Revenue Record
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time multi-branch financial accounting, fine splitting, store collections & transaction ledger
          </p>
        </div>

        {/* Center Branch Filter & Admin Offer Action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs">
            {(['All', 'Ranaghat', 'Chakdah', 'Madanpur'] as const).map((branch) => (
              <button
                key={branch}
                onClick={() => setFilterBranch(branch)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterBranch === branch
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {branch}
              </button>
            ))}
          </div>

          {isUserAdmin && (
            <button
              onClick={() => setShowCreateOfferModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Gift className="w-4 h-4" />
              <span>Create Special Offer</span>
            </button>
          )}
        </div>
      </div>

      {/* 8. FOUR MAIN REVENUE TABS / METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Normal Revenue Collected */}
        <div
          onClick={() => setActiveRevenueTab('normal')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer select-none relative overflow-hidden ${
            activeRevenueTab === 'normal'
              ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl shadow-emerald-950/50'
              : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Normal Revenue Collected
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              ₹
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ₹{normalRevenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Regular membership fee collections (without fine)
            </p>
          </div>
        </div>

        {/* 2. Fine Revenue Collected */}
        <div
          onClick={() => setActiveRevenueTab('fine')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer select-none relative overflow-hidden ${
            activeRevenueTab === 'fine'
              ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/40 shadow-xl shadow-rose-950/50'
              : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-rose-400">
              Fine Revenue Collected
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
              ⚡
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
              ₹{fineRevenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Late fee charges (₹5/day passed after 7th of month)
            </p>
          </div>
        </div>

        {/* 3. Gym Item Revenue Collected */}
        <div
          onClick={() => setActiveRevenueTab('gym_item')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer select-none relative overflow-hidden ${
            activeRevenueTab === 'gym_item'
              ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/40 shadow-xl shadow-purple-950/50'
              : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-purple-400">
              Gym Item Revenue Collected
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ₹{gymItemRevenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Supplements, apparel & store merchandise orders
            </p>
          </div>
        </div>

        {/* 4. Other Revenue Collected */}
        <div
          onClick={() => setActiveRevenueTab('others')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer select-none relative overflow-hidden ${
            activeRevenueTab === 'others'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/40 shadow-xl shadow-amber-950/50'
              : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Other Revenue Collected
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              📋
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ₹{otherRevenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Lockers, event passes, trainer inductions & misc
            </p>
          </div>
        </div>
      </div>

      {/* Gross Summary Bar */}
      <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-rose-600 text-white font-black">
            GROSS
          </div>
          <div>
            <span className="text-zinc-400 font-semibold">Total Verified Turnover ({filterBranch} Centers):</span>
            <span className="text-lg font-black text-white ml-2">₹{totalGrossRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Navigation Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveRevenueTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeRevenueTab === 'all'
                ? 'bg-white text-black font-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            All Collections ({basePayments.length})
          </button>
          <button
            onClick={() => setActiveRevenueTab('normal')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeRevenueTab === 'normal'
                ? 'bg-emerald-600 text-white font-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Normal Fees
          </button>
          <button
            onClick={() => setActiveRevenueTab('fine')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeRevenueTab === 'fine'
                ? 'bg-rose-600 text-white font-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Late Fines
          </button>
          <button
            onClick={() => setActiveRevenueTab('gym_item')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeRevenueTab === 'gym_item'
                ? 'bg-purple-600 text-white font-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Store Items
          </button>
          <button
            onClick={() => setActiveRevenueTab('others')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeRevenueTab === 'others'
                ? 'bg-amber-600 text-white font-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Others
          </button>
          {isUserAdmin && (
            <button
              onClick={() => setActiveRevenueTab('offers')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                activeRevenueTab === 'offers'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              Special Offers ({offers.length})
            </button>
          )}
        </div>
      </div>

      {/* VIEW: SPECIAL OFFERS TAB */}
      {activeRevenueTab === 'offers' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white">Active Special Offers & Occasion Plans</h3>
            <button
              onClick={() => setShowCreateOfferModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Occasion Plan</span>
            </button>
          </div>

          {offers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-zinc-800 bg-zinc-900/50 text-zinc-400 space-y-3">
              <Gift className="w-12 h-12 text-rose-500 mx-auto opacity-60" />
              <p className="font-bold text-white text-base">No Special Offers Created Yet</p>
              <p className="text-xs max-w-md mx-auto">
                Create seasonal or festive offers (e.g. Durga Puja, New Year, Summer Camp) which will appear on the Member Admission Fees Slide.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/90 shadow-xl relative overflow-hidden space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {offer.occasion_name || 'Occasion Plan'}
                      </span>
                      <h4 className="text-base font-black text-white mt-1.5">{offer.title}</h4>
                      <p className="text-xs text-zinc-400">{offer.description}</p>
                    </div>

                    <button
                      onClick={() => deleteOffer(offer.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                      title="Delete Offer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-500 line-through">₹{offer.original_price}</span>
                      <span className="text-xl font-black text-emerald-400 ml-2">₹{offer.price}</span>
                    </div>
                    <span className="text-xs font-bold text-zinc-300">
                      Duration: {offer.duration_months} Months
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span>Target: {offer.applicable_center || 'All Centers'}</span>
                    <button
                      onClick={() => toggleOfferStatus(offer.id)}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        offer.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {offer.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VIEW: TRANSACTION LEDGER TABLE */
        <div className="space-y-4">
          {/* Search bar inside ledger */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search receipts by member name, receipt number, plan, or note..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 shadow-2xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="py-3.5 px-4">Receipt / Date</th>
                    <th className="py-3.5 px-4">Member Name & ID</th>
                    <th className="py-3.5 px-4">Center</th>
                    <th className="py-3.5 px-4">Payment Category</th>
                    <th className="py-3.5 px-4">Normal Fee</th>
                    <th className="py-3.5 px-4">Late Fine (₹5/day)</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4 text-right">Receipt Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-zinc-500">
                        No transactions found matching the selected revenue category and search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((pay) => {
                      const fineAmt = pay.fine_amount || 0;
                      const normalAmt = pay.normal_amount !== undefined ? pay.normal_amount : (pay.revenue_category === 'gym_fees' ? pay.amount : (fineAmt > 0 ? pay.amount - fineAmt : pay.amount));

                      return (
                        <tr key={pay.id} className="hover:bg-zinc-800/40 transition-colors">
                          {/* Receipt & Date */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-white">{pay.receipt_no}</div>
                            <div className="text-[10px] text-zinc-500">{pay.payment_date}</div>
                          </td>

                          {/* Member */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{pay.user_name}</div>
                            <div className="text-[10px] font-mono text-zinc-500">{pay.user_id}</div>
                          </td>

                          {/* Center */}
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
                              {pay.center}
                            </span>
                          </td>

                          {/* Payment Category */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">
                              {pay.payment_for || pay.plan_name}
                            </div>
                            <span className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                              pay.revenue_category === 'gym_fees'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : pay.revenue_category === 'gym_item'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {pay.revenue_category || 'Gym Fees'}
                            </span>
                          </td>

                          {/* Normal Fee */}
                          <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                            ₹{normalAmt.toLocaleString()}
                          </td>

                          {/* Late Fine Portion */}
                          <td className="py-3.5 px-4 font-mono font-semibold text-rose-400">
                            {fineAmt > 0 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
                                ⚡ ₹{fineAmt.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-zinc-600">₹0</span>
                            )}
                          </td>

                          {/* Total Paid */}
                          <td className="py-3.5 px-4 font-mono font-black text-white text-sm">
                            ₹{pay.amount.toLocaleString()}
                          </td>

                          {/* Mode */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              pay.payment_mode === 'offline'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                            }`}>
                              {pay.payment_mode || 'Online'}
                            </span>
                          </td>

                          {/* View Receipt Button */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedReceipt(pay)}
                              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-[11px] inline-flex items-center gap-1 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Receipt</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 text-white shadow-2xl p-6 relative space-y-4">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Receipt Header */}
            <div className="text-center space-y-1 border-b border-zinc-800 pb-4">
              <div className="flex items-center justify-center gap-2">
                <img src="/hercules-logo-removebg-preview.png" alt="Hercules Logo" className="w-8 h-8 object-contain" />
                <span className="font-black text-lg bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 bg-clip-text text-transparent">
                  HERCULES GYM
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                Official Revenue Receipt • {selectedReceipt.center} Branch
              </p>
              <div className="mt-2 inline-block px-3 py-1 rounded-full bg-zinc-950 font-mono text-xs font-black text-rose-400 border border-zinc-800">
                {selectedReceipt.receipt_no}
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Member Name:</span>
                <span className="font-bold text-white">{selectedReceipt.user_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Member ID:</span>
                <span className="font-mono text-zinc-300">{selectedReceipt.user_id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Payment Reason:</span>
                <span className="font-semibold text-white">{selectedReceipt.payment_for || selectedReceipt.plan_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Payment Date:</span>
                <span className="text-zinc-300">{selectedReceipt.payment_date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Payment Mode:</span>
                <span className="capitalize font-bold text-amber-400">{selectedReceipt.payment_mode || 'Online'}</span>
              </div>

              {/* Split Breakdown */}
              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-1.5 mt-2">
                <div className="flex justify-between text-zinc-300">
                  <span>Normal Fee Amount:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ₹{(selectedReceipt.normal_amount !== undefined ? selectedReceipt.normal_amount : (selectedReceipt.fine_amount ? selectedReceipt.amount - selectedReceipt.fine_amount : selectedReceipt.amount)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Late Fine Portion (₹5/day):</span>
                  <span className="font-mono text-rose-400 font-bold">
                    ₹{(selectedReceipt.fine_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-white font-black pt-1.5 border-t border-zinc-800 text-sm">
                  <span>Total Amount Paid:</span>
                  <span className="font-mono text-white">₹{selectedReceipt.amount.toLocaleString()}</span>
                </div>
              </div>

              {selectedReceipt.offline_note && (
                <div className="p-2.5 rounded-xl bg-zinc-950 text-[11px] text-zinc-400">
                  <strong>Admin Note:</strong> {selectedReceipt.offline_note}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* CREATE OFFER MODAL */}
      {showCreateOfferModal && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 text-white shadow-2xl p-6 relative space-y-4">
            <button
              onClick={() => setShowCreateOfferModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-black text-white">Create Special Occasion Plan</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Offer special rates for festive seasons, displayed during member admission fee slide
              </p>
            </div>

            <form onSubmit={handleCreateOfferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Occasion / Festival Name</label>
                <input
                  type="text"
                  required
                  value={offerForm.occasion_name}
                  onChange={(e) => setOfferForm({ ...offerForm, occasion_name: e.target.value })}
                  placeholder="e.g. Durga Puja Special / New Year Pass"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  placeholder="e.g. Festive Mega Pass"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={offerForm.original_price}
                    onChange={(e) => setOfferForm({ ...offerForm, original_price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Offer Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={offerForm.offer_price}
                    onChange={(e) => setOfferForm({ ...offerForm, offer_price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    required
                    value={offerForm.duration_months}
                    onChange={(e) => setOfferForm({ ...offerForm, duration_months: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Applicable Center</label>
                  <select
                    value={offerForm.applicable_center}
                    onChange={(e) => setOfferForm({ ...offerForm, applicable_center: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="All">All Centers</option>
                    <option value="Ranaghat">Ranaghat</option>
                    <option value="Chakdah">Chakdah</option>
                    <option value="Madanpur">Madanpur</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Discount Tag Badge</label>
                <input
                  type="text"
                  value={offerForm.discount_badge}
                  onChange={(e) => setOfferForm({ ...offerForm, discount_badge: e.target.value })}
                  placeholder="e.g. Save ₹600 (28% OFF)"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateOfferModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black text-xs shadow-md"
                >
                  Save & Publish Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
