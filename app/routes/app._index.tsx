import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useRouteLoaderData, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";
import LanguagePicker from "../components/LanguagePicker";
import type { loader as rootLoader } from "../root";
import { deleteFormById, getForms, getFormStats } from "../models/form.server";
import { getSubmissionTrend } from "../models/submission.server";
import {
  Page, Layout, Card, Text, BlockStack, Box,
  Button, Badge, DataTable, EmptyState,
  InlineStack, InlineGrid, Banner,
} from "@shopify/polaris";

export const handle = { i18n: ["dashboard", "common"] };

/* ── resolveAppUrl ────────────────────────────────────────────────────────────
   Always returns an https:// URL.

   Priority:
     1. SHOPIFY_APP_URL env var  — Shopify CLI overrides this with the current
        tunnel URL (https://xxxx.trycloudflare.com) in dev, and it equals your
        permanent domain in production. This is the single source of truth.
     2. request.headers x-forwarded-host — fallback for edge cases where the
        env var isn't injected yet.

   We NEVER read protocol+host from request.url directly because the Shopify
   proxy rewrites the URL to http://localhost which gives us http:// and breaks
   storefront fetches (mixed-content policy).
──────────────────────────────────────────────────────────────────────────────*/
function resolveAppUrl(request: Request): string {
  // 1. Use the env var — most reliable in both dev and production
  const envUrl = process.env.SHOPIFY_APP_URL ?? "";
  if (envUrl) {
    return envUrl.replace(/^http:\/\//, "https://").replace(/\/$/, "");
  }

  // 2. Fallback: x-forwarded-host header (set by Shopify's proxy)
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    return `https://${forwardedHost.replace(/\/$/, "")}`;
  }

  // 3. Last resort: parse request URL but force https
  const parsed = new URL(request.url);
  return `https://${parsed.host}`;
}

// ── Loader ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  // ── Update app_url metafield ───────────────────────────────────────────────
  // This runs on every dashboard load so the metafield always reflects the
  // current tunnel URL in dev and the permanent URL in production.
  const appUrl = resolveAppUrl(request);

  if (appUrl) {
    try {
      const shopRes  = await admin.graphql(`{ shop { id } }`);
      const shopData = await shopRes.json();
      const shopId   = shopData?.data?.shop?.id;

      if (shopId) {
        const mfRes = await admin.graphql(
          `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields { key namespace value }
              userErrors  { field message }
            }
          }`,
          {
            variables: {
              metafields: [{
                namespace: "smartformly",
                key:       "app_url",
                value:     appUrl,
                type:      "single_line_text_field",
                ownerId:   shopId,
              }],
            },
          }
        );

        const mfData   = await mfRes.json();
        const errors   = mfData?.data?.metafieldsSet?.userErrors ?? [];
        const setValue = mfData?.data?.metafieldsSet?.metafields?.[0]?.value ?? "";

        if (errors.length > 0) {
          console.error("[metafield] userErrors:", errors);
        } else {
          console.log(`[metafield] smartformly.app_url → ${setValue}`);
        }
      }
    } catch (err) {
      console.error("[metafield] Failed to set app_url:", err);
    }
  }

  const [forms, stats, trend] = await Promise.all([
    getForms(session.shop),
    getFormStats(session.shop),
    getSubmissionTrend(session.shop, 7).catch(() => []),
  ]);

  return json({ forms, stats, trend, shop: session.shop });
};

