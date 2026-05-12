// // app/config/plans.js

// export const PLANS = {
//   free: {
//     name:        "free",
//     label:       "Free",
//     price:       0,
//     bundleLimit: Infinity,
//     trialDays:   0,
//   },
//   pro: {
//     name:        "pro",
//     label:       "Pro",
//     price:       10.99,
//     bundleLimit: Infinity,
//     trialDays:   0,
//   },
//   advanced: {
//     name:        "advanced",
//     label:       "Advanced",
//     price:       17.99,
//     bundleLimit: Infinity,
//     trialDays:   7,
//   },
// };

// export const DEFAULT_PLAN = PLANS.free;

// export const PLAN_KEYS = Object.keys(PLANS); // ["free", "advanced"]


// ---------12.05.2026--------

// ============================================================
// plans.js — Central Plans Config
// ============================================================

export const PLANS = {
  free: {
    name:        "Free Plan",        // ✅ Shopify registered exact name
    key:         "free",
    label:       "Free",
    price:       0,
    bundleLimit: Infinity,
    trialDays:   0,
    interval:    "EVERY_30_DAYS",
    color:       "#6B7280",
    features: [
      "Unlimited bundles",
      "Basic analytics",
      "Email support",
    ],
  },
  pro: {
    name:        "Pro Plan",         // ✅ Shopify registered exact name
    key:         "pro",
    label:       "Pro",
    price:       10.99,
    bundleLimit: Infinity,
    trialDays:   0,
    interval:    "EVERY_30_DAYS",
    color:       "#3B82F6",
    features: [
      "Unlimited bundles",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
    ],
  },
  advanced: {
    name:        "Advanced Plan",    // ✅ Shopify registered exact name
    key:         "advanced",
    label:       "Advanced",
    price:       17.99,
    bundleLimit: Infinity,
    trialDays:   7,
    interval:    "EVERY_30_DAYS",
    color:       "#8B5CF6",
    features: [
      "Unlimited bundles",
      "Full analytics dashboard",
      "24/7 priority support",
      "Custom branding",
      "API access",
      "Multi-store support",
    ],
  },
};

// Default plan
export const DEFAULT_PLAN = PLANS.free;

// ✅ Fixed: ["free", "pro", "advanced"] — teeno correct
export const PLAN_KEYS = Object.keys(PLANS);

// Shopify billing config — shopify.server.js mein use hoga
export const billingConfig = Object.fromEntries(
  Object.values(PLANS).map((plan) => [
    plan.name,
    {
      amount:       plan.price,
      currencyCode: "USD",
      interval:     plan.interval,
      ...(plan.trialDays > 0 ? { trialDays: plan.trialDays } : {}),
    },
  ])
);

// ============================================================
// Utility Functions
// ============================================================

// Key se plan lo: getPlan("pro") → PLANS.pro
export function getPlan(key) {
  return PLANS[key] ?? DEFAULT_PLAN;
}

// Shopify name se key nikalo: getPlanByShopifyName("Pro Plan") → "pro"
export function getPlanByShopifyName(shopifyName) {
  const entry = Object.entries(PLANS).find(
    ([_, plan]) => plan.name.toLowerCase() === shopifyName.toLowerCase()
  );
  return entry ? entry[0] : null;
}

// Upgrade check: canUpgradeTo("free", "pro") → true
export function canUpgradeTo(current, target) {
  const order = ["free", "pro", "advanced"];
  return order.indexOf(target) > order.indexOf(current);
}

// Price display: formatPrice("pro") → "$10.99/mo"
export function formatPrice(key) {
  const plan = PLANS[key];
  return plan.price === 0 ? "Free" : `$${plan.price.toFixed(2)}/mo`;
}