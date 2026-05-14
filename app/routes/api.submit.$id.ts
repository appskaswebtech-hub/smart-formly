import { json, type ActionFunctionArgs } from "@remix-run/node";
import db from "../db.server";
import { createSubmission } from "../models/submission.server";
import { sendFormSubmissionEmail } from "../utils/email.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = async ({ request }: { request: Request }) => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  // Always return CORS headers even on crash
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

    const form = await db.formConfig.findUnique({ where: { id: formId } });
    if (!form) {
      return json({ error: "Form not found" }, { status: 404, headers: CORS_HEADERS });
    }

    if (!form.isActive) {
      return json({ error: "This form is not currently active" }, { status: 403, headers: CORS_HEADERS });
    }

    let submissionData: Record<string, any>;
    try {
      submissionData = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, { status: 400, headers: CORS_HEADERS });
    }

    console.log("[SF] submissionData:", JSON.stringify(submissionData, null, 2));

    const fields = JSON.parse(form.fields) as Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
    }>;

    const settings = JSON.parse(form.settings) as {
      notifyOnSubmit?: boolean;
      recipientEmail?: string;
      successMessage?: string;
      submitLabel?: string;
    };

    console.log("[SF] fields:", JSON.stringify(fields.map(f => ({ id: f.id, label: f.label, required: f.required }))));
    console.log("[SF] settings:", JSON.stringify(settings));

    // Validate required fields
    const errors: string[] = [];
    for (const field of fields) {
      if (field.required) {
        const value = submissionData[field.id] ?? submissionData[field.label];
        if (value === undefined || value === null || value === "") {
          errors.push(`${field.label} is required`);
        }
      }
    }

    if (errors.length > 0) {
      console.log("[SF] Validation errors:", errors);
      return json({ error: "Validation failed", errors }, { status: 422, headers: CORS_HEADERS });
    }

    const submission = await createSubmission(formId, form.shopDomain, submissionData);
    console.log("[SF] Submission saved:", submission.id);

    // Send notification email
    if (settings.notifyOnSubmit && settings.recipientEmail) {
      try {
        await sendFormSubmissionEmail({
          recipientEmail: settings.recipientEmail,
          formName: form.formName,
          fields,
          submissionData,
        });
        console.log("[SF] Email sent to:", settings.recipientEmail);
      } catch (emailError: any) {
        // Log but never crash the submission
        console.error("[SF] Email failed:", emailError?.message);
      }
    }

    return json(
      {
        success: true,
        message: settings.successMessage || "Form submitted successfully!",
        submissionId: submission.id,
      },
      { status: 200, headers: CORS_HEADERS }
    );

  } catch (err: any) {
    // Top-level catch — always return CORS headers so browser doesn't block the error
    console.error("[SF] Unhandled error:", err?.message, err);
    return json(
      { error: "Internal server error", detail: err?.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
};