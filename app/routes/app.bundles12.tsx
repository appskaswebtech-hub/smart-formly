import { useEffect, useState, useCallback } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  InlineStack,
  Badge,
  EmptyState,
  Modal,
  FormLayout,
  TextField,
  Select,
  Divider,
  Thumbnail,
  Banner,
  IndexTable,
  useIndexResourceState,
  ButtonGroup,
  Tooltip,
  Icon,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  EditIcon,
  DeleteIcon,
  PackageIcon,
  DiscountIcon,
  CheckCircleIcon,
  OrderIcon,
} from "@shopify/polaris-icons";
import db from "../db.server";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

type BundleItem = {
  id: string;
  shopifyProductId: string;
  shopifyVariantId: string;
  productTitle: string;
  variantTitle: string | null;
  sku: string | null;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  position: number;
};

type Bundle = {
  id: string;
  title: string;
  description: string | null;
  handle: string;
  status: string;
  discountType: string | null;
  discountValue: number | null;
  freeProductId: string | null;
  freeVariantId: string | null;
  originalPrice: number | null;
  bundlePrice: number | null;
  savings: number | null;
  badgeText: string | null;
  imageUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  bundleItems: BundleItem[];
  createdAt: string;
  totalOrders: number;
};

type PickedItem = {
  productId: string;
  variantId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  imageUrl: string;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
};

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function calcPricing(items: PickedItem[], discountType: string, discountValue: string) {
  const originalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  let bundlePrice = originalPrice;
  if (discountType === "PERCENTAGE" && discountValue)
    bundlePrice = originalPrice * (1 - parseFloat(discountValue) / 100);
  else if (discountType === "FIXED_AMOUNT" && discountValue)
    bundlePrice = Math.max(0, originalPrice - parseFloat(discountValue));
  return { originalPrice, bundlePrice, savings: originalPrice - bundlePrice };
}

function calcBadgeText(discountType: string, discountValue: string | number | null): string {
  const val = typeof discountValue === "string" ? parseFloat(discountValue) : discountValue;
  if (discountType === "PERCENTAGE" && val) return `Save ${val}%`;
  if (discountType === "FIXED_AMOUNT" && val) return `Save $${(val as number).toFixed(2)}`;
  if (discountType === "FREE_PRODUCT") return "Includes Free Gift";
  return "";
}

function discountLabel(bundle: Bundle) {
  if (bundle.discountType === "PERCENTAGE" && bundle.discountValue)
    return `${bundle.discountValue}% off`;
  if (bundle.discountType === "FIXED_AMOUNT" && bundle.discountValue)
    return `$${bundle.discountValue.toFixed(2)} off`;
  if (bundle.discountType === "FREE_PRODUCT") return "Free gift";
  return "—";
}

function statusTone(status: string): "success" | "info" | "warning" | "critical" {
  const map: Record<string, "success" | "info" | "warning" | "critical"> = {
    ACTIVE: "success", DRAFT: "info", PAUSED: "warning", ARCHIVED: "critical",
  };
  return map[status] ?? "info";
}

// ─────────────────────────────────────────
// SHOPIFY BUNDLE API HELPERS
// ─────────────────────────────────────────

async function fetchProductOptions(
  admin: any,
  productId: string
): Promise<Array<{ id: string; name: string; values: string[] }>> {
  const res = await admin.graphql(
    `#graphql
    query GetProductOptions($id: ID!) {
      product(id: $id) {
        options {
          id
          name
          optionValues { name }
        }
      }
    }`,
    { variables: { id: productId } }
  );
  const data = await res.json();
  return (data.data?.product?.options ?? []).map((opt: any) => ({
    id: opt.id,
    name: opt.name,
    values: opt.optionValues.map((v: any) => v.name),
  }));
}

async function buildComponents(admin: any, items: PickedItem[]) {
  return Promise.all(
    items.map(async (item) => {
      const options = await fetchProductOptions(admin, item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        optionSelections: options.map((opt) => ({
          componentOptionId: opt.id,
          name: opt.name,
          values: opt.values,
        })),
      };
    })
  );
}

