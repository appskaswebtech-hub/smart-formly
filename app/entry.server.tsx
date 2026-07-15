import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import {
  createReadableStreamFromReadable,
  type EntryContext,
} from "@remix-run/node";
import { isbot } from "isbot";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { addDocumentResponseHeaders } from "./shopify.server";
import i18nConfig from "./i18n/config";
import { resources } from "./i18n/resources";
import i18next from "./i18n/i18next.server";
import { resolveLocale } from "./i18n/resolve.server";

export const streamTimeout = 5000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  addDocumentResponseHeaders(request, responseHeaders);
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? '')
    ? "onAllReady"
    : "onShellReady";

  // Request-scoped instance — a module-level singleton would leak one request's
  // language into concurrent requests for other shops.
  const i18n = createInstance();
  const lng = await resolveLocale(request);
  const ns = i18next.getRouteNamespaces(remixContext);

  await i18n.use(initReactI18next).init({ ...i18nConfig, resources, lng, ns });

  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={i18n}>
        <RemixServer
          context={remixContext}
          url={request.url}
        />
      </I18nextProvider>,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        },
      }
    );

    // Automatically timeout the React renderer after 6 seconds, which ensures
    // React has enough time to flush down the rejected boundary contents
    setTimeout(abort, streamTimeout + 1000);
  });
}
