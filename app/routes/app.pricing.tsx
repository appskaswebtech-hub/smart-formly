// import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
// import { useLoaderData, useRouteError } from "@remix-run/react";
// import {
//   Page, Layout, Card, BlockStack, InlineStack,
//   Text, Button, Badge, Box, Divider, Icon, ButtonGroup, Banner,
// } from "@shopify/polaris";
// import { CheckIcon, XIcon } from "@shopify/polaris-icons";
// import { boundary } from "@shopify/shopify-app-remix/server";
// import { authenticate } from "../shopify.server";
// import { useState } from "react";

// export const loader = async ({ request }: LoaderFunctionArgs) => {
//   await authenticate.admin(request);
//   return {};
// };

// type BillingCycle = "monthly" | "yearly";

// const PLANS = [
//   {
//     id: "base",
//     name: "Base",
//     monthly: 6.9,
//     yearly: 4.9,
//     highlights: [
//       "Full design customization",
//       "Export form submissions",
//       "Multiple recipients for form submissions",
//       "Multiple admin notifications",
//     ],
//   },
//   {
//     id: "pro",
//     name: "Pro",
//     monthly: 9.9,
//     yearly: 8.9,
//     trialDays: 3,
//     highlights: [
//       "Full design customization",
//       "Export form submissions",
//       "Multiple recipients for form submissions",
//       "Multiple admin notifications",
//     ],
//   },
//   {
//     id: "proplus",
//     name: "Pro+",
//     monthly: 19.9,
//     yearly: 18.9,
//     trialDays: 3,
//     highlights: [
//       "Full design customization",
//       "Export form submissions",
//       "Multiple recipients for form submissions",
//       "Multiple admin notifications",
//     ],
//   },
// ];

// const FEATURES: { label: string; values: [boolean, boolean, boolean] }[] = [
//   { label: "Bing UET pixel ID",                       values: [false, true, true] },
//   { label: "Advanced JS",                             values: [false, true, true] },
//   { label: "Advanced CSS",                            values: [false, true, true] },
//   { label: "API available",                           values: [false, true, true] },
//   { label: "Customize form message",                  values: [false, true, true] },
//   { label: "Hidden field",                            values: [false, true, true] },
//   { label: "Restrict form submissions per one user",  values: [false, true, true] },
//   { label: "UTM tracking",                            values: [false, true, true] },
// ];

// function formatPrice(n: number) {
//   return `$${n.toFixed(2)}`;
// }

// export default function PricingPage() {
//   const [cycle, setCycle] = useState<BillingCycle>("monthly");
//   const [showAllFeatures, setShowAllFeatures] = useState(false);

//   const priceFor = (plan: typeof PLANS[0]) =>
//     cycle === "monthly" ? plan.monthly : plan.yearly;

//   return (
//     <Page title="Pricing">
//       <Layout>

//         <Layout.Section>
//           <Banner tone="info">
//             Subscriptions are managed through the Shopify App Store.
//             Click <strong>Choose Plan</strong> to be taken to the listing page.
//           </Banner>
//         </Layout.Section>

//         {/* Billing cycle toggle */}
//         <Layout.Section>
//           <InlineStack align="center">
//             <ButtonGroup variant="segmented">
//               <Button pressed={cycle === "monthly"} onClick={() => setCycle("monthly")}>
//                 Billed monthly
//               </Button>
//               <Button pressed={cycle === "yearly"} onClick={() => setCycle("yearly")}>
//                 Billed yearly
//               </Button>
//             </ButtonGroup>
//           </InlineStack>
//         </Layout.Section>

