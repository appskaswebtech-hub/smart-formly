import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import crypto from "crypto";
import db from "../db.server";

/**
 * App Proxy endpoint.
 *
 * Shopify forwards storefront requests from:
 *   GET /apps/bundler/api/widget-data?shop=...&productId=...
 * to this route with additional signature query params.
 *
 * Configure in shopify.app.toml:
 *   [app_proxy]
 *   url = "https://<your-app-url>/api"
 *   subpath = "bundler"
 *   prefix = "apps"
 */

function verifyProxySignature(query: URLSearchParams): boolean {
  const signature = query.get("signature");
  if (!signature) return false;

  const secret = process.env.SHOPIFY_API_SECRET || "";

  // Build the sorted query string without "signature"
  const params: string[] = [];
  query.forEach((value, key) => {
    if (key !== "signature") {
      params.push(`${key}=${value}`);
    }
  });
  params.sort();
  const message = params.join("");

  const computed = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  return computed === signature;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // In production, verify the Shopify proxy signature
  if (process.env.NODE_ENV === "production") {
    if (!verifyProxySignature(url.searchParams)) {
      return json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");

  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400 });
  }

  // Find active bundles with widget enabled for this shop
  const bundles = await db.bundle.findMany({
    where: {
      shop,
      status: "ACTIVE",
      showWidget: true,
    },
    include: {
      quantityBreaks: { orderBy: { sortOrder: "asc" } },
      widgetSettings: true,
    },
    orderBy: { prioritySequence: "asc" },
  });

  // Filter bundles by product if productId is provided
  const matchingBundles = bundles.filter((bundle) => {
    if (bundle.productSelectionType === "ALL_PRODUCTS") return true;
    if (!productId) return false;
    try {
      const ids = JSON.parse(bundle.selectedProductIds || "[]");
      return (
        ids.includes(productId) ||
        ids.includes(Number(productId)) ||
        ids.includes(String(productId))
      );
    } catch {
      return false;
    }
  });

  const payload = {
    bundles: matchingBundles.map((b) => ({
      id: b.id,
      name: b.name,
      title: b.title,
      quantityBreaks: b.quantityBreaks.map((qb) => ({
        id: qb.id,
        type: qb.type,
        quantity: qb.quantity,
        maxQuantity: qb.maxQuantity,
        discountType: qb.discountType,
        discountValue: qb.discountValue,
        savingsText: qb.savingsText,
        description: qb.description,
        freeShipping: qb.freeShipping,
      })),
      colors: b.widgetSettings
        ? (() => {
            try {
              return JSON.parse(b.widgetSettings.colors);
            } catch {
              return { primary: "#5C6AC4", secondary: "#47C1BF", accent: "#00848E" };
            }
          })()
        : { primary: "#5C6AC4", secondary: "#47C1BF", accent: "#00848E" },
    })),
  };

  // App proxy must return content-type application/liquid or application/json
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
