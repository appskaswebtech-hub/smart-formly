import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { PLANS, PLAN_KEYS } from "../config/plans";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const planKey = formData.get("plan") as string;

  if (!PLAN_KEYS.includes(planKey) || planKey === "free") {
    return json({ error: "Invalid plan" }, { status: 400 });
  }

  const selectedPlan = PLANS[planKey];

  try {
    const response = await admin.graphql(
      `#graphql
      mutation AppSubscriptionCreate(
        $name: String!,
        $lineItems: [AppSubscriptionLineItemInput!]!,
        $returnUrl: URL!,
        $trialDays: Int,
        $test: Boolean
      ) {
        appSubscriptionCreate(
          name: $name,
          returnUrl: $returnUrl,
          lineItems: $lineItems,
          trialDays: $trialDays,
          test: $test
        ) {
          userErrors { field message }
          confirmationUrl
        }
      }`,
      {
        variables: {
          name: planKey,
          returnUrl: `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/app/billing-return`,
          trialDays: selectedPlan.trialDays,
          test: true, // ← false in production
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: { amount: selectedPlan.price, currencyCode: "USD" },
                  interval: "EVERY_30_DAYS",
                },
              },
            },
          ],
        },
      }
    );

    const data = await response.json();
    const { confirmationUrl, userErrors } =
      data.data?.appSubscriptionCreate ?? {};

    if (userErrors?.length) {
      return json({ error: userErrors[0].message }, { status: 400 });
    }

    return json({ confirmationUrl });
  } catch (err) {
    return json({ error: "Something went wrong" }, { status: 500 });
  }
};