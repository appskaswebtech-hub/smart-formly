import { useState } from "react";
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit, useNavigation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";
import i18next from "../i18n/i18next.server";
import { resolveLocale } from "../i18n/resolve.server";
import { getForm } from "../models/form.server";
import { getSubmissions, deleteSubmission, deleteAllSubmissions } from "../models/submission.server";
import type { FormField } from "../models/form.server";
import {
  Page, Layout, Card, Text, BlockStack, InlineStack,
  Button, Badge, DataTable, EmptyState,
  Modal, Divider,
} from "@shopify/polaris";

export const handle = { i18n: ["submissions", "forms", "common"] };

// ── Loader ────────────────────────────────────────────────────────────────────
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const t = await i18next.getFixedT(await resolveLocale(request), "forms");
  const { id } = params;

  if (!id) {
    throw new Response(t("errors.formIdRequired"), { status: 400 });
  }

  const form = await getForm(id, session.shop);
  if (!form) {
    throw new Response(t("errors.notFound"), { status: 404 });
  }

  const submissions = await getSubmissions(id, session.shop);

  return json({ form, submissions });
};

// ── Action ────────────────────────────────────────────────────────────────────
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const locale = await resolveLocale(request);
  const t = await i18next.getFixedT(locale, "submissions");
  const tForms = await i18next.getFixedT(locale, "forms");
  const { id } = params;
  const body = await request.formData();
  const intent = body.get("intent");

  if (intent === "delete-one") {
    const submissionId = body.get("submissionId") as string;
    await deleteSubmission(submissionId, session.shop);
    return json({ success: true, message: t("byForm.deletedOne") });
  }

  if (intent === "delete-all") {
    if (!id) return json({ error: tForms("errors.formIdRequired") }, { status: 400 });
    await deleteAllSubmissions(id, session.shop);
    return json({ success: true, message: t("byForm.deletedAll") });
  }

  return json({});
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Submissions() {
  const { form, submissions } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isDeleting = navigation.state === "submitting";
  const { t, i18n } = useTranslation(["submissions", "common"]);

  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Parse form fields to get labels
  const formFields: FormField[] = form.fields;

  // ── Delete single submission ────────────────────────────────────────────
  function handleDeleteOne(submissionId: string) {
    if (!confirm(t("byForm.confirmDeleteOne"))) return;

    const fd = new FormData();
    fd.append("intent", "delete-one");
    fd.append("submissionId", submissionId);
    submit(fd, { method: "post" });
  }

  // ── Delete all submissions ──────────────────────────────────────────────
  function handleDeleteAll() {
    if (!confirm(t("byForm.confirmDeleteAll"))) return;

    const fd = new FormData();
    fd.append("intent", "delete-all");
    submit(fd, { method: "post" });
  }

  // ── View submission detail ──────────────────────────────────────────────
  function handleView(sub: any) {
    setSelectedSubmission(sub);
    setModalOpen(true);
  }

  // ── Build table rows ────────────────────────────────────────────────────
  const rows = submissions.map((sub: any) => {
    // Build a summary of the submission data (first 2-3 fields)
    const dataEntries = Object.entries(sub.data);
    const preview = dataEntries
      .slice(0, 3)
      .map(([key, val]) => `${key}: ${String(val).substring(0, 30)}`)
      .join(" | ");

    return [
      // Submission # — ✅ key added
      <Text key={`id-${sub.id}`} as="span" variant="bodySm" fontWeight="semibold">
        {sub.id.slice(0, 8)}…
      </Text>,
      // Preview — ✅ key added
      <Text key={`preview-${sub.id}`} as="span" variant="bodySm">
        {preview || "—"}
      </Text>,
      // Date — plain string, no key needed. Follows the active UI language.
      new Date(sub.createdAt).toLocaleString(i18n.language, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      // Actions — ✅ key added
      <InlineStack key={`actions-${sub.id}`} gap="200">
        <Button size="slim" onClick={() => handleView(sub)}>
          {t("byForm.view")}
        </Button>
        <Button
          size="slim"
          tone="critical"
          onClick={() => handleDeleteOne(sub.id)}
          loading={isDeleting}
        >
          {t("common:actions.delete")}
        </Button>
      </InlineStack>,
    ];
  });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Page
      title={t("byForm.title", { name: form.formName })}
      subtitle={t("byForm.subtitle", { count: submissions.length })}
      backAction={{ content: t("byForm.backToForms"), url: "/app" }}
      secondaryActions={
        submissions.length > 0
          ? [
              {
                content: t("byForm.deleteAll"),
                destructive: true,
                onAction: handleDeleteAll,
              },
            ]
          : []
      }
    >
      <Layout>
        {/* Stats Row */}
        <Layout.Section>
          <InlineStack gap="400">
            <Card>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">{t("byForm.totalSubmissions")}</Text>
                <Text as="p" variant="headingLg" fontWeight="bold">
                  {submissions.length}
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">{t("byForm.formStatus")}</Text>
                <Badge tone={form.isActive ? "success" : "info"}>
                  {form.isActive ? t("common:status.active") : t("common:status.draft")}
                </Badge>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">{t("byForm.formFields")}</Text>
                <Text as="p" variant="headingLg" fontWeight="bold">
                  {formFields.length}
                </Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        {/* Submissions Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">{t("byForm.heading")}</Text>
                <Button onClick={() => navigate(`/app/forms/${form.id}`)}>
                  {t("byForm.editForm")}
                </Button>
              </InlineStack>

              {submissions.length === 0 ? (
                <EmptyState
                  heading={t("byForm.emptyHeading")}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>{t("byForm.emptyBody")}</p>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "text", "text"]}
                  headings={[
                    t("byForm.columns.id"),
                    t("byForm.columns.preview"),
                    t("byForm.columns.submitted"),
                    t("byForm.columns.actions"),
                  ]}
                  rows={rows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* ── Submission Detail Modal ─────────────────────────────────────────── */}
      {selectedSubmission && (
        <Modal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedSubmission(null);
          }}
          title={t("byForm.detailTitle")}
          secondaryActions={[
            {
              content: t("common:actions.close"),
              onAction: () => {
                setModalOpen(false);
                setSelectedSubmission(null);
              },
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              {/* Metadata */}
              <BlockStack gap="200">
                <InlineStack gap="200">
                  <Text as="span" variant="bodySm" fontWeight="semibold">{t("byForm.idLabel")}</Text>
                  <Text as="span" variant="bodySm" tone="subdued">
                    {selectedSubmission.id}
                  </Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Text as="span" variant="bodySm" fontWeight="semibold">{t("byForm.submittedLabel")}</Text>
                  <Text as="span" variant="bodySm" tone="subdued">
                    {new Date(selectedSubmission.createdAt).toLocaleString(i18n.language)}
                  </Text>
                </InlineStack>
              </BlockStack>

              <Divider />

              {/* Submission data */}
              <Text as="h3" variant="headingSm" fontWeight="semibold">
                {t("byForm.formData")}
              </Text>
              <BlockStack gap="300">
                {Object.entries(selectedSubmission.data).map(
                  ([key, value]: [string, any]) => (
                    <div
                      key={key}
                      style={{
                        padding: "12px 14px",
                        background: "#F9FAFB",
                        borderRadius: 8,
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      <Text as="p" variant="bodySm" fontWeight="semibold">
                        {key}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        {Array.isArray(value)
                          ? value.join(", ")
                          : String(value) || "—"}
                      </Text>
                    </div>
                  )
                )}
              </BlockStack>
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
