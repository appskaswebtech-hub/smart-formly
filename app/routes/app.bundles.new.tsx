import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useNavigate, useSubmit } from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Box,
  InlineStack,
  InlineGrid,
  Button,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { syncBundleConfigToDiscount } from "../utils/syncDiscount.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const bundleType = formData.get("bundleType") as string;

  const bundle = await db.bundle.create({
    data: {
      shop,
      name: "Quantity break",
      title: "BUY IN BULK AND GET A DISCOUNT!",
      bundleType,
      status: "ACTIVE",
      quantityBreaks: {
        create: [
          {
            shop,
            type: "FIXED_QUANTITY",
            quantity: 1,
            discountType: "PERCENTAGE",
            discountValue: 0,
            savingsText: "",
            description: "Buy 1",
            sortOrder: 0,
          },
          {
            shop,
            type: "FIXED_QUANTITY",
            quantity: 2,
            discountType: "PERCENTAGE",
            discountValue: 10,
            savingsText: "Save {{discount_value}}{{discount_unit}}",
            description: "Buy {{quantity}} and get a discount!",
            sortOrder: 1,
          },
        ],
      },
      discountCombination: {
        create: {
          shop,
          productDiscounts: true,
          orderDiscounts: true,
          shippingDiscounts: true,
        },
      },
      widgetSettings: {
        create: {
          shop,
          colors: JSON.stringify({
            primary: "#5C6AC4",
            secondary: "#47C1BF",
            accent: "#00848E",
          }),
        },
      },
    },
  });

  // ✅ Sync config to discount function after create
  await syncBundleConfigToDiscount(admin, shop);

  return redirect(`/app/bundles/${bundle.id}`);
};

const BUNDLE_TYPES = [
  {
    type: "QUANTITY_BREAKS",
    label: "Quantity breaks",
    badge: "NEW!",
    badgeTone: "info" as const,
    description: "Offer tiered discounts based on quantity purchased",
    preview: {
      title: "Buy in bulk and get a discount!",
      breaks: [
        { label: "Buy 1", price: "$10.00", original: null, saving: null },
        { label: "Buy 2 and get a discount!", price: "$18.00", original: "$20.00", saving: "Save 10%!" },
        { label: "Buy 3 and get a discount!", price: "$25.50", original: "$30.00", saving: "Save 15%!" },
      ],
    },
  },
];

export default function BundlesNew() {
  const navigate = useNavigate();
  const submit = useSubmit();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (bundleType: string) => {
    setSelected(bundleType);
    const formData = new FormData();
    formData.set("bundleType", bundleType);
    submit(formData, { method: "post" });
  };

  return (
    <Page
      title="Select the bundle type which suits you best"
      backAction={{ content: "Back", onAction: () => navigate("/app/bundles") }}
    >
      <InlineGrid columns={1} gap="400">
        {BUNDLE_TYPES.map((bt) => (
          <Card key={bt.type}>
            <BlockStack gap="400">
              <InlineStack align="center" gap="200">
                <Text as="h2" variant="headingLg" alignment="center">
                  {bt.label}
                </Text>
                {bt.badge && <Badge tone={bt.badgeTone}>{bt.badge}</Badge>}
              </InlineStack>

              <Box
                padding="400"
                borderWidth="025"
                borderColor="border"
                borderRadius="200"
                background="bg-surface-secondary"
              >
                <BlockStack gap="300">
                  <Text as="p" variant="bodySm" alignment="center" fontWeight="bold">
                    ─── {bt.preview.title.toUpperCase()} ───
                  </Text>
                  {bt.preview.breaks.map((brk, i) => (
                    <Box
                      key={i}
                      padding="300"
                      borderRadius="200"
                      background="bg-surface"
                      borderWidth="025"
                      borderColor={i === 0 ? "border-brand" : "border"}
                    >
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200" blockAlign="center">
                          <Box
                            minWidth="16px"
                            minHeight="16px"
                            borderRadius="full"
                            borderWidth="050"
                            borderColor={i === 0 ? "border-brand" : "border"}
                            background={i === 0 ? "bg-fill-brand" : "bg-surface"}
                          />
                          <Text as="span" variant="bodyMd">
                            {brk.label}
                          </Text>
                        </InlineStack>
                        <BlockStack inlineAlign="end">
                          {brk.saving && (
                            <Badge tone="critical">{brk.saving}</Badge>
                          )}
                          <Text as="span" variant="bodyMd" fontWeight="bold">
                            {brk.price}
                          </Text>
                          {brk.original && (
                            <Text
                              as="span"
                              variant="bodySm"
                              tone="subdued"
                              textDecorationLine="line-through"
                            >
                              {brk.original}
                            </Text>
                          )}
                        </BlockStack>
                      </InlineStack>
                    </Box>
                  ))}
                </BlockStack>
              </Box>

              <Button
                variant="primary"
                size="large"
                fullWidth
                loading={selected === bt.type}
                onClick={() => handleSelect(bt.type)}
              >
                Select
              </Button>
            </BlockStack>
          </Card>
        ))}
      </InlineGrid>
    </Page>
  );
}
