import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Select,
  Button,
  Thumbnail,
  Badge,
  Divider,
  Banner,
  Box,
  Icon,
  Modal,
  Filters,
  Spinner,
  FormLayout,
  ChoiceList,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  PackageIcon,
  DeleteIcon,
  PlusIcon,
  InfoIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  sku: string | null;
  image?: { url: string } | null;
  inventoryQuantity: number;
  selectedOptions: { name: string; value: string }[];
}

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  featuredImage?: { url: string } | null;
  variants: { edges: { node: ShopifyVariant }[] };
  options: { id: string; name: string; values: string[] }[];
}

interface BundleItem {
  shopifyProductId: string;
  shopifyVariantId: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: number;
  sku: string | null;
  imageUrl: string | null;
  inventoryQuantity: number;
}

// ─────────────────────────────────────────
// GRAPHQL — Search products
// ─────────────────────────────────────────
const SEARCH_PRODUCTS_QUERY = `
  query searchProducts($query: String!) {
    products(first: 10, query: $query) {
      edges {
        node {
          id
          title
          handle
          featuredImage { url }
          options { id name values }
          variants(first: 1) {
            edges {
              node {
                id
                title
                price
                sku
                image { url }
                inventoryQuantity
                selectedOptions { name value }
              }
            }
          }
        }
      }
    }
  }
`;

