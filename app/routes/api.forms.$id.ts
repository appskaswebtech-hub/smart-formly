import { json, type LoaderFunctionArgs } from "@remix-run/node";
import db from "../db.server";

// GET /api/forms/:id — public endpoint, no auth required
// Returns form config for storefront rendering
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const formId = params.id;

  if (!formId) {
    return json({ error: "Form ID required" }, {
      status: 400,
      headers: corsHeaders(),
    });
  }

  const form = await db.formConfig.findUnique({
    where: { id: formId },
  });

  if (!form) {
    return json({ error: "Form not found" }, {
      status: 404,
      headers: corsHeaders(),
    });
  }

  if (!form.isActive) {
    return json({ error: "This form is not currently active" }, {
      status: 403,
      headers: corsHeaders(),
    });
  }

  return json({
    id: form.id,
    formName: form.formName,
    fields: form.fields,
    settings: form.settings,
  }, {
    headers: corsHeaders(),
  });
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
