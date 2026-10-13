/**
 * TalkEasy v6.1.3 — transactional email service.
 *
 * Delivers password-reset and notification emails through a configurable
 * provider. Providers are selected from environment variables; nothing is
 * hardcoded and no secrets are ever logged.
 *
 * Supported providers:
 *   - resend   (RESEND_API_KEY)                     — HTTP API
 *   - sendgrid (SENDGRID_API_KEY)                   — HTTP API
 *   - mailgun  (MAILGUN_API_KEY + MAILGUN_DOMAIN)   — HTTP API
 *   - smtp     (SMTP_HOST/PORT/USER/PASSWORD)       — requires the optional
 *                                                     `nodemailer` package
 *   - console  (development only)                   — logs a redacted preview
 *   - none     (no provider configured)
 *
 * Security rules enforced here:
 *   - In production a real provider MUST be configured; otherwise sending fails
 *     loudly instead of silently pretending an email was sent.
 *   - The `console` provider is refused in production.
 *   - Message bodies are never logged (reset links / tokens stay private).
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailResult {
  delivered: boolean;
  provider: EmailProvider;
  id?: string;
  /** Present only when delivered === false. Never contains the message body. */
  error?: string;
}

export type EmailProvider = "resend" | "sendgrid" | "mailgun" | "smtp" | "console" | "none";

export class EmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigurationError";
  }
}

export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

const isProduction = () => process.env.NODE_ENV === "production";

/** Redacts an email address for safe logging: "jane@example.com" -> "j***@example.com". */
export function maskEmail(email: string): string {
  const [local, domain] = String(email).split("@");
  if (!domain) return "***";
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}

export function resolveEmailProvider(): EmailProvider {
  const explicit = (process.env.EMAIL_PROVIDER || "").trim().toLowerCase();
  if (explicit && explicit !== "auto") {
    if (["resend", "sendgrid", "mailgun", "smtp", "console", "none"].includes(explicit)) {
      return explicit as EmailProvider;
    }
    return "none";
  }
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) return "mailgun";
  if (process.env.SMTP_HOST) return "smtp";
  return isProduction() ? "none" : "console";
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM || process.env.SMTP_FROM || "";
}

export function getEmailFromName(): string {
  return process.env.EMAIL_FROM_NAME || "TalkEasy";
}

/**
 * Public support contact shown to users. Deliberately separate from EMAIL_FROM:
 * the sender is a verified no-reply address on a domain we control, while this
 * is the address people actually email. Never use it as the SMTP `from`.
 */
export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL || "talkeasysupport@gmail.com";
}

/** Public application URL used to build reset links. Never derived from Host headers. */
export function getAppBaseUrl(): string {
  const raw =
    process.env.APP_PUBLIC_URL ||
    process.env.PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VITE_APP_URL ||
    "";
  return raw.replace(/\/+$/, "");
}

/**
 * Reports whether a real transactional provider is configured.
 * `console` counts as configured only outside production.
 */
export function getEmailConfigStatus(): { configured: boolean; provider: EmailProvider; reason?: string } {
  const provider = resolveEmailProvider();
  if (provider === "none") {
    return { configured: false, provider, reason: "No email provider configured (set EMAIL_PROVIDER and credentials)." };
  }
  if (provider === "console" && isProduction()) {
    return { configured: false, provider, reason: "The console email provider cannot be used in production." };
  }
  if (provider !== "console" && !getEmailFrom()) {
    return { configured: false, provider, reason: "EMAIL_FROM is not set." };
  }
  if (provider === "mailgun" && !process.env.MAILGUN_DOMAIN) {
    return { configured: false, provider, reason: "MAILGUN_DOMAIN is not set." };
  }
  return { configured: true, provider };
}

function assertConfigured(provider: EmailProvider): void {
  if (provider === "none") {
    throw new EmailConfigurationError("No email provider configured. Set EMAIL_PROVIDER plus its credentials.");
  }
  if (provider === "console" && isProduction()) {
    throw new EmailConfigurationError("The console email provider cannot be used in production.");
  }
  if (provider !== "console" && !getEmailFrom()) {
    throw new EmailConfigurationError("EMAIL_FROM must be set for the configured email provider.");
  }
}

async function deliverViaResend(msg: EmailMessage): Promise<string | undefined> {
  const from = getEmailFromName() ? `${getEmailFromName()} <${getEmailFrom()}>` : getEmailFrom();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html }),
  });
  if (!res.ok) {
    const detail = await safeText(res);
    throw new EmailDeliveryError(`Resend rejected the email (HTTP ${res.status})${detail ? `: ${detail}` : ""}`);
  }
  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return data.id;
}

