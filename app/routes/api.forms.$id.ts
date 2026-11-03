import { json, type LoaderFunctionArgs } from "@remix-run/node";
import db from "../db.server";
import { resolveFormLocale, storefrontMessages } from "../i18n/storefront.server";

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

  // The storefront's Liquid strings follow the store's language. A form is
  // written in one language of its own, so its messages are sent along here
  // and replace those. Left out when the form has no known language.
  const locale = await resolveFormLocale(form);

  return json({
    ...(locale && { locale, messages: storefrontMessages(locale) }),
    id: form.id,
    formName: form.formName,
    fields: form.fields,
    settings: form.settings,
    // Served from its own column. The create path strips `design` out of
    // settings while the edit path leaves it nested, so a form that had never
    // been edited used to reach the storefront with no design at all — every
    // value silently falling back to its default.
    design: form.design,
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
