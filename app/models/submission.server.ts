// import db from "../db.server";

// export type SubmissionRow = {
//   id: string;
//   formId: string;
//   data: Record<string, string>;
//   ipAddress: string | null;
//   createdAt: Date;
// };

// export async function getSubmissions(
//   formId: string,
//   shopDomain: string,
//   page = 1,
//   perPage = 20
// ): Promise<{ submissions: SubmissionRow[]; total: number }> {
//   // Verify form belongs to shop
//   const form = await db.formConfig.findFirst({
//     where: { id: formId, shopDomain },
//   });
//   if (!form) return { submissions: [], total: 0 };

//   const [rows, total] = await Promise.all([
//     db.formSubmission.findMany({
//       where: { formId },
//       orderBy: { createdAt: "desc" },
//       skip: (page - 1) * perPage,
//       take: perPage,
//     }),
//     db.formSubmission.count({ where: { formId } }),
//   ]);

//   return {
//     submissions: rows.map((r) => ({
//       ...r,
//       data: JSON.parse(r.data) as Record<string, string>,
//     })),
//     total,
//   };
// }

// export async function getSubmission(
//   id: string,
//   shopDomain: string
// ): Promise<SubmissionRow | null> {
//   const row = await db.formSubmission.findFirst({
//     where: { id },
//     include: { form: true },
//   });
//   if (!row || row.form.shopDomain !== shopDomain) return null;
//   return { ...row, data: JSON.parse(row.data) as Record<string, string> };
// }

// export async function deleteSubmission(
//   id: string,
//   shopDomain: string
// ): Promise<boolean> {
//   const row = await db.formSubmission.findFirst({
//     where: { id },
//     include: { form: true },
//   });
//   if (!row || row.form.shopDomain !== shopDomain) return false;
//   await db.formSubmission.delete({ where: { id } });
//   return true;
// }

// export async function getSubmissionTrend(
//   shopDomain: string,
//   days = 7
// ): Promise<{ date: string; count: number }[]> {
//   const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

//   const forms = await db.formConfig.findMany({
//     where: { shopDomain },
//     select: { id: true },
//   });
//   const formIds = forms.map((f) => f.id);

//   const rows = await db.formSubmission.findMany({
//     where: { formId: { in: formIds }, createdAt: { gte: since } },
//     select: { createdAt: true },
//     orderBy: { createdAt: "asc" },
//   });

//   // Build a map of date -> count
//   const map: Record<string, number> = {};
//   for (let i = 0; i < days; i++) {
//     const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
//     map[d.toISOString().slice(0, 10)] = 0;
//   }
//   for (const r of rows) {
//     const key = r.createdAt.toISOString().slice(0, 10);
//     if (map[key] !== undefined) map[key]++;
//   }

//   return Object.entries(map).map(([date, count]) => ({ date, count }));
// }

// export async function exportSubmissionsCSV(
//   formId: string,
//   shopDomain: string
// ): Promise<string> {
//   const { submissions } = await getSubmissions(formId, shopDomain, 1, 10000);
//   if (submissions.length === 0) return "";

//   const keys = Object.keys(submissions[0].data);
//   const header = ["ID", "Date", ...keys].join(",");
//   const rows = submissions.map((s) => {
//     const values = keys.map((k) => `"${(s.data[k] ?? "").replace(/"/g, '""')}"`);
//     return [s.id, s.createdAt.toISOString(), ...values].join(",");
//   });

//   return [header, ...rows].join("\n");
// }


import db from "../db.server";

/** A file uploaded with a submission, ready to be stored. */
export type SubmissionUpload = {
  fieldLabel: string;
  filename: string;
  contentType: string;
  content: Buffer;
};

// ── Create a new submission ─────────────────────────────────────────────────
export async function createSubmission(
  formId: string,
  shopDomain: string,
  data: Record<string, any>,
  ticketNumber?: number | null,
  uploads: SubmissionUpload[] = []
) {
  // Nested create so the files land in the same transaction as the submission:
  // a half-saved submission with missing files would be worse than none.
  return db.formSubmission.create({
    data: {
      formId,
      shopDomain,
      data: JSON.stringify(data),
      ticketNumber: ticketNumber ?? null,
      attachments: uploads.length
        ? {
            create: uploads.map((u) => ({
              shopDomain,
              fieldLabel: u.fieldLabel,
              filename: u.filename,
              contentType: u.contentType,
              size: u.content.length,
              // Prisma's Bytes maps to Uint8Array; Buffer is one, but Node's
              // generic ArrayBufferLike doesn't satisfy the narrower type.
              data: new Uint8Array(u.content),
            })),
          }
        : undefined,
    },
    include: { attachments: { select: { id: true, filename: true, size: true } } },
  });
}

// ── Read one attachment, scoped to the shop that owns it ────────────────────
export async function getAttachment(id: string, shopDomain: string) {
  return db.formAttachment.findFirst({ where: { id, shopDomain } });
}

/**
 * Read one attachment by id alone.
 *
 * Only for requests carrying a valid signed link, where the signature is the
 * authorisation and there is no session to scope by. Never call this from a
 * path a merchant can reach without a signature.
 */
export async function getAttachmentById(id: string) {
  return db.formAttachment.findUnique({ where: { id } });
}

// ── Attachment metadata for a set of submissions (never the bytes) ──────────
export async function getAttachmentsFor(submissionIds: string[], shopDomain: string) {
  if (submissionIds.length === 0) return [];
  return db.formAttachment.findMany({
    where: { submissionId: { in: submissionIds }, shopDomain },
    // Deliberately excludes `data`: listing submissions must never pull file
    // bytes into memory.
    select: { id: true, submissionId: true, fieldLabel: true, filename: true, size: true },
  });
}

// ── Get all submissions for a specific form ─────────────────────────────────
export async function getSubmissions(formId: string, shopDomain: string) {
  const submissions = await db.formSubmission.findMany({
    where: { formId, shopDomain },
    orderBy: { createdAt: "desc" },
  });

  return submissions.map((s) => ({
    ...s,
    data: JSON.parse(s.data) as Record<string, any>,
  }));
}

// ── Get a single submission ─────────────────────────────────────────────────
export async function getSubmission(id: string, shopDomain: string) {
  const submission = await db.formSubmission.findFirst({
    where: { id, shopDomain },
  });

  if (!submission) return null;

  return {
    ...submission,
    data: JSON.parse(submission.data) as Record<string, any>,
  };
}

// ── Delete a single submission ──────────────────────────────────────────────
export async function deleteSubmission(id: string, shopDomain: string) {
  return db.formSubmission.delete({
    where: { id },
  });
}

// ── Delete all submissions for a form ───────────────────────────────────────
export async function deleteAllSubmissions(formId: string, shopDomain: string) {
  return db.formSubmission.deleteMany({
    where: { formId, shopDomain },
  });
}

// ── Count submissions for a form ────────────────────────────────────────────
export async function getSubmissionCount(formId: string, shopDomain: string) {
  return db.formSubmission.count({
    where: { formId, shopDomain },
  });
}

// ── Submission trend (for dashboard stats) ──────────────────────────────────
export async function getSubmissionTrend(shopDomain: string, days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const submissions = await db.formSubmission.findMany({
    where: {
      shopDomain,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  // Group by date
  const grouped: Record<string, number> = {};
  for (const s of submissions) {
    const date = s.createdAt.toISOString().slice(0, 10);
    grouped[date] = (grouped[date] || 0) + 1;
  }

  // Fill in missing days
  const result: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    result.push({ date, count: grouped[date] || 0 });
  }

  return result;
}