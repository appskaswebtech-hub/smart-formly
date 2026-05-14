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
import { authenticate } from "../shopify.server";
import db from "../db.server";

// ── Loader ────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

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
      formName: formMap[s.formId] ?? "Unknown Form",
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

  // View modal state
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
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
        View details
      </Button>
      <Button
        size="slim"
        variant="secondary"
        onClick={() => navigate(`/app/forms/${s.formId}/submissions`)}
      >
        All in form
      </Button>
      <Button
        size="slim"
        tone="critical"
        onClick={() => handleDeleteClick(s.id)}
      >
        Delete
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page
      title="All Submissions"
      backAction={{ content: "Forms", url: "/app/formsly" }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Recent Submissions
              </Text>

              {submissions.length === 0 ? (
                <EmptyState
                  heading="No submissions yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    Submissions will appear here once customers fill out your
                    forms.
                  </p>
                </EmptyState>
              ) : (
                <>
                  <DataTable
                    columnContentTypes={["text", "text", "text", "text"]}
                    headings={["Form", "Preview", "Submitted", "Actions"]}
                    rows={rows}
                  />
                  <div
                    style={{
                      padding: "12px 0 0",
                      borderTop: "1px solid #E5E7EB",
                    }}
                  >
                    <Text as="p" variant="bodySm" tone="subdued">
                      Showing {submissions.length} most recent{" "}
                      {submissions.length === 1 ? "submission" : "submissions"}
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
          title={`Submission — ${viewingSubmission.formName}`}
          primaryAction={{
            content: "Close",
            onAction: () => setViewingSubmission(null),
          }}
          secondaryActions={[
            {
              content: "Delete this submission",
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
                  <Text as="p" variant="bodySm" tone="subdued">Form</Text>
                  <Badge>{viewingSubmission.formName}</Badge>
                </BlockStack>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Submitted</Text>
                  <Text as="p" variant="bodyMd">
                    {formatDate(viewingSubmission.createdAt)}
                  </Text>
                </BlockStack>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">ID</Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {viewingSubmission.id}
                  </Text>
                </BlockStack>
              </InlineStack>

              <Divider />

              {/* Field data */}
              <Text as="h3" variant="headingSm">
                Submitted Data
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
        title="Delete submission?"
        primaryAction={{
          content: "Delete",
          destructive: true,
          loading: isDeleting,
          onAction: handleDeleteConfirm,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setShowDeleteConfirm(false);
              setDeletingId(null);
            },
          },
        ]}
      >
        <Modal.Section>
          <Banner tone="warning">
            This action cannot be undone. The submission will be permanently
            deleted.
          </Banner>
        </Modal.Section>
      </Modal>
    </Page>
  );
}