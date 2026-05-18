import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// ── Payload types ─────────────────────────────────────────────────────────────
type CustomerDataRequestPayload = {
  customer: { id: number; email: string; phone?: string };
  orders_to_redact: number[];
};

type CustomersRedactPayload = {
  customer: { id: number; email: string; phone?: string };
  orders_to_redact: number[];
};

type ShopRedactPayload = {
  shop_id: number;
  shop_domain: string;
};

// ── Action ────────────────────────────────────────────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST": {
      // Shopify asks: what data do you hold for this customer?
      const p = payload as CustomerDataRequestPayload;
      const customerEmail = p.customer.email;

      // Fetch all submissions for this shop
      const allSubmissions = await db.formSubmission.findMany({
        where: { shopDomain: shop },
      });

      // Filter submissions that contain this customer's email in JSON data
      const customerSubmissions = allSubmissions.filter((sub) => {
        try {
          const data = typeof sub.data === "string"
            ? JSON.parse(sub.data)
            : sub.data;
          // Check if any field value matches the customer's email
          return Object.values(data).some(
            (val) => typeof val === "string" &&
              val.toLowerCase() === customerEmail.toLowerCase()
          );
        } catch {
          return false;
        }
      });

      // Log for audit trail (in production you'd email this to the merchant)
      console.log(
        `[CUSTOMERS_DATA_REQUEST] shop=${shop} customer=${customerEmail} ` +
        `matched=${customerSubmissions.length} submission(s)`,
        customerSubmissions
      );

      break;
    }

    case "CUSTOMERS_REDACT": {
      // Shopify asks: delete all personal data for this specific customer
      const p = payload as CustomersRedactPayload;
      const customerEmail = p.customer.email;

      // Fetch all submissions for this shop
      const allSubmissions = await db.formSubmission.findMany({
        where: { shopDomain: shop },
      });

      // Find IDs of submissions that contain this customer's email
      const matchingIds = allSubmissions
        .filter((sub) => {
          try {
            const data = typeof sub.data === "string"
              ? JSON.parse(sub.data)
              : sub.data;
            return Object.values(data).some(
              (val) => typeof val === "string" &&
                val.toLowerCase() === customerEmail.toLowerCase()
            );
          } catch {
            return false;
          }
        })
        .map((sub) => sub.id);

      if (matchingIds.length > 0) {
        await db.formSubmission.deleteMany({
          where: {
            id: { in: matchingIds },
            shopDomain: shop, // safety guard
          },
        });
        console.log(
          `[CUSTOMERS_REDACT] shop=${shop} customer=${customerEmail} ` +
          `deleted=${matchingIds.length} submission(s)`
        );
      } else {
        console.log(
          `[CUSTOMERS_REDACT] shop=${shop} customer=${customerEmail} — no matching submissions found`
        );
      }

      break;
    }

    case "SHOP_REDACT": {
      // App uninstalled 48hrs ago — delete ALL data for this shop
      const _p = payload as ShopRedactPayload;

      await db.formSubmission.deleteMany({
        where: { shopDomain: shop },
      });
      await db.formConfig.deleteMany({
        where: { shopDomain: shop },
      });

      console.log(`[SHOP_REDACT] All data deleted for shop=${shop}`);
      break;
    }

    default:
      console.warn(`[WEBHOOK] Unhandled compliance topic: ${topic}`);
  }

  return new Response(null, { status: 200 });
};