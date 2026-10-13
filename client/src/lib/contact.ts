/**
 * TalkEasy — official contact identity.
 *
 * Single source of truth for the public support email. This is intentionally
 * separate from the transactional SMTP/resend sender (`EMAIL_FROM`) and from any
 * authentication identity: it is the address users write to for support,
 * privacy, legal, feedback and reviews.
 */

export const SUPPORT_EMAIL = "talkeasysupport@gmail.com";

export interface MailtoOptions {
  subject?: string;
  body?: string;
}

/**
 * Builds a `mailto:` URL with correctly percent-encoded subject/body. Spaces are
 * encoded as %20 (not "+") so every mail client renders them literally.
 */
export function buildMailto({ subject, body }: MailtoOptions = {}): string {
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${SUPPORT_EMAIL}${params.length ? `?${params.join("&")}` : ""}`;
}

/** Plain support link (no prefilled subject). */
export const SUPPORT_MAILTO = buildMailto();

/** Feedback / review links with a prefilled, recognisable subject. */
export const FEEDBACK_MAILTO = buildMailto({ subject: "TalkEasy Feedback" });
export const REVIEW_MAILTO = buildMailto({ subject: "TalkEasy Review" });

/** Visible text for a contact link, e.g. "Email talkeasysupport@gmail.com". */
export const SUPPORT_EMAIL_TEXT = SUPPORT_EMAIL;
