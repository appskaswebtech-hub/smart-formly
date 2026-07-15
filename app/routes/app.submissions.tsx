import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import {
  useLoaderData,
  useNavigate,
  useSubmit,
  useNavigation,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  EmptyState,
  DataTable,
  Modal,
  Badge,
  Divider,
  Banner,
  Box,
} from "@shopify/polaris";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";
import i18next from "../i18n/i18next.server";
import { resolveLocale } from "../i18n/resolve.server";
import db from "../db.server";

export const handle = { i18n: ["submissions", "common"] };

// ── Loader ────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const t = await i18next.getFixedT(await resolveLocale(request), "submissions");

  const forms = await db.formConfig.findMany({
    where: { shopDomain: session.shop },
    select: { id: true, formName: true },
  });
  const formMap = Object.fromEntries(forms.map((f) => [f.id, f.formName]));
  const formIds = forms.map((f) => f.id);

  const submissions = await db.formSubmission.findMany({
    where: { formId: { in: formIds } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return json({
    submissions: submissions.map((s) => ({
      id: s.id,
      formId: s.formId,
      formName: formMap[s.formId] ?? t("all.unknownForm"),
      data: JSON.parse(s.data) as Record<string, any>,
      createdAt: s.createdAt,
    })),
  });
};

// ── Action: handle delete ─────────────────────────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const submissionId = formData.get("submissionId") as string;

  if (intent === "delete" && submissionId) {
    // Verify submission belongs to this shop before deleting
    const submission = await db.formSubmission.findFirst({
      where: { id: submissionId, shopDomain: session.shop },
    });

    if (submission) {
      await db.formSubmission.delete({ where: { id: submissionId } });
    }
  }

  return json({ ok: true });
};

// ── Types ─────────────────────────────────────────────────────────────────
type Submission = {
  id: string;
  formId: string;
  formName: string;
  data: Record<string, any>;
  createdAt: string;
};

// ── Component ─────────────────────────────────────────────────────────────
export default function AllSubmissions() {
  const { submissions } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isDeleting = navigation.state === "submitting";
  const { t, i18n } = useTranslation(["submissions", "common"]);

  // View modal state
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Follows the active UI language so dates don't stay US-formatted in de/es/it.
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleDeleteClick(id: string) {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  }

  function handleDeleteConfirm() {
    if (!deletingId) return;
    const fd = new FormData();
    fd.append("intent", "delete");
    fd.append("submissionId", deletingId);
    submit(fd, { method: "POST" });
    setShowDeleteConfirm(false);
    setDeletingId(null);
  }

  const rows = submissions.map((s: Submission) => [
    // Form name
    <Text as="span" variant="bodyMd" fontWeight="semibold" key={`form-${s.id}`}>
      {s.formName}
    </Text>,

    // Data preview
    <Text as="span" variant="bodySm" tone="subdued" key={`preview-${s.id}`}>
      {Object.entries(s.data)
        .slice(0, 2)
        .map(([k, v]) => `${k}: ${String(v).substring(0, 25)}`)
        .join(" | ") || "—"}
    </Text>,

    // Date
    <Text as="span" variant="bodySm" key={`date-${s.id}`}>
      {formatDate(s.createdAt)}
    </Text>,

    // Actions
    <InlineStack gap="200" key={`actions-${s.id}`}>
      <Button
        size="slim"
        variant="secondary"
        onClick={() => setViewingSubmission(s)}
      >
        {t("all.viewDetails")}
      </Button>
      <Button
        size="slim"
        variant="secondary"
        onClick={() => navigate(`/app/forms/${s.formId}/submissions`)}
      >
        {t("all.allInForm")}
      </Button>
      <Button
        size="slim"
        tone="critical"
        onClick={() => handleDeleteClick(s.id)}
      >
        {t("common:actions.delete")}
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page
      title={t("all.title")}
      backAction={{ content: t("all.backToForms"), url: "/app/formsly" }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t("all.recent")}
              </Text>

              {submissions.length === 0 ? (
                <EmptyState
                  heading={t("all.emptyHeading")}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>{t("all.emptyBody")}</p>
                </EmptyState>
              ) : (
                <>
                  <DataTable
                    columnContentTypes={["text", "text", "text", "text"]}
                    headings={[
                      t("all.columns.form"),
                      t("all.columns.preview"),
                      t("all.columns.submitted"),
                      t("all.columns.actions"),
                    ]}
                    rows={rows}
                  />
                  <div
                    style={{
                      padding: "12px 0 0",
                      borderTop: "1px solid #E5E7EB",
                    }}
                  >
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t("all.showing", { count: submissions.length })}
                    </Text>
                  </div>
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* ── View Details Modal ───────────────────────────────────────────── */}
      {viewingSubmission && (
        <Modal
          open={!!viewingSubmission}
          onClose={() => setViewingSubmission(null)}
          title={t("modal.title", { form: viewingSubmission.formName })}
          primaryAction={{
            content: t("common:actions.close"),
            onAction: () => setViewingSubmission(null),
          }}
          secondaryActions={[
            {
              content: t("modal.deleteThis"),
              destructive: true,
              onAction: () => {
                setViewingSubmission(null);
                handleDeleteClick(viewingSubmission.id);
              },
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="300">

              {/* Metadata */}
              <InlineStack gap="400">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">{t("modal.form")}</Text>
                  <Badge>{viewingSubmission.formName}</Badge>
                </BlockStack>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">{t("modal.submitted")}</Text>
                  <Text as="p" variant="bodyMd">
                    {formatDate(viewingSubmission.createdAt)}
                  </Text>
                </BlockStack>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">{t("modal.id")}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {viewingSubmission.id}
                  </Text>
                </BlockStack>
              </InlineStack>

              <Divider />

              {/* Field data */}
              <Text as="h3" variant="headingSm">
                {t("modal.submittedData")}
              </Text>

              <BlockStack gap="300">
                {Object.entries(viewingSubmission.data).map(([key, value]) => (
                  <Box
                    key={key}
                    padding="300"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" tone="subdued">
                        {key}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        {String(value) || "—"}
                      </Text>
                    </BlockStack>
                  </Box>
                ))}
              </BlockStack>

            </BlockStack>
          </Modal.Section>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        title={t("modal.confirmTitle")}
        primaryAction={{
          content: t("common:actions.delete"),
          destructive: true,
          loading: isDeleting,
          onAction: handleDeleteConfirm,
        }}
        secondaryActions={[
          {
            content: t("common:actions.cancel"),
            onAction: () => {
              setShowDeleteConfirm(false);
              setDeletingId(null);
            },
          },
        ]}
      >
        <Modal.Section>
          <Banner tone="warning">
            {t("modal.confirmBody")}
          </Banner>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
