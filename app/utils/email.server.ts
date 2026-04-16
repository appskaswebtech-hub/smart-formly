import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendSubmissionEmail({
  to, formName, submissionData, fields,
}: {
  to: string;
  formName: string;
  submissionData: Record<string, string>;
  fields: Array<{ id: string; label: string }>;
}) {
  const rows = fields
    .map((f) => `<tr><td style="padding:8px;font-weight:600;background:#f9f9f9">${f.label}</td>
                     <td style="padding:8px">${submissionData[f.id] || "—"}</td></tr>`)
    .join("");

  await transporter.sendMail({
    from: `SmartFormly <${process.env.SMTP_USER}>`,
    to,
    subject: `New submission: ${formName}`,
    html: `<h2 style="color:#5C6AC4">New form submission — ${formName}</h2>
           <table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:600px">
             ${rows}
           </table>
           <p style="color:#888;font-size:12px;margin-top:16px">Sent by SmartFormly</p>`,
  });
}