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

  console.log(`[SF:AR] ✅ SMTP transporter ready → ${host}:${port} secure=${secure} user=${user}`);

  return nodemailer.createTransport({
    host, port, secure,
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
      } catch (emailError: any) {
        console.error("[SF] Admin email failed:", emailError?.message);
      }
    }

    // ── Send auto-responder email ─────────────────────────────────
    console.log("[SF:AR] ── Checking auto-responder ──────────────────────");
    console.log("[SF:AR]   autoResponderFromEmail :", extra.autoResponderFromEmail || "(not set)");
    console.log("[SF:AR]   autoResponderSubject   :", extra.autoResponderSubject   || "(not set)");
    console.log("[SF:AR]   transporter ready      :", !!autoResponderTransporter);
    console.log("[SF:AR]   SMTP_FROM env          :", process.env.SMTP_FROM        || "(not set)");
    console.log("[SF:AR]   ticketNumber           :", ticketNumber ?? "(ticket system disabled)");

    if (!extra.autoResponderFromEmail || !extra.autoResponderSubject) {
      console.log("[SF:AR] SKIPPED — fill in 'Email for auto response' and 'Auto responder subject' in the form builder.");
    } else if (!autoResponderTransporter) {
      console.warn("[SF:AR] SKIPPED — SMTP transporter not ready. Check SMTP_HOST / SMTP_USER / SMTP_PASS in .env");
    } else {
      const emailField = fields.find(
        (f) => f.type === "email" || f.label.toLowerCase().includes("email")
      );
      console.log("[SF:AR]   emailField found      :", emailField ? emailField.label : "(none)");

      const submitterEmail = emailField
        ? String(submissionData[emailField.id] ?? submissionData[emailField.label] ?? "").trim()
        : "";
      console.log("[SF:AR]   submitterEmail        :", submitterEmail || "(empty)");

      if (!submitterEmail || !submitterEmail.includes("@")) {
        console.warn("[SF:AR] SKIPPED — no valid email in submission.");
      } else {
        try {
          // ── Build submission rows ──────────────────────────────
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

          // ── ✅ Ticket block — shown prominently at top of email ──
          const ticketBlock = ticketNumber
            ? `<div style="
                margin:0 0 20px 0;
                padding:16px 20px;
                background:#EEF0FB;
                border:2px solid #c3c8f5;
                border-radius:8px;
                text-align:center;
              ">
                <div style="font-size:13px;color:#5C6AC4;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">
                  Your Ticket Number
                </div>
                <div style="font-size:28px;font-weight:700;color:#3c3f8f;letter-spacing:0.02em;">
                  #${ticketNumber}
                </div>
                <div style="font-size:12px;color:#6B7280;margin-top:4px;">
                  Please keep this number for your records
                </div>
              </div>`
            : "";

          // ── ✅ Subject line — append ticket number if enabled ──
          const emailSubject = ticketNumber
            ? `${extra.autoResponderSubject} [Ticket #${ticketNumber}]`
            : extra.autoResponderSubject;

          // ── Build full email body ──────────────────────────────
          const bodyHtml = `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827;">

              ${ticketBlock}

              ${extra.autoResponderMessage
                ? `<div style="padding:16px 0;font-size:14px;color:#111827;line-height:1.7;">
                    ${extra.autoResponderMessage}
                  </div>`
                : ""}

              ${submissionRows
                ? `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
                    <thead>
                      <tr style="background:#F9FAFB;">
                        <th style="padding:10px 12px;text-align:left;color:#6B7280;font-weight:600;border-bottom:2px solid #E5E7EB;">Field</th>
                        <th style="padding:10px 12px;text-align:left;color:#6B7280;font-weight:600;border-bottom:2px solid #E5E7EB;">Your answer</th>
                      </tr>
                    </thead>
                    <tbody>${submissionRows}</tbody>
                  </table>`
                : ""}

              ${extra.autoResponderFooter
                ? `<div style="padding:16px 0;font-size:12px;color:#9CA3AF;border-top:1px solid #E5E7EB;margin-top:16px;line-height:1.6;">
                    ${extra.autoResponderFooter}
                  </div>`
                : ""}

            </div>`;

          // ── Build FROM address ─────────────────────────────────
          const fromAddress = process.env.SMTP_FROM
            ? process.env.SMTP_FROM
            : extra.autoResponderFromName
              ? `"${extra.autoResponderFromName}" <${extra.autoResponderFromEmail}>`
              : extra.autoResponderFromEmail;

          console.log("[SF:AR]   from address        :", fromAddress);
          console.log("[SF:AR]   sending to          :", submitterEmail);
          console.log("[SF:AR]   subject             :", emailSubject);

          const info = await autoResponderTransporter.sendMail({
            from:    fromAddress,
            to:      submitterEmail,
            subject: emailSubject,
            html:    bodyHtml,
          });

          console.log("[SF:AR] ✅ Sent successfully!");
          console.log("[SF:AR]    messageId  :", info.messageId);
          console.log("[SF:AR]    response   :", info.response);

        } catch (arError: any) {
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