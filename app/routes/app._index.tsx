import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Box,
  InlineStack,
  Badge,
  Divider,
  Thumbnail,
  ProgressBar,
  DataTable,
  EmptyState,
  Icon,
  Banner,
  Button,
  InlineGrid,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  ChartVerticalIcon,
  OrderIcon,
  DiscountIcon,
  PackageIcon,
  StarIcon,
  ArrowUpIcon,
  PlusIcon,
} from "@shopify/polaris-icons";
import db from "../db.server";

// ─────────────────────────────────────────
// LOADER
// ─────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [
    totalBundles,
    activeBundles,
    totalOrders,
    recentBundles,
    recentOrders,
    topBundles,
  ] = await Promise.all([
    db.bundle.count({ where: { shop } }),
    db.bundle.count({ where: { shop, status: "ACTIVE" } }),
    db.bundleOrder.count({ where: { shop } }),
    db.bundle.findMany({
      where: { shop },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        items: true,
        _count: { select: { orders: true } },
      },
    }),
    db.bundleOrder.findMany({
      where: { shop },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { bundle: true },
    }),
    db.bundle.findMany({
      where: { shop, status: "ACTIVE" },
      orderBy: { orders: { _count: "desc" } },
      take: 5,
      include: { _count: { select: { orders: true } } },
    }),
  ]);

  const revenueResult = await db.bundleOrder.aggregate({
    where: { shop },
    _sum: { pricePaid: true },
  });

  const totalRevenue = revenueResult._sum.pricePaid ?? 0;
  const draftBundles = await db.bundle.count({ where: { shop, status: "DRAFT" } });
  const maxOrders = topBundles.length > 0
    ? Math.max(...topBundles.map((b) => b._count.orders), 1)
    : 1;

  return json({
    stats: { totalBundles, activeBundles, draftBundles, totalOrders, totalRevenue },
    recentBundles,
    recentOrders,
    topBundles,
    maxOrders,
  });
};

