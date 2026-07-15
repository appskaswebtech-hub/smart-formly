/**
 * Locale catalogs, bundled statically.
 *
 * `import.meta.glob` with `eager` is resolved by Vite at build time into plain
 * static imports, so this is not a runtime fetch — it works in both the SSR and
 * client bundles. Unlike the Polaris translations (see ./polaris.ts), these
 * files live inside the project, so Vite can analyze the glob.
 *
 * Dropping a new `locales/<lang>/<namespace>.json` file in registers it
 * automatically; there is no import list to keep in sync.
 */
import type { Resource, ResourceLanguage } from "i18next";

const modules = import.meta.glob("./locales/*/*.json", { eager: true });

export const resources: Resource = {};

for (const [filePath, mod] of Object.entries(modules)) {
  const match = filePath.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
  if (!match) continue;

  const [, lang, namespace] = match;
  resources[lang] ??= {} as ResourceLanguage;
  resources[lang][namespace] = (mod as { default: ResourceLanguage }).default;
}

/** Namespaces discovered from the English catalog, which is the source of truth. */
export const ns = Object.keys(resources.en ?? {});
