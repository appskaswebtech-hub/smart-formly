import type { HeadersFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useRouteError, useFetcher } from "@remix-run/react";
import {
  Page, Layout, Card, BlockStack, InlineStack,
  Text, Button, Box, Divider, Icon, Banner,
} from "@shopify/polaris";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";
import { boundary } from "@shopify/shopify-app-remix/server";
import { authenticate } from "../shopify.server";
import { useState } from "react";

// ─── Billing plan name map ────────────────────────────────────────────────────
const PLAN_NAME_MAP: Record<string, string> = {
  base:    "Base Monthly",
  pro:     "Pro Monthly",
  proplus: "ProPlus Monthly",
};

// ─── Loader ───────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({});
};


export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const planName = formData.get("planName") as string;

  // const url = new URL(request.url);
  // const returnUrl = `${url.origin}/app/pricing`;

  const returnUrl = "https://smartformly.kaswebtechsolutions.com/app/pricing";

  console.log("=== BILLING DEBUG ===");
  console.log("planName:", planName);
  console.log("returnUrl:", returnUrl);

  try {
    await billing.request({
  plan: planName as "Base Monthly" | "Pro Monthly" | "ProPlus Monthly",
  isTest: true,
  returnUrl,
});
  } catch (err: any) {
    console.error("=== BILLING ERROR ===");
    console.error("message:", err?.message);
    console.error("cause:", err?.cause);
    console.error("response:", err?.response);
    console.error("full:", JSON.stringify(err, null, 2));
    throw err;
  }

  return json({ ok: true });
};

// ─── Static data ──────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "base",
    name: "Base",
    price: 9.9,
    trialDays: 7,
    highlights: [
      "Full design customization",
      "Export form submissions",
      "Multiple recipients for form submissions",
      "Multiple admin notifications",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 17.99,
    trialDays: 7,
    highlights: [
      "Full design customization",
      "Export form submissions",
      "Multiple recipients for form submissions",
      "Multiple admin notifications",
    ],
  },
  {
    id: "proplus",
    name: "Pro+",
    price: 25.9,
    trialDays: 7,
    highlights: [
      "Full design customization",
      "Export form submissions",
      "Multiple recipients for form submissions",
      "Multiple admin notifications",
    ],
  },
];

const FEATURES: { label: string; values: [boolean, boolean, boolean] }[] = [
  { label: "Bing UET pixel ID",                      values: [false, true, true] },
  { label: "Advanced JS",                            values: [false, true, true] },
  { label: "Advanced CSS",                           values: [false, true, true] },
  { label: "API available",                          values: [false, true, true] },
  { label: "Customize form message",                 values: [false, true, true] },
  { label: "Hidden field",                           values: [false, true, true] },
  { label: "Restrict form submissions per one user", values: [false, true, true] },
  { label: "UTM tracking",                           values: [false, true, true] },
];

function formatPrice(n: number) {
  return `$${n.toFixed(2)}`;
}

// ─── Choose Plan button ───────────────────────────────────────────────────────
function ChoosePlanButton({
  planId,
  size = "medium",
  fullWidth = false,
}: {
  planId: string;
  size?: "slim" | "medium";
  fullWidth?: boolean;
}) {
  const fetcher = useFetcher();
  const loading = fetcher.state !== "idle";

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="planName" value={PLAN_NAME_MAP[planId]} />
      <Button variant="primary" fullWidth={fullWidth} size={size} submit loading={loading}>
        Choose Plan
      </Button>
    </fetcher.Form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  return (
    <Page title="Pricing">
      <Layout>

        <Layout.Section>
          <Banner tone="info">
            Click <strong>Choose Plan</strong> to activate billing directly through Shopify.
          </Banner>
        </Layout.Section>

        {/* Plan cards */}
        <Layout.Section>
          <InlineStack gap="400" align="center" wrap>
            {PLANS.map((plan) => (
              <div key={plan.id} style={{ flex: "1 1 280px", maxWidth: 340 }}>
                <Card>
                  <BlockStack gap="400">
                    <BlockStack gap="100" align="center" inlineAlign="center">
                      <Text as="h2" variant="headingMd" tone="subdued">
                        {plan.name}
                      </Text>
                      <InlineStack gap="100" blockAlign="baseline">
                        <Text as="p" variant="heading2xl">
                          {formatPrice(plan.price)}
                        </Text>
                        <Text as="span" variant="bodyMd" tone="subdued">/mo</Text>
                      </InlineStack>
                    </BlockStack>

                    <ChoosePlanButton planId={plan.id} fullWidth />

                    {plan.trialDays && (
                      <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                        {plan.trialDays}-day free trial
                      </Text>
                    )}

                    <Divider />

                    <BlockStack gap="200">
                      {plan.highlights.map((feature) => (
                        <InlineStack key={feature} gap="200" blockAlign="start" wrap={false}>
                          <Box>
                            <Icon source={CheckIcon} tone="success" />
                          </Box>
                          <Text as="span" variant="bodyMd">{feature}</Text>
                        </InlineStack>
                      ))}
                    </BlockStack>
                  </BlockStack>
                </Card>
              </div>
            ))}
          </InlineStack>
        </Layout.Section>

        {/* Toggle full feature table */}
        <Layout.Section>
          <InlineStack align="center">
            <Button variant="tertiary" onClick={() => setShowAllFeatures((v) => !v)}>
              {showAllFeatures ? "Hide all features" : "Show all features"}
            </Button>
          </InlineStack>
        </Layout.Section>

        {showAllFeatures && (
          <Layout.Section>
            <Card padding="0">
              <Box
                padding="400"
                background="bg-surface-secondary"
                borderBlockEndWidth="025"
                borderColor="border"
              >
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 16, alignItems: "center" }}>
                  <Text as="h3" variant="headingSm">{PLANS.length} plans available</Text>
                  {PLANS.map((plan) => (
                    <BlockStack key={plan.id} gap="200" inlineAlign="center">
                      <InlineStack gap="100" blockAlign="baseline">
                        <Text as="span" variant="headingSm">{plan.name}</Text>
                        <Text as="span" variant="bodySm" tone="subdued">
                          {formatPrice(plan.price)}/mo
                        </Text>
                      </InlineStack>
                      <ChoosePlanButton planId={plan.id} size="slim" />
                    </BlockStack>
                  ))}
                </div>
              </Box>

              <BlockStack gap="0">
                {FEATURES.map((feature, idx) => (
                  <Box
                    key={feature.label}
                    padding="400"
                    borderBlockEndWidth={idx < FEATURES.length - 1 ? "025" : "0"}
                    borderColor="border"
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 16, alignItems: "center" }}>
                      <Text as="span" variant="bodyMd">{feature.label}</Text>
                      {feature.values.map((included, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "center" }}>
                          <Icon
                            source={included ? CheckIcon : XIcon}
                            tone={included ? "success" : "subdued"}
                          />
                        </div>
                      ))}
                    </div>
                  </Box>
                ))}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

      </Layout>
    </Page>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return boundary.error(error);
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};