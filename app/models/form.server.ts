// import db from "../db.server";

// export type FormField = {
//   id: string;
//   type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "file";
//   label: string;
//   placeholder?: string;
//   required: boolean;
//   options?: string[];
// };

// export type FormSettings = {
//   recipientEmail: string;
//   successMessage: string;
//   submitLabel: string;
//   notifyOnSubmit: boolean;
// };

// export async function getForms(shopDomain: string) {
//   const forms = await db.formConfig.findMany({
//     where: { shopDomain },
//     orderBy: { createdAt: "desc" },
//     include: { _count: { select: { submissions: true } } },
//   });
//   return forms.map((f) => ({
//     ...f,
//     fields: JSON.parse(f.fields) as FormField[],
//     settings: JSON.parse(f.settings) as FormSettings,
//     submissionsCount: f._count.submissions,
//   }));
// }

// export async function getForm(id: string, shopDomain: string) {
//   const form = await db.formConfig.findFirst({ where: { id, shopDomain } });
//   if (!form) return null;
//   return {
//     ...form,
//     fields: JSON.parse(form.fields) as FormField[],
//     settings: JSON.parse(form.settings) as FormSettings,
//   };
// }



// export async function deleteFormById(formId: string, shop: string) {
//   return db.formConfig.delete({
//     where: {
//       id: formId,
//       shop, // ✅ prevents deleting other shop data
//     },
//   });
// }

// export async function createForm(
//   shopDomain: string,
//   formName: string,
//   fields: FormField[],
//   settings: FormSettings
// ) {
//   return db.formConfig.create({
//     data: {
//       shopDomain,
//       formName,
//       fields: JSON.stringify(fields),
//       settings: JSON.stringify(settings),
//     },
//   });
// }

// export async function updateForm(
//   id: string,
//   shopDomain: string,
//   data: Partial<{
//     formName: string;
//     fields: FormField[];
//     settings: FormSettings;
//     isActive: boolean;
//   }>
// ) {
//   return db.formConfig.updateMany({
//     where: { id, shopDomain },
//     data: {
//       ...(data.formName                && { formName:  data.formName }),
//       ...(data.fields                  && { fields:    JSON.stringify(data.fields) }),
//       ...(data.settings                && { settings:  JSON.stringify(data.settings) }),
//       ...(data.isActive !== undefined  && { isActive:  data.isActive }),
//     },
//   });
// }

// export async function deleteForm(id: string, shopDomain: string) {
//   return db.formConfig.deleteMany({ where: { id, shopDomain } });
// }

// export async function getFormStats(shopDomain: string) {
//   const forms = await db.formConfig.findMany({ where: { shopDomain } });
//   const formIds = forms.map((f) => f.id);

//   const totalSubmissions = await db.formSubmission.count({
//     where: { formId: { in: formIds } },
//   });

//   const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
//   const submissionTrend = await db.formSubmission.groupBy({
//     by: ["createdAt"],
//     where: { formId: { in: formIds }, createdAt: { gte: last7Days } },
//     _count: true,
//   });

//   return {
//     totalForms:       forms.length,
//     activeForms:      forms.filter((f) => f.isActive).length,
//     totalSubmissions,
//     submissionTrend,
//   };
// }



import db from "../db.server";

// ── Types ─────────────────────────────────────────────────────────────
// export type FormField = {
//   id: string;
//   type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "file";
//   label: string;
//   placeholder?: string;
//   required: boolean;
//   options?: string[];
// };

export type FormField = {
  id: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "file";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  // ← ADD THESE NEW PROPERTIES
  halfWidth?: boolean;
  fieldInCenter?: boolean;
  sendSubmissionEmail?: boolean;
  emailValidation?: boolean;
};

export type FormSettings = {
  recipientEmail: string;
  successMessage: string;
  submitLabel: string;
  notifyOnSubmit: boolean;
};

// ── Get all forms ─────────────────────────────────────────────────────
export async function getForms(shopDomain: string) {
  const forms = await db.formConfig.findMany({
    where: { shopDomain },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  return forms.map((f) => ({
    ...f,
    fields: JSON.parse(f.fields) as FormField[],
    settings: JSON.parse(f.settings) as FormSettings,
    submissionsCount: f._count.submissions,
  }));
}

// ── Get single form ───────────────────────────────────────────────────
export async function getForm(id: string, shopDomain: string) {
  const form = await db.formConfig.findFirst({
    where: { id, shopDomain },
  });

  if (!form) return null;

  return {
    ...form,
    fields: JSON.parse(form.fields) as FormField[],
    settings: JSON.parse(form.settings) as FormSettings,
  };
}

// ── Create form ───────────────────────────────────────────────────────
export async function createForm(
  shopDomain: string,
  formName: string,
  fields: FormField[],
  settings: FormSettings
) {
  return db.formConfig.create({
    data: {
      shopDomain,
      formName,
      fields: JSON.stringify(fields),
      settings: JSON.stringify(settings),
    },
  });
}

// ── Update form ───────────────────────────────────────────────────────
export async function updateForm(
  id: string,
  shopDomain: string,
  data: Partial<{
    formName: string;
    fields: FormField[];
    settings: FormSettings;
    isActive: boolean;
  }>
) {
  return db.formConfig.updateMany({
    where: { id, shopDomain },
    data: {
      ...(data.formName && { formName: data.formName }),
      ...(data.fields && { fields: JSON.stringify(data.fields) }),
      ...(data.settings && { settings: JSON.stringify(data.settings) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

// ── Delete form (FINAL FIXED VERSION) ─────────────────────────────────
export async function deleteFormById(formId: string, shopDomain: string) {
  return db.formConfig.deleteMany({
    where: {
      id: formId,
      shopDomain, // ✅ important for multi-tenant safety
    },
  });
}

// ── Stats ─────────────────────────────────────────────────────────────
export async function getFormStats(shopDomain: string) {
  const forms = await db.formConfig.findMany({
    where: { shopDomain },
  });

  const formIds = forms.map((f) => f.id);

  const totalSubmissions = await db.formSubmission.count({
    where: { formId: { in: formIds } },
  });

  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const submissionTrend = await db.formSubmission.groupBy({
    by: ["createdAt"],
    where: {
      formId: { in: formIds },
      createdAt: { gte: last7Days },
    },
    _count: true,
  });

  return {
    totalForms: forms.length,
    activeForms: forms.filter((f) => f.isActive).length,
    totalSubmissions,
    submissionTrend,
  };
}