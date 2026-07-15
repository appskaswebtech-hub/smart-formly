import { RemixI18Next } from "remix-i18next/server";

import config, { fallbackLng, supportedLngs } from "./config";
import { resources } from "./resources";

const i18next = new RemixI18Next({
  detection: {
    supportedLanguages: [...supportedLngs],
    fallbackLanguage: fallbackLng,
    // Shopify sends the admin locale as `?locale=`; remix-i18next defaults to `lng`.
    searchParamKey: "locale",
  },
  i18next: { ...config, resources },
});

export default i18next;
