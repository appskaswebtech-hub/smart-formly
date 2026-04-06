import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  useSearchParams,
} from "@remix-run/react";
import { useState, useCallback, useEffect } from "react";
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
  Toast,
  Frame,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  PackageIcon,
  DeleteIcon,
  PlusIcon,
  ExternalIcon,
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
}

interface ShopifyProduct {
  id: string;
  title: string;
  featuredImage?: { url: string } | null;
  variants: { edges: { node: ShopifyVariant }[] };
}

interface BundleItemState {
  shopifyProductId: string;
  shopifyVariantId: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: number;
  sku: string | null;
  imageUrl: string | null;
}

// ─────────────────────────────────────────
// GRAPHQL
// ─────────────────────────────────────────
const SEARCH_PRODUCTS_QUERY = `
  query searchProducts($query: String!) {
    products(first: 10, query: $query) {
      edges {
        node {
          id
          title
          featuredImage { url }
          variants(first: 10) {
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
          options { id name values }
        }
      }
    }
  }
`;

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
// HELPER — Build correct optionSelections for productBundleCreate/Update
//
// Exact fields required by ProductBundleComponentOptionSelectionInput:
//   componentOptionId : "gid://shopify/ProductOption/123"
//   name              : display name for this option in the bundle
//   values            : array of selected values e.g. ["M"]
//
// Source: https://shopify.dev/docs/apps/build/product-merchandising/bundles/add-product-fixed-bundle
// ─────────────────────────────────────────
async function buildComponentOptionSelections(
  admin: any,
  productId: string,
  variantId: string
) {
  const res = await admin.graphql(GET_PRODUCT_OPTIONS_QUERY, {
    variables: { id: productId },
  });
  const data = await res.json();
  const product = data.data?.product;
  if (!product) return [];

  // Build option name → GID lookup
  const optionIdMap: Record<string, string> = {};
  for (const opt of product.options) {
    optionIdMap[opt.name] = opt.id;
  }

  // Find chosen variant (fallback to first)
  const variant =
    product.variants.edges.find((e: any) => e.node.id === variantId)?.node ??
    product.variants.edges[0]?.node;

  if (!variant) return [];

  return variant.selectedOptions.map((opt: any) => ({
    componentOptionId: optionIdMap[opt.name], // ProductOption GID — required
    name: opt.name,                           // display name in bundle
    values: [opt.value],                      // selected value from chosen variant
  }));
}

// ── Shopify GraphQL Mutations for Bundle Update ──
// Uses productBundleUpdate (native bundle API) + productUpdate for metadata

const BUNDLE_UPDATE_MUTATION = `
  mutation productBundleUpdate($input: ProductBundleUpdateInput!) {
    productBundleUpdate(input: $input) {
      productBundleOperation {
        id
        status
        product {
          id
          variants(first: 1) {
            edges { node { id } }
          }
        }
      }
      userErrors { field message }
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

const UPDATE_VARIANT_MUTATION = `
  mutation updateBundleVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id price compareAtPrice }
      userErrors { field message }
    }
  }
`;

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
      }
    }
  }
`;

// ─────────────────────────────────────────
// LOADER
// ─────────────────────────────────────────
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const { id } = params;

  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("productSearch");

  const bundle = await db.bundle.findFirst({
    where: { id, shop },
    include: { items: { orderBy: { position: "asc" } } },
  });

  if (!bundle) throw new Response("Not Found", { status: 404 });

  if (searchQuery) {
    const response = await admin.graphql(SEARCH_PRODUCTS_QUERY, {
      variables: { query: searchQuery },
    });
    const data = await response.json();
    const products: ShopifyProduct[] = data.data.products.edges.map(
      (e: any) => e.node
    );
    return json({ bundle, products, searchQuery });
  }

  return json({ bundle, products: [], searchQuery: "" });
};

