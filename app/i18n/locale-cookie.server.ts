import { createCookie } from "@remix-run/node";

import { isSupportedLocale, type SupportedLocale } from "./config";

/**
 * Mirrors ShopSettings.locale into the browser.
 *
 * ShopSettings stays the source of truth, but it can only be read when `?shop=`
 * is on the URL — which Shopify stamps onto document loads but which
 * client-side navigations (navigate("/app/formsnew")) do not carry. This cookie
 * is what keeps the language stable across those navigations.
 *
 * sameSite must be "none" (and therefore secure): the app renders in an iframe
 * on admin.shopify.com, so this is a third-party cookie. "lax" would drop it.
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
