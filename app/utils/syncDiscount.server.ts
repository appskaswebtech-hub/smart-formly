import db from "../db.server";

async function getFunctionId(admin: any): Promise<string | null> {
  const res = await admin.graphql(`
    query {
      shopifyFunctions(first: 25) {
        nodes { id title apiType }
      }
    }
  `);
  const data = await res.json();
  const functions = data.data?.shopifyFunctions?.nodes ?? [];

  const match = functions.find(
    (f: any) =>
      f.apiType === "discount" &&
      (f.title?.toLowerCase().includes("bundle") ||
        f.title?.toLowerCase().includes("quantity"))
  );

  if (!match) {
    console.error("[BundleKit] ❌ No discount function found");
    return null;
  }

  console.log("[BundleKit] ✅ Function found:", match.title, "→", match.id);
  return match.id;
}

async function deleteShopifyDiscount(admin: any, discountId: string) {
  const res = await admin.graphql(
    `mutation Delete($id: ID!) {
      discountAutomaticDelete(id: $id) {
        deletedAutomaticDiscountId
        userErrors { field message }
      }
    }`,
    { variables: { id: discountId } }
  );
  const data = await res.json();
  return data.data?.discountAutomaticDelete?.userErrors ?? [];
}

export async function syncBundleDiscount(admin: any, shop: string, bundleId: string) {
  console.log("[BundleKit] ── syncBundleDiscount START ──", bundleId);

  const FUNCTION_ID =
    process.env.SHOPIFY_DISCOUNT_FUNCTION_ID || (await getFunctionId(admin));

  if (!FUNCTION_ID) {
    console.error("[BundleKit] ❌ Could not resolve function ID");
    return;
  }

  const bundle = await db.bundle.findFirst({
    where: { id: bundleId, shop },
    include: { quantityBreaks: { orderBy: { sortOrder: "asc" } } },
  });

  if (!bundle) {
    console.log("[BundleKit] Bundle not found:", bundleId);
    return;
  }

  console.log("[BundleKit] Bundle:", bundle.name, "| Status:", bundle.status);

  // ── Not active → delete its Shopify discount ──
  if (bundle.status !== "ACTIVE") {
    if (bundle.shopifyDiscountId) {
      await deleteShopifyDiscount(admin, bundle.shopifyDiscountId);
      await db.bundle.update({
        where: { id: bundleId },
        data: { shopifyDiscountId: null },
      });
      console.log("[BundleKit] ✅ Discount deleted for inactive bundle:", bundle.name);
    }
    return;
  }

  const rules = [
    {
      bundleId: bundle.id,
      bundleType: bundle.bundleType,
      priority: bundle.prioritySequence,
      productSelectionType: bundle.productSelectionType,
      productIds: bundle.selectedProductIds
        ? JSON.parse(bundle.selectedProductIds)
        : [],
      quantityBreaks: bundle.quantityBreaks.map((qb: any) => ({
        quantity: qb.quantity,
        quantityType: qb.quantityType,
        minQuantity: qb.minQuantity,
        maxQuantity: qb.maxQuantity,
        discountType: qb.discountType,
        discountValue: qb.discountValue,
        savingsText: qb.savingsText,
        description: qb.description,
      })),
    },
  ];

  const metafields = [
    {
      namespace: "bundlekit",
      key: "rules",
      type: "json",
      value: JSON.stringify(rules),
    },
  ];

  const discountTitle = bundle.name;
  let storedDiscountId = bundle.shopifyDiscountId;

  // ── Update existing discount ──
  if (storedDiscountId) {
    console.log("[BundleKit] Updating discount:", bundle.name, "→", storedDiscountId);
    const updateRes = await admin.graphql(
      `mutation Update($id: ID!, $discount: DiscountAutomaticAppInput!) {
        discountAutomaticAppUpdate(id: $id, automaticAppDiscount: $discount) {
          automaticAppDiscount { discountId }
          userErrors { field message }
        }
      }`,
      {
        variables: {
          id: storedDiscountId,
          discount: { title: discountTitle, metafields },
        },
      }
    );
    const updateData = await updateRes.json();
    const errors = updateData.data?.discountAutomaticAppUpdate?.userErrors ?? [];

    if (errors.length) {
      const notFound = errors.some((e: any) =>
        e.message.toLowerCase().includes("does not exist")
      );
      if (notFound) {
        console.log("[BundleKit] Stale ID — clearing and will recreate");
        await db.bundle.update({
          where: { id: bundleId },
          data: { shopifyDiscountId: null },
        });
        storedDiscountId = null;
      } else {
        console.error("[BundleKit] ❌ Update errors:", JSON.stringify(errors));
        return;
      }
    } else {
      console.log("[BundleKit] ✅ Discount updated:", bundle.name);
      return;
    }
  }

  // ── Create new discount ──
  console.log("[BundleKit] Creating discount for:", bundle.name);
  const createRes = await admin.graphql(
    `mutation Create($discount: DiscountAutomaticAppInput!) {
      discountAutomaticAppCreate(automaticAppDiscount: $discount) {
        automaticAppDiscount { discountId title }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        discount: {
          title: discountTitle,
          functionId: FUNCTION_ID,
          startsAt: new Date().toISOString(),
          discountClasses: ["PRODUCT"],
          combinesWith: {
            productDiscounts: true,
            orderDiscounts: true,
            shippingDiscounts: true,
          },
          metafields,
        },
      },
    }
  );

  const createData = await createRes.json();
  const createErrors = createData.data?.discountAutomaticAppCreate?.userErrors ?? [];

  if (createErrors.length) {
    console.error("[BundleKit] ❌ Create errors:", JSON.stringify(createErrors));
  } else {
    const discountId =
      createData.data?.discountAutomaticAppCreate?.automaticAppDiscount?.discountId;
    if (discountId) {
      await db.bundle.update({
        where: { id: bundleId },
        data: { shopifyDiscountId: discountId },
      });
      console.log("[BundleKit] ✅ Discount created:", bundle.name, "→", discountId);
    }
  }

  console.log("[BundleKit] ── syncBundleDiscount END ──");
}

export async function deleteBundleDiscount(admin: any, shop: string, bundleId: string) {
  console.log("[BundleKit] ── deleteBundleDiscount ──", bundleId);
  const bundle = await db.bundle.findFirst({
    where: { id: bundleId, shop },
  });
  if (bundle?.shopifyDiscountId) {
    await deleteShopifyDiscount(admin, bundle.shopifyDiscountId);
    console.log("[BundleKit] ✅ Discount deleted for bundle:", bundle.name);
  }
}

export async function syncDiscountRules(admin: any, shop: string) {
  console.log("[BundleKit] ── syncDiscountRules (all bundles) START ──");
  const bundles = await db.bundle.findMany({
    where: {
      shop,
      bundleType: { in: ["QUANTITY_BREAKS", "VOLUME_DISCOUNT"] },
    },
  });
  console.log("[BundleKit] Total bundles to sync:", bundles.length);
  for (const bundle of bundles) {
    await syncBundleDiscount(admin, shop, bundle.id);
  }
  console.log("[BundleKit] ── syncDiscountRules (all bundles) END ──");
}