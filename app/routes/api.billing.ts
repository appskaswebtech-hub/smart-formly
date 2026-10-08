import { json, type ActionFunctionArgs } from "@remix-run/node";

import { planSelectionUrl } from "../billing/plan-page.server";
import { authenticate } from "../shopify.server";

/**
 * Sends the merchant to Shopify's hosted plan selection page.
 *
 * Used by app/routes/app.pricing.tsx, which is how a merchant who already has a
 * subscription changes plan. Merchants with no subscription never get here —
 * app/routes/app.tsx redirects them to the same page before anything renders.
 *
 * The redirect never returns: for a fetcher post (which App Bridge stamps with
 * an Authorization header) the library throws a 401 carrying App Bridge headers,
 * and App Bridge turns that into a top-level redirect out of the iframe. So
 * callers should post here with a fetcher and expect to be navigated away.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, redirect } = await authenticate.admin(request);

  const planPage = await planSelectionUrl(admin);

  if (!planPage) {
    return json(
      { ok: false as const, messages: ["Could not resolve the app handle."] },
      { status: 500 },
    );
  }

  return redirect(planPage);
};
