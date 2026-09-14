import { describe, it, expect } from 'vitest';
import { OfferPlan, User } from '../types';

// 1. Fee Inactivity Evaluation Engine (2 Months / 60 Days Rule)
export function evaluateMemberInactivity(user: Partial<User>, daysOverdueThreshold = 60): {
  is_active: boolean;
  reason?: string;
} {
  if (user.is_active === false) {
    return { is_active: false, reason: 'Manually deactivated by Admin' };
  }

  const daysOverdue = user.days_overdue || 0;
  if (daysOverdue >= daysOverdueThreshold) {
    return {
      is_active: false,
      reason: `Unpaid gym membership dues exceeding 2 months (${daysOverdue} days)`,
    };
  }

  return { is_active: true };
}

// 2. Offer Discount and Price Calculator
export function calculateOfferPricing(originalPrice: number, offerPrice: number) {
  const safeOriginal = Math.max(0, originalPrice);
  const safeOffer = Math.max(0, offerPrice);
  const discountAmount = Math.max(0, safeOriginal - safeOffer);
  const discountPercentage = safeOriginal > 0 ? Math.round((discountAmount / safeOriginal) * 100) : 0;

  return {
    originalPrice: safeOriginal,
    offerPrice: safeOffer,
    discountAmount,
    discountPercentage,
  };
}

// 3. Offer Applicability Resolver
export function isOfferApplicable(
  offer: Partial<OfferPlan>,
  memberCenter: string,
  admissionType: 'New Admission' | 'Re-admission'
): boolean {
  if (!offer.is_active) return false;

  const offerCenter = offer.applicable_center || offer.target_center || offer.center || 'All';
  if (offerCenter !== 'All' && offerCenter !== memberCenter) {
    return false;
  }

  const offerAdmission = offer.applicable_admission || offer.admission_type_applicable || 'All';
  if (offerAdmission !== 'All' && offerAdmission !== admissionType) {
    return false;
  }

  return true;
}

// 4. Re-admission Lifecycle Executor
export function executeReAdmissionMock(
  existingMember: User,
  selectedPlanDuration: 'monthly' | 'quarterly' | 'semi_annual' | 'annual',
  feePaid: number,
  appliedOffer?: OfferPlan
): User {
  const months =
    selectedPlanDuration === 'annual'
      ? 12
      : selectedPlanDuration === 'semi_annual'
      ? 6
      : selectedPlanDuration === 'quarterly'
      ? 3
      : 1;

  const startDate = new Date().toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return {
    ...existingMember,
    admission_type: 'Re-admission',
    is_active: true,
    days_overdue: 0,
    membership: {
      plan_name: appliedOffer ? `[Offer] ${appliedOffer.title}` : `${existingMember.enrollment_programme || 'Gym'} Membership`,
      plan_duration: selectedPlanDuration,
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      fee_paid: feePaid,
      due_amount: 0,
    },
    refund_record: undefined, // Cleared on re-admission
  };
}

describe('Festive Offers, 2-Month Auto-Inactivity & Member Lifecycle Suite', () => {
  it('should automatically mark member as inactive if fee is overdue for 2 months (>= 60 days)', () => {
    const freshMember: Partial<User> = {
      id: 'm-1',
      full_name: 'Debojit Saha',
      is_active: true,
      days_overdue: 15,
    };

    const status1 = evaluateMemberInactivity(freshMember);
    expect(status1.is_active).toBe(true);

    const overdueMember: Partial<User> = {
      id: 'm-2',
      full_name: 'Bishal Das',
      is_active: true,
      days_overdue: 62,
    };

    const status2 = evaluateMemberInactivity(overdueMember);
    expect(status2.is_active).toBe(false);
    expect(status2.reason).toContain('exceeding 2 months');
  });

  it('should calculate offer discounts and badge percentages accurately', () => {
    const offerCalc = calculateOfferPricing(3000, 2199);
    expect(offerCalc.discountAmount).toBe(801);
    expect(offerCalc.discountPercentage).toBe(27); // 27% off
  });

  it('should verify offer applicability across branches and admission types', () => {
    const durgaPujaOffer: Partial<OfferPlan> = {
      id: 'off-1',
      title: 'Durga Puja Maha Dhamaka',
      is_active: true,
      applicable_center: 'Ranaghat',
      admission_type_applicable: 'New Admission',
    };

    // Ranaghat New Admission -> Applicable
    expect(isOfferApplicable(durgaPujaOffer, 'Ranaghat', 'New Admission')).toBe(true);

    // Chakdah New Admission -> Not Applicable (Branch mismatch)
    expect(isOfferApplicable(durgaPujaOffer, 'Chakdah', 'New Admission')).toBe(false);

    // Ranaghat Re-admission -> Not Applicable (Admission type mismatch)
    expect(isOfferApplicable(durgaPujaOffer, 'Ranaghat', 'Re-admission')).toBe(false);

    // All Centers offer -> Applicable to any center
    const universalOffer: Partial<OfferPlan> = {
      id: 'off-2',
      title: 'New Year Resolution Plan',
      is_active: true,
      applicable_center: 'All',
      admission_type_applicable: 'All',
    };
    expect(isOfferApplicable(universalOffer, 'Madanpur', 'Re-admission')).toBe(true);
  });

  it('should reactivate an inactive member upon re-admission with updated plan and cleared debt', () => {
    const inactiveMember: User = {
      id: 'usr-inactive-1',
      member_id: 'HG-RAN-088',
      full_name: 'Kallol Sen',
      email: 'kallol@gmail.com',
      phone: '9830098300',
      role: 'member',
      center: 'Ranaghat',
      created_at: '2025-01-01',
      is_active: false,
      days_overdue: 75,
      approval_status: 'approved',
      admission_type: 'New Admission',
    };

    const reAdmitted = executeReAdmissionMock(inactiveMember, 'quarterly', 1800);
    expect(reAdmitted.is_active).toBe(true);
    expect(reAdmitted.days_overdue).toBe(0);
    expect(reAdmitted.admission_type).toBe('Re-admission');
    expect(reAdmitted.membership?.status).toBe('active');
    expect(reAdmitted.membership?.fee_paid).toBe(1800);
  });
});
