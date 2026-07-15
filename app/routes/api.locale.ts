import { json, type ActionFunctionArgs } from "@remix-run/node";

import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { isSupportedLocale } from "../i18n/config";
import { localeCookie } from "../i18n/locale-cookie.server";

/**
 * Persists the merchant's language choice per shop.
 *
 * The shop domain comes from the authenticated session, never from the form
 * body — otherwise any caller could rewrite another shop's settings.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const locale = formData.get("locale");

  if (!isSupportedLocale(locale)) {
    return json({ ok: false, error: "Unsupported locale" }, { status: 400 });
  }

  await prisma.shopSettings.upsert({
    where: { shopDomain: session.shop },
    create: { shopDomain: session.shop, locale },
    update: { locale },
  });

  // No redirect needed: Remix revalidates the root loader after this action,
  // which re-runs resolveLocale and re-renders the app in the new language.
  //
  // The cookie mirrors the choice so resolveLocale can still find it on
  // client-side navigations, which carry no `?shop=` to look the shop up by.
  return json(
    { ok: true, locale },
    { headers: { "Set-Cookie": await localeCookie.serialize(locale) } },
  );
};
