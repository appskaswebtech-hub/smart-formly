import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useRouteError, useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page, Layout, Card, BlockStack, InlineStack,
  Text, Box, Icon, Banner,
} from "@shopify/polaris";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";
import { boundary } from "@shopify/shopify-app-remix/server";
import { useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";
import { PLANS } from "../billing/plans";
import { previousTier, tierExclusives, tierIncludes, type Tier } from "../billing/features";
import { useState } from "react";

import Hero from "../components/ui/Hero";
import Glyph, { IconChip, type GlyphName } from "../components/ui/Icon";
import { C, RADIUS, cardStyle, primaryButton, secondaryButton } from "../components/ui/theme";

/** Card icon per plan, matching the tier it represents. */
const PLAN_GLYPH: Record<string, GlyphName> = {
  base: "document",
  pro: "crown",
  proplus: "star",
};

// "forms" carries the pills.* names, which are what the cards and the
// comparison table list — the same strings the builder labels its tiles with.
export const handle = { i18n: ["pricing", "common", "forms"] };

// ─── Loader ───────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Read the installation directly rather than billing.check(): that filters by
  // plan names from our own config, which under Shopify App Pricing live in the
  // Partner Dashboard and would never match. Same query app/routes/app.tsx runs
  // for the paywall — it only keeps the boolean, we need the name.
  const res = await admin.graphql(`#graphql
    query ActivePlan {
      currentAppInstallation {
        activeSubscriptions { id name status }
      }
    }
  `);
  const subscriptions: { id: string; name: string; status: string }[] =
    (await res.json())?.data?.currentAppInstallation?.activeSubscriptions ?? [];

  const active = subscriptions.find((sub) => sub.status === "ACTIVE") ?? null;
  const activePlanName = active?.name ?? null;

  // Matching is exact, so a plan renamed in the Partner Dashboard would simply
  // stop highlighting with nothing on screen to say why. Log it so the mismatch
  // is findable.
  if (activePlanName && !PLANS.some((p) => p.name === activePlanName)) {
    console.warn(
      `[billing] active subscription "${activePlanName}" matches no plan in plans.ts — ` +
        `known: ${PLANS.map((p) => p.name).join(", ")}`,
    );
  }

  return json({ activePlanName });
};

// Only subscribed merchants reach this page: app/routes/app.tsx redirects
// everyone else out to Shopify's hosted plan page before anything renders. So
// this is the "change plan" screen, not the paywall.
//
// Choose Plan posts to the /api/billing resource route, which hands off to that
// same Shopify page — App Pricing forbids charging from inside the app. See
// app/billing/plans.ts for the plan catalog.

// ─── Static data ──────────────────────────────────────────────────────────────

/** plans.ts id → the tier it grants, so a card knows what it unlocks. */
const TIER_BY_PLAN: Record<string, Tier> = {
  free: "free", base: "base", pro: "pro", proplus: "pro_plus",
};

/** Every tile, in builder order — the rows of the comparison table. */
const PILLS_ORDER = tierIncludes("pro_plus");

// Built from the gating config rather than hand-maintained: the old table was a
// fixed list in which every row read [false, true, true], so it claimed Pro and
// Pro+ were identical even though Pro+ gates four features exclusively. Deriving
// it means the table cannot drift from what the app enforces.
const FEATURE_ROWS: { key: string; values: [boolean, boolean, boolean] }[] =
  PILLS_ORDER.map((key) => ({
    key,
    values: [
      tierIncludes("base").includes(key),
      tierIncludes("pro").includes(key),
      tierIncludes("pro_plus").includes(key),
    ] as [boolean, boolean, boolean],
  }));

// Charged in USD (see the `billing` config in shopify.server.ts), but the
// number format follows the merchant's language — German renders "9,99 $".
function formatPrice(n: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  }).format(n);
}

// ─── Billing page button ──────────────────────────────────────────────────────
/**
 * Every billing action leads to the same place: Shopify's hosted plan page.
 * Choosing a plan, switching plan and cancelling are all performed there, so
 * this one button serves all three and only the label differs.
 */
