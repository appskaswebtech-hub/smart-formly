import { isSupportedLocale, type SupportedLocale } from "./config";

/**
 * Buyer-facing strings that the API returns to the storefront.
 *
 * Kept separate from the admin catalogs in ./locales because these follow the
 * *storefront's* language (passed as `?locale=` by form.liquid), not the
 * merchant's admin language — the two are independent.
 *
 * Precedence at the call site:
 *   merchant's per-form successMessage  >  this dictionary  >  English
 */
const storefrontStrings: Record<SupportedLocale, { successMessage: string }> = {
  en: { successMessage: "Form submitted successfully!" },
  de: { successMessage: "Formular erfolgreich gesendet!" },
  es: { successMessage: "¡Formulario enviado correctamente!" },
  it: { successMessage: "Modulo inviato con successo!" },
};

/**
 * Resolves storefront copy for a locale. Accepts the raw `?locale=` value and
 * tolerates regional tags (`de-DE` → `de`) and unknown values (→ English).
 */
export function getStorefrontStrings(locale: string | null | undefined) {
  const base = (locale ?? "").split("-")[0].toLowerCase();
  return isSupportedLocale(base) ? storefrontStrings[base] : storefrontStrings.en;
}
