import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page, Card, Text, BlockStack, InlineStack, Box, Icon, InlineGrid,
  Collapsible, Banner, TextField, Divider, Badge, Button,
} from "@shopify/polaris";
import {
  ChatIcon, EmailIcon, ExternalIcon, ChevronRightIcon,
  ChevronDownIcon, NoteIcon, FlagIcon, SearchIcon,
} from "@shopify/polaris-icons";
import { useState, useCallback, useMemo } from "react";
import { authenticate } from "../shopify.server";

// ── Extension config ──────────────────────────────────────────────────────────
const EXTENSION_UUID   = "b6e78f32-b464-3f93-fdf4-9265df8aeaaa73b1a718";
const EXTENSION_HANDLE = "smartformly-embed";

// ── Loader ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return json({ shop: session.shop });
};

interface FAQItem {
  id: string;
  question: string;
  answer: string[];
  isEmbed?: boolean;
}

interface FAQSection {
  id: string;
  title: string;
  icon: string;
  badge?: string;
  items: FAQItem[];
}

const FAQ_SECTIONS: FAQSection[] = [
  {
    id: "setup",
    title: "Setting Up SmartFormly on Your Store",
    icon: "🔌",
    badge: "Start Here",
    items: [
      {
        id: "setup-1",
        question: "How do I enable SmartFormly on my storefront? (App Embed)",
        isEmbed: true,
        answer: [
          "Go to Online Store → Themes → Customize in your Shopify admin.",
          "Click the puzzle piece icon (App Embeds) in the left sidebar.",
          "Find SmartFormly in the list and toggle it ON.",
          "Click Save in the top right corner.",
          "SmartFormly is now active on your storefront!",
        ],
      },
      {
        id: "setup-2",
        question: "How do I add a form to a specific page?",
        answer: [
          "Once the App Embed is enabled, add forms to any page:",
          "1. Go to Online Store → Themes → Customize.",
          "2. Navigate to the page where you want to show the form.",
          "3. Click 'Add section' or 'Add block' in the left sidebar.",
          "4. Search for 'SmartFormly' and select the form block.",
          "5. In the block settings panel, select your form from the dropdown.",
          "6. Click Save.",
        ],
      },
      {
        id: "setup-3",
        question: "Why isn't my form showing on the storefront?",
        answer: [
          "Check these common causes in order:",
          "1. App Embed — Make sure the SmartFormly App Embed toggle is ON in the theme editor.",
          "2. Form status — Confirm the form is set to 'Active' in the SmartFormly dashboard.",
          "3. Form block — Verify the SmartFormly block is added to the correct page with the right form selected.",
          "4. Browser cache — Try viewing your store in an incognito/private browser window.",
        ],
      },
      {
        id: "setup-4",
        question: "Do I need to edit my theme code?",
        answer: [
          "No code editing needed. SmartFormly uses Shopify's App Blocks system which works with all Online Store 2.0 themes.",
          "Simply enable the App Embed in the theme editor and add the form block to any page.",
          "If you're using a vintage theme (pre-OS 2.0), please contact our support team.",
        ],
      },
    ],
  },
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "🚀",
    items: [
      {
        id: "gs-1",
        question: "How do I create my first form?",
        answer: [
          "Creating your first form is simple:",
          "1. Click 'Create Form' on the Dashboard or go to Forms → New Form.",
          "2. Give your form a name.",
          "3. Add fields using the field palette (text, email, phone, dropdown, etc.).",
          "4. Customize the design — colors, border, button style.",
          "5. Set the form to Active.",
          "6. Click Save — your form is now ready to embed in your store.",
        ],
      },
      {
        id: "gs-2",
        question: "How do I find my Form ID?",
        answer: [
          "Your Form ID is shown in the Forms list on the Dashboard.",
          "Click the Form ID column to copy it to your clipboard automatically.",
          "You can also find it in the form settings page — it appears below the form name.",
        ],
      },
      {
        id: "gs-3",
        question: "Where do I see form submissions?",
        answer: [
          "Go to the Forms page and click 'Submissions' on any form.",
          "You can view each submission in detail, see a data preview, and delete individual or all submissions.",
          "If you've set up email notifications in Settings, you'll also receive an email for each new submission.",
        ],
      },
      {
        id: "gs-4",
        question: "Can I have multiple forms on my store?",
        answer: [
          "Yes — you can create as many forms as you need.",
          "Each form has a unique ID and can be placed independently on different pages.",
          "Simply add multiple SmartFormly blocks in the theme editor and assign a different form to each one.",
        ],
      },
    ],
  },
  {
    id: "forms",
    title: "Forms & Fields",
    icon: "📋",
    items: [
      {
        id: "f-1",
        question: "What field types are available?",
        answer: [
          "SmartFormly supports the following field types:",
          "Text — single line text input",
          "Email — email address with validation",
          "Phone — phone number input",
          "Textarea — multi-line text",
          "Dropdown / Select — choose from a list of options",
          "Checkbox — single or multiple checkbox options",
          "Number — numeric input",
          "Date — date picker",
          "File upload — allow customers to attach files",
        ],
      },
      {
        id: "f-2",
        question: "How do I make a field required?",
        answer: [
          "Click on the field in the form builder to open its settings.",
          "Toggle the 'Required' switch to ON.",
          "Required fields show a red asterisk (*) and block submission if left empty.",
        ],
      },
      {
        id: "f-3",
        question: "Can I reorder form fields?",
        answer: [
          "Yes — drag and drop fields in the form builder to reorder them.",
          "Use the drag handle (⠿) on the left side of each field.",
          "Click Save after reordering.",
        ],
      },
      {
        id: "f-4",
        question: "How do I set a custom success message?",
        answer: [
          "In the form settings, find the 'Success Message' field.",
          "Enter the message you want customers to see after submitting.",
          "Default: 'Thank you! Your form has been submitted.'",
        ],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: "🔧",
    items: [
      {
        id: "ts-1",
        question: "The form shows 'Unable to load form. Please check the Form ID.'",
        answer: [
          "This means the form block can't reach the SmartFormly API. Check:",
          "1. Form ID — Make sure the correct Form ID is in the theme block settings.",
          "2. Form is Active — Confirm the form status is Active in your dashboard.",
          "3. App Embed enabled — The SmartFormly App Embed must be toggled ON.",
        ],
      },
      {
        id: "ts-2",
        question: "The form loads but submission fails.",
        answer: [
          "Check these:",
          "1. Required fields — Make sure all required fields are filled correctly.",
          "2. Email validation — Email fields only accept valid email addresses.",
          "3. Open browser DevTools (F12) → Network tab and look for a failed POST to /api/submit/.",
          "4. Contact support with the error details.",
        ],
      },
      {
        id: "ts-3",
        question: "I'm not receiving email notifications for submissions.",
        answer: [
          "1. Go to Settings → Email Notifications and confirm your notification email is correct.",
          "2. Check your spam/junk folder.",
          "3. Verify SMTP or Gmail credentials in Settings are correct.",
          "4. Try submitting a test form and check for email errors.",
        ],
      },
      {
        id: "ts-4",
        question: "The app is loading slowly or showing errors.",
        answer: [
          "1. Refresh the page (Ctrl+R or Cmd+R).",
          "2. Clear your browser cache.",
          "3. Try a different browser.",
          "4. If the error persists, take a screenshot and contact our support team.",
        ],
      },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function HelpAndSupport() {
  const { shop } = useLoaderData<typeof loader>();

  const appEmbedUrl =
    `https://${shop}/admin/themes/current/editor` +
    `?context=apps` +
    `&activateAppId=${EXTENSION_UUID}/${EXTENSION_HANDLE}`;

  const [expandedItems,    setExpandedItems]    = useState<Set<string>>(new Set(["setup-1"]));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["setup"]));
  const [searchQuery,      setSearchQuery]      = useState("");
  const [showChatBanner,   setShowChatBanner]   = useState(false);
  const [showEmailBanner,  setShowEmailBanner]  = useState(false);

  const toggleItem = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSection = useCallback((id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_SECTIONS;
    const q = searchQuery.toLowerCase();
    return FAQ_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.some((line) => line.toLowerCase().includes(q))
      ),
    })).filter((section) => section.items.length > 0);
  }, [searchQuery]);

  const totalResults = filteredSections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <Page backAction={{ content: "Home", url: "/app" }} title="Help & Support">
      <BlockStack gap="400">

        {/* ── Banners ── */}
        {showChatBanner && (
          <Banner tone="success" onDismiss={() => setShowChatBanner(false)}>
            <p>Email compose opened! Send us your question and we'll get back to you shortly.</p>
          </Banner>
        )}
        {showEmailBanner && (
          <Banner tone="success" onDismiss={() => setShowEmailBanner(false)}>
            <p>Email compose opened! We'll get back to you within a few hours.</p>
          </Banner>
        )}

        {/* ── Quick Setup Banner ── */}
        <Banner
          title="Enable SmartFormly on your storefront"
          tone="info"
          action={{
            content: "Open App Embeds Panel →",
            onAction: () => window.open(appEmbedUrl, "_blank"),
          }}
        >
          <Text as="p" tone="subdued">
            Open the theme editor and toggle SmartFormly ON in the App Embeds panel
            to start showing forms on your store.
          </Text>
        </Banner>

        {/* ── Search ── */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">How can we help you?</Text>
            <TextField
              label=""
              labelHidden
              placeholder="Search for answers... e.g. 'how to create form' or 'app embed'"
              value={searchQuery}
              onChange={setSearchQuery}
              autoComplete="off"
              prefix={<Icon source={SearchIcon} />}
              clearButton
              onClearButtonClick={() => setSearchQuery("")}
            />
            {searchQuery && (
              <Text as="p" variant="bodySm" tone="subdued">
                {totalResults} result{totalResults !== 1 ? "s" : ""} found
              </Text>
            )}
          </BlockStack>
        </Card>

        {/* ── FAQ Sections ── */}
        {filteredSections.map((section) => (
          <Card key={section.id} padding="0">

            {/* Section Header */}
            <div
              onClick={() => toggleSection(section.id)}
              style={{
                padding: "16px 20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={(e)  => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                <span style={{ fontSize: "20px" }}>{section.icon}</span>
                <div>
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h2" variant="headingSm">{section.title}</Text>
                    {section.badge && <Badge tone="info">{section.badge}</Badge>}
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {section.items.length} article{section.items.length !== 1 ? "s" : ""}
                  </Text>
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <Icon
                  source={expandedSections.has(section.id) ? ChevronDownIcon : ChevronRightIcon}
                  tone="subdued"
                />
              </div>
            </div>

            {/* Section Items */}
            <Collapsible
              open={expandedSections.has(section.id) || !!searchQuery}
              id={`section-${section.id}`}
              transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
            >
              {section.items.map((item) => (
                <div key={item.id}>

                  {/* Question */}
                  <div
                    onClick={() => toggleItem(item.id)}
                    style={{
                      padding: "14px 20px 14px 56px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid #f0f0f0",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e)  => (e.currentTarget.style.background = "transparent")}
                  >
                    <Text as="span" variant="bodyMd" fontWeight={expandedItems.has(item.id) ? "bold" : "regular"}>
                      {item.question}
                    </Text>
                    <div style={{ flexShrink: 0, marginLeft: "12px" }}>
                      <Icon
                        source={expandedItems.has(item.id) ? ChevronDownIcon : ChevronRightIcon}
                        tone="subdued"
                      />
                    </div>
                  </div>

                  {/* Answer */}
                  <Collapsible
                    open={expandedItems.has(item.id)}
                    id={`item-${item.id}`}
                    transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
                  >
                    <div style={{ padding: "0 20px 16px 56px" }}>
                      <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                        <BlockStack gap="300">

                          {/* ── App Embed steps — numbered circles + button ── */}
                          {item.isEmbed ? (
                            <>
                              {item.answer.map((line, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                  <div style={{
                                    minWidth: 24, height: 24, borderRadius: "50%",
                                    background: "#111827", color: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
                                  }}>
                                    {i + 1}
                                  </div>
                                  <Text as="p" variant="bodySm">{line}</Text>
                                </div>
                              ))}
                              <div style={{ marginTop: 4 }}>
                                <Button
                                  variant="primary"
                                  onClick={() => window.open(appEmbedUrl, "_blank")}
                                >
                                  Open App Embeds Panel →
                                </Button>
                              </div>
                            </>
                          ) : (
                            item.answer.map((line, i) => (
                              <Text key={i} as="p" variant="bodySm">{line}</Text>
                            ))
                          )}

                        </BlockStack>
                      </Box>
                    </div>
                  </Collapsible>
                </div>
              ))}
            </Collapsible>
          </Card>
        ))}

        {/* No results */}
        {searchQuery && totalResults === 0 && (
          <Card>
            <BlockStack gap="300" inlineAlign="center">
              <Text as="p" variant="bodyMd" alignment="center">
                No articles found for "{searchQuery}"
              </Text>
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                Try different keywords or contact our support team below
              </Text>
            </BlockStack>
          </Card>
        )}

        <Divider />

        {/* ── Quick Links ── */}
        <InlineGrid columns={2} gap="400">
          <Card padding="0">
            <div
              onClick={() => window.open("https://docs.smartformly.kaswebtechsolutions.com", "_blank")}
              style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={(e)  => (e.currentTarget.style.background = "transparent")}
            >
              <InlineStack gap="300" blockAlign="center">
                <Icon source={NoteIcon} tone="base" />
                <BlockStack gap="0">
                  <Text as="h3" variant="headingSm">Documentation</Text>
                  <Text as="p" variant="bodySm" tone="subdued">Full guides and reference</Text>
                </BlockStack>
              </InlineStack>
              <Icon source={ExternalIcon} tone="subdued" />
            </div>
          </Card>

          <Card padding="0">
            <div
              onClick={() => window.open("mailto:support@smartformly.kaswebtechsolutions.com?subject=Feature%20Request", "_blank")}
              style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={(e)  => (e.currentTarget.style.background = "transparent")}
            >
              <InlineStack gap="300" blockAlign="center">
                <Icon source={FlagIcon} tone="base" />
                <BlockStack gap="0">
                  <Text as="h3" variant="headingSm">Feature Request</Text>
                  <Text as="p" variant="bodySm" tone="subdued">Suggest new features</Text>
                </BlockStack>
              </InlineStack>
              <Icon source={ExternalIcon} tone="subdued" />
            </div>
          </Card>
        </InlineGrid>

        {/* ── Contact Support ── */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Still need help?</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Can't find what you're looking for? Our support team is ready to assist you.
            </Text>
            <InlineGrid columns={2} gap="400">

              <div
                onClick={() => { setShowChatBanner(true); window.open("mailto:support@smartformly.kaswebtechsolutions.com?subject=Live%20Chat%20Request", "_blank"); }}
                style={{ cursor: "pointer", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "20px", textAlign: "center", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.background = "#f0fdf4"; }}
                onMouseLeave={(e)  => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.background = "transparent"; }}
              >
                <BlockStack gap="200" inlineAlign="center">
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                    <Icon source={ChatIcon} tone="base" />
                  </div>
                  <Text as="h3" variant="headingSm" alignment="center">Chat with us</Text>
                  <Text as="p" variant="bodySm" tone="subdued" alignment="center">Talk with our team now.</Text>
                  <Badge tone="success">Typically replies in minutes</Badge>
                </BlockStack>
              </div>

              <div
                onClick={() => { setShowEmailBanner(true); window.open("mailto:support@smartformly.kaswebtechsolutions.com?subject=Support%20Request%20-%20SmartFormly", "_blank"); }}
                style={{ cursor: "pointer", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "20px", textAlign: "center", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#eff6ff"; }}
                onMouseLeave={(e)  => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.background = "transparent"; }}
              >
                <BlockStack gap="200" inlineAlign="center">
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                    <Icon source={EmailIcon} tone="base" />
                  </div>
                  <Text as="h3" variant="headingSm" alignment="center">Email us</Text>
                  <Text as="p" variant="bodySm" tone="subdued" alignment="center">Send us a detailed message.</Text>
                  <Badge tone="info">Replies within a few hours</Badge>
                </BlockStack>
              </div>

            </InlineGrid>
          </BlockStack>
        </Card>

      </BlockStack>
    </Page>
  );
}