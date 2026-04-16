// import { json, type ActionFunctionArgs } from "@remix-run/node";
// import db from "../db.server";
// import { sendSubmissionEmail } from "../utils/email.server";

// // CORS (important for Shopify storefront)
// export const headers = () => ({
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "POST, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type",
// });

// export const action = async ({ request, params }: ActionFunctionArgs) => {
//   if (request.method === "OPTIONS") {
//     return new Response(null, { status: 204 });
//   }

//   const formId = params.id;

//   if (!formId) {
//     return json({ error: "Form ID missing" }, { status: 400 });
//   }

//   const form = await db.formConfig.findUnique({
//     where: { id: formId },
//   });

//   if (!form) {
//     return json({ error: "Form not found" }, { status: 404 });
//   }

//   const fields = JSON.parse(form.fields);
//   const settings = JSON.parse(form.settings);
//   const body = await request.json();

//   // Validation
//   const errors: Record<string, string> = {};

//   for (const field of fields) {
//     if (field.required && !body[field.id]) {
//       errors[field.id] = `${field.label} is required`;
//     }

//     if (field.type === "email" && body[field.id]) {
//       const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRe.test(body[field.id])) {
//         errors[field.id] = "Invalid email";
//       }
//     }
//   }

//   if (Object.keys(errors).length > 0) {
//     return json({ success: false, errors }, { status: 422 });
//   }

//   // Save submission
//   await db.formSubmission.create({
//     data: {
//       formId: form.id,
//       data: JSON.stringify(body),
//       ipAddress: request.headers.get("x-forwarded-for") || "",
//     },
//   });

//   // Email notification
//   if (settings.notifyOnSubmit && settings.recipientEmail) {
//     await sendSubmissionEmail({
//       to: settings.recipientEmail,
//       formName: form.formName,
//       submissionData: body,
//       fields,
//     });
//   }

//   return json({
//     success: true,
//     message: settings.successMessage || "Form submitted!",
//   });
// };


import { json, type ActionFunctionArgs } from "@remix-run/node";
import db from "../db.server";
import { createSubmission } from "../models/submission.server";

// ── This endpoint receives submissions from the storefront theme ────────────
// It does NOT require admin auth — it's a public API for customers to submit.
// URL: POST /api/submit/:formId
// Body: JSON with form field data

export const action = async ({ request, params }: ActionFunctionArgs) => {
  // Only allow POST
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const formId = params.id;
  if (!formId) {
    return json({ error: "Form ID is required" }, { status: 400 });
  }

  // Look up the form
  const form = await db.formConfig.findUnique({
    where: { id: formId },
  });

  if (!form) {
    return json({ error: "Form not found" }, { status: 404 });
  }

  if (!form.isActive) {
    return json({ error: "This form is not currently active" }, { status: 403 });
  }

  // Parse the submission body
  let submissionData: Record<string, any>;
  try {
    submissionData = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  const fields = JSON.parse(form.fields) as Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
  }>;

  const errors: string[] = [];
  for (const field of fields) {
    if (field.required) {
      const value = submissionData[field.label];
      if (value === undefined || value === null || value === "") {
        errors.push(`${field.label} is required`);
      }
    }
  }

  if (errors.length > 0) {
    return Response.json({ error: "Validation failed", errors }, { status: 422 });
  }

  // Save the submission
  try {
    const submission = await createSubmission(formId, form.shopDomain, submissionData);

    // Parse settings for notification check
    const settings = JSON.parse(form.settings) as {
      notifyOnSubmit?: boolean;
      recipientEmail?: string;
      successMessage?: string;
    };

    // TODO: Send email notification if settings.notifyOnSubmit && settings.recipientEmail
    // You can integrate with Nodemailer, SendGrid, etc.

    return json(
      {
        success: true,
        message: settings.successMessage || "Form submitted successfully!",
        submissionId: submission.id,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Submission error:", error);
    return json({ error: "Failed to save submission" }, { status: 500 });
  }
};

// ── Handle CORS preflight ───────────────────────────────────────────────────
export const loader = async ({ request }: { request: Request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  return json({ error: "Use POST to submit" }, { status: 405 });
};