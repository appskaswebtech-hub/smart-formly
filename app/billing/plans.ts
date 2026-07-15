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
export const PLANS = [
  { id: "base", name: "Base", price: 9.99, trialDays: 7 },
  { id: "pro", name: "Pro", price: 17.99, trialDays: 7 },
  { id: "proplus", name: "Pro+", price: 25.99, trialDays: 7 },
] as const;

export type Plan = (typeof PLANS)[number];
export type PlanId = Plan["id"];

/** Shown on every plan card. Values are `pricing` namespace translation keys. */
export const HIGHLIGHT_KEYS = [
  "designCustomization",
  "exportSubmissions",
  "multipleRecipients",
  "multipleNotifications",
];
