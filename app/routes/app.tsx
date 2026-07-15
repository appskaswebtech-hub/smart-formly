import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError, useRouteLoaderData } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";
import { getPolarisTranslations } from "../i18n/polaris";
import type { loader as rootLoader } from "../root";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const handle = { i18n: ["common", "nav"] };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

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

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const { t } = useTranslation("nav");

  // Read the locale from root rather than re-resolving it here: root is the
  // single source of truth that entry.server rendered with.
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const locale = rootData?.locale ?? "en";

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={getPolarisTranslations(locale)}>
      <NavMenu>
        <a href="/app" rel="home">{t("dashboard")}</a>
        <a href="/app/formsly">{t("myForms")}</a>
        <a href="/app/formsnew">{t("createForm")}</a>
        <a href="/app/submissions">{t("submissions")}</a>
        <a href="/app/settings">{t("settings")}</a>
        <a href="/app/pricing">{t("pricing")}</a>
        <a href="/app/helpandsupport">{t("helpAndSupport")}</a>
      </NavMenu>
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