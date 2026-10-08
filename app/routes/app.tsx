import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError, useRouteLoaderData } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";
import {
  billingBypassed,
  isUnlockedPath,
  planSelectionUrl,
} from "../billing/plan-page.server";
import { getPolarisTranslations } from "../i18n/polaris";
import type { loader as rootLoader } from "../root";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const handle = { i18n: ["common", "nav"] };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, redirect } = await authenticate.admin(request);

  // Read subscriptions straight from the installation rather than via
  // billing.check: that filters by plan names from our own config, but under
  // Shopify App Pricing the plan names live in the Partner Dashboard and would
  // never match — the paywall would stay locked forever after a real purchase.
  // Any ACTIVE subscription means the merchant has paid.
  const subRes = await admin.graphql(`#graphql
    query BillingStatus {
      currentAppInstallation {
        activeSubscriptions { id name status }
      }
    }
  `);
  const subscriptions =
    (await subRes.json())?.data?.currentAppInstallation?.activeSubscriptions ?? [];
  const hasActivePayment = subscriptions.some(
    (sub: { status: string }) => sub.status === "ACTIVE",
  );

  // Keep the app_url metafield fresh on every app load.
  // App-data metafield (AppInstallation owner) — no extra scopes required.
  if (process.env.SHOPIFY_APP_URL) {
    try {
      const appRes = await admin.graphql(`#graphql
        query { currentAppInstallation { id } }
      `);
      const ownerId = (await appRes.json())?.data?.currentAppInstallation?.id;

      if (ownerId) {
        const mfRes = await admin.graphql(
          `#graphql
          mutation SetAppUrlMetafield($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              userErrors { field message }
            }
          }`,
          {
            variables: {
              metafields: [
                {
                  ownerId,
                  namespace: "smartformly",
                  key: "app_url",
                  type: "single_line_text_field",
                  value: process.env.SHOPIFY_APP_URL,
                },
              ],
            },
          },
        );

        const userErrors =
          (await mfRes.json())?.data?.metafieldsSet?.userErrors ?? [];
        if (userErrors.length > 0) {
          console.error("[app loader] metafieldsSet userErrors:", userErrors);
        }
      }
    } catch (err) {
      console.error("[app loader] Failed to refresh app_url metafield:", err);
    }
  }

  // Without a subscription the app is closed: send the merchant to Shopify's
  // plan page instead of rendering anything. target "_top" is required because
  // that page lives outside the app's iframe.
  const locked = !hasActivePayment && !billingBypassed();

  if (locked && !isUnlockedPath(new URL(request.url).pathname)) {
    const planPage = await planSelectionUrl(admin);
    // No handle resolved: render the app rather than strand the merchant on a
    // blank screen with nowhere to go. planSelectionUrl has already logged it.
    if (planPage) return redirect(planPage, { target: "_top" });
  }

  return { apiKey: process.env.SHOPIFY_API_KEY || "", locked };
};

export default function App() {
  const { apiKey, locked } = useLoaderData<typeof loader>();
  const { t } = useTranslation("nav");

  // Read the locale from root rather than re-resolving it here: root is the
  // single source of truth that entry.server rendered with.
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const locale = rootData?.locale ?? "en";

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={getPolarisTranslations(locale)}>
      {/*
        While locked, every other tab would only bounce the merchant back out to
        Shopify's plan page, so none are offered. App Bridge requires a first
        rel="home" link, which Help & Support takes over for the duration.
      */}
      {locked ? (
        <NavMenu>
          <a href="/app/helpandsupport" rel="home">{t("helpAndSupport")}</a>
        </NavMenu>
      ) : (
        <NavMenu>
          <a href="/app" rel="home">{t("dashboard")}</a>
          <a href="/app/formsly">{t("myForms")}</a>
          <a href="/app/formsnew">{t("createForm")}</a>
          <a href="/app/submissions">{t("submissions")}</a>
          <a href="/app/settings">{t("settings")}</a>
          <a href="/app/pricing">{t("pricing")}</a>
          <a href="/app/helpandsupport">{t("helpAndSupport")}</a>
        </NavMenu>
      )}

      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};