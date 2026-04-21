import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useSubmit,
  useNavigation,
  useActionData,
} from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Divider,
  Button,
  TextField,
  Checkbox,
  Toast,
  Frame,
  Box,
  Badge,
  Banner,
  Popover,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

interface SettingsForm {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  brandingRemoved: boolean;
}

// ─── LOADER ───────────────────────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopRecord = await db.widgetSettings.findFirst({
    where: { shop: session.shop },
    // include: { settings: true },
  });

  if (!shopRecord) throw new Error("Shop not found");

  const settings = shopRecord.settings ?? {
    primaryColor: "#3b82f6",
    secondaryColor: "#4a4a6a",
    accentColor: "#1d4ed8",
    backgroundColor: "#ffffff",
    brandingRemoved: false,
  };

  return json({
    settings,
    shop: session.shop,
    planName: shopRecord.planName,
  });
};

// // ─── ACTION ───────────────────────────────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const shopRecord = await db.widgetSettings.findUnique({
    where: { shop: session.shop },
  });
  if (!shopRecord) throw new Error("Shop not found");

  await db.shopSetting.upsert({
    where: { shopId: shopRecord.id },
    update: {
      primaryColor: formData.get("primaryColor") as string,
      secondaryColor: formData.get("secondaryColor") as string,
      accentColor: formData.get("accentColor") as string,
      backgroundColor: formData.get("backgroundColor") as string,
    },
    create: {
      shopId: shopRecord.id,
      primaryColor: formData.get("primaryColor") as string,
      secondaryColor: formData.get("secondaryColor") as string,
      accentColor: formData.get("accentColor") as string,
      backgroundColor: formData.get("backgroundColor") as string,
      brandingRemoved: false,
    },
  });

  return json({ success: true });
};



// ─── COLOR INPUT ──────────────────────────────────────────────────────────────

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [popover, setPopover] = useState(false);

  return (
    <BlockStack gap="200">
      <Text variant="bodySm" as="p" fontWeight="semibold">
        {label}
      </Text>
      <InlineStack gap="300" blockAlign="center">
        <Popover
          active={popover}
          onClose={() => setPopover(false)}
          activator={
            <div
              onClick={() => setPopover(!popover)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                background: value,
                border: "2px solid #e5e7eb",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
          }
        >
         
          <Box padding="400">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: "200px", height: "40px", cursor: "pointer" }}
            />
          </Box>
         
        </Popover>
        <TextField
          label=""
          labelHidden
          value={value}
          onChange={onChange}
          autoComplete="off"
          maxLength={7}
        />
      </InlineStack>
    </BlockStack>
  );
}

// ─── LIVE PREVIEW ─────────────────────────────────────────────────────────────

