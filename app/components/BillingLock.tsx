import { useFetcher } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { HIGHLIGHT_KEYS, PLANS } from "../billing/plans";

/**
 * The teal from the SmartFormly app icon, plus darker shades derived from it.
 *
 * `brand` is too light to carry white text (2.1:1 — well under the 4.5:1 WCAG AA
 * needs), so it leads the gradient and does the decorative work while anything
 * with a white label sits on `dark` (4.8:1) or `deep` (13.5:1).
 *
 * `deep` is as dark as it is on purpose: it ends the header gradient, and a
 * lighter stop pushed the subtitle under AA against the gradient's midpoint.
 *
 * Note the rest of the app is still indigo #5C6AC4 — see the dashboard chart,
 * form builder, emails and storefront block. Only this overlay is teal so far.
 */
const BRAND = {
  brand: "#2EC4C6",
  dark: "#1E7F80",
  deep: "#093438",
  tint: "#E7F8F8",
} as const;

/**
 * Blocking paywall shown until the shop has an active subscription.
 *
 * Deliberately not a Polaris Modal: this must not be dismissable, and it is
 * rendered over a clipped, inert copy of the app (see app.tsx) so the merchant
 * cannot scroll past it inside the admin iframe.
 *
 * This is presentation only — it is not the security boundary. Anything that
 * must stay paid-only has to be enforced server-side in its own loader/action.
 */
export default function BillingLock() {
  const fetcher = useFetcher<{ ok: boolean; messages: string[] }>();
  const { t, i18n } = useTranslation(["pricing", "common"]);

  // Shopify refusing the subscription is a normal outcome (a dev store rejecting
  // a real charge, say), not a crash — show it here rather than letting the
  // action throw and replace the whole app with an error page.
  const failed = fetcher.data && fetcher.data.ok === false;
  const failureDetails = fetcher.data?.messages ?? [];

  // The whole overlay is disabled while a plan request is in flight, otherwise
  // a second click would start a competing subscription request.
  const pending = fetcher.state !== "idle";
  const pendingPlan = fetcher.formData?.get("plan");
  // `plan` is only used to show a spinner on the clicked card — the server
  // ignores it.

  const price = (n: number) =>
    new Intl.NumberFormat(i18n.language, { style: "currency", currency: "USD" }).format(n);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-lock-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(17, 24, 39, 0.55)",
        overflowY: "auto",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          background: "#fff",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            // Brand teal -> deep so the centered white heading sits over the
            // darker mid-tones rather than the lightest stop.
            background: `linear-gradient(135deg, ${BRAND.brand} 0%, ${BRAND.deep} 100%)`,
            padding: "26px 28px",
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              // Light pill with dark text: white on the teal would be
              // unreadable at 10px.
              color: BRAND.deep,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 99,
              padding: "4px 12px",
              marginBottom: 10,
            }}
          >
            {t("pricing:lock.badge")}
          </span>
          <h2
            id="billing-lock-title"
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}
          >
            {t("pricing:lock.title")}
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13.5, color: BRAND.tint }}>
            {t("pricing:lock.subtitle")}
          </p>
        </div>

        {failed && (
          <div
            role="alert"
            style={{
              padding: "12px 20px",
              background: "#fef2f2",
              borderBottom: "1px solid #fecaca",
            }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#991b1b" }}>
              {t("common:errors.generic")}
            </p>
            {/*
              Shopify's own userErrors — deliberately untranslated: they are
              diagnostic strings from the API, not app copy.
            */}
            {failureDetails.map((msg) => (
              <p key={msg} style={{ margin: "4px 0 0", fontSize: 11.5, color: "#b91c1c" }}>
                {msg}
              </p>
            ))}
          </div>
        )}

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {PLANS.map((plan, idx) => {
            const popular = plan.id === "pro";
            const thisPending = pending && pendingPlan === plan.id;

            return (
              <div
                key={plan.id}
                style={{
                  padding: "22px 20px",
                  borderLeft: idx > 0 ? "1px solid #e5e7eb" : undefined,
                  background: popular ? BRAND.tint : "#fff",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ textAlign: "center", minHeight: 22 }}>
                  {popular && (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                        color: "#fff",
                        background: BRAND.dark,
                        borderRadius: 99,
                        padding: "3px 10px",
                      }}
                    >
                      {t("pricing:lock.mostPopular")}
                    </span>
                  )}
                </div>

                <h3
                  style={{
                    margin: "10px 0 4px",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#374151",
                    textAlign: "center",
                  }}
                >
                  {plan.name}
                </h3>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>
                    {price(plan.price)}
                  </span>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {t("pricing:perMonth")}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 6 }}>
                    {t("pricing:trial", { count: plan.trialDays })}
                  </div>
                </div>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "16px 0 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                    flex: 1,
                  }}
                >
                  {HIGHLIGHT_KEYS.map((key) => (
                    <li
                      key={key}
                      style={{
                        fontSize: 12,
                        color: "#4b5563",
                        lineHeight: 1.45,
                        paddingLeft: 14,
                        position: "relative",
                      }}
                    >
                      <span style={{ position: "absolute", left: 0, color: BRAND.brand }}>•</span>
                      {t(`pricing:highlights.${key}`)}
                    </li>
                  ))}
                </ul>

                {/*
                  Every card posts the same thing: Shopify's hosted page is the
                  real plan selector, so there is no plan to send.
                */}
                <fetcher.Form method="post" action="/api/billing">
                  <button
                    type="submit"
                    name="plan"
                    value={plan.id}
                    disabled={pending}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      color: "#fff",
                      background: popular ? BRAND.dark : BRAND.deep,
                      border: "none",
                      borderRadius: 8,
                      cursor: pending ? "not-allowed" : "pointer",
                      opacity: pending && !thisPending ? 0.5 : 1,
                    }}
                  >
                    {thisPending
                      ? t("common:status.loading")
                      : t("pricing:lock.startWith", { plan: plan.name })}
                  </button>
                </fetcher.Form>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "13px 20px",
            borderTop: "1px solid #e5e7eb",
            background: "#fafbfc",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 11.5, color: "#6b7280" }}>{t("pricing:lock.footer")}</p>
        </div>
      </div>
    </div>
  );
}
