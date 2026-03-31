export function normalizePhone(p: string): string {
  const digits = p.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  return `+${digits}`;
}

export function zelleDigits(s: string | null | undefined): string | null {
  if (!s?.trim()) return null;
  const d = s.replace(/\D/g, "");
  return d.length ? d : null;
}
