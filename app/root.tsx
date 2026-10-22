import { json, type LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  type ShouldRevalidateFunction,
} from "@remix-run/react";
import { useChangeLanguage } from "remix-i18next/react";

import { localeCookie, readLocaleCookie } from "./i18n/locale-cookie.server";
import { resolveLocale } from "./i18n/resolve.server";

/**
 * The locale is resolved here rather than in app.tsx because root is what
 * entry.server renders. Resolving it any deeper would let the server render
 * English while the client hydrates German, which React 18 reports as a text
 * mismatch and repairs with a full client re-render (a visible flash).
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const locale = await resolveLocale(request);

  // Backfill the mirror cookie so client-side navigations — which carry no
  // `?shop=` for resolveLocale to look the shop up by — resolve to the same
  // language. Without this, only merchants who change language *after* this
  // shipped would have a cookie; an already-saved choice would never get one.
  if ((await readLocaleCookie(request)) !== locale) {
    return json(
      { locale },
      { headers: { "Set-Cookie": await localeCookie.serialize(locale) } },
    );
  }

  return json({ locale });
};

/**
 * Keeps the locale resolved at document load for the rest of the session.
 *
 * Remix revalidates this loader on every client-side navigation, but those
 * carry no `?shop=` — so resolveLocale cannot read ShopSettings and falls
 * through to the mirror cookie, which is a third-party cookie inside the admin
 * iframe and is dropped by default in current browsers. It then falls through
 * again to Accept-Language and flips the whole app to the browser's language
 * mid-session, which is how clicking from the dashboard into Create Form turned
 * a German app English.
 *
 * Changing language still takes effect immediately: that posts to /api/locale,
 * the one action this lets through.
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({ formAction }) =>
  formAction === "/api/locale";

export const handle = { i18n: ["common", "nav"] };

export default function App() {
  const { locale } = useLoaderData<typeof loader>();

  useChangeLanguage(locale);

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
