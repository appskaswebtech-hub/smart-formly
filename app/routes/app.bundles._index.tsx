import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigate, useSearchParams } from "@remix-run/react";
import { useState, useCallback } from "react";
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  Thumbnail,
  EmptyState,
  IndexTable,
  useIndexResourceState,
  Filters,
  ChoiceList,
  Box,
  Icon,
  Tooltip,
  Divider,
  Pagination,
  Modal,
  Banner,
  InlineGrid,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  PackageIcon,
  EditIcon,
  DeleteIcon,
  PlusIcon,
  ViewIcon,
  OrderIcon,
  ChartVerticalIcon,
  StarIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const PAGE_SIZE = 10;

// ─────────────────────────────────────────
// LOADER
// ─────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const status = url.searchParams.get("status") ?? "";
  const query = url.searchParams.get("query") ?? "";

  // ✅ SQLite does NOT support mode: "insensitive" — removed
  // Use plain contains (SQLite is case-insensitive for ASCII by default)
  const where: any = { shop };
  if (status) where.status = status;
  if (query) where.title = { contains: query };

  const [bundles, total, totalActive, totalOrders] = await Promise.all([
    db.bundle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        items: { take: 3 },
        _count: { select: { orders: true, items: true } },
      },
    }),
    db.bundle.count({ where }),
    db.bundle.count({ where: { shop, status: "ACTIVE" } }),
    db.bundleOrder.count({ where: { shop } }),
  ]);

  return json({
    bundles,
    total,
    totalActive,
    totalOrders,
    page,
    pageCount: Math.ceil(total / PAGE_SIZE),
  });
};

