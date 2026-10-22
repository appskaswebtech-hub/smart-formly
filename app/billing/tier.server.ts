import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

import { planTier, TOP_TIER, type Tier } from "./features";
import { billingBypassed } from "./plan-page.server";

/**
 * The shop's plan tier, read from its active subscription.
 *
 * Save actions cannot trust the tier the browser was rendered with — anyone can
 * post a crafted request — so they resolve it again here. The same query the
 * app route runs for the paywall.
 */
export async function shopTier(admin: AdminApiContext): Promise<Tier> {
  if (billingBypassed()) return TOP_TIER;

  try {
    const res = await admin.graphql(`#graphql
      query ShopTier {
        currentAppInstallation {
          activeSubscriptions { id name status }
        }
      }
    `);
    const subs: { name: string; status: string }[] =
      (await res.json())?.data?.currentAppInstallation?.activeSubscriptions ?? [];
    const active = subs.find((s) => s.status === "ACTIVE") ?? null;
    return planTier(active?.name ?? null);
  } catch (err) {
    // A billing lookup that fell over must not block a save. Grant the top tier
    // and log it, rather than silently stripping a paying merchant's settings
    // because Shopify was briefly unreachable.
    console.error("[billing] could not resolve the shop tier, granting", TOP_TIER, err);
    return TOP_TIER;
  }
}
