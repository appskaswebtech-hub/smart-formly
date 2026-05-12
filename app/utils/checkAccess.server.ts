// export async function checkAppAccess(admin, billing) {
//   // GraphQL call to fetch the shop's plan
//   const response = await admin.graphql(`
//     {
//       shop {
//         plan {
//           displayName
//         }
//       }
//     }
//   `);

//   const data = await response.json();
//   const planName = data.data.shop.plan.displayName;

//   const normalizedPlan = planName.toLowerCase();

//   // Checking if it's a Development Store
//   const isDevStore =
//     normalizedPlan.includes("development") ||
//     normalizedPlan.includes("partner");

//   if (isDevStore) {
//     // If it's a Development Store, grant access
//     return { hasAccess: true, isDevStore };
//   }

//   // For live stores, check if the user has the Advanced Plan
//   const billingCheck = await billing.check({
//     plans: ["ADVANCED_PLAN"],
//   });

//   const hasAdvancedPlan = billingCheck.appSubscriptions.some(
//     (sub) => sub.name === "advanced" && sub.status === "ACTIVE"
//   );

//   return {
//     hasAccess: hasAdvancedPlan,
//     isDevStore,
//      storePlan: planName,
//   };
// }



// -----12.05.2026---


import { PLANS, DEFAULT_PLAN } from "app/config/plans";

// ============================================================
// checkAppAccess.js — Plain JavaScript (no TypeScript)


const DEV_STORE_KEYWORDS = [
  "development", "partner", "staff", "affiliate", "shopify plus partner sandbox",
];

export async function checkAppAccess(admin, billing) {
  let storePlanName = "unknown";

  // STEP 1: Shop ka Shopify plan fetch karo
  try {
    const response = await admin.graphql(`
      { shop { plan { displayName partnerDevelopment } } }
    `);
    const data = await response.json();
    storePlanName = data?.data?.shop?.plan?.displayName ?? "unknown";
    const isPartnerDev = data?.data?.shop?.plan?.partnerDevelopment ?? false;

    const isDevByKeyword = DEV_STORE_KEYWORDS.some((kw) =>
      storePlanName.toLowerCase().includes(kw)
    );
    const isDevStore = isPartnerDev || isDevByKeyword;

    // STEP 2: Dev store → seedha free access do
    if (isDevStore) {
      return {
        hasAccess:       true,
        isDevStore:      true,
        activePlan:      "free",
        activePlanName:  PLANS.free.name,
        storePlan:       storePlanName,
        requiresBilling: false,
      };
    }
  } catch (err) {
    console.error("[checkAppAccess] GraphQL error:", err);
  }

  // STEP 3: Live store → billing check karo
  try {
    const billingCheck = await billing.require({
      plans:     Object.values(PLANS).map((p) => p.name),
      isTest:    process.env.NODE_ENV !== "production",
      onFailure: () => null,
    });

    const activeSubs = billingCheck?.appSubscriptions ?? [];

    // Priority order: advanced > pro > free
    const priorityOrder = ["advanced", "pro", "free"];
    let activePlanKey = "free";

    for (const planKey of priorityOrder) {
      const found = activeSubs.some(
        (sub) =>
          sub.name.toLowerCase() === PLANS[planKey].name.toLowerCase() &&
          sub.status === "ACTIVE"
      );
      if (found) { activePlanKey = planKey; break; }
    }

    const hasAccess = activeSubs.length > 0;

    return {
      hasAccess,
      isDevStore:      false,
      activePlan:      activePlanKey,
      activePlanName:  PLANS[activePlanKey].name,
      storePlan:       storePlanName,
      requiresBilling: !hasAccess,
    };
  } catch (err) {
    console.error("[checkAppAccess] Billing error:", err);
    return {
      hasAccess:       false,
      isDevStore:      false,
      activePlan:      "free",
      activePlanName:  DEFAULT_PLAN.name,
      storePlan:       storePlanName,
      requiresBilling: true,
    };
  }
}