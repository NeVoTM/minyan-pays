import { normalizePhone } from "./phone.js";

/** v1: JSON { v:1, p: "10-digit phone digits", pin: string } → base64url */
export function decodePunchSmartCode(raw: string): {
  phone: string;
  pin: string;
} | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const pad = s.length % 4 === 0 ? s : s + "=".repeat(4 - (s.length % 4));
    const json = Buffer.from(pad.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
      "utf8"
    );
    const o = JSON.parse(json) as { v?: unknown; p?: unknown; pin?: unknown };
    if (o.v !== 1 || typeof o.p !== "string" || typeof o.pin !== "string") {
      return null;
    }
    const digits = o.p.replace(/\D/g, "");
    if (digits.length < 10) return null;
    const phone = normalizePhone(o.p);
    if (o.pin.length < 4 || o.pin.length > 12) return null;
    return { phone, pin: o.pin };
  } catch {
    return null;
  }
}
