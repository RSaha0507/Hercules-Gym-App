import { describe, it, expect } from 'vitest';
import {
  calculateFineForDay,
  calculateMemberTermExpiry,
  getPlanStandardFee,
  getCenterTheme,
} from '../src/context/GymContext';
import { User, PaymentRecord } from '../src/types';

describe('Center Color Themes', () => {
  it('assigns correct gradient and accent colors per center', () => {
    const ranaghatTheme = getCenterTheme('Ranaghat', 'dark');
    expect(ranaghatTheme.gradient).toContain('amber');
    expect(ranaghatTheme.gradient).toContain('rose');
    expect(ranaghatTheme.name).toBe('Ranaghat Center');

    const chakdahTheme = getCenterTheme('Chakdah', 'dark');
    expect(chakdahTheme.gradient).toContain('amber');
    expect(chakdahTheme.gradient).toContain('yellow');
    expect(chakdahTheme.name).toBe('Chakdah Center');

    const madanpurTheme = getCenterTheme('Madanpur', 'dark');
    expect(madanpurTheme.gradient).toContain('lime');
    expect(madanpurTheme.gradient).toContain('emerald');
    expect(madanpurTheme.name).toBe('Madanpur Center');
  });
});

describe('Member Inactivity and Term Month 1st Rule', () => {
  it('calculates exact 1st of month expiration based on term duration', () => {
    // January 15th join date + quarterly (3 months) -> Expiry is April 1st
    const jan15 = '2026-01-15';
    const quarterlyExpiry = calculateMemberTermExpiry(jan15, 'quarterly');
    expect(quarterlyExpiry.getFullYear()).toBe(2026);
    expect(quarterlyExpiry.getMonth()).toBe(3); // April (0-indexed: 3)
    expect(quarterlyExpiry.getDate()).toBe(1);

    // January 20th join date + monthly (1 month) -> Expiry is February 1st
    const monthlyExpiry = calculateMemberTermExpiry(jan15, 'monthly');
    expect(monthlyExpiry.getMonth()).toBe(1); // February (0-indexed: 1)
    expect(monthlyExpiry.getDate()).toBe(1);

    // January 10th join date + annual (12 months) -> Expiry is January 1st next year
    const annualExpiry = calculateMemberTermExpiry(jan15, 'annual');
    expect(annualExpiry.getFullYear()).toBe(2027);
    expect(annualExpiry.getMonth()).toBe(0); // January
    expect(annualExpiry.getDate()).toBe(1);
  });
});

describe('Fine Calculation & Splitting Engine', () => {
  it('charges zero fine during days 1 to 7 of a month', () => {
    const day5 = new Date(2026, 3, 5); // April 5th
    expect(calculateFineForDay(day5)).toBe(0);

    const day7 = new Date(2026, 3, 7); // April 7th
    expect(calculateFineForDay(day7)).toBe(0);
  });

  it('charges 5 rupees per passing day from 8th onwards', () => {
    const day8 = new Date(2026, 3, 8); // 8th day -> 1 day late -> ₹5
    expect(calculateFineForDay(day8)).toBe(5);

    const day10 = new Date(2026, 3, 10); // 10th day -> 3 days late -> ₹15
    expect(calculateFineForDay(day10)).toBe(15);

    const day20 = new Date(2026, 3, 20); // 20th day -> 13 days late -> ₹65
    expect(calculateFineForDay(day20)).toBe(65);
  });

  it('splits payment into normal fee and fine portion correctly', () => {
    const normalFee = getPlanStandardFee('quarterly'); // ₹1900
    const moneyPaidWithFine = 1940; // 1900 normal + 40 fine

    const normalAmount = Math.min(moneyPaidWithFine, normalFee);
    const fineAmount = Math.max(0, moneyPaidWithFine - normalFee);

    expect(normalAmount).toBe(1900);
    expect(fineAmount).toBe(40);
  });
});
