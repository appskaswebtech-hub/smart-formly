import en from "@shopify/polaris/locales/en.json";
import de from "@shopify/polaris/locales/de.json";
import es from "@shopify/polaris/locales/es.json";
import it from "@shopify/polaris/locales/it.json";

import { fallbackLng, type SupportedLocale } from "./config";

/**
 * Statically imported and keyed explicitly. A template-literal `import()` of
 * `@shopify/polaris/locales/${locale}.json` cannot be analyzed by Vite across a
 * package boundary and silently fails to bundle.
 *
 * Never route these through loader data — `app.tsx` revalidates on every
 * navigation and would re-serialize ~15KB per click.
 */
const polarisTranslations = { en, de, es, it };

export function getPolarisTranslations(locale: string) {
  return (
    polarisTranslations[locale as SupportedLocale] ??
    polarisTranslations[fallbackLng]
  );
}
