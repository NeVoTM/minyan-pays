import { normalizePhone } from "./phone.js";

function twilioConfigured(): {
  sid: string;
  token: string;
  from: string;
} | null {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!sid || !token || !from) return null;
  return { sid, token, from };
}

/**
 * Sends a transactional SMS via Twilio REST (no SDK).
 * Returns whether the message was accepted by Twilio.
 */
export async function sendProfileVerificationSms(
  phoneRaw: string,
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cfg = twilioConfigured();
  if (!cfg) {
    return { ok: false, error: "SMS provider not configured" };
  }
  const to = normalizePhone(phoneRaw);
  const body = `Your MinyanPays verification code is ${code}. It expires in 10 minutes.`;
  const auth = Buffer.from(`${cfg.sid}:${cfg.token}`).toString("base64");
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15_000);
    const r = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${cfg.sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: cfg.from, Body: body }),
        signal: ac.signal,
      }
    ).finally(() => clearTimeout(t));
    if (r.ok) return { ok: true };
    const text = await r.text();
    return {
      ok: false,
      error: text.slice(0, 200) || `Twilio HTTP ${r.status}`,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "SMS send failed",
    };
  }
}

export function isTwilioReady(): boolean {
  return twilioConfigured() !== null;
}
