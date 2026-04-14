import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit, useSearchParams } from "@remix-run/react";
import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Box,
  InlineStack,
  Badge,
  EmptyState,
  Button,
  TextField,
  Pagination,
  Checkbox,
} from "@shopify/polaris";
import { PlusIcon, SearchIcon, DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const PAGE_SIZE = 10;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");

  const where: any = { shop };
  if (search) {
    where.name = { contains: search };
  }

  const [bundles, total] = await Promise.all([
    db.bundle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        quantityBreaks: true,
        _count: { select: { quantityBreaks: true } },
      },
    }),
    db.bundle.count({ where }),
  ]);

  return json({ bundles, total, page, search });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    const ids = JSON.parse(formData.get("ids") as string) as string[];
    await db.bundle.deleteMany({ where: { id: { in: ids }, shop: session.shop } });
  }

  if (intent === "toggleStatus") {
    const id = formData.get("id") as string;
    const bundle = await db.bundle.findFirst({ where: { id, shop: session.shop } });
    if (bundle) {
      await db.bundle.update({
        where: { id },
        data: { status: bundle.status === "ACTIVE" ? "PAUSED" : "ACTIVE" },
      });
    }
  }

  return json({ success: true });
};

export default function BundlesList() {
  const { bundles, total, page, search } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(search);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    params.set("page", "1");
    setSearchParams(params);
  }, [searchValue, setSearchParams]);

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} bundle(s)?`)) return;
    const formData = new FormData();
    formData.set("intent", "delete");
    formData.set("ids", JSON.stringify(selectedIds));
    submit(formData, { method: "post" });
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === bundles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(bundles.map((b: any) => b.id));
    }
  };

  return (
    <Page
      title="Bundles"
      primaryAction={{
        content: "Create bundle",
        icon: PlusIcon,
        onAction: () => navigate("/app/bundles/new"),
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd" tone="subdued">
              Create and edit bundles to boost your sales and increase average order value.
            </Text>

            <Card padding="0">
              <BlockStack gap="0">
                {/* Search Bar */}
                <Box padding="400">
                  <InlineStack gap="200" blockAlign="end">
                    <Box minWidth="0" maxWidth="100%">
                      <div style={{ flex: 1 }}>
                        <TextField
                          label=""
                          labelHidden
                          placeholder="Search by bundle name"
                          value={searchValue}
                          onChange={setSearchValue}
                          onClearButtonClick={() => {
                            setSearchValue("");
                            setSearchParams(new URLSearchParams());
                          }}
                          clearButton
                          autoComplete="off"
                          connectedRight={
                            <Button onClick={handleSearch}>Search</Button>
                          }
                        />
                      </div>
                    </Box>
                  </InlineStack>
                </Box>

                {bundles.length === 0 ? (
                  <Box padding="1200">
                    <EmptyState
                      heading="No bundles found"
                      image=""
                      action={{
                        content: "Create bundle",
                        onAction: () => navigate("/app/bundles/new"),
                      }}
                    >
                      <p>Create your first bundle to start offering discounts.</p>
                    </EmptyState>
                  </Box>
                ) : (
                  <>
                    {/* Header Row */}
                    <Box padding="300" paddingInlineStart="400" paddingInlineEnd="400" background="bg-surface-secondary">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="300" blockAlign="center">
                          <Checkbox
                            label=""
                            labelHidden
                            checked={selectedIds.length === bundles.length && bundles.length > 0}
                            onChange={toggleAll}
                          />
                          <Text as="span" variant="bodySm" tone="subdued">
                            Showing {bundles.length} of {total} bundle{total !== 1 ? "s" : ""}
                          </Text>
                        </InlineStack>
                        {selectedIds.length > 0 && (
                          <Button
                            variant="plain"
                            tone="critical"
                            icon={DeleteIcon}
                            onClick={handleBulkDelete}
                          >
                            Delete selected
                          </Button>
                        )}
                      </InlineStack>
                    </Box>

                    {/* Bundle Rows */}
                    {bundles.map((bundle: any) => (
                      <Box
                        key={bundle.id}
                        padding="300"
                        paddingInlineStart="400"
                        paddingInlineEnd="400"
                        borderBlockStartWidth="025"
                        borderColor="border"
                      >
                        <InlineStack align="space-between" blockAlign="center" wrap={false}>
                          <InlineStack gap="300" blockAlign="center">
                            <Checkbox
                              label=""
                              labelHidden
                              checked={selectedIds.includes(bundle.id)}
                              onChange={() => toggleSelect(bundle.id)}
                            />
                            <BlockStack gap="050">
                              <Text as="span" variant="bodyMd" fontWeight="semibold">
                                {bundle.name}
                              </Text>
                            </BlockStack>
                          </InlineStack>

                          <InlineStack gap="400" blockAlign="center" wrap={false}>
                            <Badge
                              tone={
                                bundle.status === "ACTIVE"
                                  ? "success"
                                  : bundle.status === "PAUSED"
                                  ? "warning"
                                  : "info"
                              }
                            >
                              {bundle.status === "ACTIVE" ? "Active" : bundle.status === "PAUSED" ? "Paused" : "Draft"}
                            </Badge>
                            <Text as="span" variant="bodySm" tone="subdued">
                              {bundle.productSelectionType === "ALL_PRODUCTS"
                                ? "All products"
                                : "Specific products"}
                            </Text>
                            <Text as="span" variant="bodySm" tone="subdued">
                              {bundle.bundleType === "QUANTITY_BREAKS" ? "Quantity break" : bundle.bundleType}
                            </Text>
                            <Button
                              variant="plain"
                              onClick={() => navigate(`/app/bundles/${bundle.id}`)}
                            >
                              Edit
                            </Button>
                          </InlineStack>
                        </InlineStack>
                      </Box>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Box padding="400">
                        <InlineStack align="center">
                          <Pagination
                            hasPrevious={page > 1}
                            hasNext={page < totalPages}
                            onPrevious={() => {
                              const params = new URLSearchParams(searchParams);
                              params.set("page", String(page - 1));
                              setSearchParams(params);
                            }}
                            onNext={() => {
                              const params = new URLSearchParams(searchParams);
                              params.set("page", String(page + 1));
                              setSearchParams(params);
                            }}
                          />
                        </InlineStack>
                      </Box>
                    )}
                  </>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