//         {/* Plan cards */}
//         <Layout.Section>
//           <InlineStack gap="400" align="center" wrap>
//             {PLANS.map((plan) => (
//               <div key={plan.id} style={{ flex: "1 1 280px", maxWidth: 340 }}>
//                 <Card>
//                   <BlockStack gap="400">
//                     <BlockStack gap="100" align="center" inlineAlign="center">
//                       <Text as="h2" variant="headingMd" tone="subdued">
//                         {plan.name}
//                       </Text>
//                       <InlineStack gap="100" blockAlign="baseline">
//                         <Text as="p" variant="heading2xl">
//                           {formatPrice(priceFor(plan))}
//                         </Text>
//                         <Text as="span" variant="bodyMd" tone="subdued">
//                           /mo
//                         </Text>
//                       </InlineStack>
//                       {cycle === "yearly" && (
//                         <Text as="p" variant="bodySm" tone="subdued">
//                           Billed as {formatPrice(priceFor(plan) * 12)}/year
//                         </Text>
//                       )}
//                     </BlockStack>

//                     {/* Links to Shopify App Store listing */}
//                     <Button
//                       variant="primary"
//                       fullWidth
//                       url="https://apps.shopify.com/smartformly"
//                       target="_blank"
//                     >
//                       Choose Plan
//                     </Button>

//                     {plan.trialDays && (
//                       <Text as="p" variant="bodySm" tone="subdued" alignment="center">
//                         {plan.trialDays}-day free trial
//                       </Text>
//                     )}

//                     <Divider />

//                     <BlockStack gap="200">
//                       {plan.highlights.map((feature) => (
//                         <InlineStack key={feature} gap="200" blockAlign="start" wrap={false}>
//                           <Box>
//                             <Icon source={CheckIcon} tone="success" />
//                           </Box>
//                           <Text as="span" variant="bodyMd">{feature}</Text>
//                         </InlineStack>
//                       ))}
//                     </BlockStack>
//                   </BlockStack>
//                 </Card>
//               </div>
//             ))}
//           </InlineStack>
//         </Layout.Section>

//         {/* Toggle full feature table */}
//         <Layout.Section>
//           <InlineStack align="center">
//             <Button variant="tertiary" onClick={() => setShowAllFeatures((v) => !v)}>
//               {showAllFeatures ? "Hide all features" : "Show all features"}
//             </Button>
//           </InlineStack>
//         </Layout.Section>

//         {showAllFeatures && (
//           <Layout.Section>
//             <Card padding="0">
//               <Box
//                 padding="400"
//                 background="bg-surface-secondary"
//                 borderBlockEndWidth="025"
//                 borderColor="border"
//               >
//                 <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 16, alignItems: "center" }}>
//                   <Text as="h3" variant="headingSm">{PLANS.length} plans available</Text>
//                   {PLANS.map((plan) => (
//                     <BlockStack key={plan.id} gap="200" inlineAlign="center">
//                       <InlineStack gap="100" blockAlign="baseline">
//                         <Text as="span" variant="headingSm">{plan.name}</Text>
//                         <Text as="span" variant="bodySm" tone="subdued">
//                           {formatPrice(priceFor(plan))}/mo
//                         </Text>
//                       </InlineStack>
//                       <Button
//                         size="slim"
//                         url="https://apps.shopify.com/smartformly"
//                         target="_blank"
//                       >
//                         Choose Plan
//                       </Button>
//                     </BlockStack>
//                   ))}
//                 </div>
//               </Box>

//               <BlockStack gap="0">
//                 {FEATURES.map((feature, idx) => (
//                   <Box
//                     key={feature.label}
//                     padding="400"
//                     borderBlockEndWidth={idx < FEATURES.length - 1 ? "025" : "0"}
//                     borderColor="border"
//                   >
//                     <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 16, alignItems: "center" }}>
//                       <Text as="span" variant="bodyMd">{feature.label}</Text>
//                       {feature.values.map((included, i) => (
//                         <div key={i} style={{ display: "flex", justifyContent: "center" }}>
//                           <Icon
//                             source={included ? CheckIcon : XIcon}
//                             tone={included ? "success" : "subdued"}
//                           />
//                         </div>
//                       ))}
//                     </div>
//                   </Box>
//                 ))}
//               </BlockStack>
//             </Card>
//           </Layout.Section>
//         )}

//       </Layout>
//     </Page>
//   );
// }