// ─────────────────────────────────────────
// GRAPHQL — Get full product options for optionSelections
//
// productBundleCreate requires ProductBundleComponentOptionSelectionInput:
//   componentOptionId → ProductOption GID  "gid://shopify/ProductOption/123"
//   name              → option name string "Size"
//   values            → selected values    ["M"]
// ─────────────────────────────────────────
const GET_PRODUCT_OPTIONS_QUERY = `
  query getProductOptions($id: ID!) {
    product(id: $id) {
      id
      options { id name values }
      variants(first: 100) {
        edges {
          node {
            id
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

// ─────────────────────────────────────────
// GRAPHQL — Mutations (module-level, not inside action)
//
// productBundleCreate schema (from docs):
//   input ProductBundleCreateInput {
//     title: String!
//     components: [ProductBundleComponentInput!]!
//     consolidatedOptions: [ProductBundleConsolidatedOptionInput!]
//   }
//   input ProductBundleComponentInput {
//     productId: ID!
//     quantity: Int
//     optionSelections: [ProductBundleComponentOptionSelectionInput!]!
//     quantityOption: ProductBundleComponentQuantityOptionInput
//   }
// ─────────────────────────────────────────
const BUNDLE_CREATE_MUTATION = `
  mutation productBundleCreate($input: ProductBundleCreateInput!) {
    productBundleCreate(input: $input) {
      productBundleOperation {
        id
        status
        product {
          id
          variants(first: 1) {
            edges { node { id } }
          }
        }
        userErrors {
          field
          message
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ─────────────────────────────────────────
// GRAPHQL — Poll productOperation
//
// ProductOperationStatus enum (from docs): CREATED | ACTIVE | COMPLETE
// There is NO "FAILED" status — errors surface via userErrors on the operation.
// ─────────────────────────────────────────
const POLL_OPERATION_QUERY = `
  query pollBundleOperation($id: ID!) {
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
        userErrors {
          field
          message
        }
      }
    }
  }
`;

const UPDATE_PRODUCT_MUTATION = `
  mutation updateBundleProduct($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id }
      userErrors { field message }
    }
  }
`;

const UPDATE_VARIANT_PRICE_MUTATION = `
  mutation updateBundleVariantPrice(
    $productId: ID!
    $variants: [ProductVariantsBulkInput!]!
  ) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id price compareAtPrice }
      userErrors { field message }
    }
  }
`;

// ─────────────────────────────────────────
// LOADER
// ─────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("productSearch");

  const shopSettings = await db.shopSettings.findUnique({ where: { shop } });
  const bundleProductTag = shopSettings?.bundleProductTag ?? "bundle";

  if (searchQuery) {
    const response = await admin.graphql(SEARCH_PRODUCTS_QUERY, {
      variables: { query: searchQuery },
    });
    const data = await response.json();
    const products: ShopifyProduct[] = data.data.products.edges.map(
      (e: any) => e.node
    );
    return json({ products, searchQuery, bundleProductTag });
  }

  return json({ products: [], searchQuery: "", bundleProductTag });
};

// ─────────────────────────────────────────
// HELPER — Build ProductBundleComponentOptionSelectionInput[]
//
// The API requires componentOptionId (ProductOption GID), not option name.
// We fetch the product's options to resolve GID per option name,
// then map each selectedOption on the chosen variant to the correct GID.
// ─────────────────────────────────────────
async function buildComponentOptionSelections(
  admin: any,
  productId: string,
  variantId: string
): Promise<{ componentOptionId: string; name: string; values: string[] }[]> {
  const res = await admin.graphql(GET_PRODUCT_OPTIONS_QUERY, {
    variables: { id: productId },
  });
  const data = await res.json();
  const product = data.data?.product;
  if (!product) return [];

  // Map option name → ProductOption GID
  const optionIdMap: Record<string, string> = {};
  for (const opt of product.options) {
    optionIdMap[opt.name] = opt.id;
  }

  // Find chosen variant (fall back to first)
  const variant =
    product.variants.edges.find((e: any) => e.node.id === variantId)?.node ??
    product.variants.edges[0]?.node;

  if (!variant) return [];

  return variant.selectedOptions.map((opt: any) => ({
    componentOptionId: optionIdMap[opt.name], // ProductOption GID — required
    name: opt.name,
    values: [opt.value],
  }));
}

// ─────────────────────────────────────────
// HELPER — Poll until COMPLETE
//
// Status per docs: CREATED | ACTIVE | COMPLETE (no FAILED)
// Errors surface via userErrors on the ProductBundleOperation object.
// ─────────────────────────────────────────
async function pollBundleOperation(
  admin: any,
  operationId: string,
  maxAttempts = 15,
  intervalMs = 1500
): Promise<{
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  error: string | null;
}> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const pollRes = await admin.graphql(POLL_OPERATION_QUERY, {
      variables: { id: operationId },
    });
    const pollData = await pollRes.json();
    const op = pollData.data?.productOperation;

    if (!op) continue;

    // Check async background errors (no FAILED status — errors come here)
    if (op.userErrors?.length > 0) {
      return {
        shopifyProductId: null,
        shopifyVariantId: null,
        error: op.userErrors[0].message,
      };
    }

    if (op.status === "COMPLETE" && op.product?.id) {
      return {
        shopifyProductId: op.product.id,
        shopifyVariantId:
          op.product.variants?.edges?.[0]?.node?.id ?? null,
        error: null,
      };
    }

    // CREATED or ACTIVE — still processing, keep polling
  }

  return {
    shopifyProductId: null,
    shopifyVariantId: null,
    error:
      "Bundle creation timed out. Check Shopify Admin to confirm if it was created.",
  };
}

// ─────────────────────────────────────────
// ACTION — Create Bundle
// ─────────────────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;
  const discountType = formData.get("discountType") as string;
  const discountValue =
    parseFloat(formData.get("discountValue") as string) || 0;
  const itemsJson = formData.get("items") as string;
  const items: BundleItem[] = JSON.parse(itemsJson || "[]");

  // ── Validation ──
  const errors: Record<string, string> = {};
  if (!title?.trim()) errors.title = "Title is required";
  if (items.length < 2) errors.items = "A bundle must have at least 2 items";
  if (Object.keys(errors).length > 0) {
    return json({ errors, success: false }, { status: 422 });
  }

  const shopSettings = await db.shopSettings.findUnique({ where: { shop } });
  const bundleProductTag = shopSettings?.bundleProductTag ?? "bundle";

  // ── Compute Price ──
  const originalTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  let finalPrice = originalTotal;
  if (discountType === "PERCENTAGE") {
    finalPrice = originalTotal * (1 - discountValue / 100);
  } else if (discountType === "FIXED_AMOUNT") {
    finalPrice = Math.max(0, originalTotal - discountValue);
  }

  // ─────────────────────────────────────────
  // STEP 1 — Build components array for productBundleCreate
  //
  // ProductBundleComponentInput {
  //   productId: ID!
  //   quantity: Int
  //   optionSelections: [ProductBundleComponentOptionSelectionInput!]!
  // }
  // ─────────────────────────────────────────
  const componentsWithOptions = await Promise.all(
    items.map(async (item) => {
      const optionSelections = await buildComponentOptionSelections(
        admin,
        item.shopifyProductId,
        item.shopifyVariantId
      );
      return {
        productId: item.shopifyProductId,
        quantity: item.quantity,
        optionSelections,
      };
    })
  );

  // ─────────────────────────────────────────
  // STEP 2 — productBundleCreate (async mutation per docs)
  // ─────────────────────────────────────────
  const bundleResponse = await admin.graphql(BUNDLE_CREATE_MUTATION, {
    variables: {
      input: {
        title,
        components: componentsWithOptions,
      },
    },
  });

  const bundleData = await bundleResponse.json();

  // Immediate sync userErrors
  const immediateErrors =
    bundleData.data?.productBundleCreate?.userErrors ?? [];
  if (immediateErrors.length > 0) {
    return json(
      { errors: { shopify: immediateErrors[0].message }, success: false },
      { status: 422 }
    );
  }

  const operation =
    bundleData.data?.productBundleCreate?.productBundleOperation;

  if (!operation) {
    return json(
      {
        errors: {
          shopify:
            "No operation returned from Shopify. Please try again.",
        },
        success: false,
      },
      { status: 422 }
    );
  }

  // Operation-level userErrors from initial response
  if (operation.userErrors?.length > 0) {
    return json(
      { errors: { shopify: operation.userErrors[0].message }, success: false },
      { status: 422 }
    );
  }

  // ─────────────────────────────────────────
  // STEP 3 — Resolve product ID
  // If already COMPLETE in initial response use it, otherwise poll.
  // ─────────────────────────────────────────
  let shopifyProductId: string | null = operation.product?.id ?? null;
  let shopifyVariantId: string | null =
    operation.product?.variants?.edges?.[0]?.node?.id ?? null;

  if (!shopifyProductId && operation.id) {
    const pollResult = await pollBundleOperation(admin, operation.id);
    if (pollResult.error) {
      return json(
        { errors: { shopify: pollResult.error }, success: false },
        { status: 422 }
      );
    }
    shopifyProductId = pollResult.shopifyProductId;
    shopifyVariantId = pollResult.shopifyVariantId;
  }

  // ─────────────────────────────────────────
  // STEP 4 — productUpdate: set description, status, tags
  // productBundleCreate only accepts title + components —
  // all other fields must be set separately via productUpdate.
  // ─────────────────────────────────────────
  if (shopifyProductId) {
    const updateRes = await admin.graphql(UPDATE_PRODUCT_MUTATION, {
      variables: {
        input: {
          id: shopifyProductId,
          descriptionHtml: description || "",
          status: status === "ACTIVE" ? "ACTIVE" : "DRAFT",
          tags: [bundleProductTag],
        },
      },
    });
    const updateData = await updateRes.json();
    const updateErrors = updateData.data?.productUpdate?.userErrors ?? [];
    if (updateErrors.length > 0) {
      // Non-fatal: bundle exists, log and continue
      console.error("productUpdate error:", updateErrors[0].message);
    }
  }

  // ─────────────────────────────────────────
  // STEP 5 — productVariantsBulkUpdate: apply discount price
  // productBundleCreate does not accept price — must set on variant separately.
  // ─────────────────────────────────────────
  if (shopifyVariantId && shopifyProductId && discountType !== "NONE") {
    const priceRes = await admin.graphql(UPDATE_VARIANT_PRICE_MUTATION, {
      variables: {
        productId: shopifyProductId,
        variants: [
          {
            id: shopifyVariantId,
            price: finalPrice.toFixed(2),
            compareAtPrice: originalTotal.toFixed(2),
          },
        ],
      },
    });
    const priceData = await priceRes.json();
    const priceErrors =
      priceData.data?.productVariantsBulkUpdate?.userErrors ?? [];
    if (priceErrors.length > 0) {
      // Non-fatal: log and continue
      console.error(
        "productVariantsBulkUpdate error:",
        priceErrors[0].message
      );
    }
  }

  // ─────────────────────────────────────────
  // STEP 6 — Save to DB
  // ─────────────────────────────────────────
  const bundle = await db.bundle.create({
    data: {
      shop,
      title,
      description,
      status,
      discountType,
      discountValue,
      totalPrice: finalPrice,
      compareAtPrice: discountType !== "NONE" ? originalTotal : null,
      shopifyProductId,
      shopifyVariantId,
      items: {
        create: items.map((item, idx) => ({
          shopifyProductId: item.shopifyProductId,
          shopifyVariantId: item.shopifyVariantId,
          productTitle: item.productTitle,
          variantTitle: item.variantTitle,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku,
          imageUrl: item.imageUrl,
          position: idx,
        })),
      },
    },
  });

  return redirect(`/app/bundles/${bundle.id}?created=true`);
};

