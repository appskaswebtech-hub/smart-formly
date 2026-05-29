// import type { ActionFunctionArgs } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
// import db from "../db.server";

// export const action = async ({ request }: ActionFunctionArgs) => {
//   const { shop } = await authenticate.webhook(request);

//   console.log("[BundleKit] 🔔 discounts/delete webhook received for:", shop);

//   // ── Delete all QUANTITY_BREAKS bundles for this shop ──
//   const deleted = await db.bundle.deleteMany({
//     where: {
//       shop,
//       bundleType: "QUANTITY_BREAKS","VOLUME_DISCOUNT"
//     },
//   });

//   // const deleted = await db.bundle.deleteMany({
//   //   where: {
//   //     shop,
//   //     bundleType: "VOLUME_DISCOUNT",
//   //   },
//   // });
//   // ── Clear stored discount ID ──
//   await db.shop.upsert({
//     where: { shopDomain: shop },
//     update: { shopifyDiscountId: null },
//     create: { shopDomain: shop, shopifyDiscountId: null },
//   });

//   console.log(`[BundleKit] ✅ Deleted ${deleted.count} bundle(s) and cleared discount ID for ${shop}`);

//   return new Response(null, { status: 200 });
// };

import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload } = await authenticate.webhook(request);

  console.log("[BundleKit] 🔔 discounts/delete webhook received for:", shop);
  console.log("[BundleKit] Full payload:", JSON.stringify(payload));

  const gid =
    (payload as any).admin_graphql_api_id ||
    (payload as any).id;

  console.log("[BundleKit] Discount GID from webhook:", gid);

  if (gid) {
    // ── Extract numeric ID to handle format differences ──
    // e.g. gid://shopify/DiscountAutomaticNode/123 → "123"
    const numericId = String(gid).split("/").pop();
    console.log("[BundleKit] Numeric ID:", numericId);

    // Find bundle where stored GID ends with same numeric ID
    const bundles = await db.bundle.findMany({
      where: { shop },
      select: { id: true, name: true, bundleType: true, shopifyDiscountId: true },
    });

    console.log("[BundleKit] All bundles:", JSON.stringify(
      bundles.map(b => ({ name: b.name, type: b.bundleType, discountId: b.shopifyDiscountId }))
    ));

    const matchingBundle = bundles.find(
      (b) => b.shopifyDiscountId && String(b.shopifyDiscountId).split("/").pop() === numericId
    );

    console.log("[BundleKit] Matching bundle:", matchingBundle?.name ?? "❌ None found");

    if (matchingBundle) {
      await db.bundle.delete({
        where: { id: matchingBundle.id },
      });
      console.log("[BundleKit] ✅ Bundle deleted:", matchingBundle.name);
    } else {
      console.warn("[BundleKit] ⚠️ No bundle found for discount GID:", gid);
    }
  }

  return new Response(null, { status: 200 });
}