// export function ErrorBoundary() {
//   const error = useRouteError();
//   return boundary.error(error);
// }

// export const headers: HeadersFunction = (headersArgs) => {
//   return boundary.headers(headersArgs);
// };




  import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
  import { useRouteError } from "@remix-run/react";
  import {
    Page,
    Layout,
    Card,
    BlockStack,
    InlineStack,
    Text,
    Button,
    Box,
    Divider,
    Icon,
    ButtonGroup,
    Banner,
  } from "@shopify/polaris";
  import { CheckIcon, XIcon } from "@shopify/polaris-icons";
  import { boundary } from "@shopify/shopify-app-remix/server";
  import { authenticate } from "../shopify.server";
  import { useState } from "react";

  export const loader = async ({ request }: LoaderFunctionArgs) => {
    await authenticate.admin(request);
    return {};
  };

  type BillingCycle = "monthly" | "yearly";

  const PLANS = [
    {
      id: "base",
      name: "Base",
      monthly: 6.9,
      yearly: 4.9,
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
      monthly: 9.9,
      yearly: 8.9,
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

  const FEATURES: { label: string; values: [boolean, boolean, boolean] }[] = [
    { label: "Bing UET pixel ID",                       values: [false, true, true] },
    { label: "Advanced JS",                             values: [false, true, true] },
    { label: "Advanced CSS",                            values: [false, true, true] },
    { label: "API available",                           values: [false, true, true] },
    { label: "Customize form message",                  values: [false, true, true] },
    { label: "Hidden field",                            values: [false, true, true] },
    { label: "Restrict form submissions per one user",  values: [false, true, true] },
    { label: "UTM tracking",                            values: [false, true, true] },
  ];

  function formatPrice(n: number) {
    return `$${n.toFixed(2)}`;
  }

  export default function PricingPage() {
    const [cycle, setCycle] = useState<BillingCycle>("monthly");
    const [showAllFeatures, setShowAllFeatures] = useState(false);

    const priceFor = (plan: (typeof PLANS)[0]) =>
      cycle === "monthly" ? plan.monthly : plan.yearly;

    return (
      <Page title="Pricing">
        <Layout>

          {/* Banner */}
          <Layout.Section>
            <Banner tone="info">
              Paid plans are coming soon. You are currently on the free plan.
            </Banner>
          </Layout.Section>

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
                            {formatPrice(priceFor(plan))}
                          </Text>
                          <Text as="span" variant="bodyMd" tone="subdued">
                            /mo
                          </Text>
                        </InlineStack>
                        {cycle === "yearly" && (
                          <Text as="p" variant="bodySm" tone="subdued">
                            Billed as {formatPrice(priceFor(plan) * 12)}/year
                          </Text>
                        )}
                      </BlockStack>

                      <Button variant="primary" fullWidth disabled>
                        Coming Soon
                      </Button>

                      {plan.trialDays && (
                        <Text
                          as="p"
                          variant="bodySm"
                          tone="subdued"
                          alignment="center"
                        >
                          {plan.trialDays}-day free trial
                        </Text>
                      )}

                      <Divider />

                      <BlockStack gap="200">
                        {plan.highlights.map((feature) => (
                          <InlineStack
                            key={feature}
                            gap="200"
                            blockAlign="start"
                            wrap={false}
                          >
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
              ))}
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
                            {formatPrice(priceFor(plan))}/mo
                          </Text>
                        </InlineStack>
                        <Button size="slim" disabled>
                          Coming Soon
                        </Button>
                      </BlockStack>
                    ))}
                  </div>
                </Box>

                <BlockStack gap="0">
                  {FEATURES.map((feature, idx) => (
                    <Box
                      key={feature.label}
                      padding="400"
                      borderBlockEndWidth={
                        idx < FEATURES.length - 1 ? "025" : "0"
                      }
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
    const error = useRouteError();
    return boundary.error(error);
  }

  export const headers: HeadersFunction = (headersArgs) => {
    return boundary.headers(headersArgs);
  };