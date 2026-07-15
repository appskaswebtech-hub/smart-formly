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
import { useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";

export const handle = { i18n: ["help", "common"] };

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

// Only the shape lives here — every question/answer comes from the `help`
// namespace under `faq.<sectionId>.items.<itemId>`, resolved at render time.
const FAQ_STRUCTURE: {
  id: string;
  icon: string;
  hasBadge?: boolean;
  items: { id: string; isEmbed?: boolean }[];
}[] = [
  {
    id: "setup",
    icon: "🔌",
    hasBadge: true,
    items: [{ id: "setup-1", isEmbed: true }, { id: "setup-2" }, { id: "setup-3" }, { id: "setup-4" }],
  },
  {
    id: "getting-started",
    icon: "🚀",
    items: [{ id: "gs-1" }, { id: "gs-2" }, { id: "gs-3" }, { id: "gs-4" }],
  },
  {
    id: "forms",
    icon: "📋",
    items: [{ id: "f-1" }, { id: "f-2" }, { id: "f-3" }, { id: "f-4" }],
  },
  {
    id: "troubleshooting",
    icon: "🔧",
    items: [{ id: "ts-1" }, { id: "ts-2" }, { id: "ts-3" }, { id: "ts-4" }],
  },
];


// ── Component ─────────────────────────────────────────────────────────────────
export default function HelpAndSupport() {
  const { shop } = useLoaderData<typeof loader>();
  const { t } = useTranslation(["help", "common"]);

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

  // Resolve the FAQ copy for the active language. Built before filtering so the
  // search matches what the merchant actually reads, not the English source.
  const faqSections: FAQSection[] = useMemo(
    () =>
      FAQ_STRUCTURE.map((section) => ({
        id: section.id,
        icon: section.icon,
        title: t(`faq.${section.id}.title`),
        badge: section.hasBadge ? t(`faq.${section.id}.badge`) : undefined,
        items: section.items.map((item) => ({
          id: item.id,
          isEmbed: item.isEmbed,
          question: t(`faq.${section.id}.items.${item.id}.question`),
          answer: t(`faq.${section.id}.items.${item.id}.answer`, {
            returnObjects: true,
          }) as unknown as string[],
        })),
      })),
    [t],
  );

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return faqSections;
    const q = searchQuery.toLowerCase();
    return faqSections.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.some((line) => line.toLowerCase().includes(q))
      ),
    })).filter((section) => section.items.length > 0);
  }, [faqSections, searchQuery]);

  const totalResults = filteredSections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <Page backAction={{ content: t("backHome"), url: "/app" }} title={t("title")}>
      <BlockStack gap="400">

        {/* ── Banners ── */}
        {showChatBanner && (
          <Banner tone="success" onDismiss={() => setShowChatBanner(false)}>
            <p>{t("banners.chat")}</p>
          </Banner>
        )}
        {showEmailBanner && (
          <Banner tone="success" onDismiss={() => setShowEmailBanner(false)}>
            <p>{t("banners.email")}</p>
          </Banner>
        )}

        {/* ── Quick Setup Banner ── */}
        <Banner
          title={t("setupBanner.title")}
          tone="info"
          action={{
            content: t("setupBanner.action"),
            onAction: () => window.open(appEmbedUrl, "_blank"),
          }}
        >
          <Text as="p" tone="subdued">
            {t("setupBanner.body")}
          </Text>
        </Banner>

        {/* ── Search ── */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">{t("search.heading")}</Text>
            <TextField
              label=""
              labelHidden
              placeholder={t("search.placeholder")}
              value={searchQuery}
              onChange={setSearchQuery}
              autoComplete="off"
              prefix={<Icon source={SearchIcon} />}
              clearButton
              onClearButtonClick={() => setSearchQuery("")}
            />
            {searchQuery && (
              <Text as="p" variant="bodySm" tone="subdued">
                {t("search.results", { count: totalResults })}
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
                    {t("articles", { count: section.items.length })}
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
                                  {t("openEmbedPanel")}
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
                {t("noResults.heading", { query: searchQuery })}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                {t("noResults.body")}
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
                  <Text as="h3" variant="headingSm">{t("links.docs")}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">{t("links.docsSub")}</Text>
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
                  <Text as="h3" variant="headingSm">{t("links.feature")}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">{t("links.featureSub")}</Text>
                </BlockStack>
              </InlineStack>
              <Icon source={ExternalIcon} tone="subdued" />
            </div>
          </Card>
        </InlineGrid>

        {/* ── Contact Support ── */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">{t("contact.heading")}</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {t("contact.body")}
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
                  <Text as="h3" variant="headingSm" alignment="center">{t("contact.chat")}</Text>
                  <Text as="p" variant="bodySm" tone="subdued" alignment="center">{t("contact.chatSub")}</Text>
                  <Badge tone="success">{t("contact.chatBadge")}</Badge>
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
                  <Text as="h3" variant="headingSm" alignment="center">{t("contact.email")}</Text>
                  <Text as="p" variant="bodySm" tone="subdued" alignment="center">{t("contact.emailSub")}</Text>
                  <Badge tone="info">{t("contact.emailBadge")}</Badge>
                </BlockStack>
              </div>

            </InlineGrid>
          </BlockStack>
        </Card>

      </BlockStack>
    </Page>
  );
}