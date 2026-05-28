// // import db from "../db.server";

// // export type FormField = {
// //   id: string;
// //   type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "file";
// //   label: string;
// //   placeholder?: string;
// //   required: boolean;
// //   options?: string[];
// // };

// // export type FormSettings = {
// //   recipientEmail: string;
// //   successMessage: string;
// //   submitLabel: string;
// //   notifyOnSubmit: boolean;
// // };

// // export async function getForms(shopDomain: string) {
// //   const forms = await db.formConfig.findMany({
// //     where: { shopDomain },
// //     orderBy: { createdAt: "desc" },
// //     include: { _count: { select: { submissions: true } } },
// //   });
// //   return forms.map((f) => ({
// //     ...f,
// //     fields: JSON.parse(f.fields) as FormField[],
// //     settings: JSON.parse(f.settings) as FormSettings,
// //     submissionsCount: f._count.submissions,
// //   }));
// // }

// // export async function getForm(id: string, shopDomain: string) {
// //   const form = await db.formConfig.findFirst({ where: { id, shopDomain } });
// //   if (!form) return null;
// //   return {
// //     ...form,
// //     fields: JSON.parse(form.fields) as FormField[],
// //     settings: JSON.parse(form.settings) as FormSettings,
// //   };
// // }



// // export async function deleteFormById(formId: string, shop: string) {
// //   return db.formConfig.delete({
// //     where: {
// //       id: formId,
// //       shop, // ✅ prevents deleting other shop data
// //     },
// //   });
// // }

// // export async function createForm(
// //   shopDomain: string,
// //   formName: string,
// //   fields: FormField[],
// //   settings: FormSettings
// // ) {
// //   return db.formConfig.create({
// //     data: {
// //       shopDomain,
// //       formName,
// //       fields: JSON.stringify(fields),
// //       settings: JSON.stringify(settings),
// //     },
// //   });
// // }

// // export async function updateForm(
// //   id: string,
// //   shopDomain: string,
// //   data: Partial<{
// //     formName: string;
// //     fields: FormField[];
// //     settings: FormSettings;
// //     isActive: boolean;
// //   }>
// // ) {
// //   return db.formConfig.updateMany({
// //     where: { id, shopDomain },
// //     data: {
// //       ...(data.formName                && { formName:  data.formName }),
// //       ...(data.fields                  && { fields:    JSON.stringify(data.fields) }),
// //       ...(data.settings                && { settings:  JSON.stringify(data.settings) }),
// //       ...(data.isActive !== undefined  && { isActive:  data.isActive }),
// //     },
// //   });
// // }

// // export async function deleteForm(id: string, shopDomain: string) {
// //   return db.formConfig.deleteMany({ where: { id, shopDomain } });
// // }

// // export async function getFormStats(shopDomain: string) {
// //   const forms = await db.formConfig.findMany({ where: { shopDomain } });
// //   const formIds = forms.map((f) => f.id);

// //   const totalSubmissions = await db.formSubmission.count({
// //     where: { formId: { in: formIds } },
// //   });

// //   const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
// //   const submissionTrend = await db.formSubmission.groupBy({
// //     by: ["createdAt"],
// //     where: { formId: { in: formIds }, createdAt: { gte: last7Days } },
// //     _count: true,
// //   });

// //   return {
// //     totalForms:       forms.length,
// //     activeForms:      forms.filter((f) => f.isActive).length,
// //     totalSubmissions,
// //     submissionTrend,
// //   };
// // }



// import db from "../db.server";

// // ── Types ─────────────────────────────────────────────────────────────
// // export type FormField = {
// //   id: string;
// //   type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "file";
// //   label: string;
// //   placeholder?: string;
// //   required: boolean;
// //   options?: string[];
// // };

// export type FormField = {
//   id: string;
//   type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "file";
//   label: string;
//   placeholder?: string;
//   required: boolean;
//   options?: string[];
//   // ← ADD THESE NEW PROPERTIES
//   halfWidth?: boolean;
//   fieldInCenter?: boolean;
//   sendSubmissionEmail?: boolean;
//   emailValidation?: boolean;
// };

// export type FormSettings = {
//   recipientEmail: string;
//   successMessage: string;
//   submitLabel: string;
//   notifyOnSubmit: boolean;
// };

// // ── Get all forms ─────────────────────────────────────────────────────
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

// // ── Get single form ───────────────────────────────────────────────────
// export async function getForm(id: string, shopDomain: string) {
//   const form = await db.formConfig.findFirst({
//     where: { id, shopDomain },
//   });

//   if (!form) return null;

//   return {
//     ...form,
//     fields: JSON.parse(form.fields) as FormField[],
//     settings: JSON.parse(form.settings) as FormSettings,
//   };
// }

// // ── Create form ───────────────────────────────────────────────────────
// // export async function createForm(
// //   shopDomain: string,
// //   formName: string,
// //   fields: FormField[],
// //   settings: FormSettings
// // ) {
// //   return db.formConfig.create({
// //     data: {
// //       shopDomain,
// //       formName,
// //       fields: JSON.stringify(fields),
// //       settings: JSON.stringify(settings),
// //     },
// //   });
// // }

// export async function createForm(
//   shopDomain: string,
//   formName: string,
//   fields: FormField[],
//   data: {
//     settings: FormSettings;
//     design: any;
//     isActive: boolean;
//   }
// ) {
//   return db.formConfig.create({
//     data: {
//       shopDomain,
//       formName,
//       fields: JSON.stringify(fields),
//       settings: JSON.stringify(data.settings),
//       design: JSON.stringify(data.design),
//       isActive: data.isActive,
//     },
//   });
// }
// // ── Update form ───────────────────────────────────────────────────────
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
//       ...(data.formName && { formName: data.formName }),
//       ...(data.fields && { fields: JSON.stringify(data.fields) }),
//       ...(data.settings && { settings: JSON.stringify(data.settings) }),
//       ...(data.isActive !== undefined && { isActive: data.isActive }),
//     },
//   });
// }

