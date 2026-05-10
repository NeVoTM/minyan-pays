import nodemailer from "nodemailer";

type GmailConfig = { user: string; pass: string };

function gmailConfigured(): GmailConfig | null {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) return null;
  return { user, pass };
}

/**
 * Returns true when an SMTP transport is configured. Used by route handlers
 * to decide whether to require email confirmation or fall back to a dev echo
 * mode (`ADMIN_PASSWORD_VERIFICATION_ECHO=1`).
 */
export function emailConfigured(): boolean {
  return gmailConfigured() !== null;
}

export function adminNotifyEmail(): string {
  const env = process.env.ADMIN_NOTIFY_EMAIL?.trim();
  if (env) return env;
  return "elichalfinny@gmail.com";
}

/**
 * Sends a one-off transactional email via Gmail SMTP. Requires:
 *   GMAIL_USER (e.g. elichalfinny@gmail.com)
 *   GMAIL_APP_PASSWORD (16-char Google App Password — needs 2FA on the account)
 *
 * Returns `{ ok: true }` if Gmail accepted the message; otherwise an error.
 */
export async function sendEmail(args: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const cfg = gmailConfigured();
  if (!cfg) {
    return { ok: false, error: "Email provider not configured" };
  }
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  try {
    await transport.sendMail({
      from: `"MinyanPays" <${cfg.user}>`,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "send failed";
    return { ok: false, error: message };
  }
}

/** 6-digit numeric code, zero-padded. */
export function generate6DigitCode(): string {
  const buf = new Uint32Array(1);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(buf);
  } else {
    buf[0] = Math.floor(Math.random() * 0xffffffff);
  }
  const n = (buf[0] ?? 0) % 1_000_000;
  return n.toString().padStart(6, "0");
}
