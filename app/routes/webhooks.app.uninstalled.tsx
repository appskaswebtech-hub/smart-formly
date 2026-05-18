import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already
  // been uninstalled. If this webhook already ran, the session may have been
  // deleted previously — so we guard each delete individually.

  if (session) {
    await db.session.deleteMany({ where: { shop } });
    console.log(`[APP_UNINSTALLED] Sessions deleted for shop=${shop}`);
  }

  // Cascade delete all form data for this shop regardless of session state.
  // This runs even if session was already gone (idempotent — safe to re-run).
  try {
    const [submissions, forms] = await Promise.all([
      db.formSubmission.deleteMany({ where: { shopDomain: shop } }),
      db.formConfig.deleteMany({ where: { shopDomain: shop } }),
    ]);

    console.log(
      `[APP_UNINSTALLED] shop=${shop} — ` +
      `deleted ${submissions.count} submission(s), ${forms.count} form(s)`
    );
  } catch (err) {
    // Log but don't throw — webhook must return 200 or Shopify will retry
    console.error(`[APP_UNINSTALLED] Error deleting form data for shop=${shop}:`, err);
  }

  return new Response(null, { status: 200 });
};