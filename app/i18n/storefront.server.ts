import prisma from "../db.server";
import { isSupportedLocale, type SupportedLocale } from "./config";

// The theme extension's own locale files. Importing them here keeps one copy of
// every shopper-facing string: Liquid reads them for the store's language, and
// the API reads them for the form's language.
import en from "../../extensions/smart-formly-block/locales/en.default.json";
import de from "../../extensions/smart-formly-block/locales/de.json";
import es from "../../extensions/smart-formly-block/locales/es.json";
import it from "../../extensions/smart-formly-block/locales/it.json";
import fr from "../../extensions/smart-formly-block/locales/fr.json";

/**
 * Shopper-facing strings, keyed as in the extension's `smartformly.form`
 * block (`required_field`, `invalid_email`, …).
 */
export type StorefrontMessages = Record<string, string>;

const catalogs: Record<SupportedLocale, StorefrontMessages> = {
  en: en.smartformly.form,
  de: de.smartformly.form,
  es: es.smartformly.form,
  it: it.smartformly.form,
  fr: fr.smartformly.form,
};

/**
 * English success texts the app stores until the merchant edits them: the
 * builder's starting value, and the model's fallback (app/models/form.server.ts),
 * which the edit page saves back for forms that had none. Stored text that
 * still equals one of these was never chosen by the merchant, so it is
 * replaced by the form's language.
 */
const DEFAULT_SUCCESS_MESSAGES = new Set([
  "Thank you! Your form has been submitted.",
  "Thank you! Your submission has been received.",
]);

/** The merchant's own success text, or null when it is still a default. */
export function customSuccessMessage(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return DEFAULT_SUCCESS_MESSAGES.has(value.trim()) ? null : value;
}

/** Accepts regional tags (`de-DE` → `de`). Unknown values give null. */
export function toSupportedLocale(value: unknown): SupportedLocale | null {
  if (typeof value !== "string") return null;
  const base = value.split("-")[0].toLowerCase();
  return isSupportedLocale(base) ? base : null;
}

/** Every shopper-facing string for a locale; English when it is unknown. */
export function storefrontMessages(locale: string | null | undefined): StorefrontMessages {
  const supported = toSupportedLocale(locale);
  return supported ? catalogs[supported] : catalogs.en;
}

/** Kept for the submit endpoint, which only needs the success text. */
export function getStorefrontStrings(locale: string | null | undefined) {
  return { successMessage: storefrontMessages(locale).success };
}

/**
 * The language a form's shopper-facing messages should use.
 *
 *   language saved on the form  >  the shop's app language  >  null
 *
 * The form's own language comes first because its labels were written in it.
 * Forms saved before the language was recorded fall back to the app language,
 * which is what their labels were created in. Null means no preference: the
 * storefront keeps the store's own language.
 */
export async function resolveFormLocale(form: {
  shopDomain: string;
  settings: string;
}): Promise<SupportedLocale | null> {
  try {
    const fromForm = toSupportedLocale(JSON.parse(form.settings)?.locale);
    if (fromForm) return fromForm;
  } catch {
    // Unreadable settings: fall through to the shop's language.
  }

  try {
    const shop = await prisma.shopSettings.findUnique({
      where: { shopDomain: form.shopDomain },
      select: { locale: true },
    });
    return toSupportedLocale(shop?.locale);
  } catch (err) {
    // A language lookup must never stop the form from loading.
    console.error("[resolveFormLocale] ShopSettings lookup failed:", err);
    return null;
  }
}
