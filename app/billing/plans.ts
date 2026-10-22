/**
 * Plans as shown in our own UI (the paywall and the pricing page).
 *
 * DISPLAY ONLY. This app uses Shopify App Pricing, so the plans actually sold —
 * their names, amounts and trial lengths — are defined in the Partner Dashboard
 * listing and rendered on Shopify's hosted plan page. Nothing here is charged.
 *
 * That means these numbers can drift from what merchants really pay. Keep them
 * in sync with the Partner Dashboard by hand; the repo cannot enforce it.
 */
/**
 * `formLimit` is the number of forms the plan allows, null meaning unlimited.
 * It is the only thing that differs between plans — every plan includes every
 * feature — so it lives beside the price rather than in the feature config.
 *
 * `name` must match the plan's name in the Partner Dashboard exactly, or
 * planTier() cannot resolve it. "Free" in particular has to exist there before
 * Shopify will offer it at all.
 */
export const PLANS = [
  { id: "free", name: "Free", price: 0, trialDays: 0, formLimit: 1 },
  { id: "base", name: "Base", price: 9.99, trialDays: 7, formLimit: 5 },
  { id: "pro", name: "Pro", price: 17.99, trialDays: 7, formLimit: 20 },
  { id: "proplus", name: "Pro Plus", price: 25.99, trialDays: 7, formLimit: null },
] as const;

export type Plan = (typeof PLANS)[number];
export type PlanId = Plan["id"];

/*
 * Plan cards no longer carry a hand-written highlight list. What each tier
 * unlocks is derived from PILLS in ./features.ts — the same config that
 * enforces access — so the pricing page cannot advertise something the app
 * then refuses. See tierExclusives() / tierIncludes().
 */
