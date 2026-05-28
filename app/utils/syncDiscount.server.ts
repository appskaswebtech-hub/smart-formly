import prisma from "../db.server";

/**
 * Builds a JSON config object from all active bundles for a shop.
 */
async function buildBundleConfig(shop: string) {
  const bundles = await prisma.bundle.findMany({
    where: { shop, status: "ACTIVE" },
    include: {
      quantityBreaks: { orderBy: { sortOrder: "asc" } },
      discountCombination: true,
    },
  });

  const config: Record<string, any> = { bundles: {} };

  for (const bundle of bundles) {
    const breaks: Record<string, any> = {};
    for (const qb of bundle.quantityBreaks) {
      breaks[qb.id] = {
        discountType: qb.discountType,
        discountValue: qb.discountValue,
        quantity: qb.quantity,
        freeShipping: qb.freeShipping,
      };
    }
    config.bundles[bundle.id] = {
      name: bundle.name,
      title: bundle.title,
      productSelectionType: bundle.productSelectionType,
      selectedProductIds: bundle.selectedProductIds,
      discountCombination: bundle.discountCombination
        ? {
            productDiscounts: bundle.discountCombination.productDiscounts,
            orderDiscounts: bundle.discountCombination.orderDiscounts,
            shippingDiscounts: bundle.discountCombination.shippingDiscounts,
          }
        : null,
      breaks,
    };
  }

  return config;
}

/**
 * Sync bundle config to the Shopify Function's automatic discount.
 *
 * - If no discount exists yet → finds the function → creates the discount with metafield
 * - If discount exists → updates the metafield with new config
 */
export async function syncBundleConfigToDiscount(admin: any, shop: string) {
  const config = await buildBundleConfig(shop);
  const configJson = JSON.stringify(config);

  // ── Step 1: Check if our discount already exists ──
  const existingResponse = await admin.graphql(
    `#graphql
    query {
      discountNodes(first: 5, query: "title:'Bundler Quantity Breaks'") {
        nodes {
          id
          discount {
            ... on DiscountAutomaticApp {
              title
              status
              appDiscountType {
                functionId
              }
            }
          }
          metafield(namespace: "bundler", key: "config") {
            id
          }
        }
      }
    }`
  );
  const existingJson = await existingResponse.json();
  const existingDiscount = existingJson?.data?.discountNodes?.nodes?.[0];

  // ── Step 2a: Discount exists → update metafield ──
  if (existingDiscount) {
    console.log("[Bundler] Updating existing discount metafield:", existingDiscount.id);

    const updateResponse = await admin.graphql(
      `#graphql
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              ownerId: existingDiscount.id,
              namespace: "bundler",
              key: "config",
              type: "json",
              value: configJson,
            },
          ],
        },
      }
    );
    const updateJson = await updateResponse.json();
    const errors = updateJson?.data?.metafieldsSet?.userErrors;
    if (errors?.length) {
      console.error("[Bundler] Metafield update errors:", errors);
    } else {
      console.log("[Bundler] Config synced successfully");
    }
    return;
  }

  // ── Step 2b: No discount exists → find function → create discount ──
  console.log("[Bundler] No existing discount found. Looking for function...");

  const functionsResponse = await admin.graphql(
    `#graphql
    query {
      shopifyFunctions(first: 25) {
        nodes {
          id
          title
          apiType
          app {
            handle
          }
        }
      }
    }`
  );
  const functionsJson = await functionsResponse.json();
  const allFunctions = functionsJson?.data?.shopifyFunctions?.nodes || [];

  // Log for debugging
  console.log(
    "[Bundler] Available functions:",
    allFunctions.map((f: any) => `${f.title} (${f.apiType})`)
  );

  // Find our discount function — match flexibly by title
  const bundleFunction = allFunctions.find(
    (fn: any) =>
      fn.title?.toLowerCase().includes("bundle-kit-discount") ||
      fn.title?.toLowerCase().includes("bundle kit discount")
  );

  if (!bundleFunction) {
    console.error(
      "[Bundler] Discount function not found. Deploy extension first with 'shopify app deploy'."
    );
    return;
  }

  console.log("[Bundler] Found function:", bundleFunction.title, "→", bundleFunction.id);

  // Create automatic discount — follows Shopify docs pattern exactly
  const createResponse = await admin.graphql(
    `#graphql
    mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
      discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
        userErrors {
          field
          message
        }
        automaticAppDiscount {
          discountId
          title
          status
          appDiscountType {
            appKey
            functionId
          }
          combinesWith {
            orderDiscounts
            productDiscounts
            shippingDiscounts
          }
        }
      }
    }`,
    {
      variables: {
        automaticAppDiscount: {
          title: "Quantity Breaks",
          functionId: bundleFunction.id,
          startsAt: new Date().toISOString(),
          discountClasses: ["PRODUCT"],
          combinesWith: {
            orderDiscounts: true,
            productDiscounts: true,
            shippingDiscounts: true,
          },
          metafields: [
            {
              namespace: "bundler",
              key: "config",
              type: "json",
              value: configJson,
            },
          ],
        },
      },
    }
  );
  const createJson = await createResponse.json();
  const createErrors = createJson?.data?.discountAutomaticAppCreate?.userErrors;

  if (createErrors?.length) {
    console.error("[Bundler] Discount create errors:", createErrors);
  } else {
    console.log(
      "[Bundler] Discount created:",
      createJson?.data?.discountAutomaticAppCreate?.automaticAppDiscount?.title
    );
  }
}
