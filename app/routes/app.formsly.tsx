import { useState, useMemo, useEffect, useRef } from "react";
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit, useSearchParams } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { deleteFormById, getForms, getFormStats } from "../models/form.server";
import { getSubmissionTrend } from "../models/submission.server";
import {
  Page, Layout, Card, Text, BlockStack,
  Button, Badge, DataTable, EmptyState,
  InlineStack, Tabs, TextField, Icon,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";

// ── Loader ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const [forms, stats, trend] = await Promise.all([
    getForms(shopDomain),
    getFormStats(shopDomain),
    getSubmissionTrend(shopDomain, 7).catch(() => []),
  ]);

  return json({ forms, stats, trend, shopDomain });
};

// ── Action ────────────────────────────────────────────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const body = await request.formData();
  const intent = body.get("intent");

  if (intent === "delete") {
    const formId = body.get("formId") as string;
    await deleteFormById(formId, shopDomain);
    return json({ success: true });
  }

  return json({});
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function FormsPage() {
  // ✅ Only destructure what we use — stats/trend/shopDomain intentionally omitted
  const { forms } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const shopify = useAppBridge();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ useRef prevents double-firing in StrictMode and avoids infinite loop
  // when setSearchParams triggers a re-render with new searchParams
  const toastShown = useRef(false);

  // ── Show toast if redirected from create/edit form ───────────────────────
  useEffect(() => {
    if (toastShown.current) return;

    if (searchParams.get("created") === "1") {
      shopify.toast.show("Form created successfully!");
      setSearchParams({});
      toastShown.current = true;
    } else if (searchParams.get("updated") === "1") {
      shopify.toast.show("Form updated successfully!");
      setSearchParams({});
      toastShown.current = true;  
    }
  }, [searchParams, setSearchParams]);

  // ── Counts ───────────────────────────────────────────────────────────────
  const allCount      = forms.length;
  const activeCount   = forms.filter((f: any) => f.isActive).length;
  const inactiveCount = forms.filter((f: any) => !f.isActive).length;

  // ── Filter tabs ──────────────────────────────────────────────────────────
  const tabs = [
    { id: "all",      content: `All ${allCount}` },
    { id: "active",   content: `Active ${activeCount}` },
    { id: "inactive", content: `Inactive ${inactiveCount}` },
  ];

  // ── Filtered + searched forms ────────────────────────────────────────────
  const filteredForms = useMemo(() => {
    let result = [...forms];

    if (selectedTab === 1) result = result.filter((f: any) => f.isActive);
    if (selectedTab === 2) result = result.filter((f: any) => !f.isActive);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f: any) =>
          f.formName.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q)
      );
    }

    return result;
  }, [forms, selectedTab, searchQuery]);

  // ── Delete handler ───────────────────────────────────────────────────────
  const handleDelete = (formId: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return;
    const fd = new FormData();
    fd.append("intent", "delete");
    fd.append("formId", formId);
    submit(fd, { method: "post" });
  };

  // ── Copy to clipboard ────────────────────────────────────────────────────
  const handleCopyId = (formId: string) => {
    navigator.clipboard.writeText(formId).then(() => {
      shopify.toast.show("Form ID copied to clipboard!");
    }).catch(() => {
      shopify.toast.show("Failed to copy ID", { isError: true });
    });
  };

  // ── Format date ──────────────────────────────────────────────────────────
  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  // ── Table rows ───────────────────────────────────────────────────────────
  const rows = filteredForms.map((f: any) => [
    // Title
    <button
      key={`name-${f.id}`}
      onClick={() => navigate(`/app/forms/${f.id}`)}
      style={{
        background: "none", border: "none", padding: 0,
        cursor: "pointer", color: "#2C6ECB", fontWeight: 500,
        fontSize: 13, textAlign: "left",
      }}
    >
      {f.formName}
    </button>,

    // Form ID — click to copy
    <div
      key={`id-${f.id}`}
      onClick={() => handleCopyId(f.id)}
      title={`Click to copy: ${f.id}`}
      style={{
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px",
        borderRadius: 4,
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

    // Status
    <Badge tone={f.isActive ? "success" : "info"} key={`status-${f.id}`}>
      {f.isActive ? "Active" : "Inactive"}
    </Badge>,

    // Submissions
    f.submissionsCount,

    // Date created
    formatDate(f.createdAt),

    // Actions
    <InlineStack gap="200" key={`actions-${f.id}`}>
      <Button size="slim" onClick={() => navigate(`/app/forms/${f.id}/submissions`)}>
        Submissions
      </Button>
      <Button size="slim" onClick={() => navigate(`/app/forms/${f.id}`)}>
        Edit
      </Button>
      <Button size="slim" tone="critical" onClick={() => handleDelete(f.id)}>
        Delete
      </Button>
    </InlineStack>,
  ]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Page
      title="My Forms"
      primaryAction={{
        content: "+ New Form",
        onAction: () => navigate("/app/formsnew"),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <BlockStack>
              {/* ── Filter Tabs ── */}
              <div style={{ borderBottom: "1px solid #E5E7EB" }}>
                <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} fitted />
              </div>

              {/* ── Search Bar ── */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #E5E7EB" }}>
                <TextField
                  label=""
                  labelHidden
                  placeholder="Search forms by name or ID…"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  autoComplete="off"
                  prefix={<Icon source={SearchIcon} />}
                  clearButton
                  onClearButtonClick={() => setSearchQuery("")}
                />
              </div>

              {/* ── Table or Empty State ── */}
              {forms.length === 0 ? (
                <div style={{ padding: "20px 16px" }}>
                  <EmptyState
                    heading="No forms yet"
                    action={{
                      content: "Create your first form",
                      onAction: () => navigate("/app/formsnew"),
                    }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Create a form to start collecting submissions from your store.</p>
                  </EmptyState>
                </div>
              ) : filteredForms.length === 0 ? (
                <div style={{
                  padding: "40px 16px",
                  textAlign: "center",
                  color: "#6B7280",
                  fontSize: 14,
                }}>
                  No forms match your current filter
                  {searchQuery && (
                    <span> for "<strong>{searchQuery}</strong>"</span>
                  )}
                </div>
              ) : (
                <>
                  <DataTable
                    columnContentTypes={["text", "text", "text", "numeric", "text", "text"]}
                    headings={["Title", "Form ID", "Status", "Submissions", "Date Created", "Actions"]}
                    rows={rows}
                  />
                  <div style={{
                    padding: "12px 16px",
                    borderTop: "1px solid #E5E7EB",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Showing {filteredForms.length} {filteredForms.length === 1 ? "record" : "records"}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      💡 Click any Form ID to copy it
                    </Text>
                  </div>
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}