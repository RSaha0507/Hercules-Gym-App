const HAS_TZ_SUFFIX = /(Z|[+-]\d{2}:?\d{2})$/i;

export function toSystemDate(value?: string | Date | null): Date {
  if (value instanceof Date) {
    return value;
  }

  if (!value) {
    return new Date();
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return new Date();
  }

  const normalized = HAS_TZ_SUFFIX.test(trimmed) ? trimmed : `${trimmed}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}
