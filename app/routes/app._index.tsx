

// import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";  // ← back to remix
import { authenticate } from "../shopify.server";
import { deleteFormById } from "../models/form.server";
import { getForms, getFormStats } from "../models/form.server";
import { useSubmit } from "@remix-run/react";
import { getSubmissionTrend } from "../models/submission.server";
import {
  Page, Layout, Card, Text, BlockStack,
  Button, Badge, DataTable, EmptyState,
  InlineStack, InlineGrid,
} from "@shopify/polaris";


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [forms, stats, trend] = await Promise.all([
    getForms(session.shop),
    getFormStats(session.shop),
    getSubmissionTrend(session.shop, 7).catch(() => []),
  ]);
  return json({ forms, stats, trend, shop: session.shop });
};

export const action = async ({ request }: ActionFunctionArgs) => {

console.log("🔥 ACTION TRIGGERED");

  const { session } = await authenticate.admin(request);
  const body = await request.formData();

  const intent = body.get("intent");

  if (intent === "delete") {
    const formId = body.get("formId") as string;

    await deleteFormById(formId, session.shop); // ✅ pass shop if needed

    return json({ success: true });
  }

  return json({});
};

export default function Dashboard() {
  const { forms, stats } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // ── correct way to navigate in embedded Shopify apps ──
  function goTo(path: string) {
    navigate(path);
  }

  const formIdHeading = (
  <div style={{ textAlign: "center", width: "100%" }}>
    Form Id
  </div>
);

//   const handleDelete = async (formId: string) => {
//   if (!confirm("Are you sure you want to delete this form?")) return;

//   const fd = new FormData();
//   fd.append("intent", "delete");
//   fd.append("formId", formId);

//   const res = await fetch("/app/index", { // ⚠️ adjust route if needed
//     method: "POST",
//     body: fd,
//   });

//   const data = await res.json();

//   if (data.success) {
//     // Option 1: reload page
//     window.location.reload();

//     // Option 2 (better UX): remove from state if you have forms state
//     // setForms(prev => prev.filter(f => f.id !== formId));
//   } else {
//     alert("Failed to delete form");
//   }
// };
 
const submit = useSubmit();

const handleDelete = (formId: string) => {
  if (!confirm("Are you sure you want to delete this form?")) return;

  const fd = new FormData();
  fd.append("intent", "delete");
  fd.append("formId", formId);

  submit(fd, {
    method: "post",
  });
};


return (
    <Page title="Hi there! 👋 Ready to create?">
      <Layout>

        {/* Stats */}
        <Layout.Section>
          <InlineGrid columns={3} gap="400">
            {[
              { label: "Forms created",    value: stats.totalForms      },
              { label: "Form submissions", value: stats.totalSubmissions },
              { label: "Active forms",     value: stats.activeForms      },
            ].map((s) => (
              <Card key={s.label}>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">{s.label}</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">{s.value}</Text>
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <InlineGrid columns={3} gap="400">
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">Create a form</Text>
                <Text as="p" tone="subdued">
                  Build and customize forms to collect the information you need.
                </Text>
                <Button variant="primary" onClick={() => navigate("/app/formsnew")}>
                  + Create Form
                </Button>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">Connect integrations</Text>
                <Text as="p" tone="subdued">
                  Connect forms to tools to track data and manage submissions.
                </Text>
                <Button onClick={() => navigate("/app/integrations")}>Setup apps</Button>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">Learn more</Text>
                <Text as="p" tone="subdued">
                  Guides, tips and answers to help you get the most from SmartFormly.
                </Text>
                <Button onClick={() => navigate("/app/helpandsupport")}>
                  Visit knowledge base
                </Button>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* Forms Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">Your Forms</Text>
                <Button variant="primary" onClick={() => navigate("/app/formsnew")}>
                  + Create Form
                </Button>
              </InlineStack>

              {forms.length === 0 ? (
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
              ) : (
                <DataTable
                  columnContentTypes={["text","numeric", "text", "numeric", "text", "text"]}
                  headings={[
  "Form name",

  // ✅ CENTERED HEADING HERE
  formIdHeading,
  "Status",
  "Submissions",
  "Created",
  "Actions",
]}
                  rows={forms.map((f) => [
                    f.formName,
                    // (Form ID column)
                        <Text as="span" variant="bodySm" tone="subdued">
                        {f.id}
                        </Text>,
                    <Badge tone={f.isActive ? "success" : "info"}>
                      {f.isActive ? "Active" : "Draft"}
                    </Badge>,
                    f.submissionsCount,
                    //  consistent on server and client
                    new Date(f.createdAt).toISOString().slice(0, 10),
                    <InlineStack gap="200">
                      <Button size="slim" onClick={() => navigate(`/app/forms/${f.id}`)}>
                        Edit                                                                        
                      </Button>
                      <Button size="slim" onClick={() => navigate(`/app/forms/${f.id}/submissions`)}>
                        Submissions
                      </Button>
                      <Button
  size="slim"
  tone="critical"
  onClick={() => handleDelete(f.id)}
>
  Delete
</Button>
                    </InlineStack>,
                  ])}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

      </Layout>
    </Page>
  );
}
