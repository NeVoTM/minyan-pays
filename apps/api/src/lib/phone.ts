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

/** If the value looks like a US phone (10+ digits), normalize to E.164; else trim or null. */
export function normalizeOptionalUsPhone(
  s: string | null | undefined
): string | null {
  if (s == null || s === "") return null;
  const t = s.trim();
  if (!t) return null;
  const digits = t.replace(/\D/g, "");
  if (digits.length >= 10) return normalizePhone(t);
  return t;
}
