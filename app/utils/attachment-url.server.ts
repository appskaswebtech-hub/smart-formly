import crypto from "node:crypto";

/**
 * Signed download links for uploaded files.
 *
 * Emailed links are opened in a plain browser tab, outside the Shopify admin,
 * so `authenticate.admin` cannot authorise them. Instead each link carries an
 * expiry and an HMAC over the attachment id, signed with the app secret. Anyone
 * holding the link can download that one file until it expires — the same
 * trade-off as any "share link", and the reason the window is finite.
 */

const DEFAULT_TTL_DAYS = 90;

function secret(): string | null {
  return process.env.SHOPIFY_API_SECRET || null;
}

function sign(id: string, expiresAt: number, key: string): string {
  return crypto.createHmac("sha256", key).update(`${id}.${expiresAt}`).digest("hex");
}

/**
 * Signed path for an attachment, e.g. `/api/attachments/<id>?e=…&s=…`.
 *
 * Used by the Submissions page: its download opens in a new tab, which carries
 * no embedded-app session, so an unsigned link would land the merchant on the
 * app's login screen instead of the file.
 */
export function signedAttachmentPath(
  id: string,
  ttlDays: number = DEFAULT_TTL_DAYS,
): string | null {
  const key = secret();
  if (!key) {
    console.warn("[SF:FILES] cannot sign a download link — SHOPIFY_API_SECRET is missing");
    return null;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60;
  const query = new URLSearchParams({ e: String(expiresAt), s: sign(id, expiresAt, key) });
  return `/api/attachments/${encodeURIComponent(id)}?${query}`;
}

/**
 * Absolute signed URL, for links that leave the app entirely — the merchant's
 * notification email. Null when the app URL or secret is missing.
 */
export function attachmentDownloadUrl(
  id: string,
  ttlDays: number = DEFAULT_TTL_DAYS,
): string | null {
  const base = process.env.SHOPIFY_APP_URL;
  const path = signedAttachmentPath(id, ttlDays);

  if (!base || !path) {
    if (!base) console.warn("[SF:FILES] cannot build a download link — SHOPIFY_APP_URL is missing");
    return null;
  }

  return new URL(path, base).toString();
}

/** True when `s` is a live signature for `id`. Rejects expired links. */
export function verifyAttachmentUrl(id: string, e: string | null, s: string | null): boolean {
  const key = secret();
  if (!key || !e || !s) return false;

  const expiresAt = Number(e);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;

  const expected = sign(id, expiresAt, key);
  // Length check first: timingSafeEqual throws on a length mismatch.
  if (expected.length !== s.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(s));
}
