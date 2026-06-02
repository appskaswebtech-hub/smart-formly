// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   host:   process.env.SMTP_HOST,
//   port:   Number(process.env.SMTP_PORT) || 587,
//   secure: process.env.SMTP_SECURE === "true",
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// export async function sendFormSubmissionEmail({
//   recipientEmail,
//   formName,
//   fields,
//   submissionData,
//   ticketNumber,   // ← now present in both params AND the type below
// }: {
//   recipientEmail: string;
//   formName:       string;
//   fields:         any[];
//   submissionData: Record<string, any>;
//   ticketNumber?:  number | null;        // ← was missing — this caused the TS error
// }) {
//   const rows = fields
//     .map((field) => {
//       const value = submissionData[field.id] ?? submissionData[field.label] ?? "—";
//       const displayValue = Array.isArray(value) ? value.join(", ") : value;
//       return `
//         <tr>
//           <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;font-weight:600;color:#374151;width:40%">
//             ${field.label}${field.required ? " *" : ""}
//           </td>
//           <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#111827">
//             ${displayValue}
//           </td>
//         </tr>
//       `;
//     })
//     .join("");

//   /* Ticket badge row — only rendered when ticketEnabled and a number was assigned */
//   const ticketBadge = ticketNumber
//     ? `<div style="margin:0 0 20px 0;padding:12px 16px;background:#EEF0FB;border:1px solid #c3c8f5;border-radius:8px;display:flex;align-items:center;gap:12px;">
//          <span style="font-size:20px">🎫</span>
//          <div>
//            <div style="font-size:12px;color:#5C6AC4;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Ticket number</div>
//            <div style="font-size:22px;font-weight:700;color:#3c3f8f;letter-spacing:.02em;">#${ticketNumber}</div>
//          </div>
//        </div>`
//     : "";

//   const html = `
//     <div style="font-family:sans-serif;max-width:600px;margin:0 auto">

//       <!-- Header -->
//       <div style="background:#5C6AC4;padding:24px 32px;border-radius:8px 8px 0 0">
//         <h1 style="color:#fff;margin:0;font-size:20px">New Form Submission</h1>
//         <p style="color:#C7D2FE;margin:4px 0 0;font-size:14px">${formName}</p>
//       </div>

//       <!-- Body -->
//       <div style="background:#fff;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 8px 8px;padding:24px 32px">

//         <p style="color:#6B7280;font-size:14px;margin-top:0">
//           You received a new submission on <strong>${new Date().toLocaleString()}</strong>
//         </p>

//         ${ticketBadge}

//         <table style="width:100%;border-collapse:collapse;font-size:14px">
//           <thead>
//             <tr style="background:#F9FAFB">
//               <th style="padding:8px 12px;text-align:left;color:#6B7280;font-weight:600;border-bottom:2px solid #E5E7EB">Field</th>
//               <th style="padding:8px 12px;text-align:left;color:#6B7280;font-weight:600;border-bottom:2px solid #E5E7EB">Response</th>
//             </tr>
//           </thead>
//           <tbody>${rows}</tbody>
//         </table>

//         <p style="margin-top:24px;font-size:12px;color:#9CA3AF">
//           Sent by SmartFormly · You're receiving this because you enabled email notifications for this form.
//         </p>

//       </div>
//     </div>
//   `;

