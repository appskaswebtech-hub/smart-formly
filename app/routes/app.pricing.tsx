import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Badge,
  Box,
  Divider,
  Icon,
  ButtonGroup,
} from "@shopify/polaris";
import {
  CheckIcon,
  XIcon,
} from "@shopify/polaris-icons";
import { boundary } from "@shopify/shopify-app-remix/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  // Current plan would normally come from your database / Shopify billing API.
  // Hard-coded to "free" for now.
  return { currentPlan: "free" as "free" | "pro" | "proplus" };
};

type PlanId = "free" | "pro" | "proplus";
type BillingCycle = "monthly" | "yearly";

interface Plan {
  id: PlanId;
  name: string;
  monthly: number;
  yearly: number; // per month when billed yearly
  trialDays?: number;
  highlights: string[];
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    yearly: 0,
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
    monthly: 8.9,
    yearly: 8.2,
    trialDays: 3,
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
    monthly: 19.9,
    yearly: 18.9,
    trialDays: 3,
    highlights: [
      "Full design customization",
      "Export form submissions",
      "Multiple recipients for form submissions",
      "Multiple admin notifications",
    ],
  },
];

// Feature matrix: true = included, false = not included.
const FEATURES: { label: string; values: [boolean, boolean, boolean] }[] = [
  { label: "Bing UET pixel ID", values: [false, true, true] },
  { label: "Advanced JS", values: [false, true, true] },
  { label: "Advanced CSS", values: [false, true, true] },
  { label: "API available", values: [false, true, true] },
  { label: "Customize form message", values: [false, true, true] },
  { label: "Hidden field", values: [false, true, true] },
  { label: "Restrict form submissions per one user", values: [false, true, true] },
  { label: "UTM tracking", values: [false, true, true] },
];

function formatPrice(n: number): string {
  if (n === 0) return "Free";
  return `$${n.toFixed(2)}`;
}

export default function PricingPage() {
  const { currentPlan } = useLoaderData<typeof loader>();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const priceFor = (plan: Plan) =>
    cycle === "monthly" ? plan.monthly : plan.yearly;

  const handleChoose = (planId: PlanId) => {
    // Static for now — later wire up appSubscriptionCreate here.
    console.log("Chose plan:", planId, "Cycle:", cycle);
  };

  return (
    <Page title="Pricing">
      <Layout>
        {/* Billing cycle toggle */}
        <Layout.Section>
          <InlineStack align="center">
            <ButtonGroup variant="segmented">
              <Button
                pressed={cycle === "monthly"}
                onClick={() => setCycle("monthly")}
              >
                Billed monthly
              </Button>
              <Button
                pressed={cycle === "yearly"}
                onClick={() => setCycle("yearly")}
              >
                Billed yearly
              </Button>
            </ButtonGroup>
          </InlineStack>
        </Layout.Section>

        {/* Plan cards */}
        <Layout.Section>
          <InlineStack gap="400" align="center" wrap>
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              return (
                <div key={plan.id} style={{ flex: "1 1 280px", maxWidth: 340 }}>
                  <Card>
                    <BlockStack gap="400">
                      <BlockStack gap="100" align="center" inlineAlign="center">
                        <Text as="h2" variant="headingMd" tone="subdued">
                          {plan.name}
                        </Text>
                        <InlineStack gap="100" blockAlign="baseline">
                          <Text as="p" variant="heading2xl">
                            {formatPrice(priceFor(plan))}
                          </Text>
                          {priceFor(plan) > 0 && (
                            <Text as="span" variant="bodyMd" tone="subdued">
                              /mo
                            </Text>
                          )}
                        </InlineStack>
                      </BlockStack>

                      {isCurrent ? (
                        <Button variant="secondary" disabled fullWidth>
                          Selected plan
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          fullWidth
                          onClick={() => handleChoose(plan.id)}
                        >
                          Choose Plan
                        </Button>
                      )}

                      {plan.trialDays && !isCurrent && (
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
                            <Text as="span" variant="bodyMd">
                              {feature}
                            </Text>
                          </InlineStack>
                        ))}
                      </BlockStack>
                    </BlockStack>
                  </Card>
                </div>
              );
            })}
          </InlineStack>
        </Layout.Section>

        {/* Toggle full feature table */}
        <Layout.Section>
          <InlineStack align="center">
            <Button
              variant="tertiary"
              onClick={() => setShowAllFeatures((v) => !v)}
            >
              {showAllFeatures ? "Hide all features" : "Show all features"}
            </Button>
          </InlineStack>
        </Layout.Section>

        {/* Full feature comparison table */}
        {showAllFeatures && (
          <Layout.Section>
            <Card padding="0">
              {/* Sticky header row */}
              <Box
                padding="400"
                background="bg-surface-secondary"
                borderBlockEndWidth="025"
                borderColor="border"
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <Text as="h3" variant="headingSm">
                    {PLANS.length} plans available
                  </Text>
                  {PLANS.map((plan) => (
                    <BlockStack key={plan.id} gap="200" inlineAlign="center">
                      <InlineStack gap="100" blockAlign="baseline">
                        <Text as="span" variant="headingSm">
                          {plan.name}
                        </Text>
                        <Text as="span" variant="bodySm" tone="subdued">
                          ${priceFor(plan).toFixed(2)}/mo
                        </Text>
                      </InlineStack>
                      {currentPlan === plan.id ? (
                        <Badge tone="success">Selected plan</Badge>
                      ) : (
                        <Button
                          size="slim"
                          onClick={() => handleChoose(plan.id)}
                        >
                          Choose Plan
                        </Button>
                      )}
                    </BlockStack>
                  ))}
                </div>
              </Box>

              {/* Feature rows */}
              <BlockStack gap="0">
                {FEATURES.map((feature, idx) => (
                  <Box
                    key={feature.label}
                    padding="400"
                    borderBlockEndWidth={idx < FEATURES.length - 1 ? "025" : "0"}
                    borderColor="border"
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr",
                        gap: 16,
                        alignItems: "center",
                      }}
                    >
                      <Text as="span" variant="bodyMd">
                        {feature.label}
                      </Text>
                      {feature.values.map((included, i) => (
                        <div
                          key={i}
                          style={{ display: "flex", justifyContent: "center" }}
                        >
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
  return boundary.error(new Error("Pricing page error"));
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
