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

const COMMON_PATTERNS = ['password', '123456', 'qwerty', 'letmein', 'admin', 'hercules', 'gym'];

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const value = password || '';
  const lower = value.toLowerCase();
  const uniqueChars = new Set(value).size;

  const checks: PasswordRuleCheck[] = [
    { key: 'length', label: 'At least 8 characters', passed: value.length >= 8 },
    { key: 'upper', label: 'At least one uppercase letter', passed: /[A-Z]/.test(value) },
    { key: 'lower', label: 'At least one lowercase letter', passed: /[a-z]/.test(value) },
    { key: 'digit', label: 'At least one number', passed: /\d/.test(value) },
    { key: 'special', label: 'At least one special character', passed: /[^A-Za-z0-9]/.test(value) },
    { key: 'space', label: 'No spaces', passed: !/\s/.test(value) },
    { key: 'variety', label: 'More character variety', passed: uniqueChars >= 4 },
    {
      key: 'common',
      label: 'Avoid common words or patterns',
      passed: !COMMON_PATTERNS.some((pattern) => lower.includes(pattern)),
    },
  ];

  const score = checks.filter((rule) => rule.passed).length;
  const total = checks.length;
  const unmetLabels = checks.filter((rule) => !rule.passed).map((rule) => rule.label);

  return {
    checks,
    isStrong: unmetLabels.length === 0,
    score,
    total,
    unmetLabels,
  };
}
