    import { useState } from "react";
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit, useNavigation } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getForm } from "../models/form.server";
import { getSubmissions, deleteSubmission, deleteAllSubmissions } from "../models/submission.server";
import type { FormField } from "../models/form.server";
import {
  Page, Layout, Card, Text, BlockStack, InlineStack,
  Button, Badge, DataTable, EmptyState, Banner, Box,
  Modal, Divider,
} from "@shopify/polaris";

// ── Loader ────────────────────────────────────────────────────────────────────
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  if (!id) {
    throw new Response("Form ID required", { status: 400 });
  }

  const form = await getForm(id, session.shop);
  if (!form) {
    throw new Response("Form not found", { status: 404 });
  }

  const submissions = await getSubmissions(id, session.shop);

  return json({ form, submissions });
};

// ── Action ────────────────────────────────────────────────────────────────────
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { id } = params;
  const body = await request.formData();
  const intent = body.get("intent");

  if (intent === "delete-one") {
    const submissionId = body.get("submissionId") as string;
    await deleteSubmission(submissionId, session.shop);
    return json({ success: true, message: "Submission deleted" });
  }

  if (intent === "delete-all") {
    if (!id) return json({ error: "Form ID required" }, { status: 400 });
    await deleteAllSubmissions(id, session.shop);
    return json({ success: true, message: "All submissions deleted" });
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

  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Parse form fields to get labels
  const formFields: FormField[] = form.fields;
  const fieldLabels = formFields.map((f) => f.label);

  // ── Delete single submission ────────────────────────────────────────────
  function handleDeleteOne(submissionId: string) {
    if (!confirm("Are you sure you want to delete this submission?")) return;

    const fd = new FormData();
    fd.append("intent", "delete-one");
    fd.append("submissionId", submissionId);
    submit(fd, { method: "post" });
  }

  // ── Delete all submissions ──────────────────────────────────────────────
  function handleDeleteAll() {
    if (!confirm("Delete ALL submissions for this form? This cannot be undone.")) return;

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
      // Submission #
      <Text as="span" variant="bodySm" fontWeight="semibold">
        {sub.id.slice(0, 8)}…
      </Text>,
      // Preview
      <Text as="span" variant="bodySm">
        {preview || "—"}
      </Text>,
      // Date
      new Date(sub.createdAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      // Actions
      <InlineStack gap="200">
        <Button size="slim" onClick={() => handleView(sub)}>
          View
        </Button>
        <Button
          size="slim"
          tone="critical"
          onClick={() => handleDeleteOne(sub.id)}
          loading={isDeleting}
        >
          Delete
        </Button>
      </InlineStack>,
    ];
  });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Page
      title={`Submissions: ${form.formName}`}
      subtitle={`${submissions.length} submission${submissions.length !== 1 ? "s" : ""}`}
      backAction={{ content: "Back to forms", url: "/app" }}
      secondaryActions={
        submissions.length > 0
          ? [
              {
                content: "Delete all submissions",
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
                <Text as="p" variant="bodySm" tone="subdued">Total submissions</Text>
                <Text as="p" variant="headingLg" fontWeight="bold">
                  {submissions.length}
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">Form status</Text>
                <Badge tone={form.isActive ? "success" : "info"}>
                  {form.isActive ? "Active" : "Draft"}
                </Badge>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">Form fields</Text>
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
                <Text as="h2" variant="headingMd">All Submissions</Text>
                <Button onClick={() => navigate(`/app/forms/${form.id}`)}>
                  Edit Form
                </Button>
              </InlineStack>

              {submissions.length === 0 ? (
                <EmptyState
                  heading="No submissions yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    Submissions will appear here once customers fill out your form.
                    Make sure the form is embedded in your store and set to Active.
                  </p>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "text", "text"]}
                  headings={["ID", "Data Preview", "Submitted", "Actions"]}
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
          title="Submission Details"
          secondaryActions={[
            {
              content: "Close",
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
                  <Text as="span" variant="bodySm" fontWeight="semibold">ID:</Text>
                  <Text as="span" variant="bodySm" tone="subdued">
                    {selectedSubmission.id}
                  </Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Text as="span" variant="bodySm" fontWeight="semibold">Submitted:</Text>
                  <Text as="span" variant="bodySm" tone="subdued">
                    {new Date(selectedSubmission.createdAt).toLocaleString()}
                  </Text>
                </InlineStack>
              </BlockStack>

              <Divider />

              {/* Submission data */}
              <Text as="h3" variant="headingSm" fontWeight="semibold">
                Form Data
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