async function deliverViaSendgrid(msg: EmailMessage): Promise<string | undefined> {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: msg.to }] }],
      from: { email: getEmailFrom(), name: getEmailFromName() },
      subject: msg.subject,
      content: [
        { type: "text/plain", value: msg.text },
        ...(msg.html ? [{ type: "text/html", value: msg.html }] : []),
      ],
    }),
  });
  if (res.status !== 202 && !res.ok) {
    const detail = await safeText(res);
    throw new EmailDeliveryError(`SendGrid rejected the email (HTTP ${res.status})${detail ? `: ${detail}` : ""}`);
  }
  return res.headers.get("x-message-id") || undefined;
}

async function deliverViaMailgun(msg: EmailMessage): Promise<string | undefined> {
  const domain = process.env.MAILGUN_DOMAIN as string;
  const body = new URLSearchParams();
  body.set("from", `${getEmailFromName()} <${getEmailFrom()}>`);
  body.set("to", msg.to);
  body.set("subject", msg.subject);
  body.set("text", msg.text);
  if (msg.html) body.set("html", msg.html);

  const auth = Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64");
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const detail = await safeText(res);
    throw new EmailDeliveryError(`Mailgun rejected the email (HTTP ${res.status})${detail ? `: ${detail}` : ""}`);
  }
  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return data.id;
}

async function deliverViaSmtp(msg: EmailMessage): Promise<string | undefined> {
  const specifier = "nodemailer";
  let nodemailer: any;
  try {
    nodemailer = await import(/* @vite-ignore */ specifier);
    nodemailer = nodemailer.default ?? nodemailer;
  } catch {
    throw new EmailConfigurationError(
      "EMAIL_PROVIDER=smtp requires the optional 'nodemailer' package to be installed.",
    );
  }
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  const info = await transport.sendMail({
    from: `${getEmailFromName()} <${getEmailFrom()}>`,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  });
  return info?.messageId;
}

async function safeText(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.slice(0, 300).replace(/[\r\n]+/g, " ");
  } catch {
    return "";
  }
}

/**
 * Sends an email. Returns a result object; throws EmailConfigurationError when
 * no provider is configured and EmailDeliveryError when a provider rejects the
 * message. Never throws for the console provider.
 */
export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const provider = resolveEmailProvider();
  assertConfigured(provider);

  if (!msg.to || !msg.subject) {
    throw new EmailDeliveryError("Email requires a recipient and subject.");
  }

  switch (provider) {
    case "console": {
      console.log(
        `[email:console] would send "${msg.subject}" to ${maskEmail(msg.to)} (development transport, body withheld)`,
      );
      return { delivered: true, provider };
    }
    case "resend":
      return { delivered: true, provider, id: await deliverViaResend(msg) };
    case "sendgrid":
      return { delivered: true, provider, id: await deliverViaSendgrid(msg) };
    case "mailgun":
      return { delivered: true, provider, id: await deliverViaMailgun(msg) };
    case "smtp":
      return { delivered: true, provider, id: await deliverViaSmtp(msg) };
    default:
      return { delivered: false, provider, error: "No provider configured" };
  }
}

/** Builds the password-reset link from trusted configuration only. */
export function buildPasswordResetUrl(rawToken: string): string {
  const base = getAppBaseUrl();
  if (!base) {
    throw new EmailConfigurationError(
      "APP_PUBLIC_URL (or PUBLIC_APP_URL/APP_URL) must be set to build password-reset links.",
    );
  }
  return `${base}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

export function buildPasswordResetEmail(rawToken: string, expiresInMinutes: number): EmailMessage & { to: string } {
  const url = buildPasswordResetUrl(rawToken);
  const text = [
    "We received a request to reset your TalkEasy password.",
    "",
    `Reset your password using this link (expires in ${expiresInMinutes} minutes):`,
    url,
    "",
    "If you did not request this, you can safely ignore this email — your password will not change.",
    "",
    `Need help? Contact us at ${getSupportEmail()}.`,
    "",
    "— The TalkEasy team",
  ].join("\n");
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
  <h2 style="color:#0d9488">Reset your TalkEasy password</h2>
  <p>We received a request to reset your TalkEasy password.</p>
  <p><a href="${url}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Reset password</a></p>
  <p>This link expires in ${expiresInMinutes} minutes and can be used once.</p>
  <p style="color:#64748b;font-size:13px">If you did not request this, you can safely ignore this email — your password will not change.</p>
  <p style="color:#64748b;font-size:13px">Need help? Contact us at <a href="mailto:${getSupportEmail()}" style="color:#0d9488">${getSupportEmail()}</a>.</p>
  </body></html>`;
  return { to: "", subject: "Reset your TalkEasy password", text, html };
}
