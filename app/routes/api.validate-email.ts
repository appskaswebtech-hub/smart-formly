import { json, type ActionFunctionArgs } from "@remix-run/node";
import dns from "node:dns/promises";

/**
 * Checks an email address for a storefront form, before the shopper submits.
 *
 * Two levels, both cheap:
 *   1. syntax
 *   2. does the domain actually accept mail (DNS MX lookup)
 *
 * The MX lookup is what catches real-world typos — gmial.com and gmail.con
 * are perfectly valid syntax but have no mail exchanger. It cannot prove a
 * specific mailbox exists; nothing short of a paid verification service can,
 * and SMTP probing gets servers blacklisted.
 *
 * Called from the theme extension, so it needs the same open CORS as
 * api.submit.$id.ts.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  Vary: "Origin",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Domains typo'd often enough to be worth suggesting a correction for. */
const COMMON_DOMAINS = [
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "hotmail.com",
  "hotmail.co.uk", "outlook.com", "live.com", "icloud.com", "me.com",
  "aol.com", "proton.me", "protonmail.com", "zoho.com", "yandex.com",
];

/**
 * DNS is slow and repetitive here — a storefront form asks about the same
 * handful of domains all day — so answers are cached in memory.
 */
const CACHE_TTL_MS = 60 * 60 * 1000;
const domainCache = new Map<string, { acceptsMail: boolean; checkedAt: number }>();

function editDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return rows[a.length][b.length];
}

/** Nearest common domain within two edits, e.g. gmial.com -> gmail.com. */
function suggestDomain(domain: string): string | null {
  if (COMMON_DOMAINS.includes(domain)) return null;

  let best: string | null = null;
  let bestDistance = 3;
  for (const candidate of COMMON_DOMAINS) {
    const distance = editDistance(domain, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best;
}

/**
 * DNS codes that actually mean "this domain has no such record". Anything else
 * — ECONNREFUSED, ETIMEOUT, ESERVFAIL — is our resolver having a bad day, not
 * a verdict on the address.
 */
const NO_SUCH_RECORD = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN"]);

/** A domain with only an A record can still receive mail (RFC 5321 §5.1). */
async function hasAddressRecord(domain: string): Promise<boolean> {
  try {
    await dns.resolve(domain);
    return true;
  } catch (err: any) {
    return !NO_SUCH_RECORD.has(err?.code);
  }
}

/**
 * Whether the domain can receive mail.
 *
 * Deliberately fails *open*: if DNS cannot be reached, every address is treated
 * as valid. The alternative is a resolver outage silently blocking every
 * submission on every form, which is far worse than letting a typo through.
 */
async function domainAcceptsMail(domain: string): Promise<boolean> {
  const cached = domainCache.get(domain);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) return cached.acceptsMail;

  let acceptsMail: boolean;
  try {
    const mx = await dns.resolveMx(domain);
    acceptsMail = mx.length > 0 ? true : await hasAddressRecord(domain);
  } catch (err: any) {
    if (!NO_SUCH_RECORD.has(err?.code)) {
      // Transient: answer yes and don't cache it, so the next request retries.
      console.warn(`[SF:EMAIL] DNS unavailable (${err?.code}) — accepting ${domain} unchecked`);
      return true;
    }
    acceptsMail = await hasAddressRecord(domain);
  }

  domainCache.set(domain, { acceptsMail, checkedAt: Date.now() });
  return acceptsMail;
}

export const loader = async () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: CORS_HEADERS });
  }

  let email = "";
  try {
    email = String(((await request.json()) as any)?.email ?? "").trim();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400, headers: CORS_HEADERS });
  }

  if (!EMAIL_RE.test(email)) {
    return json({ valid: false, reason: "format" }, { headers: CORS_HEADERS });
  }

  const domain = email.split("@")[1].toLowerCase();
  const suggestion = suggestDomain(domain);

  // A near-miss on a well-known domain is almost always a typo, and saying so
  // is more useful than waiting on DNS for a domain that may well resolve.
  if (suggestion) {
    return json({ valid: false, reason: "typo", suggestion }, { headers: CORS_HEADERS });
  }

  if (!(await domainAcceptsMail(domain))) {
    return json({ valid: false, reason: "domain" }, { headers: CORS_HEADERS });
  }

  return json({ valid: true }, { headers: CORS_HEADERS });
};
