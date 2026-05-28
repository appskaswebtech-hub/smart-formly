  // import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
  // import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
  // import { useAppBridge } from "@shopify/app-bridge-react";
  // import { authenticate } from "../shopify.server";
  // import { deleteFormById, getForms, getFormStats } from "../models/form.server";
  // import { getSubmissionTrend } from "../models/submission.server";
  // import {
  //   Page, Layout, Card, Text, BlockStack,
  //   Button, Badge, DataTable, EmptyState,
  //   InlineStack, InlineGrid, Banner,
  // } from "@shopify/polaris";

  // // ── Extension config ──────────────────────────────────────────────────────────
  // const EXTENSION_UUID = "b6e78f32-b464-3f93-fdf4-9265df8aeaaa73b1a718";
  // const EXTENSION_HANDLE = "smart-formly-block";

  // // ── Loader ────────────────────────────────────────────────────────────────────
  // export const loader = async ({ request }: LoaderFunctionArgs) => {
  //   const { session } = await authenticate.admin(request);
  //   const [forms, stats, trend] = await Promise.all([
  //     getForms(session.shop),
  //     getFormStats(session.shop),
  //     getSubmissionTrend(session.shop, 7).catch(() => []),
  //   ]);
  //   return json({ forms, stats, trend, shop: session.shop });
  // };

  // // ── Action ────────────────────────────────────────────────────────────────────
  // export const action = async ({ request }: ActionFunctionArgs) => {
  //   console.log("🔥 ACTION TRIGGERED");
  //   const { session } = await authenticate.admin(request);
  //   const body = await request.formData();
  //   const intent = body.get("intent");

  //   if (intent === "delete") {
  //     const formId = body.get("formId") as string;
  //     await deleteFormById(formId, session.shop);
  //     return json({ success: true });
  //   }

  //   return json({});
  // };

  // // ── Component ─────────────────────────────────────────────────────────────────
  // export default function Dashboard() {
  //   const { forms, stats, shop } = useLoaderData<typeof loader>();
  //   const navigate = useNavigate();
  //   const submit   = useSubmit();
  //   const shopify  = useAppBridge();

  //   // ── App Embed deep link ───────────────────────────────────────────────────
  //   const appEmbedUrl =
  //     `https://${shop}/admin/themes/current/editor` +
  //     `?context=apps` +
  //     `&activateAppId=${EXTENSION_UUID}/${EXTENSION_HANDLE}`;

  //   // ── Copy form ID to clipboard ─────────────────────────────────────────────
  //   const handleCopyId = (formId: string) => {
  //     navigator.clipboard.writeText(formId).then(() => {
  //       shopify.toast.show("Form ID copied to clipboard!");
  //     }).catch(() => {
  //       shopify.toast.show("Failed to copy ID", { isError: true });
  //     });
  //   };

  //   // ── Delete handler ────────────────────────────────────────────────────────
  //   const handleDelete = (formId: string) => {
  //     if (!confirm("Are you sure you want to delete this form?")) return;
  //     const fd = new FormData();
  //     fd.append("intent", "delete");
  //     fd.append("formId", formId);
  //     submit(fd, { method: "post" });
  //   };

  //   // ── Centered Form ID heading ──────────────────────────────────────────────
  //   const formIdHeading = (
  //     <div style={{ textAlign: "center", width: "100%" }}>Form Id</div>
  //   );

  //   // ── Render ────────────────────────────────────────────────────────────────
  //   return (
  //     <Page title="Hi there! 👋 Ready to create?">
  //       <Layout>

  //         {/* ── App Embed Banner ── */}
  //         <Layout.Section>
  //           <Banner
  //             title="Enable SmartFormly on your storefront"
  //             tone="info"
  //             action={{
  //               content: "Enable App Embed →",
  //               onAction: () => window.open(appEmbedUrl, "_blank"),
  //             }}
  //           >
  //             <Text as="p" tone="subdued">
  //               Activate the SmartFormly app embed in your theme editor to start
  //               showing forms on your storefront. Click the button to open the
  //               theme editor — then toggle SmartFormly on and save.
  //             </Text>
  //           </Banner>
  //         </Layout.Section>

  //         {/* ── Stats ── */}
  //         <Layout.Section>
  //           <InlineGrid columns={3} gap="400">
  //             {[
  //               { label: "Forms created",    value: stats.totalForms      },
  //               { label: "Form submissions", value: stats.totalSubmissions },
  //               { label: "Active forms",     value: stats.activeForms      },
  //             ].map((s) => (
  //               <Card key={s.label}>
  //                 <BlockStack gap="200">
  //                   <Text as="p" variant="bodySm" tone="subdued">{s.label}</Text>
  //                   <Text as="p" variant="heading2xl" fontWeight="bold">{s.value}</Text>
  //                 </BlockStack>
  //               </Card>
  //             ))}
  //           </InlineGrid>
  //         </Layout.Section>

  //         {/* ── Quick Actions ── */}
  //         <Layout.Section>
  //           <InlineGrid columns={3} gap="400">

  //             {/* Create a form */}
  //             <Card>
  //               <BlockStack gap="300">
  //                 <Text as="h3" variant="headingMd">Create a form</Text>
  //                 <Text as="p" tone="subdued">
  //                   Build and customize forms to collect the information you need.
  //                 </Text>
  //                 <Button variant="primary" onClick={() => navigate("/app/formsnew")}>
  //                   + Create Form
  //                 </Button>
  //               </BlockStack>
  //             </Card>

  //             {/* Enable App Embed */}
  //             <Card>
  //               <BlockStack gap="300">
  //                 <Text as="h3" variant="headingMd">Enable on storefront</Text>
  //                 <Text as="p" tone="subdued">
  //                   Toggle the SmartFormly embed in your theme editor to show forms
  //                   on your store.
  //                 </Text>
  //                 <Button
  //                   variant="primary"
  //                   tone="success"
  //                   onClick={() => window.open(appEmbedUrl, "_blank")}
  //                 >
  //                   Open Theme Editor →
  //                 </Button>
  //               </BlockStack>
  //             </Card>

  //             {/* Learn more */}
  //             <Card>
  //               <BlockStack gap="300">
  //                 <Text as="h3" variant="headingMd">Learn more</Text>
  //                 <Text as="p" tone="subdued">
  //                   Guides, tips and answers to help you get the most from SmartFormly.
  //                 </Text>
  //                 <Button onClick={() => navigate("/app/helpandsupport")}>
  //                   Visit knowledge base
  //                 </Button>
  //               </BlockStack>
  //             </Card>

  //           </InlineGrid>
  //         </Layout.Section>

  //         {/* ── Forms Table ── */}
  //         <Layout.Section>
  //           <Card>
  //             <BlockStack gap="400">
  //               <InlineStack align="space-between">
  //                 <Text as="h2" variant="headingMd">Your Forms</Text>
  //                 <Button variant="primary" onClick={() => navigate("/app/formsnew")}>
  //                   + Create Form
  //                 </Button>
  //               </InlineStack>

  //               {forms.length === 0 ? (
  //                 <EmptyState
  //                   heading="No forms yet"
  //                   action={{
  //                     content: "Create your first form",
  //                     onAction: () => navigate("/app/formsnew"),
  //                   }}
  //                   image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  //                 >
  //                   <p>Create a form to start collecting submissions from your store.</p>
  //                 </EmptyState>
  //               ) : (
  //                 <>
  //                   <DataTable
  //                     columnContentTypes={["text", "numeric", "text", "numeric", "text", "text"]}
  //                     headings={[
  //                       "Form name",
  //                       formIdHeading,
  //                       "Status",
  //                       "Submissions",
  //                       "Created",
  //                       "Actions",
  //                     ]}
  //                     rows={forms.map((f) => [

  //                       // ── Form name ──
  //                       <button
  //                         key={`name-${f.id}`}
  //                         onClick={() => navigate(`/app/forms/${f.id}`)}
  //                         style={{
  //                           background: "none", border: "none", padding: 0,
  //                           cursor: "pointer", color: "#2C6ECB",
  //                           fontWeight: 500, fontSize: 13, textAlign: "left",
  //                         }}
  //                       >
  //                         {f.formName}
  //                       </button>,

  //                       // ── Form ID — click to copy ──
  //                       <div
  //                         key={`id-${f.id}`}
  //                         onClick={() => handleCopyId(f.id)}
  //                         title={`Click to copy: ${f.id}`}
  //                         style={{
  //                           cursor: "pointer",
  //                           display: "inline-flex",
  //                           alignItems: "center",
  //                           gap: 4,
  //                           padding: "2px 6px",
  //                           borderRadius: 4,
  //                           transition: "background .15s",
  //                         }}
  //                         onMouseEnter={e => {
  //                           e.currentTarget.style.background = "#F3F4F6";
  //                         }}
  //                         onMouseLeave={e => {
  //                           e.currentTarget.style.background = "transparent";
  //                         }}
  //                       >
  //                         <Text as="span" variant="bodySm" tone="subdued">
  //                           {f.id.slice(0, 20)}…
  //                         </Text>
  //                         <span style={{ fontSize: 11, color: "#9CA3AF" }}>📋</span>
  //                       </div>,

  //                       // ── Status ──
  //                       <Badge key={`status-${f.id}`} tone={f.isActive ? "success" : "info"}>
  //                         {f.isActive ? "Active" : "Draft"}
  //                       </Badge>,

  //                       // ── Submissions ──
  //                       f.submissionsCount,

  //                       // ── Created ──
  //                       new Date(f.createdAt).toISOString().slice(0, 10),

  //                       // ── Actions ──
  //                       <InlineStack gap="200" key={`actions-${f.id}`}>
  //                         <Button size="slim" onClick={() => navigate(`/app/forms/${f.id}`)}>
  //                           Edit
  //                         </Button>
  //                         <Button size="slim" onClick={() => navigate(`/app/forms/${f.id}/submissions`)}>
  //                           Submissions
  //                         </Button>
  //                         <Button size="slim" tone="critical" onClick={() => handleDelete(f.id)}>
  //                           Delete
  //                         </Button>
  //                       </InlineStack>,

  //                     ])}
  //                   />
  //                   <div style={{
  //                     borderTop: "1px solid #E5E7EB",
  //                     padding: "10px 16px",
  //                     display: "flex",
  //                     justifyContent: "flex-end",
  //                   }}>
  //                     <Text as="p" variant="bodySm" tone="subdued">
  //                       💡 Click any Form ID to copy it
  //                     </Text>
  //                   </div>
  //                 </>
  //               )}
  //             </BlockStack>
  //           </Card>
  //         </Layout.Section>

  //       </Layout>
  //     </Page>
  //   );
  // }


  // import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
  // import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
  // import { useAppBridge } from "@shopify/app-bridge-react";
  // import { authenticate } from "../shopify.server";
  // import { deleteFormById, getForms, getFormStats } from "../models/form.server";
  // import { getSubmissionTrend } from "../models/submission.server";
  // import {
  //   Page, Layout, Card, Text, BlockStack,
  //   Button, Badge, DataTable, EmptyState,
  //   InlineStack, InlineGrid, Banner,
  // } from "@shopify/polaris";

  // // ── Extension config ──────────────────────────────────────────────────────────
  // const EXTENSION_UUID   = "b6e78f32-b464-3f93-fdf4-9265df8aeaaa73b1a718";
  // const EXTENSION_HANDLE = "smart-formly-block";

  // // ── Helpers ───────────────────────────────────────────────────────────────────

  // // ✅ Auto-detects URL — uses request host during dev (tunnel changes every session)
  // // Uses SHOPIFY_APP_URL env var in production
  // function resolveAppUrl(request: Request): string {
  //   if (process.env.NODE_ENV === "production") {
  //     return process.env.SHOPIFY_APP_URL ?? "";
  //   }
  //   const { protocol, host } = new URL(request.url);
  //   return `${protocol}//${host}`;
  // }

  // // ── Loader ────────────────────────────────────────────────────────────────────
  // export const loader = async ({ request }: LoaderFunctionArgs) => {
  //   const { session, admin } = await authenticate.admin(request);

  //   // ── Update app_url metafield with current URL (auto-detects tunnel) ───────
  //   const appUrl = resolveAppUrl(request);
  //   if (appUrl) {
  //     try {
  //       const shopRes  = await admin.graphql(`{ shop { id } }`);
  //       const shopData = await shopRes.json();
  //       const shopId   = shopData.data.shop.id;

  //       await admin.graphql(
  //         `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
  //           metafieldsSet(metafields: $metafields) {
  //             metafields { key namespace value }
  //             userErrors  { field message }
  //           }
  //         }`,
  //         {
  //           variables: {
  //             metafields: [{
  //               namespace: "smartformly",
  //               key:       "app_url",
  //               value:     appUrl,
  //               type:      "single_line_text_field",
  //               ownerId:   shopId,
  //             }],
  //           },
  //         }
  //       );
  //       console.log(`[metafield] smartformly.app_url → ${appUrl}`);
  //     } catch (err) {
  //       console.error("[metafield] Failed to set app_url:", err);
  //     }
  //   }

  //   const [forms, stats, trend] = await Promise.all([
  //     getForms(session.shop),
  //     getFormStats(session.shop),
  //     getSubmissionTrend(session.shop, 7).catch(() => []),
  //   ]);

  //   return json({ forms, stats, trend, shop: session.shop });
  // };

  // // ── Action ────────────────────────────────────────────────────────────────────
  // export const action = async ({ request }: ActionFunctionArgs) => {
  //   console.log("🔥 ACTION TRIGGERED");
  //   const { session } = await authenticate.admin(request);
  //   const body        = await request.formData();
  //   const intent      = body.get("intent");

  //   if (intent === "delete") {
  //     const formId = body.get("formId") as string;
  //     await deleteFormById(formId, session.shop);
  //     return json({ success: true });
  //   }

  //   return json({});
  // };

  // // ── Component ─────────────────────────────────────────────────────────────────
  // export default function Dashboard() {
  //   const { forms, stats, shop } = useLoaderData<typeof loader>();
  //   const navigate = useNavigate();
  //   const submit   = useSubmit();
  //   const shopify  = useAppBridge();

  //   // ── App Embed deep link ───────────────────────────────────────────────────
  //     const appEmbedUrl =
  //   `https://${shop}/admin/themes/current/editor?context=apps`;

  //   // ── Copy form ID to clipboard ─────────────────────────────────────────────
  //   const handleCopyId = (formId: string) => {
  //     navigator.clipboard.writeText(formId).then(() => {
  //       shopify.toast.show("Form ID copied to clipboard!");
  //     }).catch(() => {
  //       shopify.toast.show("Failed to copy ID", { isError: true });
  //     });
  //   };

  //   // ── Delete handler ────────────────────────────────────────────────────────
  //   const handleDelete = (formId: string) => {
  //     if (!confirm("Are you sure you want to delete this form?")) return;
  //     const fd = new FormData();
  //     fd.append("intent", "delete");
  //     fd.append("formId", formId);
  //     submit(fd, { method: "post" });
  //   };

  //   // ── Centered Form ID heading ──────────────────────────────────────────────
  //   const formIdHeading = (
  //     <div style={{ textAlign: "center", width: "100%" }}>Form Id</div>
  //   );

  //   // ── Render ────────────────────────────────────────────────────────────────
  //   return (
  //     <Page title="Hi there! 👋 Ready to create?">
  //       <Layout>

  //         {/* ── App Embed Banner ── */}
  //         <Layout.Section>
  //           <Banner
  //             title="Enable SmartFormly on your storefront"
  //             tone="info"
  //             action={{
  //               content: "Enable App Embed →",
  //               onAction: () => window.open(appEmbedUrl, "_blank"),
  //             }}
  //           >
  //             <Text as="p" tone="subdued">
  //               Activate the SmartFormly app embed in your theme editor to start
  //               showing forms on your storefront. Click the button to open the
  //               theme editor — then toggle SmartFormly on and save.
  //             </Text>
  //           </Banner>
  //         </Layout.Section>

  //         {/* ── Stats ── */}
  //         <Layout.Section>
  //           <InlineGrid columns={3} gap="400">
  //             {[
  //               { label: "Forms created",    value: stats.totalForms      },
  //               { label: "Form submissions", value: stats.totalSubmissions },
  //               { label: "Active forms",     value: stats.activeForms      },
  //             ].map((s) => (
  //               <Card key={s.label}>
  //                 <BlockStack gap="200">
  //                   <Text as="p" variant="bodySm" tone="subdued">{s.label}</Text>
  //                   <Text as="p" variant="heading2xl" fontWeight="bold">{s.value}</Text>
  //                 </BlockStack>
  //               </Card>
  //             ))}
  //           </InlineGrid>
  //         </Layout.Section>

  //         {/* ── Quick Actions ── */}
  //         <Layout.Section>
  //           <InlineGrid columns={3} gap="400">

  //             <Card>
  //               <BlockStack gap="300">
  //                 <Text as="h3" variant="headingMd">Create a form</Text>
  //                 <Text as="p" tone="subdued">
  //                   Build and customize forms to collect the information you need.
  //                 </Text>
  //                 <Button variant="primary" onClick={() => navigate("/app/formsnew")}>
  //                   + Create Form
  //                 </Button>
  //               </BlockStack>
  //             </Card>

  //             <Card>
  //               <BlockStack gap="300">
  //                 <Text as="h3" variant="headingMd">Enable on storefront</Text>
  //                 <Text as="p" tone="subdued">
  //                   Toggle the SmartFormly embed in your theme editor to show
  //                   forms on your store.
  //                 </Text>
  //                 <Button
  //                   variant="primary"
  //                   tone="success"
  //                   onClick={() => window.open(appEmbedUrl, "_blank")}
  //                 >
  //                   Open Theme Editor →
  //                 </Button>
  //               </BlockStack>
  //             </Card>

  //             <Card>
  //               <BlockStack gap="300">
  //                 <Text as="h3" variant="headingMd">Learn more</Text>
  //                 <Text as="p" tone="subdued">
  //                   Guides, tips and answers to help you get the most from SmartFormly.
  //                 </Text>
  //                 <Button onClick={() => navigate("/app/helpandsupport")}>
  //                   Visit knowledge base
  //                 </Button>
  //               </BlockStack>
  //             </Card>

  //           </InlineGrid>
  //         </Layout.Section>

  //         {/* ── Forms Table ── */}
  //         <Layout.Section>
  //           <Card>
  //             <BlockStack gap="400">
  //               <InlineStack align="space-between">
  //                 <Text as="h2" variant="headingMd">Your Forms</Text>
  //                 <Button variant="primary" onClick={() => navigate("/app/formsnew")}>
  //                   + Create Form
  //                 </Button>
  //               </InlineStack>

  //               {forms.length === 0 ? (
  //                 <EmptyState
  //                   heading="No forms yet"
  //                   action={{
  //                     content: "Create your first form",
  //                     onAction: () => navigate("/app/formsnew"),
  //                   }}
  //                   image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  //                 >
  //                   <p>Create a form to start collecting submissions from your store.</p>
  //                 </EmptyState>
  //               ) : (
  //                 <>
  //                   <DataTable
  //                     columnContentTypes={["text", "numeric", "text", "numeric", "text", "text"]}
  //                     headings={[
  //                       "Form name",
  //                       formIdHeading,
  //                       "Status",
  //                       "Submissions",
  //                       "Created",
  //                       "Actions",
  //                     ]}
  //                     rows={forms.map((f) => [

  //                       <button
  //                         key={`name-${f.id}`}
  //                         onClick={() => navigate(`/app/forms/${f.id}`)}
  //                         style={{
  //                           background: "none", border: "none", padding: 0,
  //                           cursor: "pointer", color: "#2C6ECB",
  //                           fontWeight: 500, fontSize: 13, textAlign: "left",
  //                         }}
  //                       >
  //                         {f.formName}
  //                       </button>,

  //                       <div
  //                         key={`id-${f.id}`}
  //                         onClick={() => handleCopyId(f.id)}
  //                         title={`Click to copy: ${f.id}`}
  //                         style={{
  //                           cursor: "pointer", display: "inline-flex",
  //                           alignItems: "center", gap: 4,
  //                           padding: "2px 6px", borderRadius: 4,
  //                           transition: "background .15s",
  //                         }}
  //                         onMouseEnter={e => { e.currentTarget.style.background = "#F3F4F6"; }}
  //                         onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
  //                       >
  //                         <Text as="span" variant="bodySm" tone="subdued">
  //                           {f.id.slice(0, 20)}…
  //                         </Text>
  //                         <span style={{ fontSize: 11, color: "#9CA3AF" }}>📋</span>
  //                       </div>,

  //                       <Badge key={`status-${f.id}`} tone={f.isActive ? "success" : "info"}>
  //                         {f.isActive ? "Active" : "Draft"}
  //                       </Badge>,

  //                       f.submissionsCount,

  //                       new Date(f.createdAt).toISOString().slice(0, 10),

  //                       <InlineStack gap="200" key={`actions-${f.id}`}>
  //                         <Button size="slim" onClick={() => navigate(`/app/forms/${f.id}`)}>
  //                           Edit
  //                         </Button>
  //                         <Button size="slim" onClick={() => navigate(`/app/forms/${f.id}/submissions`)}>
  //                           Submissions
  //                         </Button>
  //                         <Button size="slim" tone="critical" onClick={() => handleDelete(f.id)}>
  //                           Delete
  //                         </Button>
  //                       </InlineStack>,

  //                     ])}
  //                   />
  //                   <div style={{
  //                     borderTop: "1px solid #E5E7EB", padding: "10px 16px",
  //                     display: "flex", justifyContent: "flex-end",
  //                   }}>
  //                     <Text as="p" variant="bodySm" tone="subdued">
  //                       💡 Click any Form ID to copy it
  //                     </Text>
  //                   </div>
  //                 </>
  //               )}
  //             </BlockStack>
  //           </Card>
  //         </Layout.Section>

  //       </Layout>
  //     </Page>
  //   );
  // }


  import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { deleteFormById, getForms, getFormStats } from "../models/form.server";
