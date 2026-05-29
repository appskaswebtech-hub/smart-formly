import { useState } from "react";
import {
  Modal,
  BlockStack,
  Text,
  InlineGrid,
  Box,
  InlineStack,
  Badge,
  List,
  Button,
  Banner,
} from "@shopify/polaris";
import { PLANS } from "../config/plans";

const PLANS_UI = [
  {
    key: "pro",
    color: "#f6f6f7",
    popular: false,
    features: [
      "Real Store",
      "Up to 5 Bundles",
      "Smart discounts",
      "Priority support",
    ],
  },
  {
    key: "advanced",
    color: "#f3f0ff",
    popular: true,
    features: [
      "Real Store",
      "Unlimited Bundles",
      "Smart discounts",
      "Priority support",
    ],
  },
].map((ui) => ({ ...ui, ...PLANS[ui.key] }));

interface BillingGateProps {
  hasAccess: boolean;
  children: React.ReactNode;
}

export function BillingGate({ hasAccess, children }: BillingGateProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (hasAccess) return <>{children}</>;

  const handleSelectPlan = async (planKey: string) => {
    setLoadingPlan(planKey);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("plan", planKey);

      const res = await fetch("/app/api/billing-url", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.confirmationUrl) {
        open(data.confirmationUrl, "_top");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setLoadingPlan(null);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoadingPlan(null);
    }
  };

  return (
    <>
      {/* Blurred background content */}
      <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>

      {/* Overlay modal */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.5)",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "32px",
            maxWidth: "720px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <BlockStack gap="500">
            {/* Header */}
            <BlockStack gap="200">
              <Text variant="heading2xl" fontWeight="bold" as="h2" alignment="center">
                Upgrade to Continue
              </Text>
              <Text variant="bodyMd" tone="subdued" as="p" alignment="center">
                Choose a plan to start using BundleKit on your real store.
              </Text>
            </BlockStack>

            {/* Error */}
            {error && (
              <Banner tone="critical" title="Error">
                <Text as="p">{error}</Text>
              </Banner>
            )}

            {/* Plan cards */}
            <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
              {PLANS_UI.map((plan) => (
                <div
                  key={plan.key}
                  style={{
                    borderRadius: "12px",
                    border: plan.popular
                      ? "2px solid #005bd3"
                      : "1px solid #e1e3e5",
                    background: "#ffffff",
                    boxShadow: plan.popular
                      ? "0 4px 20px rgba(0,91,211,0.12)"
                      : "0 1px 4px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {/* Card header */}
                  <div
                    style={{
                      background: plan.color,
                      padding: "20px 24px 16px",
                      borderBottom: "1px solid #e1e3e5",
                    }}
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingLg" fontWeight="bold" as="h3">
                        {plan.label}
                      </Text>
                      {plan.popular && <Badge tone="info">Most Popular</Badge>}
                    </InlineStack>
                    <Box paddingBlockStart="200">
                      <Text variant="heading2xl" fontWeight="bold" as="p">
                        ${plan.price}
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        per month
                      </Text>
                    </Box>
                  </div>

                  {/* Features */}
                  <div style={{ padding: "20px 24px", flexGrow: 1 }}>
                    <BlockStack gap="200">
                      <Text variant="bodyMd" fontWeight="semibold" as="p">
                        What's included:
                      </Text>
                      <List type="bullet">
                        {plan.features.map((f, i) => (
                          <List.Item key={i}>{f}</List.Item>
                        ))}
                      </List>
                    </BlockStack>
                  </div>

                  {/* CTA */}
                  <div style={{ padding: "16px 24px", borderTop: "1px solid #e1e3e5" }}>
                    <Button
                      fullWidth
                      variant="primary"
                      loading={loadingPlan === plan.key}
                      disabled={!!loadingPlan}
                      onClick={() => handleSelectPlan(plan.key)}
                    >
                      {`Upgrade to ${plan.label}`}
                    </Button>
                  </div>
                </div>
              ))}
            </InlineGrid>

            {/* Footer */}
            <Text alignment="center" tone="subdued" variant="bodySm" as="p">
              Cancel anytime from your Shopify admin. Billed in USD.
            </Text>
          </BlockStack>
        </div>
      </div>
    </>
  );
}   