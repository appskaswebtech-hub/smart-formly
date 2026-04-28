// import type { ActionFunctionArgs } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
// import db from "../db.server";

// export const action = async ({ request }: ActionFunctionArgs) => {
//   const { shop, session, topic } = await authenticate.webhook(request);

//   console.log(`Received ${topic} webhook for ${shop}`);

//   // Webhook requests can trigger multiple times and after an app has already been uninstalled.
//   // If this webhook already ran, the session may have been deleted previously.

//   if (session) {
//     await db.session.deleteMany({ where: { shop } });
//   }

//   return new Response();
// };


// 23.04.2026
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.

  if (session) {
    // Step 1: Get the access token from the session table (using findFirst if shop is not unique)
    const sessionRecord = await db.session.findFirst({
      where: { shop }, // Find the first session for this shop
    });

    if (sessionRecord) {
      const accessToken = sessionRecord.accessToken; // Assuming accessToken is stored in the session table

      // Step 2: Get the subscriptionId from the shopPlan table
      const shopRecord = await db.shopPlan.findUnique({
        where: { shop },
      });

      if (shopRecord) {
        const subscriptionId = shopRecord.subscriptionId;

        if (accessToken && subscriptionId) {
          // Step 3: Make the GraphQL mutation to cancel the subscription
          const response = await fetch(`https://${shop}/admin/api/2023-01/graphql.json`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": accessToken,
            },
            body: JSON.stringify({
              query: `
                mutation {
                  appSubscriptionCancel(id: "${subscriptionId}", prorate: true) {
                    userErrors {
                      field
                      message
                    }
                    appSubscription {
                      id
                      status
                    }
                  }
                }
              `,
            }),
          });

          // Log the full response from Shopify
          const data = await response.json();
          console.log("Shopify API response:", data);

          // Check for errors in the response
          if (data.data?.appSubscriptionCancel?.userErrors.length > 0) {
            console.log("Error canceling subscription:", data.data.appSubscriptionCancel.userErrors);
          } else {
            console.log("Subscription canceled successfully.");

            // Step 4: Optionally, update your database to reflect the subscription cancellation
            await db.shopPlan.update({
              where: { shop },
              data: { status: "canceled" }, // Set the status to canceled or handle as needed
            });

            // Step 5: Clean up the session after the cancellation
            await db.session.deleteMany({
              where: { shop }, // Delete the session associated with the shop
            });
            console.log("Session deleted successfully.");
          }
        } else {
          console.log("Missing access token or subscription ID.");
        }
      } else {
        console.log("No shop record found in shopPlan table.");
      }
    } else {
      console.log("No session record found.");
    }
  }

  return new Response();
};