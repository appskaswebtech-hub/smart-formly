import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useSubmit,
  useNavigation,
  useActionData,
} from "@remix-run/react";
import { useState, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Button,
  Divider,
  Banner,
  Badge,
  Box,
  Toast,
  Frame,
  FormLayout,
  Checkbox,
  Icon,
  Tooltip,
  InlineGrid,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  SettingsIcon,
  QuestionCircleIcon,
  PackageIcon,
  OrderIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// ─────────────────────────────────────────
// LOADER
// ─────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  let settings = await db.shopSettings.findUnique({ where: { shop } });
  if (!settings) {
    settings = await db.shopSettings.create({ data: { shop } });
  }

  const [totalBundles, totalOrders, activeBundles] = await Promise.all([
    db.bundle.count({ where: { shop } }),
    db.bundleOrder.count({ where: { shop } }),
    db.bundle.count({ where: { shop, status: "ACTIVE" } }),
  ]);

  return json({ settings, shop, totalBundles, totalOrders, activeBundles });
};

// ─────────────────────────────────────────
// ACTION
// ─────────────────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "save-settings") {
    const bundleProductTag =
      (formData.get("bundleProductTag") as string)?.trim() || "bundle";
    const trackInventory = formData.get("trackInventory") === "true";

    if (!/^[a-zA-Z0-9_-]+$/.test(bundleProductTag)) {
      return json(
        {
          errors: {
            bundleProductTag:
              "Tag can only contain letters, numbers, hyphens, and underscores",
          },
          success: false,
          intent: "save-settings",
        },
        { status: 422 }
      );
    }

    await db.shopSettings.upsert({
      where: { shop },
      create: { shop, bundleProductTag, trackInventory },
      update: { bundleProductTag, trackInventory },
    });

    return json({ success: true, intent: "save-settings", errors: {} });
  }

  if (intent === "delete-all") {
    // ── Step 1: Fetch all bundle Shopify product IDs before deleting ──
    const bundles = await db.bundle.findMany({
      where: { shop, shopifyProductId: { not: null } },
      select: { id: true, shopifyProductId: true, title: true },
    });

    const DELETE_PRODUCT = `#graphql
      mutation deleteProduct($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors { field message }
        }
      }
    `;

    // ── Step 2: Delete each from Shopify (best-effort) ──
    for (const bundle of bundles) {
      if (!bundle.shopifyProductId) continue;
      try {
        const res = await admin.graphql(DELETE_PRODUCT, {
          variables: { input: { id: bundle.shopifyProductId } },
        });
        const data = await res.json();
        const errors = data.data?.productDelete?.userErrors ?? [];
        if (errors.length > 0) {
          console.warn(`Shopify delete warning for "${bundle.title}":`, errors);
        } else {
          console.log(`✅ Shopify product deleted: ${bundle.shopifyProductId}`);
        }
      } catch (err) {
        console.error(`Failed Shopify delete for bundle ${bundle.id}:`, err);
      }
    }

    // ── Step 3: Delete from DB in dependency order ──
    await db.bundleOrder.deleteMany({ where: { shop } });
    await db.bundleItem.deleteMany({ where: { bundle: { shop } } });
    await db.bundle.deleteMany({ where: { shop } });

    return json({ success: true, intent: "delete-all", errors: {} });
  }

  return json({ success: false, intent: "", errors: {} });
};

// ─────────────────────────────────────────
// SETTING SECTION WRAPPER
// ─────────────────────────────────────────
function SettingSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <Layout.Section variant="oneThird">
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">{title}</Text>
          {description && (
            <Text as="p" variant="bodySm" tone="subdued">{description}</Text>
          )}
        </BlockStack>
      </Layout.Section>
      <Layout.Section>{children}</Layout.Section>
    </Layout>
  );
}

