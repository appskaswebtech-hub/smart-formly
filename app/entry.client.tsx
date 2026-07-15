import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { createInstance } from "i18next";
import { getInitialNamespaces } from "remix-i18next/client";

import i18nConfig from "./i18n/config";
import { resources } from "./i18n/resources";

async function hydrate() {
  const i18n = createInstance();

  await i18n.use(initReactI18next).init({
    ...i18nConfig,
    resources,
    // The server already resolved the locale and rendered with it; read it back
    // off <html lang> so the client hydrates the same language and React does
    // not see a text mismatch.
    lng: document.documentElement.lang,
    ns: getInitialNamespaces(),
  });

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18n}>
        <StrictMode>
          <RemixBrowser />
        </StrictMode>
      </I18nextProvider>,
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  window.setTimeout(hydrate, 1);
}
