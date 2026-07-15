import { json, type ActionFunctionArgs } from "@remix-run/node";

import { authenticate } from "../shopify.server";

/**
 * Sends the merchant to Shopify's hosted plan selection page.
 *
 * This app is enrolled in Shopify App Pricing (formerly Managed Pricing), which
 * forbids the Billing API outright — appSubscriptionCreate answers
 * "Managed Pricing Apps cannot use the Billing API (to create charges)". Shopify
 * owns the plan page, the charge, trials, proration and test charges; our only
 * job is to send the merchant there and later read the resulting subscription.
 *
 * The redirect never returns: for a fetcher post (which App Bridge stamps with
 * an Authorization header) the library throws a 401 carrying App Bridge headers,
 * and App Bridge turns that into a top-level redirect out of the iframe. So
 * callers should post here with a fetcher and expect to be navigated away.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, redirect } = await authenticate.admin(request);

  // Queried rather than hardcoded: the handle lives in the Partner Dashboard
  // listing, not in the repo, and differs per app config.
  const res = await admin.graphql(`#graphql
    query AppHandle {
      currentAppInstallation {
        app { handle }
      }
    }
  `);
  const handle = (await res.json())?.data?.currentAppInstallation?.app?.handle;

  if (!handle) {
    console.error("[billing] could not resolve the app handle from currentAppInstallation");
    return json(
      { ok: false as const, messages: ["Could not resolve the app handle."] },
      { status: 500 },
    );
  }

  // The library rewrites shopify://admin/... to
  // https://admin.shopify.com/store/<shop>/charges/<handle>/pricing_plans and
  // throws the App Bridge 401 that escapes the iframe.
  return redirect(`shopify://admin/charges/${handle}/pricing_plans`);
};
