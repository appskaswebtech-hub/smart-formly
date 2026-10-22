import { PLANS } from "./plans";

/**
 * Which Quick Settings a plan may use, and how that is enforced.
 *
 * The badges on the tiles used to be decoration: every merchant could open
 * every panel and save it. This module is the one place that says what is paid
 * for, so the two builder pages and the save actions cannot disagree.
 */

export type Tier = "free" | "base" | "pro" | "pro_plus";

/**
 * What a tile can require. Free and Base are the entry tiers, so neither is
 * ever a requirement — a tile needing nothing is simply left unannotated.
 */
export type PaidTier = Exclude<Tier, "free" | "base">;

/** Low to high. Index is the comparison. */
const TIER_ORDER: Tier[] = ["free", "base", "pro", "pro_plus"];

export const TOP_TIER: Tier = "pro_plus";

export function tierAllows(has: Tier, needs: Tier | undefined): boolean {
  if (!needs) return true; // untiered tile — always available

  /* Free is deliberately exempt, not an oversight.
     It is a full-featured trial capped at one form, so it opens every tile
     even though it sits lowest in TIER_ORDER — the index comparison below
     would otherwise deny it everything. Removing this line is the obvious
     "fix" for someone who has not read this; don't. */
  if (has === "free") return true;

  return TIER_ORDER.indexOf(has) >= TIER_ORDER.indexOf(needs);
}

/** Plan id in plans.ts → the tier it grants. */
const TIER_BY_PLAN_ID: Record<string, Tier> = {
  free: "free",
  base: "base",
  pro: "pro",
  proplus: "pro_plus",
};

/**
 * Resolves a Shopify subscription name to a tier.
 *
 * Names are matched exactly, because the real names live in the Partner
 * Dashboard and plans.ts only mirrors them by hand.
 *
 * An unrecognised name **fails open to the top tier**. A rename in the Partner
 * Dashboard would otherwise silently strip paid features from every subscriber,
 * and wrongly locking out a merchant who has paid is far worse than briefly
 * granting too much. Same reasoning as the email validator, which never blocks
 * on a check that is itself broken.
 */
export function planTier(planName: string | null | undefined): Tier {
  if (!planName) return "free";

  const plan = PLANS.find((p) => p.name === planName);
  if (plan) return TIER_BY_PLAN_ID[plan.id] ?? "free";

  console.error(
    `[billing] subscription "${planName}" matches no plan in plans.ts ` +
      `(known: ${PLANS.map((p) => p.name).join(", ")}) — granting ${TOP_TIER} so a ` +
      `paying merchant is not locked out. Reconcile plans.ts with the Partner Dashboard.`,
  );
  return TOP_TIER;
}

/**
 * The Quick Settings tiles, in display order.
 *
 * A tile with no `plan` is included in every tier. The rest are reserved for
 * the tier named — except on Free, which opens everything (see tierAllows):
 * Free is a full-featured trial limited instead by its single form.
 */
export const PILLS: { key: string; plan?: PaidTier }[] = [
  { key: "form_details" },
  { key: "ticket_system",            plan: "pro_plus" },
  { key: "allow_form_access",        plan: "pro_plus" },
  { key: "form_schedule",            plan: "pro" },
  { key: "customize_form_messages",  plan: "pro" },
  { key: "customize_form_scrolling", plan: "pro" },
  { key: "after_submission_action" },
  { key: "after_submit_script",      plan: "pro_plus" },
  { key: "auto_responder_email" },
  { key: "admin_email" },
  { key: "email_export",             plan: "pro_plus" },
  { key: "form_load_as_popup",       plan: "pro" },
];

/**
 * How many forms a tier allows; null means unlimited.
 *
 * This is the only thing plans differ by, so it is the single lever the whole
 * paywall turns on.
 */
export function formLimitFor(tier: Tier): number | null {
  const plan = PLANS.find((p) => TIER_BY_PLAN_ID[p.id] === tier);
  return plan ? plan.formLimit : 1; // unknown tier: the most restrictive
}

