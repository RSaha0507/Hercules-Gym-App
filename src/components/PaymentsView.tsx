import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { PaymentRecord, CenterType } from '../types';
import {
  CreditCard,
  CheckCircle2,
  Download,
  QrCode,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  Search,
  Filter,
  Check,
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const {
    payments,
    recordPayment,
    currentUser,
    selectedCenter,
    theme,
  } = useGym();

  const [selectedPlan, setSelectedPlan] = useState<string>('Quarterly Pro Tier');
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);
  const [pendingPlanData, setPendingPlanData] = useState<{ name: string; amount: number; months: number } | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<PaymentRecord | null>(null);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Standard',
      price: 700,
      period: '1 Month',
      months: 1,
      popular: false,
      features: ['Access to selected gym center', 'General fitness induction', 'Locker & shower access', 'Basic diet guidance'],
    },
    {
      id: 'quarterly',
      name: 'Quarterly Pro Tier',
      price: 1900,
      period: '3 Months',
      months: 3,
      popular: true,
      features: ['Access to all 3 centers (Ranaghat, Chakdah, Madanpur)', 'Custom workout split design', 'Monthly body composition tracking', 'Supplements discount (10% OFF)'],
    },
    {
      id: 'half_yearly',
      name: 'Half-Yearly Elite',
      price: 3500,
      period: '6 Months',
      months: 6,
      popular: false,
      features: ['Full multi-center privileges', 'Dedicated trainer check-ins', 'Comprehensive macro diet plan', 'Free Hercules Gym shaker & t-shirt'],
    },
    {
      id: 'annual',
      name: 'Annual Champion Pass',
      price: 6500,
      period: '12 Months',
      months: 12,
      popular: false,
      features: ['Unlimited all-access VIP status', 'Personal training sessions included', 'Priority locker assignment', '20% discount on all supplements & merchandise'],
    },
  ];

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleInitiatePayment = (plan: typeof plans[0]) => {
    setPendingPlanData({ name: plan.name, amount: plan.price, months: plan.months });
    setShowUpiModal(true);
  };

  const handleConfirmPayment = () => {
    if (!pendingPlanData || !currentUser) return;
    const now = new Date();
    const dueDate = new Date(now.getTime() + pendingPlanData.months * 30 * 86400000);

    const paymentInput: Omit<PaymentRecord, 'id' | 'receipt_no'> = {
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      center: currentUser.center,
      plan_name: pendingPlanData.name,
      amount: pendingPlanData.amount,
      payment_date: now.toISOString().slice(0, 10),
      due_date: dueDate.toISOString().slice(0, 10),
      status: 'paid',
      payment_method: 'UPI',
    };

    recordPayment(paymentInput);
    setSuccessReceipt({
      ...paymentInput,
      id: `pay-${Date.now()}`,
      receipt_no: `HG-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setShowUpiModal(false);
    setPendingPlanData(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Memberships & Fee Payments</h2>
        <p className="text-xs text-zinc-400">
          Transparent fee tiers, digital tax invoices, and real-time revenue accounting
        </p>
      </div>

      {/* Admin Revenue Overview if Admin */}
      {currentUser?.role === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-5 rounded-3xl border ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <span className="text-xs font-semibold text-zinc-400">Total Revenue Collected</span>
            <div className="text-3xl font-black text-rose-500 mt-1">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Across Ranaghat, Chakdah, Madanpur</p>
          </div>

          <div className={`p-5 rounded-3xl border ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <span className="text-xs font-semibold text-zinc-400">Active Paid Memberships</span>
            <div className="text-3xl font-black text-white mt-1">{payments.length + 18}</div>
            <p className="text-[11px] text-emerald-400 mt-0.5 font-semibold">96% on-time renewal rate</p>
          </div>

          <div className={`p-5 rounded-3xl border ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <span className="text-xs font-semibold text-zinc-400">Average Plan Value</span>
            <div className="text-3xl font-black text-amber-400 mt-1">₹2,450</div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Quarterly pass is most popular</p>
          </div>
        </div>
      )}

      {/* Success Receipt Banner */}
      {successReceipt && (
        <div className="p-5 rounded-3xl bg-emerald-950/40 border border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                Payment Successful! Receipt No: {successReceipt.receipt_no}
              </div>
              <div className="text-xs text-zinc-300 mt-0.5">
                {successReceipt.plan_name} • ₹{successReceipt.amount} • Valid till {successReceipt.due_date}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSuccessReceipt(null)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
          >
            Done
          </button>
        </div>
      )}

      {/* Membership Plans Grid */}
      <div className="space-y-3">
        <h3 className="text-base font-black text-white">Select Membership Package</h3>

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
                onClick={() => handleInitiatePayment(plan)}
                className={`w-full py-2.5 rounded-2xl font-bold text-xs shadow-lg transition-all mt-6 ${
                  plan.popular
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}
              >
                Join / Renew Plan
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction & Payment History */}
      <div className={`rounded-3xl border overflow-hidden ${
        theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        <div className="p-4 sm:p-6 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-extrabold text-white">Payment & Invoice History</h3>
          </div>
          <span className="text-xs text-zinc-400">{payments.length} Transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 ${
              theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}>
              <tr>
                <th className="px-6 py-3.5">Athlete</th>
                <th className="px-6 py-3.5">Center</th>
                <th className="px-6 py-3.5">Plan</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Receipt No</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {payments.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/30">
                  <td className="px-6 py-4 font-bold text-white">{item.user_name}</td>
                  <td className="px-6 py-4 text-zinc-300">{item.center}</td>
                  <td className="px-6 py-4 text-zinc-300">{item.plan_name}</td>
                  <td className="px-6 py-4 font-mono font-bold text-rose-400">₹{item.amount}</td>
                  <td className="px-6 py-4 font-mono text-zinc-400">{item.receipt_no}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulated UPI Payment Modal */}
      {showUpiModal && pendingPlanData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 text-center space-y-4 ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <h3 className="text-lg font-black">Scan & Pay with UPI</h3>
            <p className="text-xs text-zinc-400">
              Activating <strong className="text-white">{pendingPlanData.name}</strong> for ₹{pendingPlanData.amount}
            </p>

            <div className="w-44 h-44 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <div className="w-full h-full border-4 border-zinc-900 p-2 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-8 h-8 bg-zinc-900" />
                  <div className="w-8 h-8 bg-zinc-900" />
                </div>
                <div className="text-[10px] font-mono font-black text-zinc-900">
                  HERCULES GYM UPI
                </div>
                <div className="flex justify-between">
                  <div className="w-8 h-8 bg-zinc-900" />
                  <div className="w-6 h-6 bg-zinc-900 ml-auto" />
                </div>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <div className="font-mono font-bold text-white">VPA: herculesgym.nadia@icici</div>
              <p className="text-zinc-500 text-[11px]">Supports Google Pay, PhonePe, Paytm, BHIM UPI</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowUpiModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30"
              >
                Simulate Payment Success
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