import { getSubmissionTrend } from "../models/submission.server";
import {
  Page, Layout, Card, Text, BlockStack,
  Button, Badge, DataTable, EmptyState,
  InlineStack, InlineGrid, Banner,
} from "@shopify/polaris";

// ── Extension config ──────────────────────────────────────────────────────────
const EXTENSION_UUID   = "b6e78f32-b464-3f93-fdf4-9265df8aeaaa73b1a718";
const EXTENSION_HANDLE = "smart-formly-block";

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

  // ── App Embed deep link ───────────────────────────────────────────────────
  const appEmbedUrl = `https://${shop}/admin/themes/current/editor?context=apps`;

  // ── Copy form ID to clipboard ─────────────────────────────────────────────
  const handleCopyId = (formId: string) => {
    navigator.clipboard.writeText(formId).then(() => {
      shopify.toast.show("Form ID copied to clipboard!");
    }).catch(() => {
      shopify.toast.show("Failed to copy ID", { isError: true });
    });
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = (formId: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return;
    const fd = new FormData();
    fd.append("intent", "delete");
    fd.append("formId", formId);
    submit(fd, { method: "post" });
  };

  // ── Centered Form ID heading ──────────────────────────────────────────────
  const formIdHeading = (
    <div style={{ textAlign: "center", width: "100%" }}>Form Id</div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Page title="Hi there! 👋 Ready to create?">
      <Layout>

        {/* ── App Embed Banner ── */}
        <Layout.Section>
          <Banner
            title="Enable SmartFormly on your storefront"
            tone="info"
            action={{
              content: "Enable App Embed →",
              onAction: () => window.open(appEmbedUrl, "_blank"),
            }}
          >
            <Text as="p" tone="subdued">
              Activate the SmartFormly app embed in your theme editor to start
              showing forms on your storefront. Click the button to open the
              theme editor — then toggle SmartFormly on and save.
            </Text>
          </Banner>
        </Layout.Section>

        {/* ── Stats ── */}
        <Layout.Section>
          <InlineGrid columns={3} gap="400">
            {[
              { label: "Forms created",    value: stats.totalForms       },
              { label: "Form submissions", value: stats.totalSubmissions  },
              { label: "Active forms",     value: stats.activeForms       },
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

        {/* ── Quick Actions ── */}
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
                <Text as="h3" variant="headingMd">Enable on storefront</Text>
                <Text as="p" tone="subdued">
                  Toggle the SmartFormly embed in your theme editor to show
                  forms on your store.
                </Text>
                <Button
                  variant="primary"
                  tone="success"
                  onClick={() => window.open(appEmbedUrl, "_blank")}
                >
                  Open Theme Editor →
                </Button>
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

        {/* ── Forms Table ── */}
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
                <>
                  <DataTable
                    columnContentTypes={["text", "numeric", "text", "numeric", "text", "text"]}
                    headings={[
                      "Form name",
                      formIdHeading,
                      "Status",
                      "Submissions",
                      "Created",
                      "Actions",
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
                        title={`Click to copy: ${f.id}`}
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
                        {f.isActive ? "Active" : "Draft"}
                      </Badge>,

                      // ── Submissions ──
                      f.submissionsCount,

                      // ── Created ──
                      new Date(f.createdAt).toISOString().slice(0, 10),

                      // ── Actions ──
                      <InlineStack gap="200" key={`actions-${f.id}`}>
                        <Button size="slim" onClick={() => navigate(`/app/forms/${f.id}`)}>
                          Edit
                        </Button>
                        <Button size="slim" onClick={() => navigate(`/app/forms/${f.id}/submissions`)}>
                          Submissions
                        </Button>
                        <Button size="slim" tone="critical" onClick={() => handleDelete(f.id)}>
                          Delete
                        </Button>
                      </InlineStack>,

                    ])}
                  />
                  <div style={{
                    borderTop: "1px solid #E5E7EB", padding: "10px 16px",
                    display: "flex", justifyContent: "flex-end",
                  }}>
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