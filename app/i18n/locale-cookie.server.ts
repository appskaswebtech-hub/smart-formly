import { createCookie } from "@remix-run/node";

import { isSupportedLocale, type SupportedLocale } from "./config";

/**
 * Mirrors ShopSettings.locale into the browser.
 *
 * ShopSettings stays the source of truth, but it can only be read when `?shop=`
 * is on the URL — which Shopify stamps onto document loads but which
 * client-side navigations (navigate("/app/formsnew")) do not carry.
 *
 * sameSite must be "none" (and therefore secure): the app renders in an iframe
 * on admin.shopify.com, so this is a third-party cookie. "lax" would drop it.
 *
 * Being third-party is also why this is only a best-effort fallback and never
 * the thing holding the language steady — browsers block that category by
 * default now. What keeps the locale stable across client-side navigations is
 * `shouldRevalidate` in app/root.tsx, which stops it being re-resolved at all.
 */
export const localeCookie = createCookie("smartformly_locale", {
  path: "/",
  sameSite: "none",
  secure: true,
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
});

export async function readLocaleCookie(
  request: Request,
): Promise<SupportedLocale | null> {
  const value = await localeCookie.parse(request.headers.get("Cookie"));
  return isSupportedLocale(value) ? value : null;
}