// ── Action ────────────────────────────────────────────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const body        = await request.formData();
  const intent      = body.get("intent");

  if (intent === "delete") {
    const formId = body.get("formId") as string;
    await deleteFormById(formId, session.shop);
    return json({ success: true });
  }

  return json({});
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { forms, stats, shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit   = useSubmit();
  const shopify  = useAppBridge();
  const { t } = useTranslation(["dashboard", "common"]);

  // Read the locale from root rather than re-resolving it here: root is the
  // single source of truth that entry.server rendered with.
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const locale = rootData?.locale ?? "en";

  // ── App Embed deep link ───────────────────────────────────────────────────
  const appEmbedUrl = `https://${shop}/admin/themes/current/editor?context=apps`;

  // ── Copy form ID to clipboard ─────────────────────────────────────────────
  const handleCopyId = (formId: string) => {
    navigator.clipboard.writeText(formId).then(() => {
      shopify.toast.show(t("common:forms.copied"));
    }).catch(() => {
      shopify.toast.show(t("common:forms.copyFailed"), { isError: true });
    });
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = (formId: string) => {
    if (!confirm(t("common:forms.confirmDelete"))) return;
    const fd = new FormData();
    fd.append("intent", "delete");
    fd.append("formId", formId);
    submit(fd, { method: "post" });
  };

  // ── Centered Form ID heading ──────────────────────────────────────────────
  const formIdHeading = (
    <div style={{ textAlign: "center", width: "100%" }}>{t("formsTable.columns.id")}</div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
    <Box paddingInlineEnd="400">
      <InlineStack align="end">
        <LanguagePicker locale={locale} />
      </InlineStack>
    </Box>
    <Page title={t("title")}>
      <Layout>

        {/* ── App Embed Banner ── */}
        <Layout.Section>
          <Banner
            title={t("banner.title")}
            tone="info"
            action={{
              content: t("banner.action"),
              onAction: () => window.open(appEmbedUrl, "_blank"),
            }}
          >
            <Text as="p" tone="subdued">
              {t("banner.body")}
            </Text>
          </Banner>
        </Layout.Section>

        {/* ── Stats ── */}
        <Layout.Section>
          <InlineGrid columns={3} gap="400">
            {[
              { key: "formsCreated",    label: t("stats.formsCreated"),    value: stats.totalForms       },
              { key: "formSubmissions", label: t("stats.formSubmissions"), value: stats.totalSubmissions },
              { key: "activeForms",     label: t("stats.activeForms"),     value: stats.activeForms      },
            ].map((s) => (
              <Card key={s.key}>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">{s.label}</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">{s.value}</Text>
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>
        </Layout.Section>

        {/* ── Quick Actions ── */}
        <Layout.Section>
          <InlineGrid columns={3} gap="400">

            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">{t("quickActions.createForm.title")}</Text>
                <Text as="p" tone="subdued">
                  {t("quickActions.createForm.body")}
                </Text>
                <Button variant="primary" onClick={() => navigate("/app/formsnew")}>
                  {t("quickActions.createForm.cta")}
                </Button>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">{t("quickActions.enableStorefront.title")}</Text>
                <Text as="p" tone="subdued">
                  {t("quickActions.enableStorefront.body")}
                </Text>
                <Button
                  variant="primary"
                  tone="success"
                  onClick={() => window.open(appEmbedUrl, "_blank")}
                >
                  {t("quickActions.enableStorefront.cta")}
                </Button>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">{t("quickActions.learnMore.title")}</Text>
                <Text as="p" tone="subdued">
                  {t("quickActions.learnMore.body")}
                </Text>
                <Button onClick={() => navigate("/app/helpandsupport")}>
                  {t("quickActions.learnMore.cta")}
                </Button>
              </BlockStack>
            </Card>

          </InlineGrid>
        </Layout.Section>

        {/* ── Forms Table ── */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">{t("formsTable.heading")}</Text>
                <Button variant="primary" onClick={() => navigate("/app/formsnew")}>
                  {t("quickActions.createForm.cta")}
                </Button>
              </InlineStack>

              {forms.length === 0 ? (
                <EmptyState
                  heading={t("common:forms.empty.heading")}
                  action={{
                    content: t("common:forms.empty.action"),
                    onAction: () => navigate("/app/formsnew"),
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>{t("common:forms.empty.body")}</p>
                </EmptyState>
              ) : (
                <>
                  <DataTable
                    columnContentTypes={["text", "numeric", "text", "numeric", "text", "text"]}
                    headings={[
                      t("formsTable.columns.name"),
                      formIdHeading,
                      t("formsTable.columns.status"),
                      t("formsTable.columns.submissions"),
                      t("formsTable.columns.created"),
                      t("formsTable.columns.actions"),
                    ]}
                    rows={forms.map((f) => [

                      // ── Form name ──
                      <button
                        key={`name-${f.id}`}
                        onClick={() => navigate(`/app/forms/${f.id}`)}
                        style={{
                          background: "none", border: "none", padding: 0,
                          cursor: "pointer", color: "#2C6ECB",
                          fontWeight: 500, fontSize: 13, textAlign: "left",
                        }}
                      >
                        {f.formName}
                      </button>,

                      // ── Form ID — click to copy ──
                      <div
                        key={`id-${f.id}`}
                        onClick={() => handleCopyId(f.id)}
                        title={t("common:forms.copyTitle", { id: f.id })}
                        style={{
                          cursor: "pointer", display: "inline-flex",
                          alignItems: "center", gap: 4,
                          padding: "2px 6px", borderRadius: 4,
                          transition: "background .15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#F3F4F6"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <Text as="span" variant="bodySm" tone="subdued">
                          {f.id.slice(0, 20)}…
                        </Text>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>📋</span>
                      </div>,

                      // ── Status ──
                      <Badge key={`status-${f.id}`} tone={f.isActive ? "success" : "info"}>
                        {f.isActive ? t("common:status.active") : t("common:status.draft")}
                      </Badge>,

                      // ── Submissions ──
                      f.submissionsCount,

                      // ── Created ──
                      new Date(f.createdAt).toISOString().slice(0, 10),

                      // ── Actions ──
                      <InlineStack gap="200" key={`actions-${f.id}`}>
                        <Button size="slim" onClick={() => navigate(`/app/forms/${f.id}`)}>
                          {t("common:actions.edit")}
                        </Button>
                        <Button size="slim" onClick={() => navigate(`/app/forms/${f.id}/submissions`)}>
                          {t("formsTable.viewSubmissions")}
                        </Button>
                        <Button size="slim" tone="critical" onClick={() => handleDelete(f.id)}>
                          {t("common:actions.delete")}
                        </Button>
                      </InlineStack>,

                    ])}
                  />
                  <div style={{
                    borderTop: "1px solid #E5E7EB", padding: "10px 16px",
                    display: "flex", justifyContent: "flex-end",
                  }}>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t("common:forms.copyHint")}
                    </Text>
                  </div>
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

      </Layout>
    </Page>
    </>
  );
}