// // ── Delete form (FINAL FIXED VERSION) ─────────────────────────────────
// export async function deleteFormById(formId: string, shopDomain: string) {
//   return db.formConfig.deleteMany({
//     where: {
//       id: formId,
//       shopDomain, // ✅ important for multi-tenant safety
//     },
//   });
// }

// // ── Stats ─────────────────────────────────────────────────────────────
// export async function getFormStats(shopDomain: string) {
//   const forms = await db.formConfig.findMany({
//     where: { shopDomain },
//   });

//   const formIds = forms.map((f) => f.id);

//   const totalSubmissions = await db.formSubmission.count({
//     where: { formId: { in: formIds } },
//   });

//   const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

//   const submissionTrend = await db.formSubmission.groupBy({
//     by: ["createdAt"],
//     where: {
//       formId: { in: formIds },
//       createdAt: { gte: last7Days },
//     },
//     _count: true,
//   });

//   return {
//     totalForms: forms.length,
//     activeForms: forms.filter((f) => f.isActive).length,
//     totalSubmissions,
//     submissionTrend,
//   };
// }


import db from "../db.server";

// ── Types ─────────────────────────────────────────────────────────────────────

export type FormField = {
  id: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "file";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
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

// ── Default values (prevents undefined crashing Polaris components) ───────────

const defaultSettings: FormSettings = {
  recipientEmail: "",
  successMessage: "Thank you! Your submission has been received.",
  submitLabel:    "Submit",
  notifyOnSubmit: false,
};

// ── Safe JSON parse helpers ───────────────────────────────────────────────────

function safeParseFields(raw: string): FormField[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseSettings(raw: string): FormSettings & Record<string, any> {
  try {
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...(typeof parsed === "object" && parsed !== null ? parsed : {}) };
  } catch {
    return { ...defaultSettings };
  }
}

function safeParseJson(raw: string): Record<string, any> {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

// ── Get all forms ─────────────────────────────────────────────────────────────

export async function getForms(shopDomain: string) {
  const forms = await db.formConfig.findMany({
    where: { shopDomain },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  return forms.map((f) => {
    const settings = safeParseSettings(f.settings);
    return {
      ...f,
      fields:           safeParseFields(f.fields),
      settings,
      submissionsCount: f._count.submissions,
    };
  });
}

// ── Get single form ───────────────────────────────────────────────────────────

export async function getForm(id: string, shopDomain: string) {
  const form = await db.formConfig.findFirst({
    where: { id, shopDomain },
  });

  if (!form) return null;

  // Parse settings — may contain nested `design` and `extra` from updateForm
  const settings = safeParseSettings(form.settings);

  // Parse design from the dedicated column first, fall back to settings.design
  const designFromColumn  = safeParseJson(form.design ?? "{}");
  const designFromSettings = (settings as any).design ?? {};
  const mergedDesign = Object.keys(designFromColumn).length > 0
    ? designFromColumn
    : designFromSettings;

  // Merge design back into settings so the route can read (form.settings as any).design
  const settingsWithDesign = {
    ...settings,
    design: mergedDesign,
    extra:  (settings as any).extra ?? {},
  };

  return {
    ...form,
    fields:   safeParseFields(form.fields),
    settings: settingsWithDesign,
  };
}

// ── Create form ───────────────────────────────────────────────────────────────

export async function createForm(
  shopDomain: string,
  formName: string,
  fields: FormField[],
  data: {
    settings: FormSettings;
    design:   any;
    isActive: boolean;
  }
) {
  return db.formConfig.create({
    data: {
      shopDomain,
      formName,
      fields:   JSON.stringify(fields),
      settings: JSON.stringify(data.settings),
      design:   JSON.stringify(data.design ?? {}),
      isActive: data.isActive,
    },
  });
}

// ── Update form ───────────────────────────────────────────────────────────────
// NOTE: settings object passed from the route already contains { ...settings, design, extra }
// We save everything in the settings column so getForm can reconstruct it.
// We also keep the design column in sync.

export async function updateForm(
  id: string,
  shopDomain: string,
  data: Partial<{
    formName: string;
    fields:   FormField[];
    settings: any;          // accepts { ...FormSettings, design, extra }
    isActive: boolean;
  }>
) {
  const designValue = data.settings?.design
    ? JSON.stringify(data.settings.design)
    : undefined;

  return db.formConfig.updateMany({
    where: { id, shopDomain },
    data: {
      ...(data.formName !== undefined  && { formName: data.formName }),
      ...(data.fields   !== undefined  && { fields:   JSON.stringify(data.fields) }),
      ...(data.settings !== undefined  && { settings: JSON.stringify(data.settings) }),
      ...(designValue   !== undefined  && { design:   designValue }),
      ...(data.isActive !== undefined  && { isActive: data.isActive }),
    },
  });
}

// ── Delete form ───────────────────────────────────────────────────────────────

export async function deleteFormById(formId: string, shopDomain: string) {
  return db.formConfig.deleteMany({
    where: { id: formId, shopDomain },
  });
}

// ── Stats ─────────────────────────────────────────────────────────────────────

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
      formId:    { in: formIds },
      createdAt: { gte: last7Days },
    },
    _count: true,
  });

  return {
    totalForms:       forms.length,
    activeForms:      forms.filter((f) => f.isActive).length,
    totalSubmissions,
    submissionTrend,
  };
}