import { describe, it, expect } from 'vitest';
import { formatMemberId, getBranchCode, getProgrammeCode } from '../src/context/GymContext';

export interface AdmissionPayload {
  full_name: string;
  phone: string;
  email?: string;
  center: 'Ranaghat' | 'Chakdah' | 'Madanpur';
  admission_type: 'New Admission' | 'Re-admission';
  profession?: 'Business' | 'Service' | 'Student' | 'Others';
  guardian_name?: string;
  guardian_phone?: string;
  present_address?: string;
  permanent_address?: string;
  body_weight?: number;
  body_height?: string;
  health_problems?: string;
  enrollment_programme?: 'Gym' | 'Karate' | 'Yoga' | 'Crossfit' | 'Kidsfit';
  enrollment_category?: 'Ladies & Gents' | 'Ladies';
}

export function validateAdmissionForm(data: Partial<AdmissionPayload>) {
  const errors: string[] = [];

  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }

  const phoneDigits = (data.phone || '').replace(/\D/g, '').slice(-10);
  if (phoneDigits.length !== 10) {
    errors.push('Valid 10-digit mobile number required');
  }

  if (data.email && data.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push('Invalid email format');
    }
  }

  if (data.body_weight !== undefined) {
    if (isNaN(data.body_weight) || data.body_weight <= 20 || data.body_weight >= 300) {
      errors.push('Body weight must be between 20kg and 300kg');
    }
  }

  if (!data.center) {
    errors.push('Gym center branch is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function generateMemberId(center: string, serial: number): string {
  const prefix = center.slice(0, 3).toUpperCase();
  const padded = String(serial).padStart(3, '0');
  return `HG-${prefix}-${padded}`;
}

describe('Member Admission & Data Integrity Verification (Fix 1)', () => {
  it('should validate valid admission form payload', () => {
    const validData: Partial<AdmissionPayload> = {
      full_name: 'Sourav Ganguly',
      phone: '9830198301',
      email: 'sourav@herculesgym.in',
      center: 'Ranaghat',
      admission_type: 'New Admission',
      profession: 'Business',
      body_weight: 78.5,
      body_height: '5ft 11in',
      health_problems: 'None',
      present_address: 'Ranaghat Station Road, Nadia',
      enrollment_programme: 'Gym',
      enrollment_category: 'Ladies & Gents',
    };

    const res = validateAdmissionForm(validData);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('should flag missing names and invalid phone numbers', () => {
    const invalidData: Partial<AdmissionPayload> = {
      full_name: ' ',
      phone: '123',
      center: 'Ranaghat',
      admission_type: 'New Admission',
    };

    const res = validateAdmissionForm(invalidData);
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('Full name must be at least 2 characters');
    expect(res.errors).toContain('Valid 10-digit mobile number required');
  });

  it('should format standard Member IDs conforming to XX-YYY-NNNN (Branch-Category-Serial)', () => {
    // Branch codes: Ranaghat -> RG, Chakdah -> CD, Madanpur -> MD
    expect(getBranchCode('Ranaghat')).toBe('RG');
    expect(getBranchCode('Chakdah')).toBe('CD');
    expect(getBranchCode('Madanpur')).toBe('MD');

    // 5 Category codes: Gym -> GYM, Karate -> KRT, Yoga -> YGA, Crossfit -> CRF, Kidsfit -> KID
    expect(getProgrammeCode('Gym')).toBe('GYM');
    expect(getProgrammeCode('Karate')).toBe('KRT');
    expect(getProgrammeCode('Yoga')).toBe('YGA');
    expect(getProgrammeCode('Crossfit')).toBe('CRF');
    expect(getProgrammeCode('Kidsfit')).toBe('KID');

    // XX-YYY-NNNN 4-digit formatting
    expect(formatMemberId('Ranaghat', 'Gym', 1)).toBe('RG-GYM-0001');
    expect(formatMemberId('Chakdah', 'Karate', 5)).toBe('CD-KRT-0005');
    expect(formatMemberId('Madanpur', 'Yoga', 12)).toBe('MD-YGA-0012');
    expect(formatMemberId('Ranaghat', 'Crossfit', 99)).toBe('RG-CRF-0099');
    expect(formatMemberId('Chakdah', 'Kidsfit', 1045)).toBe('CD-KID-1045');
  });
});
