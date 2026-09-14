import { describe, it, expect } from 'vitest';

export interface RefundRecord {
  member_id: string;
  member_name: string;
  paid_amount: number;
  refund_percentage: number;
  refund_amount: number;
  reason: string;
  payout_timeline: string;
  processed_at: string;
  permanent_removal: boolean;
}

export function processMemberRefundAndDeparture(
  member: { id: string; name: string; paid_amount: number },
  refundPercentage: number,
  reason: string,
  timeline: string,
  permanentRemoval: boolean
): RefundRecord {
  const percent = Math.max(0, Math.min(100, refundPercentage));
  const refundAmount = Math.round((member.paid_amount * percent) / 100);

  return {
    member_id: member.id,
    member_name: member.name,
    paid_amount: member.paid_amount,
    refund_percentage: percent,
    refund_amount: refundAmount,
    reason: reason.trim() || 'Voluntary departure / Member request',
    payout_timeline: timeline || 'Within 3 business days',
    processed_at: new Date().toISOString(),
    permanent_removal: permanentRemoval,
  };
}

describe('Member Departure & Refund System Verification', () => {
  const sampleMember = {
    id: 'HG-RAN-102',
    name: 'Rahul Sharma',
    paid_amount: 4500,
  };

  it('should calculate 100% full refund correctly', () => {
    const refund = processMemberRefundAndDeparture(
      sampleMember,
      100,
      'Relocating to another city',
      'Within 3 business days',
      false
    );

    expect(refund.refund_percentage).toBe(100);
    expect(refund.refund_amount).toBe(4500);
    expect(refund.reason).toBe('Relocating to another city');
    expect(refund.permanent_removal).toBe(false);
  });

  it('should calculate partial refunds and clamp values between 0 and 100', () => {
    const partialRefund = processMemberRefundAndDeparture(
      sampleMember,
      50,
      'Early cancellation with deduction',
      'Instant UPI',
      false
    );
    expect(partialRefund.refund_amount).toBe(2250);

    const clampedRefund = processMemberRefundAndDeparture(
      sampleMember,
      150, // Over 100
      'Full claim',
      'Instant',
      true
    );
    expect(clampedRefund.refund_percentage).toBe(100);
    expect(clampedRefund.refund_amount).toBe(4500);
    expect(clampedRefund.permanent_removal).toBe(true);
  });
});
