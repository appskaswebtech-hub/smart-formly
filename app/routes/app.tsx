import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

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

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <a href="/app" rel="home">Dashboard</a>
        <a href="/app/formsly">My Forms</a>
        <a href="/app/formsnew">Create Form</a>
        <a href="/app/submissions">Submissions</a>
        <a href="/app/settings">Settings</a>
        <a href="/app/pricing">Pricing</a>
        <a href="/app/helpandsupport">Help & Support</a>
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