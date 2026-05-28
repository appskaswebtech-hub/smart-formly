import { json, type ActionFunctionArgs } from "@remix-run/node";
import db from "../db.server";
import { createSubmission } from "../models/submission.server";
import { sendFormSubmissionEmail } from "../utils/email.server";
import nodemailer from "nodemailer";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/* ── Shared SMTP transporter ─────────────────────────────────────────────────
   Created once at module load — not on every request.
   Logs a clear warning at startup if SMTP env vars are missing.
─────────────────────────────────────────────────────────────────────────────*/
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "[SF:AR] ⚠️  SMTP not configured — auto-responder emails will be skipped.\n" +
      "[SF:AR]     Set SMTP_HOST, SMTP_USER, SMTP_PASS in your .env file.\n" +
      "[SF:AR]     Current values → SMTP_HOST=" + (host || "MISSING") +
      " SMTP_USER=" + (user || "MISSING") + " SMTP_PASS=" + (pass ? "SET" : "MISSING")
    );
    return null;
  }

  const port   = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  console.log(
    `[SF:AR] ✅ SMTP transporter ready → ${host}:${port} secure=${secure} user=${user}`
  );

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls:  { rejectUnauthorized: false },
  });
}

const autoResponderTransporter = createTransporter();

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

    const settings = {
      notifyOnSubmit:        rawSettings.notifyOnSubmit  ?? false,
      recipientEmail:        rawSettings.recipientEmail  ?? "",
      successMessage:        rawSettings.successMessage  ?? "Form submitted successfully!",
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
        await sendFormSubmissionEmail({
          recipientEmail: settings.recipientEmail,
          formName:       form.formName,
          fields,
          submissionData,
          ticketNumber:   ticketNumber ?? undefined,
        });
      } catch (emailError: any) {
        console.error("[SF] Admin email failed:", emailError?.message);
      }
    }

    // ── Send auto-responder email ─────────────────────────────────
    console.log("[SF:AR] ── Checking auto-responder ──────────────────────");
    console.log("[SF:AR]   autoResponderFromEmail :", extra.autoResponderFromEmail || "(not set — fill in Auto responder email pill)");
    console.log("[SF:AR]   autoResponderSubject   :", extra.autoResponderSubject   || "(not set — fill in Auto responder email pill)");
    console.log("[SF:AR]   transporter ready      :", !!autoResponderTransporter);
    console.log("[SF:AR]   SMTP_FROM env          :", process.env.SMTP_FROM        || "(not set)");

    if (!extra.autoResponderFromEmail || !extra.autoResponderSubject) {
      console.log("[SF:AR] SKIPPED — fill in 'Email for auto response' and 'Auto responder subject' in the form builder.");
    } else if (!autoResponderTransporter) {
      console.warn("[SF:AR] SKIPPED — SMTP transporter not ready. Check SMTP_HOST / SMTP_USER / SMTP_PASS in .env");
    } else {
      // Find the email field in the submission
      const emailField = fields.find(
        (f) => f.type === "email" || f.label.toLowerCase().includes("email")
      );
      console.log("[SF:AR]   emailField found      :", emailField ? emailField.label : "(none — add an Email field to your form)");

      const submitterEmail = emailField
        ? String(submissionData[emailField.id] ?? submissionData[emailField.label] ?? "").trim()
        : "";
      console.log("[SF:AR]   submitterEmail        :", submitterEmail || "(empty — visitor left email blank)");

      if (!submitterEmail || !submitterEmail.includes("@")) {
        console.warn("[SF:AR] SKIPPED — no valid email in submission. submissionData keys:", Object.keys(submissionData));
      } else {
        try {
          // Build submission rows for optional inclusion
          let submissionRows = "";
          if (extra.autoResponderIncludeResponse) {
            submissionRows = fields
              .map((f) => {
                const val = submissionData[f.id] ?? submissionData[f.label] ?? "";
                return `<tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;font-weight:500;color:#374151;width:40%">${f.label}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#6B7280">${Array.isArray(val) ? val.join(", ") : val}</td>
                </tr>`;
              })
              .join("");
          }

          const ticketRow = ticketNumber
            ? `<div style="margin:12px 0;padding:12px 16px;background:#EEF0FB;border:1px solid #c3c8f5;border-radius:8px;font-size:14px;color:#3c3f8f;">
                 🎫 <strong>Your ticket number: #${ticketNumber}</strong>
               </div>`
            : "";

          const bodyHtml = `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
              ${extra.autoResponderMessage
                ? `<div style="padding:20px 0;font-size:14px;color:#111827;line-height:1.7;">${extra.autoResponderMessage}</div>`
                : ""}
              ${ticketRow}
              ${submissionRows
                ? `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
                    <thead>
                      <tr style="background:#F9FAFB;">
                        <th style="padding:8px 12px;text-align:left;color:#6B7280;font-weight:600;border-bottom:2px solid #E5E7EB;">Field</th>
                        <th style="padding:8px 12px;text-align:left;color:#6B7280;font-weight:600;border-bottom:2px solid #E5E7EB;">Your answer</th>
                      </tr>
                    </thead>
                    <tbody>${submissionRows}</tbody>
                  </table>`
                : ""}
              ${extra.autoResponderFooter
                ? `<div style="padding:16px 0;font-size:12px;color:#9CA3AF;border-top:1px solid #E5E7EB;margin-top:16px;">${extra.autoResponderFooter}</div>`
                : ""}
            </div>`;

          // ── Build FROM address ───────────────────────────────────
          // Use SMTP_FROM env var as-is if set (already has display name + address).
          // Fall back to constructing from builder fields.
          // NEVER wrap SMTP_FROM in another name<> — that produces malformed headers.
          const fromAddress = process.env.SMTP_FROM
            ? process.env.SMTP_FROM
            : extra.autoResponderFromName
              ? `"${extra.autoResponderFromName}" <${extra.autoResponderFromEmail}>`
              : extra.autoResponderFromEmail;

          console.log("[SF:AR]   from address        :", fromAddress);
          console.log("[SF:AR]   sending to          :", submitterEmail);
          console.log("[SF:AR]   subject             :", extra.autoResponderSubject);

          const info = await autoResponderTransporter.sendMail({
            from:    fromAddress,
            to:      submitterEmail,
            subject: extra.autoResponderSubject,
            html:    bodyHtml,
          });

          console.log("[SF:AR] ✅ Sent successfully!");
          console.log("[SF:AR]    messageId  :", info.messageId);
          console.log("[SF:AR]    response   :", info.response);

        } catch (arError: any) {
          // Never crash a submission because of email failure
          console.error("[SF:AR] ❌ FAILED:", arError?.message);
          console.error("[SF:AR]    error code :", arError?.code);
          console.error("[SF:AR]    response   :", arError?.response);
          console.error("[SF:AR]    Common causes:");
          console.error("[SF:AR]    1. FROM address not verified in Brevo → Senders & IPs → Senders");
          console.error("[SF:AR]    2. Gmail FROM blocked by DMARC — use a non-Gmail sender address");
          console.error("[SF:AR]    3. Wrong SMTP credentials — double-check SMTP_PASS");
          console.error("[SF:AR]    4. Brevo daily limit reached");
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