function BillingPageButton({
  label,
  size = "medium",
  fullWidth = false,
  emphasis = false,
}: {
  label: string;
  size?: "slim" | "medium";
  fullWidth?: boolean;
  /** Filled green instead of outlined — used on the popular plan. */
  emphasis?: boolean;
}) {
  const fetcher = useFetcher<{ ok: boolean; messages: string[] }>();
  const loading = fetcher.state !== "idle";
  const { t } = useTranslation(["pricing", "common"]);

  // A refusal from Shopify is a normal outcome — show it rather than letting the
  // action throw and hit the error boundary.
  const failed = fetcher.data && fetcher.data.ok === false;

  return (
    <BlockStack gap="200">
      {failed && (
        <Banner tone="critical" title={t("common:errors.generic")}>
          {/* Shopify's userErrors — diagnostic API strings, not app copy. */}
          {(fetcher.data?.messages ?? []).map((msg) => (
            <Text key={msg} as="p" variant="bodySm">{msg}</Text>
          ))}
        </Banner>
      )}
      {/* Shopify's hosted page is the real selector, so no plan is sent. */}
      <fetcher.Form method="post" action="/api/billing">
        <button
          type="submit"
          disabled={loading}
          style={{
            ...(emphasis ? primaryButton : secondaryButton),
            width: fullWidth ? "100%" : undefined,
            justifyContent: "center",
            padding: size === "slim" ? "7px 14px" : "11px 18px",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {label}
        </button>
      </fetcher.Form>
    </BlockStack>
  );
}

/** The card button for a plan the merchant is already on. */
function CurrentPlanButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      style={{
        ...secondaryButton,
        width: "100%",
        justifyContent: "center",
        padding: "11px 18px",
        gap: 8,
        background: C.wash,
        borderColor: C.mid,
        color: C.deep,
        cursor: "default",
      }}
    >
      <Glyph name="check" size={15} color={C.deep} strokeWidth={2.2} />
      {label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const { activePlanName } = useLoaderData<typeof loader>();
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const { t, i18n } = useTranslation(["pricing", "common"]);

  return (
    <Page title={t("title")}>
      <Layout>

        <Layout.Section>
          <Hero
            art="billing"
            eyebrow={t("hero.eyebrow")}
            title={t("hero.title")}
            titleAccent={t("hero.accent")}
            subtitle={t("hero.sub")}
          />
        </Layout.Section>

        {/* Plan cards.
            Hand-built rather than Polaris Card: the design needs a badge that
            straddles the top border and a green outline on the popular plan,
            neither of which Card exposes. */}
        <Layout.Section>
          <div className="sf-grid-4">
            {PLANS.map((plan) => {
              // Exact name match: the Partner Dashboard owns the real plan names
              // and the loader warns when one drifts out of sync with plans.ts.
              const current = plan.name === activePlanName;
              const popular = plan.id === "pro";
              const planTierId = TIER_BY_PLAN[plan.id] ?? "free";
              const below = previousTier(planTierId);
              // The plan in force outranks the one we would like to sell.
              const highlighted = current || popular;
              return (
                <div
                  key={plan.id}
                  style={{
                    position: "relative",
                    background: C.surface,
                    border: `1px solid ${highlighted ? C.mid : C.line}`,
                    borderRadius: RADIUS.card,
                    padding: "26px 24px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    boxShadow: highlighted
                      ? "0 6px 20px rgba(11,107,69,0.10)"
                      : "0 1px 2px rgba(16,24,40,0.04)",
                  }}
                >
                  {(current || popular) && (
                    <span
                      style={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: C.deep,
                        color: "#fff",
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "4px 14px",
                        borderRadius: RADIUS.pill,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {current ? t("currentPlan") : t("mostPopular")}
                    </span>
                  )}

                  <IconChip name={PLAN_GLYPH[plan.id]} tint={C.soft} size={48} />

                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: C.ink }}>{plan.name}</div>
                    <div style={{ fontSize: 13.5, color: C.muted, marginTop: 2 }}>
                      {t(`planTagline.${plan.id}`)}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>
                      {formatPrice(plan.price, i18n.language)}
                    </span>
                    <span style={{ fontSize: 14, color: C.muted }}>{t("perMonth")}</span>
                  </div>

                  {plan.trialDays && (
                    <div
                      style={{
                        background: C.wash,
                        color: C.body,
                        borderRadius: RADIUS.control,
                        padding: "9px 12px",
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    >
                      {t("trial", { count: plan.trialDays })}
                    </div>
                  )}

                  {/* Every plan includes every feature, so the allowance is the
                      only thing worth saying here. Listing twelve identical
                      ticks on four cards would say nothing at all. */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>
                      {plan.formLimit === null
                        ? t("formsUnlimited")
                        : t("formsIncluded", { count: plan.formLimit })}
                    </div>

                    {planTierId === "free" ? (
                      /* Free genuinely opens every tile, so listing them one by
                         one would just be the whole catalogue. */
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, color: C.body, lineHeight: 1.45 }}>
                        <span style={{ color: C.mid, flexShrink: 0, marginTop: 1 }}>
                          <Glyph name="check" size={16} color={C.mid} strokeWidth={2.2} />
                        </span>
                        {t("allFeatures")}
                      </div>
                    ) : (
                      <>
                        {below && (
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.muted }}>
                            {t("everythingIn", { plan: PLANS.find((p) => TIER_BY_PLAN[p.id] === below)?.name })}
                          </div>
                        )}
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                          {tierExclusives(planTierId).map((key) => (
                            <li key={key} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, color: C.body, lineHeight: 1.45 }}>
                              <span style={{ color: C.mid, flexShrink: 0, marginTop: 1 }}>
                                <Glyph name="check" size={16} color={C.mid} strokeWidth={2.2} />
                              </span>
                              {t(`forms:pills.${key}`)}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  {current ? (
                    <CurrentPlanButton label={t("currentPlan")} />
                  ) : (
                    <BillingPageButton label={t("pricing:choosePlan")} fullWidth emphasis={popular} />
                  )}
                </div>
              );
            })}
          </div>
        </Layout.Section>

        {/* Managing a subscription — switching plan or cancelling — happens on
            Shopify's billing page, not here: App Pricing gives the app no
            supported way to change a charge. Only shown to subscribers. */}
        {activePlanName && (
          <Layout.Section>
            <div
              className="sf-toolbar"
              style={{
                ...cardStyle,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                <IconChip name="gear" tint="#F1F2F4" color={C.muted} size={40} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
                    {t("manageOrCancel")}
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                    {t("manageOrCancelHelp")}
                  </div>
                </div>
              </div>

              <div style={{ flexShrink: 0 }}>
                <BillingPageButton label={t("manageOrCancelCta")} />
              </div>
            </div>
          </Layout.Section>
        )}

        {/* Footer card carrying the comparison toggle. */}
        <Layout.Section>
          <div
            className="sf-toolbar"
            style={{
              ...cardStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "16px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <IconChip name="info" tint="#F1F2F4" color={C.muted} size={40} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
                  {t("needMoreDetails.title")}
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                  {t("needMoreDetails.body")}
                </div>
              </div>
            </div>

            <button
              type="button"
              style={{ ...secondaryButton, flexShrink: 0 }}
              onClick={() => setShowAllFeatures((v) => !v)}
            >
              {showAllFeatures ? t("hideAllFeatures") : t("showAllFeatures")}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </Layout.Section>

        {showAllFeatures && (
          <Layout.Section>
            <Card padding="0">
              <Box
                padding="400"
                background="bg-surface-secondary"
                borderBlockEndWidth="025"
                borderColor="border"
              >
                <div className="sf-compare-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 16, alignItems: "center" }}>
                  <Text as="h3" variant="headingSm">{t("plansAvailable", { count: PLANS.length })}</Text>
                  {PLANS.map((plan) => (
                    <BlockStack key={plan.id} gap="200" inlineAlign="center">
                      <InlineStack gap="100" blockAlign="baseline">
                        <Text as="span" variant="headingSm">{plan.name}</Text>
                        <Text as="span" variant="bodySm" tone="subdued">
                          {formatPrice(plan.price, i18n.language)}{t("perMonth")}
                        </Text>
                      </InlineStack>
                      {plan.name === activePlanName ? (
                        <Text as="span" variant="bodySm" tone="success" fontWeight="semibold">
                          {t("currentPlan")}
                        </Text>
                      ) : (
                        <BillingPageButton label={t("pricing:choosePlan")} size="slim" />
                      )}
                    </BlockStack>
                  ))}
                </div>
              </Box>

              {/* The allowance is the only row that differs; every feature row
                  below is ticked on every plan, which is itself the message. */}
              <Box padding="400" borderBlockEndWidth="025" borderColor="border">
                <div className="sf-compare-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 16, alignItems: "center" }}>
                  <Text as="span" variant="bodyMd" fontWeight="semibold">{t("formsRow")}</Text>
                  {PLANS.map((plan) => (
                    <div key={plan.id} style={{ textAlign: "center", fontSize: 13.5, fontWeight: 600, color: C.ink }}>
                      {plan.formLimit === null ? t("formsUnlimited") : plan.formLimit}
                    </div>
                  ))}
                </div>
              </Box>

              <BlockStack gap="0">
                {FEATURE_ROWS.map((feature, idx) => (
                  <Box
                    key={feature.key}
                    padding="400"
                    borderBlockEndWidth={idx < FEATURE_ROWS.length - 1 ? "025" : "0"}
                    borderColor="border"
                  >
                    <div className="sf-compare-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 16, alignItems: "center" }}>
                      <Text as="span" variant="bodyMd">{t(`forms:pills.${feature.key}`)}</Text>
                      {feature.values.map((included, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "center" }}>
                          <Icon
                            source={included ? CheckIcon : XIcon}
                            tone={included ? "success" : "subdued"}
                          />
                        </div>
                      ))}
                    </div>
                  </Box>
                ))}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

      </Layout>
    </Page>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return boundary.error(error);
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};