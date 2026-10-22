import prisma from "../db.server";
import { isSupportedLocale, type SupportedLocale } from "./config";
import i18next from "./i18next.server";
import { readLocaleCookie } from "./locale-cookie.server";

/**
 * Resolves the admin locale.
 *
 *   ShopSettings.locale  >  locale cookie  >  ?locale=  >  Accept-Language  >  en
 *
 * The merchant's saved choice must outrank `?locale=`: Shopify stamps that
 * param onto every top-level document load, so if it won, an explicit pick in
 * the language dropdown would be silently reverted on the next reload.
 *
 * The cookie exists because ShopSettings is only reachable when `?shop=` is on
 * the URL, which client-side navigations do not carry. It is a best-effort
 * fallback only: it is a third-party cookie in the admin iframe, so browsers
 * drop it by default. Root therefore stops revalidating on client-side
 * navigations (see `shouldRevalidate` in app/root.tsx) rather than relying on
 * this function being able to resolve without `?shop=` — when it cannot, it
 * falls through to Accept-Language, which is the browser's language and has
 * nothing to do with the merchant's choice.
 *
 * Reads `?shop=` without authenticating. That is deliberate — Shopify always
 * sends `shop` to embedded apps, the value only selects a display language and
 * exposes no data, and full auth is unavailable here because this runs in the
 * root loader, which is shared with the public /auth/login route.
 */
export async function resolveLocale(request: Request): Promise<SupportedLocale> {
  const shop = new URL(request.url).searchParams.get("shop");

  if (shop) {
    try {
      const settings = await prisma.shopSettings.findUnique({
        where: { shopDomain: shop },
        select: { locale: true },
      });

      const saved = settings?.locale;
      if (isSupportedLocale(saved)) return saved;
    } catch (err) {
      // A locale lookup must never take down the whole document render.
      console.error("[resolveLocale] ShopSettings lookup failed:", err);
    }
  }

  const fromCookie = await readLocaleCookie(request);
  if (fromCookie) return fromCookie;

  const detected = await i18next.getLocale(request);
  return isSupportedLocale(detected) ? detected : "en";
}
