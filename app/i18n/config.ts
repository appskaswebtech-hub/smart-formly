export const supportedLngs = ["en", "de", "es", "it"] as const;

export type SupportedLocale = (typeof supportedLngs)[number];

export const fallbackLng: SupportedLocale = "en";

export const defaultNS = "common";

/** Labels are intentionally in each language's own name, never translated. */
export const localeLabels: Record<SupportedLocale, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
};

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return (
    typeof value === "string" &&
    (supportedLngs as readonly string[]).includes(value)
  );
}

export default {
  supportedLngs: [...supportedLngs],
  fallbackLng,
  defaultNS,
  // Shopify sends regional tags such as `de-DE`; collapse them to `de`.
  load: "languageOnly" as const,
  nonExplicitSupportedLngs: true,
  interpolation: { escapeValue: false },
};
