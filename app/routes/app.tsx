// import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
// import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
// import { boundary } from "@shopify/shopify-app-remix/server";
// import { AppProvider } from "@shopify/shopify-app-remix/react";
// import { NavMenu } from "@shopify/app-bridge-react";
// import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

// import { authenticate } from "../shopify.server";

// export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// export const loader = async ({ request }: LoaderFunctionArgs) => {
//   await authenticate.admin(request);

//   return { apiKey: process.env.SHOPIFY_API_KEY || "" };
// };

// export default function App() {
//   const { apiKey } = useLoaderData<typeof loader>();

//   return (
//     <AppProvider isEmbeddedApp apiKey={apiKey}>
//       <NavMenu>
//         <Link to="/app" rel="home">
//           Home
//         </Link>
//         <Link to="/app/bundles">
//           Bundles
//         </Link>
//         <Link to="/app/settings1">
//           Settings
//         </Link>
//         <Link to="/app/billing">
//           Upgrate to Plans
//         </Link>
//          </NavMenu>
//       <Outlet />
//     </AppProvider>
//   );
// }

// // Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
// export function ErrorBoundary() {
//   return boundary.error(useRouteError());
// }

// export const headers: HeadersFunction = (headersArgs) => {
//   return boundary.headers(headersArgs);
// };


import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { BillingGate } from "../components/BillingGate";
import { checkAppAccess } from "../utils/checkAccess.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, billing } = await authenticate.admin(request);

  const access = await checkAppAccess(admin, billing);

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    hasAccess: access.hasAccess,
  });
};

export default function App() {
  const { apiKey, hasAccess } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">Home</Link>
        <Link to="/app/bundles">Bundles</Link>
        <Link to="/app/settings1">Settings</Link>
        <Link to="/app/billing">Upgrade to Plans</Link>
      </NavMenu>
      <BillingGate hasAccess={hasAccess}>
        <Outlet />
      </BillingGate>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};