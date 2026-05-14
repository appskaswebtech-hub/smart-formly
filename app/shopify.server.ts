import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,                    // ← removed BillingInterval
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  // ← entire billing block removed

  hooks: {
    afterAuth: async ({ session, admin }) => {
      const appUrl = process.env.SHOPIFY_APP_URL;
      if (!appUrl) {
        console.warn("[afterAuth] SHOPIFY_APP_URL not set; skipping sync.");
        return;
      }
      try {
        const appRes = await admin.graphql(`#graphql
          query { currentAppInstallation { id } }
        `);
        const appJson = await appRes.json();
        const ownerId = appJson?.data?.currentAppInstallation?.id;
        if (!ownerId) {
          console.error("[afterAuth] Could not resolve AppInstallation ID for", session.shop);
          return;
        }
        const mfRes = await admin.graphql(
          `#graphql
          mutation SetAppUrlMetafield($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields { id namespace key value }
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
                  value: appUrl,
                },
              ],
            },
          },
        );
        const mfJson = await mfRes.json();
        const userErrors = mfJson?.data?.metafieldsSet?.userErrors ?? [];
        if (userErrors.length > 0) {
          console.error("[afterAuth] metafieldsSet userErrors:", userErrors);
        } else {
          console.log(`[afterAuth] Synced app_url for ${session.shop} -> ${appUrl}`);
        }
      } catch (err) {
        console.error("[afterAuth] Failed to sync app_url metafield:", err);
      }
    },
  },

  future: {
    unstable_newEmbeddedAuthStrategy: true,
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;