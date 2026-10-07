import { json, type ActionFunctionArgs } from "@remix-run/node";
import db from "../db.server";
import { createSubmission } from "../models/submission.server";
import {
  sendFormSubmissionEmail,
  sendAutoResponderEmail,
  findSubmitterEmail,
} from "../utils/email.server";
import { getStorefrontStrings } from "../i18n/storefront.server";

// const CORS_HEADERS = {
//   "Access-Control-Allow-Origin":  "*",
//   "Access-Control-Allow-Methods": "POST, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type",
// };

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "false",
  "Vary": "Origin",
};

export const loader = async ({ request }: { request: Request }) => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, { status: 405, headers: CORS_HEADERS });
    }

    const formId = params.id;
    if (!formId) {
      return json({ error: "Form ID is required" }, { status: 400, headers: CORS_HEADERS });
    }

    // ── Load form ─────────────────────────────────────────────────
    const form = await db.formConfig.findUnique({ where: { id: formId } });
    if (!form) {
      return json({ error: "Form not found" }, { status: 404, headers: CORS_HEADERS });
    }
    if (!form.isActive) {
      return json({ error: "This form is not currently active" }, { status: 403, headers: CORS_HEADERS });
    }

    // ── Parse settings ────────────────────────────────────────────
    const rawSettings = JSON.parse(form.settings) as Record<string, any>;
    const extra       = rawSettings.extra ?? {};

    // ── Allow logged-in only ──────────────────────────────────────
    if (extra.allowLoggedInOnly === true) {
      const customerLoggedIn = request.headers.get("x-sf-customer-logged-in") === "true";
      if (!customerLoggedIn) {
        return json(
          { error: extra.loginMessage || "Please login to access this form.", loginRequired: true },
          { status: 403, headers: CORS_HEADERS }
        );
      }
    }

    // ── Schedule enforcement ──────────────────────────────────────
    const now = new Date();

    if (extra.scheduleStartDate) {
      const start = new Date(extra.scheduleStartDate + "T" + (extra.scheduleStartTime || "00:00"));
      if (now < start) {
        return json(
          { error: extra.beforeStartMessage || "This form is not open yet.", schedule: "not_started" },
          { status: 403, headers: CORS_HEADERS }
        );
      }
    }

    if (extra.scheduleEndDate) {
      const end = new Date(extra.scheduleEndDate + "T" + (extra.scheduleEndTime || "23:59"));
      if (now > end) {
        return json(
          { error: extra.afterEndMessage || "This form has closed.", schedule: "ended" },
          { status: 403, headers: CORS_HEADERS }
        );
      }
    }

    if (extra.scheduleMaxSubmissions) {
      const count = await db.formSubmission.count({ where: { formId } });
      if (count >= Number(extra.scheduleMaxSubmissions)) {
        return json(
          { error: extra.submissionClosedMessage || "This form has reached its maximum number of submissions.", schedule: "closed" },
          { status: 403, headers: CORS_HEADERS }
        );
      }
    }

    // ── Parse request body ────────────────────────────────────────
    let submissionData: Record<string, any>;
    try {
      submissionData = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, { status: 400, headers: CORS_HEADERS });
    }

    const fields = JSON.parse(form.fields) as Array<{
      id: string; label: string; type: string; required: boolean;
    }>;

    // The storefront passes its own language as ?locale=; it is independent of
    // the merchant's admin language, so it is resolved here rather than reusing
    // resolveLocale (which reads the admin's ShopSettings preference).
    const storefront = getStorefrontStrings(
      new URL(request.url).searchParams.get("locale"),
    );

    const settings = {
      notifyOnSubmit:        rawSettings.notifyOnSubmit  ?? false,
      recipientEmail:        rawSettings.recipientEmail  ?? "",
      successMessage:        rawSettings.successMessage  ?? storefront.successMessage,
      submitLabel:           rawSettings.submitLabel     ?? "Submit",
      afterSubmissionAction: extra.afterSubmissionAction ?? "clear_and_allow",
      redirectUrl:           extra.redirectUrl           ?? "",
      thankYouMessage:       extra.thankYouMessage       ?? "",
      thankYouTimerSec:      Number(extra.thankYouTimerSec ?? 5),
    };

    // ── Validate required fields ──────────────────────────────────
    const errors: string[] = [];
    for (const field of fields) {
      if (field.required) {
        const value = submissionData[field.id] ?? submissionData[field.label];
        if (
          value === undefined || value === null || value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          errors.push(`${field.label} is required`);
        }
      }
    }
    if (errors.length > 0) {
      return json({ error: "Validation failed", errors }, { status: 422, headers: CORS_HEADERS });
    }

    // ── Ticket number generation ──────────────────────────────────
    let ticketNumber: number | null = null;
    if (extra.ticketEnabled === true) {
      const existingCount = await db.formSubmission.count({ where: { formId } });
      ticketNumber = existingCount + 1;
    }

    // ── Save submission ───────────────────────────────────────────
    const submission = await createSubmission(formId, form.shopDomain, submissionData, ticketNumber);

    // ── Send admin notification email ─────────────────────────────
    if (settings.notifyOnSubmit && settings.recipientEmail) {
      try {
        const result = await sendFormSubmissionEmail({
          recipientEmail: settings.recipientEmail,
          formName:       form.formName,
          fields,
          submissionData,
          ticketNumber:   ticketNumber ?? undefined,
          adminEmailSettings: {
            adminEmailSubject:         extra.adminEmailSubject,
            adminEmailIncludeDateTime: extra.adminEmailIncludeDateTime,
            adminEmailUseShopTimezone: extra.adminEmailUseShopTimezone,
            adminEmailMessage:         extra.adminEmailMessage,
            adminEmailIncludeResponse: extra.adminEmailIncludeResponse,
            adminEmailHideHidden:      extra.adminEmailHideHidden,
            adminEmailHideEmpty:       extra.adminEmailHideEmpty,
          },
        });
        if (result.status === "sent") {
          console.log("[SF:MAIL] Admin email sent:", result.messageId);
        } else {
          console.warn("[SF:MAIL] Admin email skipped:", result.reason);
        }
      } catch (emailError: any) {
        console.error("[SF:MAIL] Admin email failed:", emailError?.code, emailError?.message);
      }
    }

    // ── Send auto-responder email ─────────────────────────────────
    // "From email" + subject together act as the on switch in the form builder.
    // The from email itself is used as Reply-To (see email.server.ts).
    if (extra.autoResponderFromEmail && extra.autoResponderSubject) {
      const submitterEmail = findSubmitterEmail(fields, submissionData);
      if (!submitterEmail) {
        console.warn("[SF:AR] Auto-responder skipped: no valid email in submission");
      } else {
        try {
          const result = await sendAutoResponderEmail({
            toEmail:         submitterEmail,
            subject:         extra.autoResponderSubject,
            message:         extra.autoResponderMessage,
            footer:          extra.autoResponderFooter,
            fromName:        extra.autoResponderFromName,
            fromEmail:       extra.autoResponderFromEmail,
            includeResponse: extra.autoResponderIncludeResponse === true,
            fields,
            submissionData,
            ticketNumber,
          });
          if (result.status === "sent") {
            console.log("[SF:AR] Auto-responder sent to", submitterEmail, result.messageId);
          } else {
            console.warn("[SF:AR] Auto-responder skipped:", result.reason);
          }
        } catch (arError: any) {
          console.error("[SF:AR] Auto-responder failed:", arError?.code, arError?.message, arError?.response);
        }
      }
    }

    // ── Return response ───────────────────────────────────────────
    return json(
      {
        success:               true,
        message:               settings.successMessage,
        submissionId:          submission.id,
        afterSubmissionAction: settings.afterSubmissionAction,
        redirectUrl:           settings.redirectUrl,
        thankYouMessage:       settings.thankYouMessage,
        thankYouTimerSec:      settings.thankYouTimerSec,
        ticketEnabled:         extra.ticketEnabled === true,
        ticketNumber:          ticketNumber,
      },
      { status: 200, headers: CORS_HEADERS }
    );

  } catch (err: any) {
    console.error("[SF] Unhandled error:", err?.message, err);
    return json(
      { error: "Internal server error", detail: err?.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
};