// ─────────────────────────────────────────
// PRODUCT PICKER MODAL
//
// One row per PRODUCT — click Add to add directly.
// No variant dropdown, no selection state.
// Uses the product's first variant (already fetched via variants(first:1)).
// ─────────────────────────────────────────
function ProductPickerModal({
  open,
  onClose,
  onSelect,
  fetching,
  products,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (product: ShopifyProduct, variant: ShopifyVariant) => void;
  fetching: boolean;
  products: ShopifyProduct[];
  onSearch: (q: string) => void;
}) {
  const [query, setQuery] = useState("");

  const handleSearch = (v: string) => {
    setQuery(v);
    onSearch(v);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add product to bundle">
      <Modal.Section>
        <Filters
          queryValue={query}
          queryPlaceholder="Search products…"
          filters={[]}
          onQueryChange={handleSearch}
          onQueryClear={() => handleSearch("")}
          onClearAll={() => handleSearch("")}
        />
      </Modal.Section>

      <Modal.Section>
        {fetching ? (
          <Box paddingBlock="400">
            <InlineStack align="center">
              <Spinner size="large" />
            </InlineStack>
          </Box>
        ) : products.length === 0 ? (
          <Box paddingBlock="400">
            <Text as="p" tone="subdued" alignment="center">
              {query
                ? "No products found."
                : "Start typing to search products…"}
            </Text>
          </Box>
        ) : (
          <BlockStack gap="200">
            {products.map((product) => {
              // Always use first variant — no variant selector shown
              const variant = product.variants.edges[0]?.node;
              if (!variant) return null;

              return (
                <Box
                  key={product.id}
                  padding="300"
                  borderRadius="200"
                  borderWidth="025"
                  borderColor="border"
                >
                  <InlineStack align="space-between" blockAlign="center">
                    {/* Left: image + info */}
                    <InlineStack gap="300" blockAlign="center">
                      {product.featuredImage ? (
                        <Thumbnail
                          source={product.featuredImage.url}
                          alt={product.title}
                          size="small"
                        />
                      ) : (
                        <Box
                          background="bg-surface-secondary"
                          borderRadius="100"
                          padding="200"
                        >
                          <Icon source={PackageIcon} />
                        </Box>
                      )}
                      <BlockStack gap="100">
                        <Text
                          as="p"
                          variant="bodyMd"
                          fontWeight="semibold"
                        >
                          {product.title}
                        </Text>
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="p" variant="bodySm" tone="subdued">
                            ${parseFloat(variant.price).toFixed(2)}
                          </Text>
                          <Badge
                            tone={
                              variant.inventoryQuantity > 10
                                ? "success"
                                : variant.inventoryQuantity > 0
                                ? "attention"
                                : "critical"
                            }
                          >
                            {variant.inventoryQuantity > 0
                              ? `${variant.inventoryQuantity} in stock`
                              : "Out of stock"}
                          </Badge>
                        </InlineStack>
                      </BlockStack>
                    </InlineStack>

                    {/* Right: Add button */}
                    <Button
                      size="slim"
                      variant="primary"
                      onClick={() => onSelect(product, variant)}
                    >
                      Add
                    </Button>
                  </InlineStack>
                </Box>
              );
            })}
          </BlockStack>
        )}
      </Modal.Section>
    </Modal>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
export default function BundlesNew() {
  const { products, bundleProductTag } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const saving = navigation.state === "submitting";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [discountType, setDiscountType] = useState("NONE");
  const [discountValue, setDiscountValue] = useState(0);
  const [items, setItems] = useState<BundleItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSearch = useCallback(
    (q: string) => {
      const params = new URLSearchParams();
      if (q) params.set("productSearch", q);
      submit(params, { method: "GET", replace: true });
    },
    [submit]
  );

  const handleAddProduct = useCallback(
    (product: ShopifyProduct, variant: ShopifyVariant) => {
      const existing = items.find(
        (i) => i.shopifyVariantId === variant.id
      );
      if (existing) {
        setItems((prev) =>
          prev.map((i) =>
            i.shopifyVariantId === variant.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        );
      } else {
        setItems((prev) => [
          ...prev,
          {
            shopifyProductId: product.id,
            shopifyVariantId: variant.id,
            productTitle: product.title,
            variantTitle:
              variant.title !== "Default Title" ? variant.title : "",
            quantity: 1,
            price: parseFloat(variant.price),
            sku: variant.sku,
            imageUrl: product.featuredImage?.url ?? null,
            inventoryQuantity: variant.inventoryQuantity,
          },
        ]);
      }
      setPickerOpen(false);
    },
    [items]
  );

  const handleRemoveItem = (variantId: string) =>
    setItems((prev) =>
      prev.filter((i) => i.shopifyVariantId !== variantId)
    );

  const handleQtyChange = (variantId: string, qty: number) =>
    setItems((prev) =>
      prev.map((i) =>
        i.shopifyVariantId === variantId
          ? { ...i, quantity: Math.max(1, qty) }
          : i
      )
    );

  const originalTotal = items.reduce(
    (s, i) => s + i.price * i.quantity,
    0
  );
  const finalPrice =
    discountType === "PERCENTAGE"
      ? originalTotal * (1 - discountValue / 100)
      : discountType === "FIXED_AMOUNT"
      ? Math.max(0, originalTotal - discountValue)
      : originalTotal;
  const savings = originalTotal - finalPrice;

  const zeroStockItems = items.filter((i) => i.inventoryQuantity <= 0);
  const lowStockItems = items.filter(
    (i) => i.inventoryQuantity > 0 && i.inventoryQuantity < 5
  );

  const maxBundles =
    items.length === 0
      ? 0
      : Math.min(
          ...items.map((i) =>
            Math.floor(i.inventoryQuantity / i.quantity)
          )
        );

  // Fix: overrideStatus avoids stale closure bug with "Save as draft"
  const handleSave = useCallback(
    (overrideStatus?: string) => {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      formData.set("status", overrideStatus ?? status);
      formData.set("discountType", discountType);
      formData.set("discountValue", String(discountValue));
      formData.set("items", JSON.stringify(items));
      submit(formData, { method: "POST" });
    },
    [title, description, status, discountType, discountValue, items, submit]
  );

  const errors = (actionData as any)?.errors ?? {};

  return (
    <Page
      backAction={{ content: "Bundles", url: "/app/bundles" }}
      title="Create Bundle"
      primaryAction={{
        content: saving ? "Creating…" : "Create bundle",
        loading: saving,
        onAction: () => handleSave(),
        disabled: saving,
      }}
      secondaryActions={[
        {
          content: "Save as draft",
          onAction: () => handleSave("DRAFT"),
        },
      ]}
    >
      <TitleBar title="Create Bundle" />

      <BlockStack gap="500">

        {errors.shopify && (
          <Banner tone="critical" title="Shopify error">
            <Text as="p">{errors.shopify}</Text>
          </Banner>
        )}

        <Banner tone="info" title="How bundle inventory works">
          <Text as="p">
            Shopify bundles don't track their own inventory. The bundle
            shows "0 available" in Shopify Admin — this is normal.
            Availability is calculated automatically from component
            products' stock levels.
          </Text>
        </Banner>

        {zeroStockItems.length > 0 && (
          <Banner tone="warning" title="Some components are out of stock">
            <Text as="p">
              <Text as="span" fontWeight="semibold">
                {zeroStockItems.map((i) => i.productTitle).join(", ")}
              </Text>{" "}
              {zeroStockItems.length === 1 ? "has" : "have"} 0 inventory.
              This bundle will be unavailable until stock is added.
            </Text>
          </Banner>
        )}

        {lowStockItems.length > 0 && zeroStockItems.length === 0 && (
          <Banner tone="attention" title="Low stock on some components">
            <Text as="p">
              {lowStockItems
                .map(
                  (i) =>
                    `${i.productTitle} (${i.inventoryQuantity} left)`
                )
                .join(", ")}
              . Consider restocking before activating this bundle.
            </Text>
          </Banner>
        )}

        <Layout>
          {/* ── LEFT COLUMN ── */}
          <Layout.Section>
            <BlockStack gap="500">

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Bundle details</Text>
                  <Divider />
                  <FormLayout>
                    <TextField
                      label="Title"
                      value={title}
                      onChange={setTitle}
                      error={errors.title}
                      placeholder="e.g. Summer Starter Kit"
                      autoComplete="off"
                    />
                    <TextField
                      label="Description"
                      value={description}
                      onChange={setDescription}
                      multiline={3}
                      placeholder="Describe what's included in this bundle…"
                      autoComplete="off"
                    />
                  </FormLayout>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="050">
                      <Text as="h2" variant="headingMd">
                        Bundle items
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Add at least 2 products
                      </Text>
                    </BlockStack>
                    <Button
                      icon={PlusIcon}
                      onClick={() => setPickerOpen(true)}
                      variant="primary"
                    >
                      Add product
                    </Button>
                  </InlineStack>

                  <Divider />

                  {errors.items && (
                    <Banner tone="critical">
                      <Text as="p">{errors.items}</Text>
                    </Banner>
                  )}

                  {items.length === 0 ? (
                    <Box paddingBlock="800">
                      <BlockStack gap="300" align="center">
                        <Icon source={PackageIcon} />
                        <Text as="p" tone="subdued" alignment="center">
                          No products added yet. Click "Add product" to
                          start building your bundle.
                        </Text>
                      </BlockStack>
                    </Box>
                  ) : (
                    <BlockStack gap="300">
                      {items.map((item) => (
                        <Box
                          key={item.shopifyVariantId}
                          padding="300"
                          borderRadius="200"
                          borderWidth="025"
                          borderColor={
                            item.inventoryQuantity <= 0
                              ? "border-critical"
                              : "border"
                          }
                        >
                          <InlineStack
                            align="space-between"
                            blockAlign="center"
                          >
                            <InlineStack gap="300" blockAlign="center">
                              {item.imageUrl ? (
                                <Thumbnail
                                  source={item.imageUrl}
                                  alt={item.productTitle}
                                  size="small"
                                />
                              ) : (
                                <Box
                                  background="bg-surface-secondary"
                                  borderRadius="100"
                                  padding="200"
                                >
                                  <Icon source={PackageIcon} />
                                </Box>
                              )}
                              <BlockStack gap="100">
                                <Text
                                  as="p"
                                  fontWeight="semibold"
                                  variant="bodyMd"
                                >
                                  {item.productTitle}
                                </Text>
                                <InlineStack gap="200" blockAlign="center">
                                  {item.variantTitle && (
                                    <Badge>{item.variantTitle}</Badge>
                                  )}
                                  <Badge
                                    tone={
                                      item.inventoryQuantity > 10
                                        ? "success"
                                        : item.inventoryQuantity > 0
                                        ? "attention"
                                        : "critical"
                                    }
                                  >
                                    {item.inventoryQuantity > 0
                                      ? `${item.inventoryQuantity} in stock`
                                      : "Out of stock"}
                                  </Badge>
                                </InlineStack>
                                <Text
                                  as="p"
                                  variant="bodySm"
                                  tone="subdued"
                                >
                                  ${item.price.toFixed(2)} each
                                </Text>
                              </BlockStack>
                            </InlineStack>
                            <InlineStack gap="300" blockAlign="center">
                              <Box width="80px">
                                <TextField
                                  label="Qty"
                                  labelHidden
                                  type="number"
                                  value={String(item.quantity)}
                                  onChange={(v) =>
                                    handleQtyChange(
                                      item.shopifyVariantId,
                                      parseInt(v) || 1
                                    )
                                  }
                                  autoComplete="off"
                                  min={1}
                                />
                              </Box>
                              <Text
                                as="p"
                                variant="bodyMd"
                                fontWeight="semibold"
                              >
                                ${(item.price * item.quantity).toFixed(2)}
                              </Text>
                              <Button
                                icon={DeleteIcon}
                                tone="critical"
                                variant="plain"
                                onClick={() =>
                                  handleRemoveItem(item.shopifyVariantId)
                                }
                                accessibilityLabel="Remove item"
                              />
                            </InlineStack>
                          </InlineStack>
                        </Box>
                      ))}

                      {items.length >= 2 && (
                        <Box
                          background="bg-surface-secondary"
                          padding="300"
                          borderRadius="200"
                        >
                          <InlineStack gap="200" blockAlign="center">
                            <Icon source={InfoIcon} />
                            <Text as="p" variant="bodySm" tone="subdued">
                              Based on current stock:{" "}
                              <Text as="span" fontWeight="semibold">
                                {zeroStockItems.length > 0
                                  ? "0 bundles can be fulfilled (component out of stock)"
                                  : `${maxBundles} bundle${
                                      maxBundles !== 1 ? "s" : ""
                                    } can be fulfilled`}
                              </Text>
                            </Text>
                          </InlineStack>
                        </Box>
                      )}
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Discount</Text>
                  <Divider />
                  <FormLayout>
                    <Select
                      label="Discount type"
                      value={discountType}
                      onChange={setDiscountType}
                      options={[
                        { label: "No discount", value: "NONE" },
                        { label: "Percentage off", value: "PERCENTAGE" },
                        {
                          label: "Fixed amount off",
                          value: "FIXED_AMOUNT",
                        },
                      ]}
                    />
                    {discountType !== "NONE" && (
                      <TextField
                        label={
                          discountType === "PERCENTAGE"
                            ? "Discount percentage (%)"
                            : "Discount amount ($)"
                        }
                        type="number"
                        value={String(discountValue)}
                        onChange={(v) =>
                          setDiscountValue(parseFloat(v) || 0)
                        }
                        autoComplete="off"
                        min={0}
                        max={
                          discountType === "PERCENTAGE" ? 100 : undefined
                        }
                        prefix={
                          discountType === "FIXED_AMOUNT" ? "$" : undefined
                        }
                        suffix={
                          discountType === "PERCENTAGE" ? "%" : undefined
                        }
                      />
                    )}
                  </FormLayout>
                </BlockStack>
              </Card>

            </BlockStack>
          </Layout.Section>

          {/* ── RIGHT COLUMN ── */}
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Status</Text>
                  <Divider />
                  <ChoiceList
                    title="Bundle status"
                    titleHidden
                    choices={[
                      {
                        label: "Active",
                        value: "ACTIVE",
                        helpText: "Visible in your Shopify store",
                      },
                      {
                        label: "Draft",
                        value: "DRAFT",
                        helpText: "Hidden from customers",
                      },
                    ]}
                    selected={[status]}
                    onChange={([v]) => setStatus(v)}
                  />
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">Price summary</Text>
                  <Divider />
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Original total
                    </Text>
                    <Text as="p" variant="bodySm">
                      ${originalTotal.toFixed(2)}
                    </Text>
                  </InlineStack>
                  {discountType !== "NONE" && (
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodySm" tone="subdued">
                        Discount
                      </Text>
                      <Text as="p" variant="bodySm" tone="critical">
                        -${savings.toFixed(2)}
                      </Text>
                    </InlineStack>
                  )}
                  <Divider />
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd" fontWeight="bold">
                      Bundle price
                    </Text>
                    <Text as="p" variant="bodyMd" fontWeight="bold">
                      ${finalPrice.toFixed(2)}
                    </Text>
                  </InlineStack>
                  {discountType !== "NONE" && savings > 0 && (
                    <Badge tone="success">
                      Customers save ${savings.toFixed(2)}
                    </Badge>
                  )}
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">Summary</Text>
                  <Divider />
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Products
                    </Text>
                    <Text as="p" variant="bodySm">
                      {items.length}
                    </Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Total qty
                    </Text>
                    <Text as="p" variant="bodySm">
                      {items.reduce((s, i) => s + i.quantity, 0)}
                    </Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Can fulfill
                    </Text>
                    <Text
                      as="p"
                      variant="bodySm"
                      fontWeight="semibold"
                      tone={
                        items.length === 0
                          ? "subdued"
                          : zeroStockItems.length > 0
                          ? "critical"
                          : maxBundles < 5
                          ? "caution"
                          : undefined
                      }
                    >
                      {items.length === 0
                        ? "—"
                        : `${maxBundles} bundle${
                            maxBundles !== 1 ? "s" : ""
                          }`}
                    </Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Shopify tag
                    </Text>
                    <Badge tone="info">{bundleProductTag}</Badge>
                  </InlineStack>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={InfoIcon} />
                    <Text as="h2" variant="headingMd">
                      Inventory note
                    </Text>
                  </InlineStack>
                  <Divider />
                  <Text as="p" variant="bodySm" tone="subdued">
                    The bundle will show{" "}
                    <Text as="span" fontWeight="semibold">
                      0 available
                    </Text>{" "}
                    in Shopify Admin. This is normal — Shopify derives
                    bundle availability from component stock automatically.
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    To make this bundle purchasable, set inventory on each
                    component product in Shopify Admin → Products →
                    [product] → Inventory.
                  </Text>
                </BlockStack>
              </Card>

            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>

      <ProductPickerModal
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          // Clear stale search results when modal closes
          submit(new URLSearchParams(), { method: "GET", replace: true });
        }}
        onSelect={handleAddProduct}
        fetching={navigation.state === "loading"}
        products={products as ShopifyProduct[]}
        onSearch={handleSearch}
      />
    </Page>
  );
}
