//For Resend

// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// export async function sendFormSubmissionEmail({
//   recipientEmail,
//   formName,
//   fields,
//   submissionData,
// }: {
//   recipientEmail: string;
//   formName: string;
//   fields: any[];
//   submissionData: Record<string, any>;
// }) {
//   const rows = fields
//     .map((field) => {
//       const value =
//         submissionData[field.id] ??
//         submissionData[field.label] ??
//         "—";
//       return `
//         <tr>
//           <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;
//                      font-weight:600;color:#374151;width:40%">
//             ${field.label}${field.required ? " *" : ""}
//           </td>
//           <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#111827">
//             ${value}
//           </td>
//         </tr>
//       `;
//     })
//     .join("");

//   const html = `
//     <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
//       <div style="background:#5C6AC4;padding:24px 32px;border-radius:8px 8px 0 0">
//         <h1 style="color:#fff;margin:0;font-size:20px">New Form Submission</h1>
//         <p style="color:#C7D2FE;margin:4px 0 0;font-size:14px">${formName}</p>
//       </div>
//       <div style="background:#fff;border:1px solid #E5E7EB;border-top:none;
//                   border-radius:0 0 8px 8px;padding:24px 32px">
//         <p style="color:#6B7280;font-size:14px;margin-top:0">
//           You received a new submission on
//           <strong>${new Date().toLocaleString()}</strong>
//         </p>
//         <table style="width:100%;border-collapse:collapse;font-size:14px">
//           <thead>
//             <tr style="background:#F9FAFB">
//               <th style="padding:8px 12px;text-align:left;color:#6B7280;
//                          font-weight:600;border-bottom:2px solid #E5E7EB">
//                 Field
//               </th>
//               <th style="padding:8px 12px;text-align:left;color:#6B7280;
//                          font-weight:600;border-bottom:2px solid #E5E7EB">
//                 Response
//               </th>
//             </tr>
//           </thead>
//           <tbody>${rows}</tbody>
//         </table>
//         <p style="margin-top:24px;font-size:12px;color:#9CA3AF">
//           Sent by SmartFormly · You're receiving this because you enabled
//           email notifications for this form.
//         </p>
//       </div>
//     </div>
//   `;

//   const { error } = await resend.emails.send({
//     from: "SmartFormly <onboarding@resend.dev>", // ← your verified domain
//     to: recipientEmail,   // ← merchant's email they entered in the form settings
//     subject: `New submission: ${formName}`,
//     html,
//   });

//   if (error) {
//     throw new Error(`Email failed: ${error.message}`);
//   }
// }

// For SMTP

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendFormSubmissionEmail({
  recipientEmail,
  formName,
  fields,
  submissionData,
}: {
  recipientEmail: string;
  formName: string;
  fields: any[];
  submissionData: Record<string, any>;
}) {
  const rows = fields
    .map((field) => {
      const value = submissionData[field.id] ?? submissionData[field.label] ?? "—";
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;font-weight:600;color:#374151;width:40%">
            ${field.label}${field.required ? " *" : ""}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#111827">
            ${value}
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#5C6AC4;padding:24px 32px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">New Form Submission</h1>
        <p style="color:#C7D2FE;margin:4px 0 0;font-size:14px">${formName}</p>
      </div>
      <div style="background:#fff;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 8px 8px;padding:24px 32px">
        <p style="color:#6B7280;font-size:14px;margin-top:0">
          You received a new submission on <strong>${new Date().toLocaleString()}</strong>
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#F9FAFB">
              <th style="padding:8px 12px;text-align:left;color:#6B7280;font-weight:600;border-bottom:2px solid #E5E7EB">Field</th>
              <th style="padding:8px 12px;text-align:left;color:#6B7280;font-weight:600;border-bottom:2px solid #E5E7EB">Response</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:24px;font-size:12px;color:#9CA3AF">
          Sent by SmartFormly · You're receiving this because you enabled email notifications for this form.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"SmartFormly" <${process.env.GMAIL_USER}>`,
    to: recipientEmail,
    subject: `New submission: ${formName}`,
    html,
  });
}