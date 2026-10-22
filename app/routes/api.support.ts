import { json, type ActionFunctionArgs } from "@remix-run/node";

import { authenticate } from "../shopify.server";
import { sendSupportEmail } from "../utils/email.server";

/** Same shape the submission endpoint uses, so both ends agree on "valid". */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Long enough for a real question, short enough that nobody can paste a book. */
const MAX_MESSAGE = 5000;

/**
 * Receives a merchant's support message and mails it to us.
 *
 * The shop comes from the authenticated session, never the request body —
 * otherwise anyone could send a message that appears to come from another
 * store.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const form = await request.formData();
  const replyTo = String(form.get("replyTo") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();

  if (!message) {
    return json({ ok: false as const, error: "empty-message" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return json({ ok: false as const, error: "message-too-long" }, { status: 400 });
  }
  if (!EMAIL_RE.test(replyTo)) {
    return json({ ok: false as const, error: "invalid-email" }, { status: 400 });
  }

  try {
    const result = await sendSupportEmail({ shop: session.shop, replyTo, message });

    if (result.status !== "sent") {
      // Nothing was sent, so say so rather than showing a false confirmation.
      console.warn("[SF:SUPPORT] not sent:", result.reason);
      return json({ ok: false as const, error: "not-sent" }, { status: 503 });
    }

    console.log("[SF:SUPPORT] sent from", session.shop, result.messageId);
    return json({ ok: true as const });
  } catch (err: any) {
    console.error("[SF:SUPPORT] failed:", err?.code, err?.message);
    return json({ ok: false as const, error: "send-failed" }, { status: 500 });
  }
};
