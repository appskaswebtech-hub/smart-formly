import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey:          process.env.SHOPIFY_API_KEY,
  apiSecretKey:    process.env.SHOPIFY_API_SECRET || "",
  apiVersion:      ApiVersion.January25,
  scopes:          process.env.SCOPES?.split(","),
  appUrl:          process.env.SHOPIFY_APP_URL || "",
  authPathPrefix:  "/auth",
  sessionStorage:  new PrismaSessionStorage(prisma),
  distribution:    AppDistribution.AppStore,

  billing: {
    "Base Monthly": {
      lineItems: [
        {
          amount:       9.9,
          currencyCode: "USD",
          interval:     BillingInterval.Every30Days,
        },
      ],
    },
    "Pro Monthly": {
      lineItems: [
        {
          amount:       17.9,
          currencyCode: "USD",
          interval:     BillingInterval.Every30Days,
        },
      ],
    },
    "ProPlus Monthly": {
      lineItems: [
        {
          amount:       25.9,
          currencyCode: "USD",
          interval:     BillingInterval.Every30Days,
        },
      ],
    },
  },

  hooks: {
    afterAuth: async ({ session, admin }) => {
      /* ── Resolve app URL ─────────────────────────────────────────────────────
         process.env.SHOPIFY_APP_URL is automatically overridden by Shopify CLI
         with the current tunnel URL (https://xxxx.trycloudflare.com) in dev,
         and equals your permanent domain in production.
         We always force https:// so the storefront fetch never hits a mixed-
         content block.
      ─────────────────────────────────────────────────────────────────────── */
      const rawUrl = process.env.SHOPIFY_APP_URL;
      if (!rawUrl) {
        console.warn("[afterAuth] SHOPIFY_APP_URL not set — skipping metafield sync.");
        return;
      }

      const appUrl = rawUrl
        .replace(/^http:\/\//, "https://")  // always https
        .replace(/\/$/, "");                 // no trailing slash

      try {
        /* ── Step 1: Get the AppInstallation ID ──────────────────────────────
           MUST use currentAppInstallation.id as ownerId — NOT shop.id.
           app.metafields in Liquid reads from the AppInstallation namespace.
           Using shop.id writes to the Shop object which Liquid cannot read
           via app.metafields, causing data-app-url="" on the storefront.
        ─────────────────────────────────────────────────────────────────── */
        const appRes  = await admin.graphql(`#graphql
          query { currentAppInstallation { id } }
        `);
        const appJson = await appRes.json();
        const ownerId = appJson?.data?.currentAppInstallation?.id;

        if (!ownerId) {
          console.error("[afterAuth] Could not resolve AppInstallation ID for", session.shop);
          return;
        }

        /* ── Step 2: Write the metafield ─────────────────────────────────── */
        const mfRes = await admin.graphql(
          `#graphql
          mutation SetAppUrlMetafield($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields { id namespace key value }
              userErrors  { field message }
            }
          }`,
          {
            variables: {
              metafields: [
                {
                  ownerId,
                  namespace: "smartformly",
                  key:       "app_url",
                  type:      "single_line_text_field",
                  value:     appUrl,
                },
              ],
            },
          },
        );

        const mfJson     = await mfRes.json();
        const userErrors = mfJson?.data?.metafieldsSet?.userErrors ?? [];
        const setValue   = mfJson?.data?.metafieldsSet?.metafields?.[0]?.value ?? "";

        if (userErrors.length > 0) {
          console.error("[afterAuth] metafieldsSet userErrors:", userErrors);
        } else {
          console.log(`[afterAuth] Synced app_url for ${session.shop} -> ${setValue}`);
        }

      } catch (err) {
        console.error("[afterAuth] Failed to sync app_url metafield:", err);
      }
    },
  },

  future: {
    unstable_newEmbeddedAuthStrategy: true,
    expiringOfflineAccessTokens:      true,
  },

  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion                = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate              = shopify.authenticate;
export const unauthenticated           = shopify.unauthenticated;
export const login                     = shopify.login;
export const registerWebhooks          = shopify.registerWebhooks;
export const sessionStorage            = shopify.sessionStorage;