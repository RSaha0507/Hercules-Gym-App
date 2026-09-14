export interface PasswordRuleCheck {
  key: string;
  label: string;
  passed: boolean;
}

export interface PasswordStrengthResult {
  checks: PasswordRuleCheck[];
  isStrong: boolean;
  score: number;
  total: number;
  unmetLabels: string[];
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const value = password || '';
  const uniqueChars = new Set(value).size;

  const checks: PasswordRuleCheck[] = [
    { key: 'length', label: 'At least 4 characters', passed: value.length >= 4 },
    { key: 'variety', label: 'Good variety (optional)', passed: uniqueChars >= 3 || value.length >= 6 },
  ];

  const score = checks.filter((rule) => rule.passed).length;
  const total = checks.length;
  const unmetLabels = checks.filter((rule) => !rule.passed).map((rule) => rule.label);

  return {
    checks,
    // Relaxed for local gym: any password with at least 4 characters is valid
    isStrong: value.length >= 4,
    score: value.length >= 4 ? 2 : value.length > 0 ? 1 : 0,
    total: 2,
    unmetLabels: value.length < 4 ? ['Password must be at least 4 characters'] : [],
  };
}

