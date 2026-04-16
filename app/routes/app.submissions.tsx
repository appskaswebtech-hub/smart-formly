import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import {
  Page, Layout, Card, Text, BlockStack,
  DataTable, EmptyState, Button, InlineStack,
} from "@shopify/polaris";

// export const loader = async ({ request }: LoaderFunctionArgs) => {
//   const { session } = await authenticate.admin(request);

//   const submissions = await db.formSubmission.findMany({
//     where: { shopDomain: session.shop },
//     orderBy: { createdAt: "desc" },
//     take: 50,
//     include: { form: { select: { formName: true, id: true } } },
//   });

//   return Response.json({
//     submissions: submissions.map(s => ({
//       id: s.id,
//       formId: s.formId,
//       formName: s.form.formName,
//       data: JSON.parse(s.data),
//       createdAt: s.createdAt,
//     })),
//   });
// };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Step 1: Get all form IDs belonging to this shop
  const forms = await db.formConfig.findMany({
    where: { shopDomain: session.shop },
    select: { id: true, formName: true },
  });
  const formMap = Object.fromEntries(forms.map(f => [f.id, f.formName]));
  const formIds = forms.map(f => f.id);

  // Step 2: Get submissions for those forms
  const submissions = await db.formSubmission.findMany({
    where: { formId: { in: formIds } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return json({
    submissions: submissions.map(s => ({
      id: s.id,
      formId: s.formId,
      formName: formMap[s.formId] ?? "Unknown Form",
      data: JSON.parse(s.data),
      createdAt: s.createdAt,
    })),
  });
};

export default function AllSubmissions() {
  const { submissions } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  const rows = submissions.map((s: any) => [
    s.formName,
    Object.entries(s.data)
      .slice(0, 2)
      .map(([k, v]) => `${k}: ${String(v).substring(0, 25)}`)
      .join(" | ") || "—",
    formatDate(s.createdAt),
    <InlineStack gap="200" key={s.id}>
      <Button size="slim" onClick={() => navigate(`/app/forms/${s.formId}/submissions`)}>
        View all
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page title="All Submissions" backAction={{ content: "Forms", url: "/app/formsly" }}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Recent Submissions</Text>

              {submissions.length === 0 ? (
                <EmptyState
                  heading="No submissions yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Submissions will appear here once customers fill out your forms.</p>
                </EmptyState>
              ) : (
                <>
                  <DataTable
                    columnContentTypes={["text", "text", "text", "text"]}
                    headings={["Form", "Preview", "Submitted", "Actions"]}
                    rows={rows}
                  />
                  <div style={{ padding: "12px 0 0", borderTop: "1px solid #E5E7EB" }}>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Showing {submissions.length} most recent {submissions.length === 1 ? "submission" : "submissions"}
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