// Poll productOperation until COMPLETE or FAILED.
// productBundleCreate/Update are async — the product GID is only available once COMPLETE.
// If this times out, productId will be null and the webhook will never match — so we
// throw instead of silently returning null.
async function pollBundleOperation(
  admin: any,
  operationId: string
): Promise<{ productId: string; variantId: string }> {
  const MAX_ATTEMPTS = 20;   // ~16 seconds total
  const DELAY_MS = 800;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, DELAY_MS));

    const res = await admin.graphql(
      `#graphql
      query PollBundleOperation($id: ID!) {
        productOperation(id: $id) {
          ... on ProductBundleOperation {
            id
            status
            product {
              id
              variants(first: 1) {
                edges { node { id } }
              }
            }
            userErrors { field message }
          }
        }
      }`,
      { variables: { id: operationId } }
    );

    const data = await res.json();
    const op = data.data?.productOperation;

    if (op?.userErrors?.length > 0) {
      throw new Error(`Bundle operation errors: ${JSON.stringify(op.userErrors)}`);
    }

    if (op?.status === "FAILED") {
      throw new Error("Bundle operation FAILED on Shopify side");
    }

    if (op?.status === "COMPLETE") {
      const productId = op.product?.id;
      const variantId = op.product?.variants?.edges?.[0]?.node?.id;

      if (!productId || !variantId) {
        throw new Error("Bundle operation COMPLETE but product/variant ID missing in response");
      }

      console.log(`  Poll complete (attempt ${i + 1}): productId=${productId} variantId=${variantId}`);
      return { productId, variantId };
    }

    console.log(`  Poll attempt ${i + 1}/${MAX_ATTEMPTS}: status=${op?.status ?? "unknown"}`);
  }

  // If we exhaust all attempts the bundle product was never saved with a GID,
  // meaning the webhook will never be able to match this bundle. Throw so the
  // caller can handle it rather than silently saving null to the DB.
  throw new Error(`Bundle operation timed out after ${MAX_ATTEMPTS} attempts (~${(MAX_ATTEMPTS * DELAY_MS) / 1000}s)`);
}

// Create the Shopify bundle product and set its price + inventory in one variant update.
// Returns the saved productId (GID) and variantId (GID).
async function createShopifyBundle(
  admin: any,
  title: string,
  items: PickedItem[],
  bundlePrice: number
): Promise<{ shopifyProductId: string; shopifyVariantId: string }> {
  const components = await buildComponents(admin, items);

  // Step 1 — create the bundle product
  const createRes = await admin.graphql(
    `#graphql
    mutation CreateProductBundle($input: ProductBundleCreateInput!) {
      productBundleCreate(input: $input) {
        productBundleOperation { id status }
        userErrors { field message }
      }
    }`,
    { variables: { input: { title, components } } }
  );

  const createData = await createRes.json();
  const createErrors = createData.data?.productBundleCreate?.userErrors ?? [];
  if (createErrors.length > 0) {
    throw new Error(`productBundleCreate failed: ${JSON.stringify(createErrors)}`);
  }

  const operationId = createData.data?.productBundleCreate?.productBundleOperation?.id;
  if (!operationId) {
    throw new Error("productBundleCreate returned no operationId");
  }

  // Step 2 — wait for the async operation to complete
  const { productId, variantId } = await pollBundleOperation(admin, operationId);

  // Step 3 — set price + inventory policy in a single variant update call
  const variantRes = await admin.graphql(
    `#graphql
    mutation UpdateBundleVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants { id price inventoryPolicy }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        productId,
        variants: [{
          id: variantId,
          price: bundlePrice.toFixed(2),
          // CONTINUE lets the bundle be purchased even when a component
          // shows "low stock" — Shopify manages component inventory separately
          inventoryPolicy: "CONTINUE",
        }],
      },
    }
  );

  const variantData = await variantRes.json();
  const variantErrors = variantData.data?.productVariantsBulkUpdate?.userErrors ?? [];
  if (variantErrors.length > 0) {
    // Non-fatal — price/policy can be retried, but product GID is already saved
    console.error("productVariantsBulkUpdate errors:", JSON.stringify(variantErrors));
  }

  return { shopifyProductId: productId, shopifyVariantId: variantId };
}

// Update the Shopify bundle product title + components, then sync the variant price.
async function updateShopifyBundle(
  admin: any,
  shopifyProductId: string,
  title: string,
  items: PickedItem[],
  bundlePrice: number
): Promise<{ shopifyVariantId: string }> {
  const components = await buildComponents(admin, items);

  const updateRes = await admin.graphql(
    `#graphql
    mutation UpdateProductBundle($input: ProductBundleUpdateInput!) {
      productBundleUpdate(input: $input) {
        productBundleOperation { id status }
        userErrors { field message }
      }
    }`,
    { variables: { input: { productId: shopifyProductId, title, components } } }
  );

  const updateData = await updateRes.json();
  const updateErrors = updateData.data?.productBundleUpdate?.userErrors ?? [];
  if (updateErrors.length > 0) {
    throw new Error(`productBundleUpdate failed: ${JSON.stringify(updateErrors)}`);
  }

  const operationId = updateData.data?.productBundleUpdate?.productBundleOperation?.id;
  if (!operationId) {
    throw new Error("productBundleUpdate returned no operationId");
  }

  // Variant ID can change after a component update — always use the polled one
  const { variantId } = await pollBundleOperation(admin, operationId);

  // Sync price + inventory policy
  const variantRes = await admin.graphql(
    `#graphql
    mutation UpdateBundleVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants { id price inventoryPolicy }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        productId: shopifyProductId,
        variants: [{
          id: variantId,
          price: bundlePrice.toFixed(2),
          inventoryPolicy: "CONTINUE",
        }],
      },
    }
  );

  const variantData = await variantRes.json();
  const variantErrors = variantData.data?.productVariantsBulkUpdate?.userErrors ?? [];
  if (variantErrors.length > 0) {
    console.error("productVariantsBulkUpdate errors on update:", JSON.stringify(variantErrors));
  }

  return { shopifyVariantId: variantId };
}

