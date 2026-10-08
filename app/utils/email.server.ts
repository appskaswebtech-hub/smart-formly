import nodemailer, { type Transporter } from "nodemailer";

// ── Types ────────────────────────────────────────────────────────────────────

export type EmailField = {
  id:        string;
  label:     string;
  type?:     string;
  required?: boolean;
};

/**
 * An uploaded file offered as a download link rather than an attachment.
 *
 * Linking instead of attaching keeps the message small, sidesteps the ~25 MB
 * limit most mail servers impose, and means a large upload can never be the
 * reason a notification fails to arrive.
 */
export type MailFileLink = {
  filename: string;
  size:     number;
  url:      string;
};

export type MailResult =
  | { status: "sent";    messageId: string }
  | { status: "skipped"; reason: "no-transport" | "no-recipient" };

// ── Helpers ──────────────────────────────────────────────────────────────────

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

// Merchant email messages come from a plain <textarea>, so escape them and
// keep their line breaks.
function escapeMultiline(value: unknown): string {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, "<br>");
}

// Submission values can be arrays (checkbox groups) or objects.
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// Strip line breaks from anything that ends up in a mail header.
function headerSafe(value: unknown): string {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Transporter ──────────────────────────────────────────────────────────────

declare global {
  // undefined = not built yet, null = SMTP not configured
  var sfMailTransporter: Transporter | null | undefined;
  var sfMailVerify: Promise<boolean> | undefined;
}

function smtpPort(): number {
  return Number(process.env.SMTP_PORT) || 587;
}

function smtpSecure(): boolean {
  return process.env.SMTP_SECURE === "true" || smtpPort() === 465;
}

function buildTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "[SF:MAIL] SMTP not configured — emails disabled. " +
      `SMTP_HOST=${host || "MISSING"} SMTP_USER=${user || "MISSING"} SMTP_PASS=${pass ? "SET" : "MISSING"}`
    );
    return null;
  }

  const secure = smtpSecure();

  return nodemailer.createTransport({
    host,
    port:              smtpPort(),
    secure,                      // 465 → implicit TLS
    requireTLS:        !secure,  // 587 → refuse to send without STARTTLS
    auth:              { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout:   10_000,
    socketTimeout:     20_000,
  });
}

// Cached on globalThis so Vite HMR doesn't build a new transporter per reload.
export function getTransporter(): Transporter | null {
  if (global.sfMailTransporter === undefined) {
    global.sfMailTransporter = buildTransporter();
  }
  return global.sfMailTransporter;
}

// One-shot connectivity check. Never rejects, so it's safe to fire and forget.
export function verifyTransport(): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return Promise.resolve(false);

  global.sfMailVerify ??= transporter
    .verify()
    .then(() => {
      console.log(
        `[SF:MAIL] SMTP ready → ${process.env.SMTP_HOST}:${smtpPort()} ` +
        `secure=${smtpSecure()} user=${process.env.SMTP_USER}`
      );
      return true;
    })
    .catch((err: any) => {
      console.error("[SF:MAIL] SMTP verify failed:", err?.code, err?.message);
      return false;
    });

  return global.sfMailVerify;
}