// ─────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
}) {
  return (
    <Card>
      <InlineStack align="space-between" blockAlign="center">
        <BlockStack gap="100">
          <Text as="p" variant="bodySm" tone="subdued">{label}</Text>
          <Text as="p" variant="headingLg" fontWeight="bold">{value}</Text>
        </BlockStack>
        <Box background="bg-surface-secondary" borderRadius="200" padding="200">
          <Icon source={icon} />
        </Box>
      </InlineStack>
    </Card>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
export default function Settings() {
  const { settings, shop, totalBundles, totalOrders, activeBundles } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const saving = navigation.state === "submitting";
  const isDeleting =
    saving && navigation.formData?.get("intent") === "delete-all";

  const [bundleProductTag, setBundleProductTag] = useState(
    settings.bundleProductTag
  );
  const [trackInventory, setTrackInventory] = useState(settings.trackInventory);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);

  useEffect(() => {
    if (!actionData?.success) return;
    if (actionData.intent === "save-settings") {
      setToastMessage("Settings saved successfully!");
      setToastError(false);
      setToastActive(true);
    } else if (actionData.intent === "delete-all") {
      setToastMessage("All bundles deleted from Shopify and database.");
      setToastError(false);
      setToastActive(true);
    }
  }, [actionData]);

  const handleSave = () => {
    const formData = new FormData();
    formData.set("intent", "save-settings");
    formData.set("bundleProductTag", bundleProductTag);
    formData.set("trackInventory", String(trackInventory));
    submit(formData, { method: "POST" });
  };

  const errors = (actionData as any)?.errors ?? {};

  return (
    <Frame>
      <Page
        title="Settings"
        primaryAction={{
          content: saving && !isDeleting ? "Saving…" : "Save settings",
          loading: saving && !isDeleting,
          onAction: handleSave,
          disabled: saving,
        }}
      >
        <TitleBar title="Settings" />

        <BlockStack gap="800">

          {/* ── Shop overview ── */}
          <Card>
            <BlockStack gap="500">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={SettingsIcon} />
                <Text as="h2" variant="headingMd">Shop overview</Text>
              </InlineStack>
              <Divider />
              <InlineGrid columns={4} gap="400">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Store</Text>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    {shop.replace(".myshopify.com", "")}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">{shop}</Text>
                </BlockStack>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Total bundles</Text>
                  <InlineStack gap="150" blockAlign="center">
                    <Icon source={PackageIcon} />
                    <Text as="p" variant="headingMd" fontWeight="bold">
                      {totalBundles}
                    </Text>
                  </InlineStack>
                  <Badge tone="success">{activeBundles} active</Badge>
                </BlockStack>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Total orders</Text>
                  <InlineStack gap="150" blockAlign="center">
                    <Icon source={OrderIcon} />
                    <Text as="p" variant="headingMd" fontWeight="bold">
                      {totalOrders}
                    </Text>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">All time</Text>
                </BlockStack>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Installed</Text>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    {new Date(settings.installedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </BlockStack>
              </InlineGrid>
            </BlockStack>
          </Card>

          <Divider />

          {/* ── Product settings ── */}
          <SettingSection
            title="Product settings"
            description="Configure how bundle products are tagged in your Shopify store."
          >
            <Card>
              <BlockStack gap="400">
                <FormLayout>
                  <InlineStack gap="300" blockAlign="end" wrap={false}>
                    <div style={{ flex: 1 }}>
                      <TextField
                        label={
                          <InlineStack gap="100" blockAlign="center">
                            <span>Bundle product tag</span>
                            <Tooltip content="This tag is added to all bundle products in Shopify so you can identify and filter them in reports.">
                              <Icon source={QuestionCircleIcon} />
                            </Tooltip>
                          </InlineStack>
                        }
                        value={bundleProductTag}
                        onChange={setBundleProductTag}
                        error={errors.bundleProductTag}
                        placeholder="bundle"
                        autoComplete="off"
                        helpText="Applied to all bundle products in Shopify."
                      />
                    </div>
                    <Box paddingBlockEnd="100">
                      <Badge tone="info">{bundleProductTag || "bundle"}</Badge>
                    </Box>
                  </InlineStack>
                </FormLayout>
              </BlockStack>
            </Card>
          </SettingSection>

          <Divider />

          {/* ── Inventory ── */}
          <SettingSection
            title="Inventory"
            description="Control how bundle orders interact with your product inventory."
          >
            <Card>
              <Checkbox
                label="Track inventory per bundle item"
                helpText="When enabled, purchasing a bundle reduces inventory for each individual component product."
                checked={trackInventory}
                onChange={setTrackInventory}
              />
            </Card>
          </SettingSection>

          <Divider />



          <Divider />

          {/* ── Danger zone ── */}
          <SettingSection
            title="Danger zone"
            description="Irreversible actions. These cannot be undone."
          >
            <Card>
              <BlockStack gap="400">
                <Banner tone="critical">
                  <Text as="p">
                    Deleting all bundles will also remove the associated
                    products from your Shopify store permanently.
                  </Text>
                </Banner>

                <Divider />

                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Delete all bundles
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Remove all {totalBundles} bundle
                      {totalBundles !== 1 ? "s" : ""} from this app{" "}
                      <Text as="span" fontWeight="semibold">
                        and delete their Shopify products
                      </Text>
                      .
                    </Text>
                  </BlockStack>
                  <Button
                    tone="critical"
                    loading={isDeleting}
                    disabled={totalBundles === 0 || saving}
                    onClick={() => {
                      if (
                        confirm(
                          `Delete ALL ${totalBundles} bundles?\n\nThis will also delete their products from Shopify. This cannot be undone.`
                        )
                      ) {
                        const formData = new FormData();
                        formData.set("intent", "delete-all");
                        submit(formData, { method: "POST" });
                      }
                    }}
                  >
                    Delete all bundles
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </SettingSection>

          {/* ── Bottom save ── */}
          <Box paddingBlockEnd="800">
            <InlineStack align="end">
              <Button
                variant="primary"
                size="large"
                loading={saving && !isDeleting}
                disabled={saving}
                onClick={handleSave}
              >
                {saving && !isDeleting ? "Saving…" : "Save settings"}
              </Button>
            </InlineStack>
          </Box>

        </BlockStack>
      </Page>

      {toastActive && (
        <Toast
          content={toastMessage}
          error={toastError}
          onDismiss={() => setToastActive(false)}
        />
      )}
    </Frame>
  );
}
