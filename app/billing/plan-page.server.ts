import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

/**
 * Where merchants go to subscribe: Shopify's hosted plan selection page.
 *
 * This app is enrolled in Shopify App Pricing, which forbids the Billing API
 * outright — appSubscriptionCreate answers "Managed Pricing Apps cannot use the
 * Billing API (to create charges)". Shopify owns the plan page, the charge,
 * trials, proration and test charges; our only job is to send the merchant
 * there and later read the resulting subscription.
 *
 * Linking at a single plan (.../pricing_plans/<plan-handle>) was tried and does
 * not work — that path is undocumented and Shopify does not honour it. The plan
 * list is the only supported destination.
 *
 * Returns null when the handle can't be resolved, so callers can decide whether
 * that is fatal.
 */
export async function planSelectionUrl(admin: AdminApiContext): Promise<string | null> {
  // Queried rather than hardcoded: the handle lives in the Partner Dashboard
  // listing, not in the repo, and differs per app config.
  const res = await admin.graphql(`#graphql
    query AppHandle {
      currentAppInstallation {
        app { handle }
      }
    }
  `);
  const appHandle = (await res.json())?.data?.currentAppInstallation?.app?.handle;

  if (!appHandle) {
    console.error("[billing] could not resolve the app handle from currentAppInstallation");
    return null;
  }

  // The library rewrites shopify://admin/... to
  // https://admin.shopify.com/store/<shop>/charges/<handle>/pricing_plans.
  return `shopify://admin/charges/${appHandle}/pricing_plans`;
}

/**
 * The only route an unpaid merchant may still open, so someone with a billing
 * problem can contact us rather than being bounced in a loop.
 *
 * Note /app/pricing is deliberately not exempt: unpaid merchants are sent to
 * Shopify's hosted plan page and reach no in-app page at all.
 */
const UNLOCKED_PATHS = ["/app/helpandsupport"];

export function isUnlockedPath(pathname: string): boolean {
  return UNLOCKED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Dev-only escape hatch for the paywall.
 *
 * Without it, a store with no active subscription cannot open the app at all,
 * which makes local work on a fresh dev store impossible. Deliberately inert in
 * production so a stray env var can never switch the paywall off for real
 * merchants.
 */
export function billingBypassed(): boolean {
  const bypassed =
    process.env.SKIP_BILLING === "true" && process.env.NODE_ENV !== "production";

  if (bypassed) {
    console.warn("[billing] SKIP_BILLING is set — paywall bypassed (development only)");
  }
  return bypassed;
}