//   await transporter.sendMail({
//     from:    process.env.SMTP_FROM,
//     to:      recipientEmail,
//     subject: ticketNumber
//       ? `New submission: ${formName} — Ticket #${ticketNumber}`
//       : `New submission: ${formName}`,
//     html,
//   });
// }

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendFormSubmissionEmail({
  recipientEmail,
  formName,
  fields,
  submissionData,
  ticketNumber,
  adminEmailSettings,
}: {
  recipientEmail:      string;
  formName:            string;
  fields:              any[];
  submissionData:      Record<string, any>;
  ticketNumber?:       number | null;
  adminEmailSettings?: {
    adminEmailSubject?:          string;
    adminEmailIncludeDateTime?:  boolean;
    adminEmailUseShopTimezone?:  boolean;
    adminEmailMessage?:          string;
    adminEmailIncludeResponse?:  boolean;
    adminEmailHideHidden?:       boolean;
    adminEmailHideEmpty?:        boolean;
  };
}) {
  const s = adminEmailSettings ?? {};

  // ── Build subject ──────────────────────────────────────────────────────────
  let subject = s.adminEmailSubject?.trim()
    ? s.adminEmailSubject
    : ticketNumber
      ? `New submission: ${formName} — Ticket #${ticketNumber}`
      : `New submission: ${formName}`;

  if (s.adminEmailIncludeDateTime) {
    const dateStr = new Date().toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    subject += ` — ${dateStr}`;
  }

  // ── Build submission rows ──────────────────────────────────────────────────
  let filteredFields = [...fields];

  // Hide hidden fields if requested (fields with type "hidden")
  if (s.adminEmailHideHidden) {
    filteredFields = filteredFields.filter((f) => f.type !== "hidden");
  }

  const rows = filteredFields
    .map((field) => {
      const value = submissionData[field.id] ?? submissionData[field.label] ?? "";
      const displayValue = Array.isArray(value) ? value.join(", ") : String(value);

      // Hide empty fields if requested
      if (s.adminEmailHideEmpty && (!displayValue || displayValue.trim() === "")) {
        return "";
      }

      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;font-weight:600;color:#374151;width:40%">
            ${field.label}${field.required ? " *" : ""}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#111827">
            ${displayValue || "—"}
          </td>
        </tr>
      `;
    })
    .join("");

  // ── Ticket badge ───────────────────────────────────────────────────────────
  const ticketBadge = ticketNumber
    ? `<div style="margin:0 0 20px 0;padding:12px 16px;background:#EEF0FB;border:1px solid #c3c8f5;border-radius:8px;display:flex;align-items:center;gap:12px;">
         <span style="font-size:20px">🎫</span>
         <div>
           <div style="font-size:12px;color:#5C6AC4;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Ticket number</div>
           <div style="font-size:22px;font-weight:700;color:#3c3f8f;letter-spacing:.02em;">#${ticketNumber}</div>
         </div>
       </div>`
    : "";

  // ── Custom message ─────────────────────────────────────────────────────────
  const customMessage = s.adminEmailMessage?.trim()
    ? `<div style="padding:12px 0 16px;font-size:14px;color:#374151;line-height:1.7;border-bottom:1px solid #E5E7EB;margin-bottom:16px;">
        ${s.adminEmailMessage}
       </div>`
    : "";

  // ── Submission table ───────────────────────────────────────────────────────
  const submissionTable = s.adminEmailIncludeResponse === false ? "" : `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#F9FAFB">
          <th style="padding:8px 12px;text-align:left;color:#6B7280;font-weight:600;border-bottom:2px solid #E5E7EB">Field</th>
          <th style="padding:8px 12px;text-align:left;color:#6B7280;font-weight:600;border-bottom:2px solid #E5E7EB">Response</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">

      <!-- Header -->
      <div style="background:#5C6AC4;padding:24px 32px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">New Form Submission</h1>
        <p style="color:#C7D2FE;margin:4px 0 0;font-size:14px">${formName}</p>
      </div>

      <!-- Body -->
      <div style="background:#fff;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 8px 8px;padding:24px 32px">

        <p style="color:#6B7280;font-size:14px;margin-top:0">
          You received a new submission on <strong>${new Date().toLocaleString()}</strong>
        </p>

        ${ticketBadge}
        ${customMessage}
        ${submissionTable}

        <p style="margin-top:24px;font-size:12px;color:#9CA3AF">
          Sent by SmartFormly · You're receiving this because you enabled email notifications for this form.
        </p>

      </div>
    </div>
  `;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to:      recipientEmail,
    subject,
    html,
  });
}