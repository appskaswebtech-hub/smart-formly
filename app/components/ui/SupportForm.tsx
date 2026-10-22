import { useFetcher } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

import Glyph from "./Icon";
import { C, RADIUS, primaryButton, secondaryButton } from "./theme";

/** Where support mail lands. Also offered for copying, for merchants who would
 *  rather write from their own mail client. */
export const SUPPORT_EMAIL = "apps.kaswebtech@gmail.com";

/** Mirrors MAX_MESSAGE in api.support.ts so the browser stops typing at the
 *  same point the server would reject. */
const MAX_MESSAGE = 5000;

/**
 * The merchant's direct line to us, used on Create Form and Help & Support.
 *
 * It posts to our own server rather than handing off to a `mailto:` link. The
 * Shopify admin runs the app in an iframe that blocks those, and on a machine
 * with no mail client registered they do nothing at all — both failure modes
 * were hit before this form replaced them.
 *
 * Renders no card of its own so each page can wrap it in its own chrome.
 *
 * Strings come from the `common` namespace rather than a page's own, because
 * two different pages render this.
 */
export default function SupportForm({
  initialMessage,
  autoFocus = false,
}: {
  /** Seeds the textarea, e.g. when the merchant arrives from "Feature Request". */
  initialMessage?: string;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation("common");
  const shopify = useAppBridge();

  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const sending = fetcher.state !== "idle";
  const sent    = fetcher.data?.ok === true;
  const failed  = fetcher.data?.ok === false;

  /* Clipboard + toast rather than a link: the same pattern the dashboard uses
     to copy Form IDs, so it is known to work inside the admin iframe. */
  const copyAddress = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL)
      .then(() => shopify.toast.show(t("support.copied")))
      .catch(() => shopify.toast.show(t("support.copyFailed"), { isError: true }));
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    fontSize: 13,
    marginBottom: 10,
    border: `1px solid ${C.line}`,
    borderRadius: RADIUS.control,
    fontFamily: "inherit",
    color: C.ink,
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12.5,
    fontWeight: 500,
    color: C.body,
    marginBottom: 4,
  };

  return (
    <>
      {sent ? (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "11px 12px", borderRadius: RADIUS.control,
            background: C.wash, color: C.deep, fontSize: 13, fontWeight: 500,
          }}
        >
          <Glyph name="check" size={16} color={C.deep} strokeWidth={2.2} />
          {t("support.sent")}
        </div>
      ) : (
        <fetcher.Form method="post" action="/api/support">
          <label style={labelStyle}>{t("support.emailLabel")}</label>
          <input
            type="email"
            name="replyTo"
            required
            autoFocus={autoFocus}
            placeholder={t("support.emailPlaceholder")}
            style={fieldStyle}
          />

          <label style={labelStyle}>{t("support.messageLabel")}</label>
          <textarea
            name="message"
            required
            rows={4}
            maxLength={MAX_MESSAGE}
            defaultValue={initialMessage}
            placeholder={t("support.messagePlaceholder")}
            style={{ ...fieldStyle, resize: "vertical" }}
          />

          {failed && (
            <p style={{ margin: "0 0 10px", fontSize: 12, color: C.dangerText }}>
              {t("support.error")}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            style={{
              ...primaryButton,
              width: "100%",
              justifyContent: "center",
              opacity: sending ? 0.6 : 1,
              cursor: sending ? "wait" : "pointer",
            }}
          >
            <Glyph name="inbox" size={15} color="#fff" />
            {sending ? t("support.sending") : t("support.send")}
          </button>
        </fetcher.Form>
      )}

      <button
        type="button"
        onClick={copyAddress}
        style={{
          ...secondaryButton,
          width: "100%",
          justifyContent: "center",
          marginTop: 8,
          background: "transparent",
          border: "none",
          color: C.muted,
          fontSize: 12,
          fontWeight: 500,
          padding: "6px 0",
        }}
      >
        <Glyph name="copy" size={13} color={C.muted} />
        {SUPPORT_EMAIL}
      </button>
    </>
  );
}
