import type { LoaderFunctionArgs } from "@remix-run/node";

import { authenticate } from "../shopify.server";
import { getAttachment, getAttachmentById } from "../models/submission.server";
import { verifyAttachmentUrl } from "../utils/attachment-url.server";

/**
 * Serves a file a shopper uploaded through a form.
 *
 * Two ways in, because this is reached from two very different places:
 *
 *  - A signed link (`?e=…&s=…`) from the merchant's notification email, opened
 *    in a plain browser tab where no Shopify session exists. The signature is
 *    the authorisation and it expires.
 *  - The Submissions page inside the admin, where the session authorises it and
 *    the lookup is scoped to that shop.
 */
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const id = params.id;
  if (!id) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const signed = verifyAttachmentUrl(id, url.searchParams.get("e"), url.searchParams.get("s"));

  const attachment = signed
    ? await getAttachmentById(id)
    : await getAttachment(id, (await authenticate.admin(request)).session.shop);

  if (!attachment) return new Response("Not found", { status: 404 });

  // Quote the filename and strip anything that would break out of the header.
  const safeName = attachment.filename.replace(/["\\\r\n]/g, "_");

  return new Response(Buffer.from(attachment.data), {
    status: 200,
    headers: {
      "Content-Type": attachment.contentType || "application/octet-stream",
      "Content-Length": String(attachment.data.length),
      "Content-Disposition": `attachment; filename="${safeName}"`,
      // private: a shared proxy must never hold another merchant's file.
      "Cache-Control": "private, max-age=3600",
    },
  });
};
