export async function checkAppAccess(admin, billing) {
  // GraphQL call to fetch the shop's plan
  const response = await admin.graphql(`
    {
      shop {
        plan {
          displayName
        }
      }
    }
  `);

  const data = await response.json();
  const planName = data.data.shop.plan.displayName;

  const normalizedPlan = planName.toLowerCase();

  // Checking if it's a Development Store
  const isDevStore =
    normalizedPlan.includes("development") ||
    normalizedPlan.includes("partner");

  if (isDevStore) {
    // If it's a Development Store, grant access
    return { hasAccess: true, isDevStore };
  }

  // For live stores, check if the user has the Advanced Plan
  const billingCheck = await billing.check({
    plans: ["ADVANCED_PLAN"],
  });

  const hasAdvancedPlan = billingCheck.appSubscriptions.some(
    (sub) => sub.name === "advanced" && sub.status === "ACTIVE"
  );

  return {
    hasAccess: hasAdvancedPlan,
    isDevStore,
     storePlan: planName,
  };
}