function LivePreview({ form }: { form: SettingsForm }) {
  const [selected, setSelected] = useState(0);

  const rows = [
    { label: "Buy 1", price: "$10.00", origPrice: null, badge: null },
    { label: "Buy 2 and get a discount!", price: "$18.00", origPrice: "$20.00", badge: "Save 10%" },
    { label: "Buy 3 and get a discount!", price: "$25.50", origPrice: "$30.00", badge: "Save 15%" },
  ];

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        overflow: "hidden",
        background: form.backgroundColor,
      }}
    >
      {/* Title */}
      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: "12px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "12px 16px",
          borderBottom: "1px solid #e5e7eb",
          color: form.primaryColor,
          background: "#f9fafb",
        }}
      >
        — BUY IN BULK AND GET A DISCOUNT! —
      </div>

      {/* Rows */}
      <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {rows.map((row, i) => (
          <div
            key={i}
            onClick={() => setSelected(i)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              borderRadius: "7px",
              border: `2px solid ${i === selected ? form.primaryColor : "#e5e7eb"}`,
              background: i === selected ? `${form.primaryColor}18` : "#f9fafb",
              cursor: "pointer",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: `${i === selected ? "5px" : "2px"} solid ${i === selected ? form.primaryColor : "#d1d5db"}`,
                  background: "#fff",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "13px", color: "#111827", fontWeight: 500 }}>
                {row.label}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {row.badge && (
                <span
                  style={{
                    background: form.accentColor,
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: "20px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.badge}
                </span>
              )}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                  {row.price}
                </div>
                {row.origPrice && (
                  <div style={{ fontSize: "11px", color: "#9ca3af", textDecoration: "line-through" }}>
                    {row.origPrice}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Branding */}
      {!form.brandingRemoved && (
        <div style={{ textAlign: "center", fontSize: "10px", color: "#d1d5db", padding: "6px 0 10px" }}>
          Powered by BundleKit
        </div>
      )}
    </div>
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function Settings() {
  const { settings, shop, planName } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const [form, setForm] = useState<SettingsForm>({
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    accentColor: settings.accentColor,
    backgroundColor: settings.backgroundColor,
    brandingRemoved: settings.brandingRemoved,
  });
  const [toastActive, setToastActive] = useState(false);

  const updateColor = (field: keyof SettingsForm) => (val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const handleSave = () => {
    alert();
    
    const fd = new FormData();
    console.log("AAAAAAAA",fd);
    return;
    fd.append("primaryColor", form.primaryColor);
    fd.append("secondaryColor", form.secondaryColor);
    fd.append("accentColor", form.accentColor);
    fd.append("backgroundColor", form.backgroundColor);
    submit(fd, { method: "post" });
    setToastActive(true);
  };

  const handleReset = () =>
    setForm({
      primaryColor: "#3b82f6",
      secondaryColor: "#4a4a6a",
      accentColor: "#1d4ed8",
      backgroundColor: "#ffffff",
      brandingRemoved: false,
    });

  return (
    <Frame>
      {toastActive && actionData?.success && (
        <Toast
          content="Settings saved successfully!"
          onDismiss={() => setToastActive(false)}
        />
      )}

      <Page
        title="Settings"
        subtitle="Configure your BundleKit widget appearance"
        primaryAction={{
          content: "Save settings",
          loading: isSaving,
          onAction: handleSave,
        }}
        secondaryActions={[
          { content: "Reset to defaults", onAction: handleReset },
        ]}
      >
        <Layout>
          {/* ── LEFT ── */}
          <Layout.Section>
            <BlockStack gap="500">

              {/* Widget Colors */}
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">Widget Colors</Text>
                  <Divider />
                  <Text variant="bodySm" as="p" tone="subdued">
                    Customize colors to match your store theme. Changes apply to all quantity break widgets.
                  </Text>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "24px",
                    }}
                  >
                    <ColorInput
                      label="Primary Color"
                      value={form.primaryColor}
                      onChange={updateColor("primaryColor")}
                    />
                    <ColorInput
                      label="Secondary Color"
                      value={form.secondaryColor}
                      onChange={updateColor("secondaryColor")}
                    />
                    <ColorInput
                      label="Badge / Discount Color"
                      value={form.accentColor}
                      onChange={updateColor("accentColor")}
                    />
                    <ColorInput
                      label="Background Color"
                      value={form.backgroundColor}
                      onChange={updateColor("backgroundColor")}
                    />
                  </div>
                </BlockStack>
              </Card>

              {/* Branding */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingMd" as="h2">Branding</Text>
                    <Badge tone={planName === "premium" ? "success" : "warning"}>
                      {planName === "premium" ? "Premium" : "Free Plan"}
                    </Badge>
                  </InlineStack>
                  <Divider />

                  {planName !== "premium" && (
                    <Banner tone="warning">
                      <Text as="p" variant="bodyMd">
                        Remove "Powered by BundleKit" branding by upgrading
                        to Premium or emailing{" "}
                        <strong>verify@bundler.app</strong>.
                      </Text>
                    </Banner>
                  )}

                  <div style={{ opacity: planName === "premium" ? 1 : 0.5 }}>
                    <Checkbox
                      label="Remove 'Powered by BundleKit' branding"
                      checked={planName === "premium" ? form.brandingRemoved : false}
                      disabled={planName !== "premium"}
                      onChange={(val) =>
                        setForm((prev) => ({ ...prev, brandingRemoved: val }))
                      }
                      helpText="Hide the BundleKit branding text from your widget."
                    />
                  </div>

                  {planName !== "premium" && (
                    <Button variant="primary" tone="success" fullWidth>
                      Upgrade to Remove Branding
                    </Button>
                  )}
                </BlockStack>
              </Card>

              {/* App Embed */}
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">App Embed</Text>
                  <Divider />
                  <Text variant="bodyMd" as="p">
                    Enable the BundleKit block in your theme editor and place
                    it above the Add to Cart button on your product pages.
                  </Text>
                  <Button
                    url={`https://${shop}/admin/themes/current/editor?context=apps`}
                    external
                    variant="primary"
                  >
                    Open Theme Editor →
                  </Button>
                </BlockStack>
              </Card>

            </BlockStack>
          </Layout.Section>

          {/* ── RIGHT: Live Preview ── */}
          <Layout.Section variant="oneThird">
            <div style={{ position: "sticky", top: "20px" }}>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">Live Preview</Text>
                  <Divider />
                  <LivePreview form={form} />
                  <Text variant="bodySm" as="p" tone="subdued" alignment="center">
                    Click rows to preview selection state
                  </Text>
                </BlockStack>
              </Card>
            </div>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}