// ─────────────────────────────────────────
// ACTION — Bulk operations
// ─────────────────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const ids = formData.getAll("ids[]") as string[];
  const intent = formData.get("intent");

  if (intent === "bulk-delete") {
    // Fetch Shopify product IDs before deleting from DB
    const bundlesToDelete = await db.bundle.findMany({
      where: { id: { in: ids }, shop },
      select: { id: true, shopifyProductId: true, title: true },
    });

    // Step 1: Delete from Shopify (best effort — don't fail if product already gone)
    const DELETE_PRODUCT = `#graphql
      mutation deleteProduct($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors { field message }
        }
      }
    `;

    for (const bundle of bundlesToDelete) {
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
          console.log(`Shopify product deleted: ${bundle.shopifyProductId}`);
        }
      } catch (err) {
        // Log but continue — we still want to clean up DB
        console.error(`Failed to delete Shopify product for bundle ${bundle.id}:`, err);
      }
    }

    // Step 2: Delete from DB in correct dependency order
    await db.bundleOrder.deleteMany({ where: { bundleId: { in: ids }, shop } });
    await db.bundleItem.deleteMany({ where: { bundleId: { in: ids } } });
    await db.bundle.deleteMany({ where: { id: { in: ids }, shop } });

    return json({ success: true, deleted: ids.length });
  }

  if (intent === "bulk-status") {
    const newStatus = formData.get("status") as string;
    await db.bundle.updateMany({
      where: { id: { in: ids }, shop },
      data: { status: newStatus },
    });
    return json({ success: true });
  }

  return json({ success: false });
};

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const toneMap: Record<string, "success" | "attention" | "critical"> = {
    ACTIVE: "success",
    DRAFT: "attention",
    ARCHIVED: "critical",
  };
  return (
    <Badge tone={toneMap[status] ?? "attention"}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

function DiscountBadge({ type, value }: { type: string; value: number }) {
  if (type === "NONE") {
    return <Text as="span" tone="subdued" variant="bodySm">—</Text>;
  }
  const label = type === "PERCENTAGE" ? `${value}% off` : `$${value.toFixed(2)} off`;
  return <Badge tone="info">{label}</Badge>;
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
}) {
  return (
    <Card>
      <InlineStack align="space-between" blockAlign="center">
        <BlockStack gap="100">
          <Text as="p" variant="bodySm" tone="subdued">{title}</Text>
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
export default function BundlesIndex() {
  const { bundles, total, totalActive, totalOrders, page, pageCount } =
    useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [queryValue, setQueryValue] = useState(searchParams.get("query") ?? "");
  const [statusFilter, setStatusFilter] = useState<string[]>(
    searchParams.get("status") ? [searchParams.get("status")!] : []
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  const resourceName = { singular: "bundle", plural: "bundles" };
  const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } =
    useIndexResourceState(bundles);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQueryValue(value);
      const params = new URLSearchParams(searchParams);
      params.set("query", value);
      params.set("page", "1");
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const handleStatusChange = useCallback(
    (value: string[]) => {
      setStatusFilter(value);
      const params = new URLSearchParams(searchParams);
      if (value.length > 0) params.set("status", value[0]);
      else params.delete("status");
      params.set("page", "1");
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const handleClearAll = useCallback(() => {
    setQueryValue("");
    setStatusFilter([]);
    setSearchParams({});
  }, [setSearchParams]);

  const confirmDelete = () => {
    const formData = new FormData();
    formData.set("intent", "bulk-delete");
    pendingDeleteIds.forEach((id) => formData.append("ids[]", id));
    submit(formData, { method: "POST" });
    setDeleteModalOpen(false);
    clearSelection();
  };

  const handleBulkActivate = () => {
    const formData = new FormData();
    formData.set("intent", "bulk-status");
    formData.set("status", "ACTIVE");
    selectedResources.forEach((id) => formData.append("ids[]", id));
    submit(formData, { method: "POST" });
    clearSelection();
  };

  const handlePrev = () => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page - 1));
    setSearchParams(params);
  };

  const handleNext = () => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page + 1));
    setSearchParams(params);
  };

  const filters = [
    {
      key: "status",
      label: "Status",
      filter: (
        <ChoiceList
          title="Status"
          titleHidden
          choices={[
            { label: "Active", value: "ACTIVE" },
            { label: "Draft", value: "DRAFT" },
            { label: "Archived", value: "ARCHIVED" },
          ]}
          selected={statusFilter}
          onChange={handleStatusChange}
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters = statusFilter.length > 0
    ? [{ key: "status", label: `Status: ${statusFilter[0]}`, onRemove: () => handleStatusChange([]) }]
    : [];

  const promotedBulkActions = [
    { content: "Set active", onAction: handleBulkActivate },
  ];
  const bulkActions = [
    {
      content: "Delete selected",
      destructive: true,
      onAction: () => {
        setPendingDeleteIds(selectedResources);
        setDeleteModalOpen(true);
      },
    },
  ];

  const rowMarkup = bundles.map((bundle, index) => (
    <IndexTable.Row
      id={bundle.id}
      key={bundle.id}
      selected={selectedResources.includes(bundle.id)}
      position={index}
    >
      {/* Bundle name + image */}
      <IndexTable.Cell>
        <InlineStack gap="300" blockAlign="center">
          {bundle.image ? (
            <Thumbnail source={bundle.image} alt={bundle.title} size="small" />
          ) : (
            <Box
              background="bg-surface-secondary"
              borderRadius="100"
              padding="150"
              minWidth="36px"
            >
              <Icon source={PackageIcon} />
            </Box>
          )}
          <BlockStack gap="050">
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              {bundle.title}
            </Text>
            {bundle.description && (
              <Text as="p" variant="bodySm" tone="subdued">
                {bundle.description.length > 55
                  ? bundle.description.slice(0, 55) + "…"
                  : bundle.description}
              </Text>
            )}
          </BlockStack>
        </InlineStack>
      </IndexTable.Cell>

      {/* Status */}
      <IndexTable.Cell>
        <StatusBadge status={bundle.status} />
      </IndexTable.Cell>

      {/* Items */}
      <IndexTable.Cell>
        <Badge>{String(bundle._count.items)}</Badge>
      </IndexTable.Cell>

      {/* Price */}
      <IndexTable.Cell>
        <BlockStack gap="050">
          <Text as="p" variant="bodySm" fontWeight="semibold">
            {bundle.totalPrice ? `$${bundle.totalPrice.toFixed(2)}` : "—"}
          </Text>
          {bundle.compareAtPrice && (
            <Text as="p" variant="bodySm" tone="subdued">
              was ${bundle.compareAtPrice.toFixed(2)}
            </Text>
          )}
        </BlockStack>
      </IndexTable.Cell>

      {/* Discount */}
      <IndexTable.Cell>
        <DiscountBadge type={bundle.discountType} value={bundle.discountValue} />
      </IndexTable.Cell>

      {/* Orders */}
      <IndexTable.Cell>
        <Text as="p" variant="bodySm" alignment="center">
          {bundle._count.orders}
        </Text>
      </IndexTable.Cell>

      {/* Created */}
      <IndexTable.Cell>
        <Text as="p" variant="bodySm" tone="subdued">
          {new Date(bundle.createdAt).toLocaleDateString()}
        </Text>
      </IndexTable.Cell>

      {/* Actions */}
      <IndexTable.Cell>
        <InlineStack gap="150">
          <Tooltip content="Edit">
            <Button
              size="slim"
              icon={EditIcon}
              url={`/app/bundles/${bundle.id}`}
              accessibilityLabel="Edit bundle"
            />
          </Tooltip>
          {bundle.shopifyProductId && (
            <Tooltip content="View in Shopify">
              <Button
                size="slim"
                icon={ViewIcon}
                url={`https://admin.shopify.com/products/${bundle.shopifyProductId.replace("gid://shopify/Product/", "")}`}
                external
                accessibilityLabel="View in Shopify"
              />
            </Tooltip>
          )}
          <Tooltip content="Delete">
            <Button
              size="slim"
              icon={DeleteIcon}
              tone="critical"
              onClick={() => {
                setPendingDeleteIds([bundle.id]);
                setDeleteModalOpen(true);
              }}
              accessibilityLabel="Delete bundle"
            />
          </Tooltip>
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  // ─────────────────────────────────────────
  // EMPTY STATE — no bundles in DB at all
  // ─────────────────────────────────────────
  const isFiltering = !!queryValue || statusFilter.length > 0;
  const isEmpty = bundles.length === 0;

  return (
    <Page>
      <TitleBar title="Bundles">
        <button variant="primary" onClick={() => navigate("/app/bundles/new")}>
          Create bundle
        </button>
      </TitleBar>

      <BlockStack gap="500">

        {/* ── Summary stats (only show when bundles exist) ── */}
        {total > 0 && (
          <InlineGrid columns={3} gap="400">
            <SummaryCard title="Total Bundles" value={total} icon={PackageIcon} />
            <SummaryCard title="Active" value={totalActive} icon={StarIcon} />
            <SummaryCard title="Orders" value={totalOrders} icon={OrderIcon} />
          </InlineGrid>
        )}

        {/* ── Main card ── */}
        <Card padding="0">

          {/* ── Pure empty state — no bundles in DB at all ── */}
          {!isFiltering && isEmpty ? (
            <Box padding="600">
              <EmptyState
                heading="Create your first bundle"
                action={{
                  content: "Create bundle",
                  icon: PlusIcon,
                  url: "/app/bundles/new",
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <Text as="p">
                  Bundles let you group products together and offer them at a
                  discounted price. Get started by creating your first bundle.
                </Text>
              </EmptyState>
            </Box>
          ) : (
            <>
              {/* Filters — always show when there are bundles OR active filters */}
              <Filters
                queryValue={queryValue}
                queryPlaceholder="Search bundles…"
                filters={filters}
                appliedFilters={appliedFilters}
                onQueryChange={handleQueryChange}
                onQueryClear={() => handleQueryChange("")}
                onClearAll={handleClearAll}
              />

              <Divider />

              {/* ── Filtered empty state ── */}
              {isEmpty ? (
                <Box padding="600">
                  <EmptyState
                    heading="No bundles match your search"
                    action={{
                      content: "Clear filters",
                      onAction: handleClearAll,
                    }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <Text as="p">
                      Try adjusting your search terms or filters.
                    </Text>
                  </EmptyState>
                </Box>
              ) : (
                <>
                  <IndexTable
                    resourceName={resourceName}
                    itemCount={bundles.length}
                    selectedItemsCount={
                      allResourcesSelected ? "All" : selectedResources.length
                    }
                    onSelectionChange={handleSelectionChange}
                    promotedBulkActions={promotedBulkActions}
                    bulkActions={bulkActions}
                    headings={[
                      { title: "Bundle" },
                      { title: "Status" },
                      { title: "Items" },
                      { title: "Price" },
                      { title: "Discount" },
                      { title: "Orders", alignment: "center" },
                      { title: "Created" },
                      { title: "Actions" },
                    ]}
                  >
                    {rowMarkup}
                  </IndexTable>

                  {pageCount > 1 && (
                    <Box padding="400" borderBlockStartWidth="025" borderColor="border">
                      <InlineStack align="center">
                        <Pagination
                          hasPrevious={page > 1}
                          onPrevious={handlePrev}
                          hasNext={page < pageCount}
                          onNext={handleNext}
                          label={`Page ${page} of ${pageCount}`}
                        />
                      </InlineStack>
                    </Box>
                  )}
                </>
              )}
            </>
          )}
        </Card>
      </BlockStack>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={
          pendingDeleteIds.length > 1
            ? `Delete ${pendingDeleteIds.length} bundles?`
            : "Delete bundle?"
        }
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: confirmDelete,
        }}
        secondaryActions={[
          { content: "Cancel", onAction: () => setDeleteModalOpen(false) },
        ]}
      >
        <Modal.Section>
          <Banner tone="critical">
            <Text as="p">
              This will permanently delete{" "}
              {pendingDeleteIds.length > 1
                ? `${pendingDeleteIds.length} bundles`
                : "this bundle"}{" "}
              from your database <Text as="span" fontWeight="semibold">and remove the associated product(s) from Shopify</Text>. This cannot be undone.
            </Text>
          </Banner>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