/** Whether a shop holding `count` forms may create another. */
export function canCreateForm(tier: Tier, count: number): boolean {
  const limit = formLimitFor(tier);
  return limit === null || count < limit;
}

/**
 * The `extra` keys each gated tile writes, extracted from the panels rather
 * than listed from memory — a key missing here is a feature that looks gated
 * but saves anyway.
 *
 * Only gated tiles appear. `form_load_as_popup` also *reads*
 * `submitButtonText`, which belongs to `customize_form_messages`; reads do not
 * matter here, only what a panel can write.
 */
export const GATED_EXTRA_KEYS: Record<string, readonly string[]> = {
  ticket_system: ["ticketEnabled"],
  allow_form_access: ["allowLoggedInOnly", "loginMessage"],
  form_schedule: [
    "scheduleStartDate", "scheduleEndDate", "scheduleStartTime", "scheduleEndTime",
    "scheduleMaxSubmissions", "beforeStartMessage", "afterEndMessage", "submissionClosedMessage",
  ],
  customize_form_messages: ["submitButtonText", "errorMessage", "requiredFieldMessage"],
  customize_form_scrolling: ["scrollBehavior", "scrollOffset"],
  after_submit_script: ["afterSubmitScript"],
  email_export: ["emailExportEnabled", "emailExportTo", "emailExportFrequency"],
  form_load_as_popup: [
    "popupEnabled", "popupTrigger", "popupButtonText", "popupButtonBg", "popupButtonColor",
    "popupDelay", "popupOverlayBg", "popupOverlayOpacity", "popupCloseOnOverlay",
    "popupWidth", "popupShowOnce",
  ],
};

/**
 * The tiles a tier unlocks that the tier below does not — what a plan card
 * should advertise as the reason to move up.
 *
 * Derived from PILLS, the same config that enforces access, so the pricing page
 * cannot promise something the app then refuses.
 */
export function tierExclusives(tier: Tier): string[] {
  return PILLS.filter((p) => (p.plan ?? "base") === tier).map((p) => p.key);
}

/** Every tile a tier can use, for the comparison table. */
export function tierIncludes(tier: Tier): string[] {
  return PILLS.filter((p) => tierAllows(tier, p.plan)).map((p) => p.key);
}

/** The tier below this one, or null for the entry plan. */
export function previousTier(tier: Tier): Tier | null {
  const i = TIER_ORDER.indexOf(tier);
  return i > 0 ? TIER_ORDER[i - 1] : null;
}

/** The tier a given `extra` key requires, or undefined when it is free. */
function tierForExtraKey(key: string): PaidTier | undefined {
  for (const pill of PILLS) {
    if (!pill.plan) continue;
    if (GATED_EXTRA_KEYS[pill.key]?.includes(key)) return pill.plan;
  }
  return undefined;
}

/**
 * Applies the tier to the settings a merchant just submitted.
 *
 * Features already switched on are grandfathered: a merchant below the tier
 * cannot change a gated setting or turn one on somewhere new, but whatever is
 * already stored is carried forward untouched. Stripping instead would wipe a
 * working feature the next time they saved anything on that form.
 *
 * @param incoming  what the browser sent
 * @param stored    what is already saved, or null when creating a form
 * @param tier      the shop's tier
 */
export function applyTierToExtra<T extends Record<string, unknown>>(
  incoming: T,
  stored: Record<string, unknown> | null,
  tier: Tier,
): T {
  const result: Record<string, unknown> = { ...incoming };

  for (const key of Object.keys(incoming)) {
    const needs = tierForExtraKey(key);
    if (tierAllows(tier, needs)) continue;

    if (stored && Object.prototype.hasOwnProperty.call(stored, key)) {
      // Grandfathered: keep what the form already has.
      result[key] = stored[key];
    } else {
      // Nothing stored to protect, so the merchant may not set it at all.
      delete result[key];
    }
  }

  return result as T;
}