// ─────────────────────────────────────────
// ACTION — Update Bundle
// ─────────────────────────────────────────
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const { id } = params;

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // ── Archive ──
  if (intent === "archive") {
    await db.bundle.update({
      where: { id, shop },
      data: { status: "ARCHIVED" },
    });
    return json({ success: true, intent: "archive" });
  }

  // ── Update ──
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;
  const discountType = formData.get("discountType") as string;
  const discountValue = parseFloat(formData.get("discountValue") as string) || 0;
  const itemsJson = formData.get("items") as string;
  const items: BundleItemState[] = JSON.parse(itemsJson || "[]");

  const errors: Record<string, string> = {};
  if (!title?.trim()) errors.title = "Title is required";
  if (items.length < 2) errors.items = "A bundle must have at least 2 items";
  if (Object.keys(errors).length > 0) {
    return json({ errors, success: false }, { status: 422 });
  }

  const originalTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  let finalPrice = originalTotal;
  if (discountType === "PERCENTAGE") finalPrice = originalTotal * (1 - discountValue / 100);
  else if (discountType === "FIXED_AMOUNT") finalPrice = Math.max(0, originalTotal - discountValue);

  // Fetch current bundle for shopifyProductId
  const currentBundle = await db.bundle.findFirst({ where: { id, shop } });

  // ─────────────────────────────────────────
  // UPDATE BUNDLE using Shopify's native productBundleUpdate
  // Docs: https://shopify.dev/docs/api/admin-graphql/unstable/mutations/productBundleUpdate
  // ─────────────────────────────────────────
  if (currentBundle?.shopifyProductId) {

    // ── STEP 1: Fetch option selections for each component ──
    // productBundleUpdate requires ALL options of ALL components to be mapped
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

    // ── STEP 2: Update bundle components via productBundleUpdate ──
    const bundleUpdateRes = await admin.graphql(BUNDLE_UPDATE_MUTATION, {
      variables: {
        input: {
          productId: currentBundle.shopifyProductId,
          title,
          components: componentsWithOptions,
        },
      },
    });

    const bundleUpdateData = await bundleUpdateRes.json();
    const bundleUserErrors = bundleUpdateData.data?.productBundleUpdate?.userErrors ?? [];

    if (bundleUserErrors.length > 0) {
      return json(
        { errors: { shopify: bundleUserErrors[0].message }, success: false },
        { status: 422 }
      );
    }

    // ── STEP 3: Poll until operation COMPLETE ──
    const operationId = bundleUpdateData.data?.productBundleUpdate?.productBundleOperation?.id;
    let variantId = currentBundle.shopifyVariantId;

    if (operationId) {
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const pollRes = await admin.graphql(POLL_OPERATION_QUERY, {
          variables: { id: operationId },
        });
        const pollData = await pollRes.json();
        const op = pollData.data?.productOperation;
        if (op?.status === "COMPLETE") {
          variantId = op?.product?.variants?.edges?.[0]?.node?.id ?? variantId;
          break;
        }
        if (op?.status === "FAILED") break;
      }
    }

    // ── STEP 4: Update product description + status ──
    await admin.graphql(UPDATE_PRODUCT_MUTATION, {
      variables: {
        input: {
          id: currentBundle.shopifyProductId,
          descriptionHtml: description || "",
          status: status === "ACTIVE" ? "ACTIVE" : "DRAFT",
          tags: ["bundle"],
        },
      },
    });

    // ── STEP 5: Update discount price on variant ──
    if (variantId && discountType !== "NONE") {
      await admin.graphql(UPDATE_VARIANT_MUTATION, {
        variables: {
          productId: currentBundle.shopifyProductId,
          variants: [
            {
              id: variantId,
              price: finalPrice.toFixed(2),
              compareAtPrice: originalTotal.toFixed(2),
            },
          ],
        },
      });
    }
  }

  // Update DB
  await db.bundle.update({
    where: { id, shop },
    data: {
      title,
      description,
      status: status as any,
      discountType: discountType as any,
      discountValue,
      totalPrice: finalPrice,
      compareAtPrice: discountType !== "NONE" ? originalTotal : null,
      items: {
        deleteMany: {},
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

  return json({ success: true, intent: "update" });
};

// ─────────────────────────────────────────
// PRODUCT PICKER MODAL
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
  return (
    <Modal open={open} onClose={onClose} title="Add product to bundle">
      <Modal.Section>
        <Filters
          queryValue={query}
          queryPlaceholder="Search products…"
          filters={[]}
          onQueryChange={(v) => { setQuery(v); onSearch(v); }}
          onQueryClear={() => { setQuery(""); onSearch(""); }}
          onClearAll={() => { setQuery(""); onSearch(""); }}
        />
      </Modal.Section>
      <Modal.Section>
        {fetching ? (
          <InlineStack align="center"><Spinner size="large" /></InlineStack>
        ) : products.length === 0 ? (
          <Text as="p" tone="subdued" alignment="center">
            {query ? "No products found." : "Start typing to search products…"}
          </Text>
        ) : (
          <BlockStack gap="300">
            {products.map((product) =>
              product.variants.edges.map(({ node: variant }) => (
                <Box key={variant.id} padding="300" borderRadius="200" borderWidth="025" borderColor="border">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="300" blockAlign="center">
                      {product.featuredImage ? (
                        <Thumbnail source={product.featuredImage.url} alt={product.title} size="small" />
                      ) : (
                        <Box background="bg-surface-secondary" borderRadius="100" padding="200">
                          <Icon source={PackageIcon} />
                        </Box>
                      )}
                      <BlockStack gap="050">
                        <Text as="p" fontWeight="semibold" variant="bodyMd">{product.title}</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {variant.title !== "Default Title" ? variant.title : ""} · ${parseFloat(variant.price).toFixed(2)}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <Button size="slim" variant="primary" onClick={() => onSelect(product, variant)}>Add</Button>
                  </InlineStack>
                </Box>
              ))
            )}
          </BlockStack>
        )}
      </Modal.Section>
    </Modal>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
export default function BundleEdit() {
  const { bundle, products } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [searchParams] = useSearchParams();

  const saving = navigation.state === "submitting";
  const justCreated = searchParams.get("created") === "true";

  // ── Toast ──
  const [toastActive, setToastActive] = useState(justCreated);
  const [toastMessage, setToastMessage] = useState(
    justCreated ? "Bundle created successfully!" : ""
  );

  useEffect(() => {
    if (actionData?.success && actionData.intent === "update") {
      setToastMessage("Bundle updated successfully!");
      setToastActive(true);
    }
  }, [actionData]);

  // ── Form State — init from DB ──
  const [title, setTitle] = useState(bundle.title);
  const [description, setDescription] = useState(bundle.description ?? "");
  const [status, setStatus] = useState(bundle.status);
  const [discountType, setDiscountType] = useState(bundle.discountType);
  const [discountValue, setDiscountValue] = useState(bundle.discountValue);
  const [items, setItems] = useState<BundleItemState[]>(
    bundle.items.map((item) => ({
      shopifyProductId: item.shopifyProductId,
      shopifyVariantId: item.shopifyVariantId,
      productTitle: item.productTitle,
      variantTitle: item.variantTitle ?? "",
      quantity: item.quantity,
      price: item.price,
      sku: item.sku,
      imageUrl: item.imageUrl,
    }))
  );

  // ── Archive Modal ──
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  // ── Product Picker ──
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searching, setSearching] = useState(false);

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
      const existing = items.find((i) => i.shopifyVariantId === variant.id);
      if (existing) {
        setItems((prev) =>
          prev.map((i) =>
            i.shopifyVariantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        );
      } else {
        setItems((prev) => [
          ...prev,
          {
            shopifyProductId: product.id,
            shopifyVariantId: variant.id,
            productTitle: product.title,
            variantTitle: variant.title !== "Default Title" ? variant.title : "",
            quantity: 1,
            price: parseFloat(variant.price),
            sku: variant.sku,
            imageUrl: product.featuredImage?.url ?? null,
          },
        ]);
      }
      setPickerOpen(false);
    },
    [items]
  );

  const handleRemoveItem = (variantId: string) =>
    setItems((prev) => prev.filter((i) => i.shopifyVariantId !== variantId));

  const handleQtyChange = (variantId: string, qty: number) =>
    setItems((prev) =>
      prev.map((i) =>
        i.shopifyVariantId === variantId ? { ...i, quantity: Math.max(1, qty) } : i
      )
    );

  // ── Price calc ──
  const originalTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const finalPrice =
    discountType === "PERCENTAGE"
      ? originalTotal * (1 - discountValue / 100)
      : discountType === "FIXED_AMOUNT"
      ? Math.max(0, originalTotal - discountValue)
      : originalTotal;
  const savings = originalTotal - finalPrice;

  // ── Save ──
  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "update");
    formData.set("title", title);
    formData.set("description", description);
    formData.set("status", status);
    formData.set("discountType", discountType);
    formData.set("discountValue", String(discountValue));
    formData.set("items", JSON.stringify(items));
    submit(formData, { method: "POST" });
  }, [title, description, status, discountType, discountValue, items, submit]);

  const handleArchive = () => {
    const formData = new FormData();
    formData.set("intent", "archive");
    submit(formData, { method: "POST" });
    setArchiveModalOpen(false);
  };

  const errors = (actionData as any)?.errors ?? {};

  const statusTone: Record<string, "success" | "attention" | "critical"> = {
    ACTIVE: "success", DRAFT: "attention", ARCHIVED: "critical",
  };

  return (
    <Frame>
      <Page
        backAction={{ content: "Bundles", url: "/app/bundles" }}
        title={bundle.title}
        titleMetadata={<Badge tone={statusTone[bundle.status]}>{bundle.status}</Badge>}
        primaryAction={{
          content: saving ? "Saving…" : "Save changes",
          loading: saving,
          onAction: handleSave,
          disabled: saving,
        }}
        secondaryActions={[
          ...(bundle.shopifyProductId
            ? [
                {
                  content: "View in Shopify",
                  icon: ExternalIcon,
                  url: `https://admin.shopify.com/products/${bundle.shopifyProductId.replace("gid://shopify/Product/", "")}`,
                  external: true,
                },
              ]
            : []),
          {
            content: "Archive",
            destructive: true,
            onAction: () => setArchiveModalOpen(true),
            disabled: bundle.status === "ARCHIVED",
          },
        ]}
      >
        <TitleBar title={`Edit: ${bundle.title}`} />

        <BlockStack gap="600">
          {errors.shopify && (
            <Banner tone="critical" title="Shopify error">
              <Text as="p">{errors.shopify}</Text>
            </Banner>
          )}

          {bundle.status === "ARCHIVED" && (
            <Banner tone="warning" title="This bundle is archived">
              <Text as="p">Archived bundles are hidden from your store.</Text>
            </Banner>
          )}

          <Layout>
            {/* ── Left ── */}
            <Layout.Section>
              <BlockStack gap="500">
                {/* Details */}
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
                        autoComplete="off"
                      />
                      <TextField
                        label="Description"
                        value={description}
                        onChange={setDescription}
                        multiline={3}
                        autoComplete="off"
                      />
                    </FormLayout>
                  </BlockStack>
                </Card>

                {/* Items */}
                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="050">
                        <Text as="h2" variant="headingMd">Bundle items</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {items.length} product{items.length !== 1 ? "s" : ""}
                        </Text>
                      </BlockStack>
                      <Button icon={PlusIcon} onClick={() => setPickerOpen(true)} variant="primary">
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
                      <Box paddingBlock="600">
                        <Text as="p" tone="subdued" alignment="center">
                          No items. Add at least 2 products.
                        </Text>
                      </Box>
                    ) : (
                      <BlockStack gap="300">
                        {items.map((item) => (
                          <Box
                            key={item.shopifyVariantId}
                            padding="300"
                            borderRadius="200"
                            borderWidth="025"
                            borderColor="border"
                          >
                            <InlineStack align="space-between" blockAlign="center">
                              <InlineStack gap="300" blockAlign="center">
                                {item.imageUrl ? (
                                  <Thumbnail source={item.imageUrl} alt={item.productTitle} size="small" />
                                ) : (
                                  <Box background="bg-surface-secondary" borderRadius="100" padding="200">
                                    <Icon source={PackageIcon} />
                                  </Box>
                                )}
                                <BlockStack gap="050">
                                  <Text as="p" fontWeight="semibold" variant="bodyMd">{item.productTitle}</Text>
                                  {item.variantTitle && <Badge>{item.variantTitle}</Badge>}
                                  <Text as="p" variant="bodySm" tone="subdued">${item.price.toFixed(2)} each</Text>
                                </BlockStack>
                              </InlineStack>
                              <InlineStack gap="300" blockAlign="center">
                                <Box width="80px">
                                  <TextField
                                    label="Qty"
                                    labelHidden
                                    type="number"
                                    value={String(item.quantity)}
                                    onChange={(v) => handleQtyChange(item.shopifyVariantId, parseInt(v) || 1)}
                                    autoComplete="off"
                                    min={1}
                                  />
                                </Box>
                                <Text as="p" fontWeight="semibold" variant="bodyMd">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </Text>
                                <Button
                                  icon={DeleteIcon}
                                  tone="critical"
                                  variant="plain"
                                  onClick={() => handleRemoveItem(item.shopifyVariantId)}
                                  accessibilityLabel="Remove"
                                />
                              </InlineStack>
                            </InlineStack>
                          </Box>
                        ))}
                      </BlockStack>
                    )}
                  </BlockStack>
                </Card>

                {/* Discount */}
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
                          { label: "Fixed amount off", value: "FIXED_AMOUNT" },
                        ]}
                      />
                      {discountType !== "NONE" && (
                        <TextField
                          label={discountType === "PERCENTAGE" ? "Discount (%)" : "Discount ($)"}
                          type="number"
                          value={String(discountValue)}
                          onChange={(v) => setDiscountValue(parseFloat(v) || 0)}
                          autoComplete="off"
                          min={0}
                          max={discountType === "PERCENTAGE" ? 100 : undefined}
                          prefix={discountType === "FIXED_AMOUNT" ? "$" : undefined}
                          suffix={discountType === "PERCENTAGE" ? "%" : undefined}
                        />
                      )}
                    </FormLayout>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Layout.Section>

            {/* ── Right ── */}
            <Layout.Section variant="oneThird">
              <BlockStack gap="400">
                {/* Status */}
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd">Status</Text>
                    <Divider />
                    <ChoiceList
                      title="Status"
                      titleHidden
                      choices={[
                        { label: "Active", value: "ACTIVE", helpText: "Visible in store" },
                        { label: "Draft", value: "DRAFT", helpText: "Hidden from customers" },
                      ]}
                      selected={[status]}
                      onChange={([v]) => setStatus(v)}
                    />
                  </BlockStack>
                </Card>

                {/* Pricing */}
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">Price summary</Text>
                    <Divider />
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodySm" tone="subdued">Original total</Text>
                      <Text as="p" variant="bodySm">${originalTotal.toFixed(2)}</Text>
                    </InlineStack>
                    {discountType !== "NONE" && (
                      <InlineStack align="space-between">
                        <Text as="p" variant="bodySm" tone="subdued">Discount</Text>
                        <Text as="p" variant="bodySm" tone="critical">-${savings.toFixed(2)}</Text>
                      </InlineStack>
                    )}
                    <Divider />
                    <InlineStack align="space-between">
                      <Text as="p" fontWeight="bold" variant="bodyMd">Bundle price</Text>
                      <Text as="p" fontWeight="bold" variant="bodyMd">${finalPrice.toFixed(2)}</Text>
                    </InlineStack>
                    {discountType !== "NONE" && savings > 0 && (
                      <Badge tone="success">Customers save ${savings.toFixed(2)}</Badge>
                    )}
                  </BlockStack>
                </Card>

                {/* Stats */}
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">Performance</Text>
                    <Divider />
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodySm" tone="subdued">Created</Text>
                      <Text as="p" variant="bodySm">
                        {new Date(bundle.createdAt).toLocaleDateString()}
                      </Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodySm" tone="subdued">Last updated</Text>
                      <Text as="p" variant="bodySm">
                        {new Date(bundle.updatedAt).toLocaleDateString()}
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </Card>

                {/* Danger zone */}
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd" tone="critical">Danger zone</Text>
                    <Divider />
                    <Text as="p" variant="bodySm" tone="subdued">
                      Delete this bundle permanently. This cannot be undone.
                    </Text>
                    <Button
                      tone="critical"
                      url={`/app/bundles/${bundle.id}/destroy`}
                      fullWidth
                    >
                      Delete bundle
                    </Button>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Layout.Section>
          </Layout>
        </BlockStack>

        {/* Archive Modal */}
        <Modal
          open={archiveModalOpen}
          onClose={() => setArchiveModalOpen(false)}
          title="Archive bundle?"
          primaryAction={{ content: "Archive", destructive: true, onAction: handleArchive }}
          secondaryActions={[{ content: "Cancel", onAction: () => setArchiveModalOpen(false) }]}
        >
          <Modal.Section>
            <Text as="p">
              Archiving will hide this bundle from your store. You can reactivate it anytime.
            </Text>
          </Modal.Section>
        </Modal>

        {/* Product Picker */}
        <ProductPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handleAddProduct}
          fetching={navigation.state === "loading"}
          products={products as ShopifyProduct[]}
          onSearch={handleSearch}
        />
      </Page>

      {toastActive && (
        <Toast content={toastMessage} onDismiss={() => setToastActive(false)} />
      )}
    </Frame>
  );
}