// The From address is always the authenticated SMTP identity — Gmail rewrites
// or rejects anything else. Only the display name can be customised; the
// merchant's own address goes in Reply-To instead.
function senderIdentity(displayName?: string): { name: string; address: string } | string {
  const raw     = (process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
  const angle   = raw.match(/^(.*)<([^>]+)>\s*$/);
  const address = (angle ? angle[2] : raw).trim();
  const envName = angle ? angle[1].trim().replace(/^"|"$/g, "") : "";
  const name    = headerSafe(displayName) || envName;
  return name ? { name, address } : address;
}

function validEmailOrUndefined(email?: string): string | undefined {
  const value = headerSafe(email);
  return EMAIL_RE.test(value) ? value : undefined;
}

// ── Shared rendering ─────────────────────────────────────────────────────────

function renderRows(
  fields: EmailField[],
  data: Record<string, any>,
  opts: {
    hideHidden?:   boolean;
    hideEmpty?:    boolean;
    markRequired?: boolean;
    labelWeight?:  number;
    valueColor?:   string;
  } = {},
): string {
  return fields
    .filter((field) => !(opts.hideHidden && field.type === "hidden"))
    .map((field) => {
      const display = formatValue(data[field.id] ?? data[field.label] ?? "");
      if (opts.hideEmpty && !display.trim()) return "";

      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;font-weight:${opts.labelWeight ?? 600};color:#374151;width:40%">
            ${escapeHtml(field.label)}${opts.markRequired && field.required ? " *" : ""}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:${opts.valueColor ?? "#111827"}">
            ${escapeHtml(display) || "&mdash;"}
          </td>
        </tr>
      `;
    })
    .join("");
}

// Finds the submitter's address for the auto-responder: the first email-type
// field, or failing that the first field whose label mentions "email".
export function findSubmitterEmail(
  fields: EmailField[],
  data: Record<string, any>,
): string | null {
  const field = fields.find(
    (f) => f.type === "email" || (f.label ?? "").toLowerCase().includes("email")
  );
  if (!field) return null;

  const value = String(data[field.id] ?? data[field.label] ?? "").trim();
  return EMAIL_RE.test(value) ? value : null;
}

// ── Admin notification ───────────────────────────────────────────────────────

export async function sendFormSubmissionEmail({
  recipientEmail,
  formName,
  fields,
  submissionData,
  ticketNumber,
  adminEmailSettings,
  fileLinks,
}: {
  recipientEmail:      string;
  formName:            string;
  fields:              EmailField[];
  submissionData:      Record<string, any>;
  ticketNumber?:       number | null;
  /* Files the shopper uploaded, rendered as download links. */
  fileLinks?:          MailFileLink[];
  adminEmailSettings?: {
    adminEmailSubject?:          string;
    adminEmailIncludeDateTime?:  boolean;
    adminEmailUseShopTimezone?:  boolean;
    adminEmailMessage?:          string;
    adminEmailIncludeResponse?:  boolean;
    adminEmailHideHidden?:       boolean;
    adminEmailHideEmpty?:        boolean;
  };
}): Promise<MailResult> {
  const transporter = getTransporter();
  if (!transporter) return { status: "skipped", reason: "no-transport" };

  const to = headerSafe(recipientEmail);
  if (!to) return { status: "skipped", reason: "no-recipient" };

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
        ${escapeMultiline(s.adminEmailMessage)}
       </div>`
    : "";

  // ── Submission table ───────────────────────────────────────────────────────
  const rows = renderRows(fields, submissionData, {
    hideHidden:   s.adminEmailHideHidden,
    hideEmpty:    s.adminEmailHideEmpty,
    markRequired: true,
  });

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

  // ── Uploaded files ─────────────────────────────────────────────────────────
  // Linked rather than attached: the message stays small, and a large upload
  // can never be the reason the notification fails to arrive.
  const fileLinksBlock = fileLinks?.length
    ? `
      <div style="margin-top:24px;padding:16px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px">
        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:10px">
          ${fileLinks.length === 1 ? "Uploaded file" : "Uploaded files"}
        </div>
        ${fileLinks
          .map(
            (file) => `
          <div style="margin-bottom:8px">
            <a href="${escapeHtml(file.url)}"
               style="color:#5C6AC4;font-size:14px;font-weight:500;text-decoration:underline">
              ${escapeHtml(file.filename)}
            </a>
            <span style="color:#9CA3AF;font-size:12px"> (${formatBytes(file.size)})</span>
          </div>`,
          )
          .join("")}
        <div style="font-size:11.5px;color:#9CA3AF;margin-top:10px">
          Download links expire in 90 days.
        </div>
      </div>`
    : "";

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">

      <!-- Header -->
      <div style="background:#5C6AC4;padding:24px 32px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">New Form Submission</h1>
        <p style="color:#C7D2FE;margin:4px 0 0;font-size:14px">${escapeHtml(formName)}</p>
      </div>

      <!-- Body -->
      <div style="background:#fff;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 8px 8px;padding:24px 32px">

        <p style="color:#6B7280;font-size:14px;margin-top:0">
          You received a new submission on <strong>${new Date().toLocaleString()}</strong>
        </p>

        ${ticketBadge}
        ${customMessage}
        ${submissionTable}

        ${fileLinksBlock}

        <p style="margin-top:24px;font-size:12px;color:#9CA3AF">
          Sent by SmartFormly · You're receiving this because you enabled email notifications for this form.
        </p>

      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from:    senderIdentity(),
    to,
    subject: headerSafe(subject),
    html,
  });

  return { status: "sent", messageId: info.messageId };
}

// ── Auto-responder (to the person who submitted the form) ────────────────────

export async function sendAutoResponderEmail({
  toEmail,
  subject,
  message,
  footer,
  fromName,
  fromEmail,
  includeResponse,
  fields,
  submissionData,
  ticketNumber,
}: {
  toEmail:          string;
  subject:          string;
  message?:         string;
  footer?:          string;
  fromName?:        string;
  fromEmail?:       string;
  includeResponse?: boolean;
  fields:           EmailField[];
  submissionData:   Record<string, any>;
  ticketNumber?:    number | null;
}): Promise<MailResult> {
  const transporter = getTransporter();
  if (!transporter) return { status: "skipped", reason: "no-transport" };

  const to = validEmailOrUndefined(toEmail);
  if (!to) return { status: "skipped", reason: "no-recipient" };

  const submissionRows = includeResponse
    ? renderRows(fields, submissionData, { labelWeight: 500, valueColor: "#6B7280" })
    : "";

  // ── Ticket block — shown prominently at top of email ─────────────────────
  const ticketBlock = ticketNumber
    ? `<div style="
        margin:0 0 20px 0;
        padding:16px 20px;
        background:#EEF0FB;
        border:2px solid #c3c8f5;
        border-radius:8px;
        text-align:center;
      ">
        <div style="font-size:13px;color:#5C6AC4;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">
          Your Ticket Number
        </div>
        <div style="font-size:28px;font-weight:700;color:#3c3f8f;letter-spacing:0.02em;">
          #${ticketNumber}
        </div>
        <div style="font-size:12px;color:#6B7280;margin-top:4px;">
          Please keep this number for your records
        </div>
      </div>`
    : "";

  const emailSubject = ticketNumber
    ? `${headerSafe(subject)} [Ticket #${ticketNumber}]`
    : headerSafe(subject);

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827;">

      ${ticketBlock}

      ${message
        ? `<div style="padding:16px 0;font-size:14px;color:#111827;line-height:1.7;">
            ${escapeMultiline(message)}
          </div>`
        : ""}

      ${submissionRows
        ? `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
            <thead>
              <tr style="background:#F9FAFB;">
                <th style="padding:10px 12px;text-align:left;color:#6B7280;font-weight:600;border-bottom:2px solid #E5E7EB;">Field</th>
                <th style="padding:10px 12px;text-align:left;color:#6B7280;font-weight:600;border-bottom:2px solid #E5E7EB;">Your answer</th>
              </tr>
            </thead>
            <tbody>${submissionRows}</tbody>
          </table>`
        : ""}

      ${footer
        ? `<div style="padding:16px 0;font-size:12px;color:#9CA3AF;border-top:1px solid #E5E7EB;margin-top:16px;line-height:1.6;">
            ${escapeMultiline(footer)}
          </div>`
        : ""}

    </div>`;

  const info = await transporter.sendMail({
    from:    senderIdentity(fromName),
    replyTo: validEmailOrUndefined(fromEmail),
    to,
    subject: emailSubject,
    html,
  });

  return { status: "sent", messageId: info.messageId };
}

// Runs once when this module is first imported (boot in production, first
// submission in dev). Non-blocking and never throws.
void verifyTransport();