// ─────────────────────────────────────────
// LOADER
// ─────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;

  const bundles = await db.bundle.findMany({
    where: { shopId },
    include: {
      bundleItems: { orderBy: { position: "asc" } },
      _count: { select: { bundleOrders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return json({
    bundles: bundles.map((b) => ({ ...b, totalOrders: b._count.bundleOrders })),
  });
};

// ─────────────────────────────────────────
// ACTION
// ─────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shopId = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (intent === "delete") {
    const bundleId = formData.get("bundleId") as string;
    const bundle = await db.bundle.findFirst({ where: { id: bundleId, shopId } });
    if (!bundle) return json({ error: "Bundle not found" }, { status: 404 });

    if (bundle.shopifyProductId) {
      await admin.graphql(
        `#graphql
        mutation DeleteProduct($input: ProductDeleteInput!) {
          productDelete(input: $input) { deletedProductId }
        }`,
        { variables: { input: { id: bundle.shopifyProductId } } }
      );
    }

    await db.bundle.delete({ where: { id: bundleId } });
    return json({ deleted: true });
  }

  // ── TOGGLE STATUS ─────────────────────────────────────────────────────────
  // ACTIVE in DB → ACTIVE on Shopify
  // PAUSED in DB → DRAFT on Shopify  (Shopify has no "PAUSED" status)
  if (intent === "toggleStatus") {
    const bundleId = formData.get("bundleId") as string;
    const currentStatus = formData.get("currentStatus") as string;
    const newDbStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const newShopifyStatus = newDbStatus === "ACTIVE" ? "ACTIVE" : "DRAFT";

    const updated = await db.bundle.update({
      where: { id: bundleId },
      data: { status: newDbStatus },
    });

    if (updated.shopifyProductId) {
      await admin.graphql(
        `#graphql
        mutation UpdateProductStatus($input: ProductInput!) {
          productUpdate(input: $input) {
            product { id status }
            userErrors { field message }
          }
        }`,
        { variables: { input: { id: updated.shopifyProductId, status: newShopifyStatus } } }
      );
    }

    return json({ toggled: true, newStatus: newDbStatus });
  }

  // ── SHARED FIELDS (create + edit) ─────────────────────────────────────────
  const title       = formData.get("title") as string;
  const description = formData.get("description") as string;
  const discountType  = formData.get("discountType") as string;
  const discountValue = formData.get("discountValue")
    ? parseFloat(formData.get("discountValue") as string)
    : null;
  const freeProductId = formData.get("freeProductId") as string | null;
  const items: PickedItem[] = JSON.parse((formData.get("items") as string) || "[]");

  if (!title || items.length === 0)
    return json({ error: "Title and at least one product are required." }, { status: 400 });

  // Recalculate pricing server-side — never trust client-sent totals
  const originalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let bundlePrice = originalPrice;
  if (discountType === "PERCENTAGE" && discountValue)
    bundlePrice = originalPrice * (1 - discountValue / 100);
  else if (discountType === "FIXED_AMOUNT" && discountValue)
    bundlePrice = Math.max(0, originalPrice - discountValue);
  const savings   = originalPrice - bundlePrice;
  const badgeText = calcBadgeText(discountType, discountValue);

  const itemRows = items.map((item, index) => ({
    shopifyProductId: item.productId,
    shopifyVariantId: item.variantId,
    productTitle:     item.productTitle,
    variantTitle:     item.variantTitle || null,
    sku:              item.sku || null,
    imageUrl:         item.imageUrl || null,
    price:            item.price,
    compareAtPrice:   item.compareAtPrice ?? null,
    quantity:         item.quantity,
    position:         index,
  }));

  // ── CREATE ────────────────────────────────────────────────────────────────
  if (intent === "create") {
    const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const existingCount = await db.bundle.count({ where: { shopId, handle } });
    const uniqueHandle  = existingCount > 0 ? `${handle}-${Date.now()}` : handle;

    // createShopifyBundle throws if anything fails — no silent null GIDs saved to DB
    const { shopifyProductId, shopifyVariantId } = await createShopifyBundle(
      admin, title, items, bundlePrice
    );

    const bundle = await db.bundle.create({
      data: {
        shopId,
        title,
        description:      description || null,
        handle:           uniqueHandle,
        status:           "DRAFT",
        shopifyProductId, // always a real GID — never null (would have thrown above)
        shopifyVariantId, // always a real GID — never null
        discountType:     discountType || null,
        discountValue,
        freeProductId:    freeProductId || null,
        originalPrice,
        bundlePrice,
        savings,
        badgeText,
        imageUrl:         items[0]?.imageUrl ?? null,
        bundleItems:      { create: itemRows },
      },
      include: { bundleItems: true },
    });

    return json({ bundle });
  }

  // ── EDIT ──────────────────────────────────────────────────────────────────
  if (intent === "edit") {
    const bundleId = formData.get("bundleId") as string;
    const bundle   = await db.bundle.findFirst({ where: { id: bundleId, shopId } });
    if (!bundle) return json({ error: "Bundle not found" }, { status: 404 });

    let latestVariantId = bundle.shopifyVariantId;

    if (bundle.shopifyProductId) {
      const { shopifyVariantId } = await updateShopifyBundle(
        admin, bundle.shopifyProductId, title, items, bundlePrice
      );
      latestVariantId = shopifyVariantId;
    }

    await db.bundleItem.deleteMany({ where: { bundleId } });

    const updatedBundle = await db.bundle.update({
      where: { id: bundleId },
      data: {
        title,
        description:      description || null,
        discountType:     discountType || null,
        discountValue,
        freeProductId:    freeProductId || null,
        originalPrice,
        bundlePrice,
        savings,
        badgeText,
        shopifyVariantId: latestVariantId,
        imageUrl:         items[0]?.imageUrl ?? bundle.imageUrl,
        bundleItems:      { create: itemRows },
      },
      include: { bundleItems: true },
    });

    return json({ updatedBundle });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
};

// ─────────────────────────────────────────
// BUNDLE FORM MODAL
// ─────────────────────────────────────────

function BundleFormModal({
  open, onClose, onSubmit, loading, error, shopify, editBundle,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string; description: string; discountType: string;
    discountValue: string; freeProductId: string; items: PickedItem[];
  }) => void;
  loading: boolean;
  error: string | null;
  shopify: ReturnType<typeof useAppBridge>;
  editBundle: Bundle | null;
}) {
  const isEditMode = editBundle !== null;
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [freeProductId, setFreeProductId] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<PickedItem[]>([]);

  useEffect(() => {
    if (!open) return;
    if (isEditMode && editBundle) {
      setTitle(editBundle.title);
      setDescription(editBundle.description ?? "");
      setDiscountType(editBundle.discountType ?? "PERCENTAGE");
      setDiscountValue(editBundle.discountValue?.toString() ?? "");
      setFreeProductId(editBundle.freeProductId ?? "");
      setSelectedProducts(editBundle.bundleItems.map((item) => ({
        productId:    item.shopifyProductId,
        variantId:    item.shopifyVariantId,
        productTitle: item.productTitle,
        variantTitle: item.variantTitle ?? "",
        sku:          item.sku ?? "",
        imageUrl:     item.imageUrl ?? "",
        price:        item.price,
        compareAtPrice: item.compareAtPrice,
        quantity:     item.quantity,
      })));
    } else {
      setTitle(""); setDescription(""); setDiscountType("PERCENTAGE");
      setDiscountValue(""); setFreeProductId(""); setSelectedProducts([]);
    }
  }, [open, isEditMode, editBundle]);

  const handlePickProducts = useCallback(async () => {
    const selected = await shopify.resourcePicker({
      type: "product",
      multiple: true,
      selectionIds: selectedProducts.map((p) => ({
        id: p.productId, variants: [{ id: p.variantId }],
      })),
    });
    if (!selected || selected.length === 0) return;

    setSelectedProducts(selected.map((product: any) => {
      const variant  = product.variants[0];
      const existing = selectedProducts.find((p) => p.variantId === variant.id);
      return {
        productId:    product.id,
        variantId:    variant.id,
        productTitle: product.title,
        variantTitle: variant.title !== "Default Title" ? variant.title : "",
        sku:          variant.sku ?? "",
        imageUrl:     product.images?.[0]?.originalSrc ?? "",
        price:        parseFloat(variant.price),
        compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null,
        quantity:     existing?.quantity ?? 1, // preserve qty if re-picking same product
      };
    }));
  }, [shopify, selectedProducts]);

  const updateQuantity = useCallback((index: number, qty: string) => {
    const parsed  = parseInt(qty, 10);
    const safeQty = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    setSelectedProducts((prev) =>
      prev.map((item, i) => i === index ? { ...item, quantity: safeQty } : item)
    );
  }, []);

  const removeProduct = useCallback((index: number) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const { originalPrice, bundlePrice: previewPrice, savings: previewSavings } =
    calcPricing(selectedProducts, discountType, discountValue);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditMode ? `Edit — ${editBundle?.title}` : "Create New Bundle"}
      primaryAction={{
        content: isEditMode ? "Save Changes" : "Create Bundle",
        onAction: () => onSubmit({ title, description, discountType, discountValue, freeProductId, items: selectedProducts }),
        loading,
        disabled: !title || selectedProducts.length === 0,
      }}
      secondaryActions={[{ content: "Cancel", onAction: onClose }]}
      large
    >
      {/* ── Section 1: Info ── */}
      <Modal.Section>
        {error && (
          <Box paddingBlockEnd="400">
            <Banner tone="critical" title="Error"><p>{error}</p></Banner>
          </Box>
        )}
        <FormLayout>
          <TextField label="Bundle Title" value={title} onChange={setTitle}
            placeholder="e.g. Summer Starter Pack" autoComplete="off" requiredIndicator />
          <TextField label="Description" value={description} onChange={setDescription}
            placeholder="Describe what's included..." multiline={3} autoComplete="off" />
        </FormLayout>
      </Modal.Section>

      {/* ── Section 2: Products ── */}
      <Modal.Section>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="050">
              <Text as="h3" variant="headingMd">Bundle Products</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {selectedProducts.length > 0
                  ? `${selectedProducts.length} product${selectedProducts.length !== 1 ? "s" : ""} selected`
                  : "No products selected yet"}
              </Text>
            </BlockStack>
            <Button variant="primary" onClick={handlePickProducts}>
              {selectedProducts.length > 0 ? "Edit Products" : "Add Products"}
            </Button>
          </InlineStack>

          {selectedProducts.length === 0 ? (
            <Box padding="800" background="bg-surface-secondary" borderRadius="300"
              borderWidth="025" borderColor="border-secondary" borderStyle="dashed">
              <BlockStack gap="200" inlineAlign="center">
                <Icon source={PackageIcon} tone="subdued" />
                <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                  Click "Add Products" to pick items from your store
                </Text>
              </BlockStack>
            </Box>
          ) : (
            <BlockStack gap="200">
              {selectedProducts.map((item, index) => (
                <Card key={item.variantId} padding="300">
                  <InlineStack align="space-between" blockAlign="center" gap="300">
                    <InlineStack gap="300" blockAlign="center">
                      <Thumbnail source={item.imageUrl || ""} alt={item.productTitle} size="small" />
                      <BlockStack gap="050">
                        <Text as="span" variant="bodyMd" fontWeight="semibold">{item.productTitle}</Text>
                        {item.variantTitle && <Badge tone="info">{item.variantTitle}</Badge>}
                        <Text as="span" variant="bodySm" tone="subdued">${item.price.toFixed(2)} each</Text>
                      </BlockStack>
                    </InlineStack>
                    <InlineStack gap="300" blockAlign="center">
                      {/* Custom stepper avoids Polaris showing "Sold out" on number inputs */}
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid #d1d5db", borderRadius: "8px", overflow: "hidden" }}>
                        <button type="button"
                          onClick={() => updateQuantity(index, String(item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          style={{ width: 32, height: 32, background: "none", border: "none", cursor: item.quantity <= 1 ? "not-allowed" : "pointer", fontSize: 16, color: item.quantity <= 1 ? "#d1d5db" : "#374151" }}>
                          −
                        </button>
                        <div style={{ width: 36, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb" }}>
                          {item.quantity}
                        </div>
                        <button type="button"
                          onClick={() => updateQuantity(index, String(item.quantity + 1))}
                          style={{ width: 32, height: 32, background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#374151" }}>
                          +
                        </button>
                      </div>
                      <Button icon={DeleteIcon} tone="critical" variant="plain"
                        onClick={() => removeProduct(index)} accessibilityLabel="Remove product" />
                    </InlineStack>
                  </InlineStack>
                </Card>
              ))}

              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">Price Summary</Text>
                  <Divider />
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd" tone="subdued">Original total</Text>
                    <Text as="span" variant="bodyMd">${originalPrice.toFixed(2)}</Text>
                  </InlineStack>
                  {previewSavings > 0 && (
                    <>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd" tone="subdued">Discount applied</Text>
                        <Text as="span" variant="bodyMd" tone="success">−${previewSavings.toFixed(2)}</Text>
                      </InlineStack>
                      <Divider />
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd" fontWeight="bold">Bundle price</Text>
                        <Text as="span" variant="bodyMd" fontWeight="bold" tone="success">
                          ${previewPrice.toFixed(2)}
                        </Text>
                      </InlineStack>
                    </>
                  )}
                </BlockStack>
              </Card>
            </BlockStack>
          )}
        </BlockStack>
      </Modal.Section>

      {/* ── Section 3: Discount ── */}
      <Modal.Section>
        <BlockStack gap="400">
          <BlockStack gap="050">
            <Text as="h3" variant="headingMd">Discount</Text>
            <Text as="p" variant="bodySm" tone="subdued">Choose how customers save on this bundle</Text>
          </BlockStack>
          <FormLayout>
            <Select label="Discount Type"
              options={[
                { label: "Percentage off (e.g. 20% off)", value: "PERCENTAGE" },
                { label: "Fixed amount off (e.g. $10 off)", value: "FIXED_AMOUNT" },
                { label: "Free product (gift with purchase)", value: "FREE_PRODUCT" },
              ]}
              value={discountType} onChange={setDiscountType} />
            {discountType === "PERCENTAGE" && (
              <TextField label="Discount Percentage" type="number" value={discountValue}
                onChange={setDiscountValue} suffix="%" min={1} max={100} autoComplete="off"
                placeholder="e.g. 20" helpText="Customers will see this percentage saved at checkout" />
            )}
            {discountType === "FIXED_AMOUNT" && (
              <TextField label="Amount Off" type="number" value={discountValue}
                onChange={setDiscountValue} prefix="$" min={0} autoComplete="off"
                placeholder="e.g. 10.00" helpText="Fixed dollar amount deducted from the bundle total" />
            )}
            {discountType === "FREE_PRODUCT" && (
              <TextField label="Free Product GID" value={freeProductId} onChange={setFreeProductId}
                placeholder="gid://shopify/Product/123456789" autoComplete="off"
                helpText="Paste the Shopify product GID for the free gift item" />
            )}
          </FormLayout>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

// ─────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────

export default function BundlesPage() {
  const { bundles }  = useLoaderData<typeof loader>();
  const fetcher      = useFetcher<typeof action>();
  const shopify      = useAppBridge();

  const [modalOpen, setModalOpen]       = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [actionError, setActionError]   = useState<string | null>(null);

  const isSubmitting = fetcher.state !== "idle" &&
    (fetcher.formData?.get("intent") === "create" || fetcher.formData?.get("intent") === "edit");
  const isDeleting = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "delete";

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if ("bundle"        in fetcher.data) { shopify.toast.show("Bundle created!"); setModalOpen(false); setActionError(null); }
    if ("updatedBundle" in fetcher.data) { shopify.toast.show("Bundle updated!"); setModalOpen(false); setEditingBundle(null); setActionError(null); }
    if ("deleted"       in fetcher.data) shopify.toast.show("Bundle deleted.");
    if ("toggled"       in fetcher.data) shopify.toast.show((fetcher.data as any).newStatus === "ACTIVE" ? "Bundle activated!" : "Bundle paused.");
    if ("error"         in fetcher.data) setActionError((fetcher.data as any).error);
  }, [fetcher.state, fetcher.data, shopify]);

  const handleOpenCreate  = useCallback(() => { setEditingBundle(null); setActionError(null); setModalOpen(true); }, []);
  const handleOpenEdit    = useCallback((bundle: Bundle) => { setEditingBundle(bundle); setActionError(null); setModalOpen(true); }, []);
  const handleModalClose  = useCallback(() => { setModalOpen(false); setEditingBundle(null); setActionError(null); }, []);

  const handleFormSubmit = useCallback((data: {
    title: string; description: string; discountType: string;
    discountValue: string; freeProductId: string; items: PickedItem[];
  }) => {
    setActionError(null);
    const payload: Record<string, string> = {
      intent:        editingBundle ? "edit" : "create",
      title:         data.title,
      description:   data.description,
      discountType:  data.discountType,
      discountValue: data.discountValue,
      freeProductId: data.freeProductId,
      items:         JSON.stringify(data.items),
    };
    if (editingBundle) payload.bundleId = editingBundle.id;
    fetcher.submit(payload, { method: "POST" });
  }, [fetcher, editingBundle]);

  const handleDelete = useCallback((bundleId: string) => {
    if (confirm("Delete this bundle? This cannot be undone."))
      fetcher.submit({ intent: "delete", bundleId }, { method: "POST" });
  }, [fetcher]);

  const handleToggle = useCallback((bundleId: string, currentStatus: string) => {
    fetcher.submit({ intent: "toggleStatus", bundleId, currentStatus }, { method: "POST" });
  }, [fetcher]);

  const resourceName = { singular: "bundle", plural: "bundles" };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(bundles);

  return (
    <Page>
      <TitleBar title="Bundles">
        <button variant="primary" onClick={handleOpenCreate}>Create Bundle</button>
      </TitleBar>

      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Box paddingBlockEnd="400">
              <InlineStack gap="300">
                {[
                  { label: "Total",  value: bundles.length },
                  { label: "Active", value: bundles.filter((b) => b.status === "ACTIVE").length,  tone: "success" as const },
                  { label: "Draft",  value: bundles.filter((b) => b.status === "DRAFT").length },
                  { label: "Paused", value: bundles.filter((b) => b.status === "PAUSED").length,  tone: "caution" as const },
                ].map(({ label, value, tone }) => (
                  <Card key={label}>
                    <BlockStack gap="050">
                      <Text as="p" variant="bodySm" tone="subdued">{label}</Text>
                      <Text as="p" variant="headingLg" fontWeight="bold" tone={tone}>{String(value)}</Text>
                    </BlockStack>
                  </Card>
                ))}
              </InlineStack>
            </Box>

            <Card padding="0">
              {bundles.length === 0 ? (
                <EmptyState
                  heading="Create your first bundle"
                  action={{ content: "Create Bundle", onAction: handleOpenCreate }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Bundle products together and offer discounts to boost average order value.</p>
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={resourceName}
                  itemCount={bundles.length}
                  selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
                  onSelectionChange={handleSelectionChange}
                  headings={[
                    { title: "Bundle" },
                    { title: "Status" },
                    { title: "Discount" },
                    { title: "Bundle Price" },
                    { title: "Orders", alignment: "end" },
                    { title: "Actions" },
                  ]}
                >
                  {bundles.map((bundle, index) => (
                    <IndexTable.Row
                      id={bundle.id}
                      key={bundle.id}
                      selected={selectedResources.includes(bundle.id)}
                      position={index}
                    >
                      <IndexTable.Cell>
                        <InlineStack gap="300" blockAlign="center">
                          <Thumbnail source={bundle.imageUrl || ""} alt={bundle.title} size="small" />
                          <BlockStack gap="050">
                            <Text as="span" variant="bodyMd" fontWeight="semibold">{bundle.title}</Text>
                            <Text as="span" variant="bodySm" tone="subdued">
                              {bundle.bundleItems.length} product{bundle.bundleItems.length !== 1 ? "s" : ""}
                            </Text>
                          </BlockStack>
                        </InlineStack>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <Badge tone={statusTone(bundle.status)}>{bundle.status}</Badge>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {bundle.discountType
                          ? <Badge tone="magic">{discountLabel(bundle as Bundle)}</Badge>
                          : <Text as="span" variant="bodyMd" tone="subdued">—</Text>}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <BlockStack gap="050">
                          <Text as="span" variant="bodyMd" fontWeight="semibold">
                            ${bundle.bundlePrice?.toFixed(2) ?? "—"}
                          </Text>
                          {bundle.savings && bundle.savings > 0 && (
                            <Text as="span" variant="bodySm" tone="success">
                              Save ${bundle.savings.toFixed(2)}
                            </Text>
                          )}
                        </BlockStack>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <Text as="span" variant="bodyMd" alignment="end">{bundle.totalOrders}</Text>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <ButtonGroup>
                          <Tooltip content="Edit bundle">
                            <Button size="slim" icon={EditIcon}
                              onClick={() => handleOpenEdit(bundle as unknown as Bundle)}
                              disabled={fetcher.state !== "idle"}
                              accessibilityLabel="Edit bundle" />
                          </Tooltip>
                          <Button size="slim"
                            onClick={() => handleToggle(bundle.id, bundle.status)}
                            disabled={fetcher.state !== "idle"}
                            tone={bundle.status === "ACTIVE" ? "critical" : undefined}
                            variant={bundle.status !== "ACTIVE" ? "primary" : undefined}
                          >
                            {bundle.status === "ACTIVE" ? "Pause" : "Activate"}
                          </Button>
                          <Tooltip content="Delete bundle">
                            <Button size="slim" icon={DeleteIcon} tone="critical" variant="plain"
                              onClick={() => handleDelete(bundle.id)}
                              disabled={isDeleting} accessibilityLabel="Delete bundle" />
                          </Tooltip>
                        </ButtonGroup>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              )}
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">How it works</Text>
                  <Divider />
                  <BlockStack gap="300">
                    {[
                      { icon: PackageIcon,    text: "Pick products and set quantities" },
                      { icon: DiscountIcon,   text: "Apply a percentage, fixed, or free-gift discount" },
                      { icon: CheckCircleIcon, text: "Activate — a Shopify product is auto-created" },
                      { icon: OrderIcon,      text: "Customers buy and savings apply at checkout" },
                    ].map(({ icon: Ic, text }, i) => (
                      <InlineStack key={i} gap="300" blockAlign="start">
                        <Box background="bg-surface-secondary" padding="150" borderRadius="200">
                          <Icon source={Ic} tone="base" />
                        </Box>
                        <Box paddingBlockStart="050">
                          <Text as="p" variant="bodyMd">{text}</Text>
                        </Box>
                      </InlineStack>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">Discount Types</Text>
                  <Divider />
                  {[
                    ["Percentage",   "magic",   "e.g. 20% off"],
                    ["Fixed Amount", "info",    "e.g. $10 off"],
                    ["Free Product", "success", "Free gift"],
                  ].map(([label, tone, example]) => (
                    <InlineStack key={label} align="space-between" blockAlign="center">
                      <Text as="span" variant="bodyMd">{label}</Text>
                      <Badge tone={tone as any}>{example}</Badge>
                    </InlineStack>
                  ))}
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>

      <BundleFormModal
        open={modalOpen}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        loading={isSubmitting}
        error={actionError}
        shopify={shopify}
        editBundle={editingBundle}
      />
    </Page>
  );
}