// ─────────────────────────────────────────
// STAT CARD — uses InlineGrid-compatible Card
// ─────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon,
  badgeText,
  badgeTone,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  badgeText?: string;
  badgeTone?: "success" | "info" | "attention" | "critical";
}) {
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="start">
          <Text as="p" variant="bodySm" tone="subdued">
            {title}
          </Text>
          <Box background="bg-surface-secondary" borderRadius="200" padding="150">
            <Icon source={icon} />
          </Box>
        </InlineStack>
        <Text as="p" variant="headingXl" fontWeight="bold">
          {value}
        </Text>
        {(subtitle || badgeText) && (
          <InlineStack gap="200" blockAlign="center">
            {badgeText && <Badge tone={badgeTone ?? "info"}>{badgeText}</Badge>}
            {subtitle && (
              <Text as="p" variant="bodySm" tone="subdued">
                {subtitle}
              </Text>
            )}
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
export default function Index() {
  const { stats, recentBundles, recentOrders, topBundles, maxOrders } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const avgOrderValue = stats.totalOrders > 0
    ? (stats.totalRevenue / stats.totalOrders).toFixed(2)
    : null;

  const activeRate = stats.totalBundles > 0
    ? Math.round((stats.activeBundles / stats.totalBundles) * 100)
    : null;

  // ── Order table rows ──
  const orderRows = recentOrders.map((order) => [
    <Text as="span" variant="bodySm" fontWeight="semibold">
      #{order.shopifyOrderId.replace("gid://shopify/Order/", "")}
    </Text>,
    order.bundle?.title ?? "—",
    order.quantity,
    `$${order.pricePaid.toFixed(2)}`,
    new Date(order.createdAt).toLocaleDateString(),
    <Badge tone="success">Completed</Badge>,
  ]);

  // ── Bundle table rows ──
  const bundleRows = recentBundles.map((bundle) => [
    <InlineStack gap="200" blockAlign="center">
      {bundle.image ? (
        <Thumbnail source={bundle.image} alt={bundle.title} size="small" />
      ) : (
        <Box background="bg-surface-secondary" borderRadius="100" padding="150">
          <Icon source={PackageIcon} />
        </Box>
      )}
      <Text as="span" variant="bodySm" fontWeight="semibold">
        {bundle.title}
      </Text>
    </InlineStack>,
    bundle.items.length,
    bundle.totalPrice ? `$${bundle.totalPrice.toFixed(2)}` : "—",
    bundle._count.orders,
    <Badge
      tone={
        bundle.status === "ACTIVE" ? "success"
        : bundle.status === "DRAFT" ? "attention"
        : "critical"
      }
    >
      {bundle.status}
    </Badge>,
  ]);

  return (
    <Page
      title="Dashboard"
      primaryAction={
        stats.totalBundles > 0
          ? {
              content: "Create bundle",
              icon: PlusIcon,
              onAction: () => navigate("/app/bundles/new"),
            }
          : undefined
      }
    >
      <TitleBar title="Bundle Dashboard" />

      <BlockStack gap="600">

        {/* ── Welcome Banner (first time) ── */}
        {stats.totalBundles === 0 && (
          <Banner
            title="Welcome to Bundle Builder 🎉"
            tone="info"
            action={{
              content: "Create your first bundle",
              url: "/app/bundles/new",
            }}
          >
            <Text as="p">
              Create product bundles to boost your average order value.
              Bundle complementary products and offer them at a special price.
            </Text>
          </Banner>
        )}

        {/* ── 4-column Stats using InlineGrid ── */}
        <InlineGrid columns={4} gap="400">
          <StatCard
            title="Total Bundles"
            value={stats.totalBundles}
            icon={PackageIcon}
            subtitle={`${stats.draftBundles} draft${stats.draftBundles !== 1 ? "s" : ""}`}
          />
          <StatCard
            title="Active Bundles"
            value={stats.activeBundles}
            icon={StarIcon}
            badgeText={activeRate !== null ? `${activeRate}% active` : undefined}
            badgeTone="success"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={OrderIcon}
            subtitle="All time bundle orders"
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            icon={ChartVerticalIcon}
            badgeText={avgOrderValue ? `$${avgOrderValue} avg` : undefined}
            badgeTone="info"
          />
        </InlineGrid>

        {/* ── Middle row: Recent Bundles + Right sidebar ── */}
        <Layout>
          {/* Recent Bundles table */}
          <Layout.Section variant="twoThirds">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={PackageIcon} />
                    <Text as="h2" variant="headingMd">Recent Bundles</Text>
                  </InlineStack>
                  <Button
                    variant="plain"
                    url="/app/bundles"
                  >
                    View all →
                  </Button>
                </InlineStack>
                <Divider />

                {recentBundles.length === 0 ? (
                  <EmptyState
                    heading="No bundles yet"
                    action={{ content: "Create bundle", url: "/app/bundles/new" }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <Text as="p">Start creating bundles to see them here.</Text>
                  </EmptyState>
                ) : (
                  <DataTable
                    columnContentTypes={["text", "numeric", "numeric", "numeric", "text"]}
                    headings={["Bundle", "Items", "Price", "Orders", "Status"]}
                    rows={bundleRows}
                  />
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Right sidebar */}
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">

              {/* Top Performing */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={ChartVerticalIcon} />
                    <Text as="h2" variant="headingMd">Top Performing</Text>
                  </InlineStack>
                  <Divider />

                  {topBundles.length === 0 ? (
                    <Box paddingBlock="200">
                      <Text as="p" tone="subdued" variant="bodySm" alignment="center">
                        No sales data yet.
                      </Text>
                    </Box>
                  ) : (
                    <BlockStack gap="400">
                      {topBundles.map((bundle, index) => (
                        <BlockStack gap="200" key={bundle.id}>
                          <InlineStack align="space-between" blockAlign="center">
                            <InlineStack gap="200" blockAlign="center">
                              <Box
                                background={
                                  index === 0 ? "bg-fill-warning"
                                  : index === 1 ? "bg-surface-secondary"
                                  : "bg-surface-secondary"
                                }
                                borderRadius="full"
                                paddingInline="200"
                                paddingBlock="050"
                              >
                                <Text as="span" variant="bodySm" fontWeight="bold">
                                  {index + 1}
                                </Text>
                              </Box>
                              <Text as="p" variant="bodySm" fontWeight="semibold">
                                {bundle.title.length > 22
                                  ? bundle.title.slice(0, 22) + "…"
                                  : bundle.title}
                              </Text>
                            </InlineStack>
                            <Badge tone="info">{bundle._count.orders}</Badge>
                          </InlineStack>
                          <ProgressBar
                            progress={maxOrders > 0 ? (bundle._count.orders / maxOrders) * 100 : 0}
                            size="small"
                            tone="highlight"
                          />
                        </BlockStack>
                      ))}
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>

              {/* Quick Stats */}
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">Quick Stats</Text>
                  <Divider />
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">Avg. Order Value</Text>
                    <Text as="p" variant="bodySm" fontWeight="semibold">
                      {avgOrderValue ? `$${avgOrderValue}` : "—"}
                    </Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">Active Rate</Text>
                    <Text as="p" variant="bodySm" fontWeight="semibold">
                      {activeRate !== null ? `${activeRate}%` : "—"}
                    </Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">Draft Bundles</Text>
                    <Badge tone={stats.draftBundles > 0 ? "attention" : "success"}>
                      {stats.draftBundles}
                    </Badge>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">Total Revenue</Text>
                    <Text as="p" variant="bodySm" fontWeight="semibold">
                      ${stats.totalRevenue.toFixed(2)}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Card>

            </BlockStack>
          </Layout.Section>
        </Layout>

        {/* ── Recent Orders ── */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={OrderIcon} />
                <Text as="h2" variant="headingMd">Recent Bundle Orders</Text>
              </InlineStack>
              <Badge tone="info">{stats.totalOrders} total</Badge>
            </InlineStack>
            <Divider />

            {recentOrders.length === 0 ? (
              <Box paddingBlock="400">
                <Text as="p" tone="subdued" alignment="center">
                  No orders yet. Share your bundles to start selling!
                </Text>
              </Box>
            ) : (
              <DataTable
                columnContentTypes={["text", "text", "numeric", "numeric", "text", "text"]}
                headings={["Order ID", "Bundle", "Qty", "Revenue", "Date", "Status"]}
                rows={orderRows}
              />
            )}
          </BlockStack>
        </Card>

        {/* ── Active discount callout ── */}
        {stats.activeBundles > 0 && (
          <Card>
            <InlineStack gap="400" blockAlign="center" align="space-between">
              <InlineStack gap="300" blockAlign="center">
                <Box background="bg-fill-success" borderRadius="200" padding="200">
                  <Icon source={DiscountIcon} />
                </Box>
                <BlockStack gap="050">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    {stats.activeBundles} Active Bundle{stats.activeBundles !== 1 ? "s" : ""}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Your bundles are live and visible to customers.
                  </Text>
                </BlockStack>
              </InlineStack>
              <Button url="/app/bundles" variant="plain">Manage bundles →</Button>
            </InlineStack>
          </Card>
        )}

      </BlockStack>
    </Page>
  );
}
