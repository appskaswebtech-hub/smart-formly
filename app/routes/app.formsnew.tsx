import { useState, useEffect, useRef } from "react";
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useSubmit, useActionData, useNavigation } from "@remix-run/react";
import { Trans, useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";
import i18next from "../i18n/i18next.server";
import { resolveLocale } from "../i18n/resolve.server";
import { createForm } from "../models/form.server";
import type { FormField, FormSettings } from "../models/form.server";
import { v4 as uuidv4 } from "uuid";
import {
  Page, Card, Text, BlockStack, InlineStack,
  Button, TextField, Select, Checkbox, Badge,
  Tabs, Divider, Box, Banner,
} from "@shopify/polaris";

export const handle = { i18n: ["forms", "common"] };

/* ── ColorInput ── */
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Text as="p" variant="bodySm" fontWeight="semibold">{label}</Text>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width: 36, height: 36, border: "1px solid #D1D5DB", borderRadius: 6, padding: 2, cursor: "pointer" }} />
        <div style={{ flex: 1 }}>
          <TextField label="" labelHidden value={value} onChange={onChange} autoComplete="off" />
        </div>
      </div>
    </div>
  );
}

/* ── RadioGroup ── */
function RadioGroup({ label, options, value, onChange }: {
  label: string; options: { label: string; value: string }[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <Text as="p" variant="bodySm" fontWeight="semibold">{label}</Text>
      <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
        {options.map(o => (
          <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
            <input type="radio" checked={value === o.value} onChange={() => onChange(o.value)} style={{ accentColor: "#5C6AC4" }} />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ── Pill ── */
function Pill({ label, plan, active, onClick }: {
  label: string; plan?: "pro" | "pro_plus"; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 11px", borderRadius: 5, cursor: "pointer",
      border: active ? "2px solid #5C6AC4" : "1px solid #D1D5DB",
      background: active ? "#EEF0FB" : "#fff",
      fontSize: 13, fontWeight: active ? 600 : 400,
      color: active ? "#5C6AC4" : "#111827",
      whiteSpace: "nowrap", fontFamily: "inherit", transition: "all .12s",
    }}>
      {label}
      {plan === "pro" && (
        <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3, background: "#E3F1DF", color: "#108043", fontWeight: 700 }}>Pro</span>
      )}
      {plan === "pro_plus" && (
        <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3, background: "#FDF3D0", color: "#B98900", fontWeight: 700 }}>Pro+</span>
      )}
    </button>
  );
}

/* ── DTField ── */
function DTField({ label, type, value, onChange }: { label: string; type: "date" | "time"; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Text as="p" variant="bodySm" fontWeight="semibold">{label}</Text>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 4, fontSize: 14, fontFamily: "inherit" }} />
        {value && (
          <button onClick={() => onChange("")}
            style={{ padding: "6px 10px", border: "1px solid #D1D5DB", borderRadius: 4, background: "#fff", cursor: "pointer", color: "#6B7280", fontSize: 13 }}>✕</button>
        )}
      </div>
    </div>
  );
}

/* ── RichArea ── */
function RichArea({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      {label && <Text as="p" variant="bodySm" fontWeight="semibold">{label}</Text>}
      <div style={{ border: "1px solid #D1D5DB", borderRadius: 6, overflow: "hidden", marginTop: label ? 4 : 0 }}>
        <div style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "5px 8px", display: "flex", gap: 4 }}>
          {["B", "I", "U", "S"].map(t => (
            <button key={t} style={{ padding: "2px 6px", border: "1px solid #D1D5DB", borderRadius: 3, background: "#fff", cursor: "pointer", fontSize: 11, fontWeight: t === "B" ? 700 : 400, fontFamily: "inherit" }}>{t}</button>
          ))}
        </div>
        <textarea value={value} onChange={e => onChange(e.target.value)}
          style={{ width: "100%", minHeight: 100, padding: "8px 10px", border: "none", outline: "none", fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════════ */
type DesignSettings = {
  bgType: "transparent" | "color" | "gradient";
  bgColor: string; bgColor2: string; bgShadow: string;
  formWidth: string; formPadding: string;
  borderColor: string; borderRadius: string; borderSize: string;
  inputBg: string; inputBorderColor: string; inputBorderFocusColor: string;
  inputBorderRadius: string; inputFontSize: string; inputFontColor: string;
  inputPlaceholderColor: string;
  labelFontSize: string; labelColor: string; labelStyle: "block" | "inline" | "floating";
  buttonBg: string; buttonText: string; buttonTextColor: string;
  buttonAlignment: "full" | "left" | "center" | "right";
  buttonFontSize: string; buttonBorderColor: string; buttonBorderRadius: string; buttonBorderWidth: string;
  formBannerUrl: string; formBannerHeight: string; formBannerWidth: string; formBannerAlignment: "left" | "center" | "right";
  formDescription: string;
};

type ExtraSettings = {
  // Ticket system
  ticketEnabled: boolean;
  // Allow form access
  allowLoggedInOnly: boolean; loginMessage: string;
  // Form schedule
  scheduleStartDate: string; scheduleEndDate: string;
  scheduleStartTime: string; scheduleEndTime: string;
  scheduleMaxSubmissions: string;
  beforeStartMessage: string; afterEndMessage: string; submissionClosedMessage: string;
  // Customize messages
  submitButtonText: string; errorMessage: string; requiredFieldMessage: string;
  // Scrolling
  scrollBehavior: string; scrollOffset: string;
  // After submission
  afterSubmissionAction: string; redirectUrl: string;
  thankYouMessage: string; thankYouTimerSec: string;
  // Script
  afterSubmitScript: string;
  // Auto responder
  autoResponderFromName: string; autoResponderFromEmail: string;
  autoResponderSubject: string; autoResponderMessage: string;
  autoResponderIncludeResponse: boolean; autoResponderFooter: string;
  // Admin email
  adminEmailSubject: string; adminEmailIncludeDateTime: boolean;
  adminEmailUseShopTimezone: boolean; adminEmailMessage: string;
  adminEmailIncludeResponse: boolean; adminEmailHideHidden: boolean; adminEmailHideEmpty: boolean;
  // Email export
  emailExportEnabled: boolean; emailExportTo: string; emailExportFrequency: string;
  // Popup
  popupEnabled: boolean;
  popupTrigger: "button" | "delay" | "exit_intent";
  popupButtonText: string;
  popupButtonBg: string;
  popupButtonColor: string;
  popupDelay: string;
  popupOverlayBg: string;
  popupOverlayOpacity: string;
  popupCloseOnOverlay: boolean;
  popupWidth: string;
  popupShowOnce: boolean;
};

const defaultExtra: ExtraSettings = {
  ticketEnabled: false,
  allowLoggedInOnly: false, loginMessage: "Please login to access the form\nDo not have an account? Create account",
  scheduleStartDate: "", scheduleEndDate: "", scheduleStartTime: "", scheduleEndTime: "",
  scheduleMaxSubmissions: "", beforeStartMessage: "", afterEndMessage: "", submissionClosedMessage: "",
  submitButtonText: "Submit", errorMessage: "Something went wrong. Please try again.", requiredFieldMessage: "This field is required.",
  scrollBehavior: "scroll_to_top", scrollOffset: "0",
  afterSubmissionAction: "clear_and_allow", redirectUrl: "", thankYouMessage: "", thankYouTimerSec: "5",
  afterSubmitScript: "",
  autoResponderFromName: "", autoResponderFromEmail: "", autoResponderSubject: "",
  autoResponderMessage: "", autoResponderIncludeResponse: false, autoResponderFooter: "",
  adminEmailSubject: "New form submission received.", adminEmailIncludeDateTime: true,
  adminEmailUseShopTimezone: false, adminEmailMessage: "Hi [first-name of store owner],\nSomeone just submitted a response to your form.",
  adminEmailIncludeResponse: true, adminEmailHideHidden: false, adminEmailHideEmpty: false,
  emailExportEnabled: false, emailExportTo: "", emailExportFrequency: "weekly",
  // ✅ FIX: use hex, not rgba — <input type="color"> does not accept rgba
  popupEnabled: false,
  popupTrigger: "button",
  popupButtonText: "Open Form",
  popupButtonBg: "#000000",
  popupButtonColor: "#ffffff",
  popupDelay: "3",
  popupOverlayBg: "#000000",
  popupOverlayOpacity: "0.5",
  popupCloseOnOverlay: true,
  popupWidth: "600",
  popupShowOnce: false,
};

const defaultDesign: DesignSettings = {
  bgType: "transparent", bgColor: "#ffffff", bgColor2: "#f0f0f0",
  bgShadow: "none", formWidth: "600px", formPadding: "30",
  borderColor: "#000000", borderRadius: "1", borderSize: "2",
  inputBg: "#ffffff", inputBorderColor: "#000000", inputBorderFocusColor: "#5C6AC4",
  inputBorderRadius: "1", inputFontSize: "14", inputFontColor: "#000000",
  inputPlaceholderColor: "#9CA3AF",
  labelFontSize: "14", labelColor: "#000000", labelStyle: "block",
  buttonBg: "#000000", buttonText: "Submit", buttonTextColor: "#ffffff",
  buttonAlignment: "full", buttonFontSize: "16",
  buttonBorderColor: "#000000", buttonBorderRadius: "2", buttonBorderWidth: "1",
  formBannerUrl: "", formBannerHeight: "200", formBannerWidth: "100%",
  formBannerAlignment: "center", formDescription: "",
};

// Labels live in the `forms` namespace under `fieldTypes.<type>` / `pills.<key>`
// and are resolved at render time — these constants are evaluated at import,
// before i18next knows the request's language.
const FIELD_TYPES = [
  { type: "text",     icon: "T" },
  { type: "email",    icon: "@" },
  { type: "phone",    icon: "☎" },
  { type: "textarea", icon: "¶" },
  { type: "select",   icon: "▾" },
  { type: "checkbox", icon: "☑" },
  { type: "file",     icon: "⬆" },
  { type: "number",   icon: "#" },
  { type: "date",     icon: "📅" },
  { type: "time",     icon: "🕐" },
] as const;

// Local (not UTC) yyyy-mm-dd, to match what <input type="date"> expects.
function todayISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

const PILLS = [
  { key: "form_details" },
  { key: "ticket_system",            plan: "pro_plus" as const },
  { key: "allow_form_access",        plan: "pro_plus" as const },
  { key: "form_schedule",            plan: "pro" as const },
  { key: "customize_form_messages",  plan: "pro" as const },
  { key: "customize_form_scrolling", plan: "pro" as const },
  { key: "after_submission_action" },
  { key: "after_submit_script",      plan: "pro" as const },
  { key: "auto_responder_email" },
  { key: "admin_email" },
  { key: "email_export",             plan: "pro" as const },
  { key: "form_load_as_popup",       plan: "pro" as const },
];

/* ══════════════════════════════════════════════════════════════════════
   LOADER / ACTION
   ══════════════════════════════════════════════════════════════════ */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  // These errors are rendered to the merchant, so they must follow the same
  // locale the page was rendered in — not the server's default.
  const t = await i18next.getFixedT(await resolveLocale(request), "forms");
  try {
    const body        = await request.formData();
    const formName    = body.get("formName") as string;
    const fields      = JSON.parse(body.get("fields") as string) as FormField[];
    const rawSettings = JSON.parse(body.get("settings") as string);
    const { isActive, design, extra, ...settings } = rawSettings;

    if (!formName?.trim()) return json({ error: t("errors.nameRequired") }, { status: 422 });
    if (!fields || fields.length === 0) return json({ error: t("errors.addField") }, { status: 422 });

    await createForm(session.shop, formName, fields, {
      settings: { ...settings, extra: extra ?? {} },
      design: design ?? {},
      isActive: isActive === true,
    });

    return redirect("/app/formsly?created=1");
  } catch (err) {
    console.error("FORM SAVE ERROR:", err);
    return json({ error: err instanceof Error ? err.message : t("errors.unknown") }, { status: 500 });
  }
};

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function NewForm() {
  const submit     = useSubmit();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const saving     = navigation.state === "submitting";
  const { t } = useTranslation(["forms", "common"]);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [bannerFile,    setBannerFile]    = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");

  const [formName,        setFormName]        = useState("My Form");
  const [fields,          setFields]          = useState<FormField[]>([]);
  const [settings,        setSettings]        = useState<FormSettings>({
    recipientEmail: "", successMessage: "Thank you! Your form has been submitted.",
    submitLabel: "Submit", notifyOnSubmit: true,
  });
  const [design,          setDesign]          = useState<DesignSettings>(defaultDesign);
  const [extra,           setExtra]           = useState<ExtraSettings>(defaultExtra);
  const [activeTab,       setActiveTab]       = useState(0);
  const [activePill,      setActivePill]      = useState("form_details");
  const [activeDesignTab, setActiveDesignTab] = useState(0);
  const [error,           setError]           = useState("");
  const [optionInputs,    setOptionInputs]    = useState<Record<string, string>>({});
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [showAddElement,  setShowAddElement]  = useState(false);

  const d  = design;
  const setD = (p: Partial<DesignSettings>) => setDesign(prev => ({ ...prev, ...p }));
  const setE = (p: Partial<ExtraSettings>)  => setExtra(prev  => ({ ...prev, ...p }));

  useEffect(() => {
    if ((actionData as any)?.error) setError((actionData as any).error);
  }, [actionData]);

  /* ── Field helpers ── */
  function addField(type: FormField["type"]) {
    // Seeds the field's editable label in the merchant's language.
    const label = t(`fieldTypes.${type}`, { defaultValue: type });
    const nf: FormField = {
      id: uuidv4(), type, label, placeholder: "", required: false,
      halfWidth: false, fieldInCenter: false, sendSubmissionEmail: false, emailValidation: false,
      options: type === "select" || type === "checkbox" ? ["Option 1", "Option 2"] : undefined,
      // Quantities start at 1 with no upper bound until the merchant sets one.
      min: type === "number" ? "1" : undefined,
      max: undefined,
      dateFormat: type === "date" ? "us" : undefined,
    };
    setFields(prev => [...prev, nf]);
    setExpandedFieldId(nf.id);
    setShowAddElement(false);
  }
  function updateField(id: string, patch: Partial<FormField>) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  }
  function deleteField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id));
    if (expandedFieldId === id) setExpandedFieldId(null);
  }
  function moveField(id: string, dir: "up" | "down") {
    setFields(prev => {
      const idx  = prev.findIndex(f => f.id === id);
      const next = [...prev];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }
  function addOption(fid: string) {
    const val = (optionInputs[fid] ?? "").trim();
    if (!val) return;
    updateField(fid, { options: [...(fields.find(f => f.id === fid)?.options ?? []), val] });
    setOptionInputs(p => ({ ...p, [fid]: "" }));
  }

  /* ── Save ── */
  function handleSave(isActive: boolean) {
    if (!formName.trim()) { setError(t("errors.nameRequired")); return; }
    if (fields.length === 0) { setError(t("errors.addField")); return; }
    setError("");
    const fd = new FormData();
    fd.append("formName", formName);
    fd.append("fields",   JSON.stringify(fields));
    fd.append("settings", JSON.stringify({ ...settings, design, extra, isActive }));
    submit(fd, { method: "POST" });
  }

  /* ── Tabs ── */
  const mainTabs = [
    { id: "settings",    content: t("mainTabs.settings") },
    { id: "design",      content: t("mainTabs.design") },
    { id: "integration", content: t("mainTabs.integration") },
  ];
  const designTabs = [
    { id: "heading",  content: t("designTabs.heading") },
    { id: "elements", content: t("designTabs.elements") },
    { id: "captcha",  content: t("designTabs.captcha") },
    { id: "form",     content: t("designTabs.form") },
    { id: "input",    content: t("designTabs.input") },
    { id: "button",   content: t("designTabs.button") },
    { id: "layout",   content: t("designTabs.layout") },
  ];

  /* ── Styles ── */
  const pInput: React.CSSProperties = {
    width: "100%", padding: "8px 10px",
    border: `1px solid ${d.inputBorderColor}`,
    borderRadius: `${d.inputBorderRadius}px`,
    background: d.inputBg, fontSize: Number(d.inputFontSize),
    fontFamily: "inherit", boxSizing: "border-box", color: d.inputFontColor,
  };
  const iconBtn: React.CSSProperties = {
    background: "none", border: "1px solid #E5E7EB",
    borderRadius: 6, padding: "3px 7px", cursor: "pointer", fontSize: 12, color: "#6B7280",
  };

  function renderPreview(field: FormField) {
    switch (field.type) {
      case "textarea": return <textarea placeholder={field.placeholder} style={pInput} rows={3} />;
      case "select":   return <select style={pInput}><option>{t("preview.pleaseSelect")}</option>{(field.options??[]).map(o=><option key={o}>{o}</option>)}</select>;
      case "checkbox": return <div style={{display:"flex",flexDirection:"column",gap:4}}>{(field.options??[]).map(o=><label key={o} style={{display:"flex",gap:8,alignItems:"center",fontSize:14}}><input type="checkbox"/>{o}</label>)}</div>;
      case "file":     return <input type="file" style={{fontSize:13}} />;
      case "number":   return <input type="number" placeholder={field.placeholder} min={field.min || undefined} max={field.max || undefined} style={pInput} />;
      case "date":     return <input type="date" min={field.disablePastDates ? todayISO() : undefined} style={pInput} />;
      default:         return <input type={field.type} placeholder={field.placeholder} style={pInput} />;
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     PILL CONTENT
     ══════════════════════════════════════════════════════════════ */
  function renderPillContent() {
    switch (activePill) {

      case "form_details": return (
        <BlockStack gap="500">
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm" fontWeight="semibold">{t("details.heading")}</Text>
            <TextField label={t("details.formName")} value={formName} onChange={setFormName} autoComplete="off" />
            <TextField label={t("details.notificationEmail")} value={settings.recipientEmail}
              onChange={v => setSettings(s => ({...s, recipientEmail: v}))} placeholder={t("details.notificationEmailPlaceholder")} autoComplete="off" />
            <TextField label={t("details.successMessage")} value={settings.successMessage}
              onChange={v => setSettings(s => ({...s, successMessage: v}))} autoComplete="off" />
            <Checkbox label={t("details.notifyOnSubmit")} checked={settings.notifyOnSubmit}
              onChange={v => setSettings(s => ({...s, notifyOnSubmit: v}))} />
          </BlockStack>
          <Divider />
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm" fontWeight="semibold">{t("details.elementsHeading")}</Text>
            <Text as="p" variant="bodySm" tone="subdued">{t("details.clickToAdd")}</Text>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {FIELD_TYPES.map(ft => (
                <button key={ft.type} onClick={() => addField(ft.type as FormField["type"])}
                  style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"#fff",border:"1px solid #E5E7EB",borderRadius:8,cursor:"pointer",textAlign:"left",fontFamily:"inherit" }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor="#5C6AC4")}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor="#E5E7EB")}>
                  <span style={{width:28,height:28,borderRadius:6,background:"#EEF0FB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#5C6AC4",flexShrink:0}}>{ft.icon}</span>
                  <span style={{fontSize:12.5,fontWeight:500,color:"#111827"}}>{t(`fieldTypes.${ft.type}`)}</span>
                </button>
              ))}
            </div>
          </BlockStack>
          {fields.length > 0 && (
            <><Divider />
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" fontWeight="semibold">{t("details.fieldsCount", { count: fields.length })}</Text>
              {fields.map(f => (
                <div key={f.id} style={{padding:"8px 12px",background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <Text as="span" variant="bodySm" fontWeight="semibold">{f.label}</Text>
                    <Badge>{f.type}</Badge>
                    {f.required && <Badge tone="attention">{t("details.requiredBadge")}</Badge>}
                  </div>
                  <button onClick={()=>deleteField(f.id)} style={{...iconBtn,color:"#C0392B"}}>✕</button>
                </div>
              ))}
            </BlockStack></>
          )}
        </BlockStack>
      );

      case "ticket_system": return (
        <BlockStack gap="400">
          <Text as="p" variant="bodySm" tone="subdued">
            {t("ticket.description")}
          </Text>
          <Checkbox
            label={<InlineStack gap="200" blockAlign="center"><span>{t("ticket.enable")}</span><Badge tone="warning" size="small">Pro+</Badge></InlineStack>}
            checked={extra.ticketEnabled}
            onChange={v => setE({ ticketEnabled: v })}
          />
        </BlockStack>
      );

      case "allow_form_access": return (
        <BlockStack gap="400">
          <Checkbox
            label={<InlineStack gap="200" blockAlign="center"><span>{t("access.loggedInOnly")}</span><Badge tone="warning" size="small">Pro+</Badge></InlineStack>}
            checked={extra.allowLoggedInOnly}
            onChange={v => setE({ allowLoggedInOnly: v })}
          />
          {extra.allowLoggedInOnly && (
            <RichArea label={t("access.loginMessage")} value={extra.loginMessage} onChange={v => setE({ loginMessage: v })} />
          )}
        </BlockStack>
      );

      case "form_schedule": return (
        <BlockStack gap="400">
          <Text as="h3" variant="headingSm" fontWeight="semibold">{t("schedule.heading")}</Text>
          <DTField label={t("schedule.startDate")} type="date" value={extra.scheduleStartDate} onChange={v => setE({ scheduleStartDate: v })} />
          <DTField label={t("schedule.endDate")}   type="date" value={extra.scheduleEndDate}   onChange={v => setE({ scheduleEndDate: v })} />
          <DTField label={t("schedule.startTime")} type="time" value={extra.scheduleStartTime} onChange={v => setE({ scheduleStartTime: v })} />
          <DTField label={t("schedule.endTime")}   type="time" value={extra.scheduleEndTime}   onChange={v => setE({ scheduleEndTime: v })} />
          <TextField label={t("schedule.maxSubmissions")} type="number"
            value={extra.scheduleMaxSubmissions} onChange={v => setE({ scheduleMaxSubmissions: v })}
            placeholder={t("schedule.maxSubmissionsPlaceholder")} helpText={t("schedule.maxSubmissionsHelp")} autoComplete="off" />
          <Divider />
          <Text as="h3" variant="headingSm" fontWeight="semibold">{t("schedule.messagesHeading")}</Text>
          <RichArea label={t("schedule.beforeStart")} value={extra.beforeStartMessage} onChange={v => setE({ beforeStartMessage: v })} />
          <RichArea label={t("schedule.afterEnd")}    value={extra.afterEndMessage}    onChange={v => setE({ afterEndMessage: v })} />
          <RichArea label={t("schedule.closed")} value={extra.submissionClosedMessage} onChange={v => setE({ submissionClosedMessage: v })} />
        </BlockStack>
      );

      case "customize_form_messages": return (
        <BlockStack gap="400">
          <TextField label={t("messages.submitButtonText")}     value={extra.submitButtonText}    onChange={v => setE({ submitButtonText: v })}    autoComplete="off" />
          <TextField label={t("messages.successMessage")}        value={settings.successMessage}   onChange={v => setSettings(s => ({...s, successMessage: v}))} autoComplete="off" />
          <TextField label={t("messages.errorMessage")}          value={extra.errorMessage}        onChange={v => setE({ errorMessage: v })}        autoComplete="off" multiline={2} />
          <TextField label={t("messages.requiredFieldMessage")} value={extra.requiredFieldMessage} onChange={v => setE({ requiredFieldMessage: v })} autoComplete="off" />
        </BlockStack>
      );

      case "customize_form_scrolling": return (
        <BlockStack gap="400">
          <Select label={t("scrolling.behavior")}
            options={[
              { label: t("scrolling.toTop"),     value: "scroll_to_top" },
              { label: t("scrolling.toMessage"), value: "scroll_to_message" },
              { label: t("scrolling.none"),      value: "none" },
            ]}
            value={extra.scrollBehavior} onChange={v => setE({ scrollBehavior: v })} />
          {extra.scrollBehavior !== "none" && (
            <TextField label={t("scrolling.offset")} type="number" value={extra.scrollOffset}
              onChange={v => setE({ scrollOffset: v })}
              helpText={t("scrolling.offsetHelp")} autoComplete="off" />
          )}
        </BlockStack>
      );

      case "after_submission_action": return (
        <BlockStack gap="400">
          <Select label={t("afterSubmission.action")}
            options={[
              { label: t("afterSubmission.oneEntry"),        value: "one_entry" },
              { label: t("afterSubmission.clearAndAllow"),   value: "clear_and_allow" },
              { label: t("afterSubmission.redirect"),        value: "redirect" },
              { label: t("afterSubmission.hideAndShow"),     value: "hide_and_show_message" },
              { label: t("afterSubmission.showAndDownload"), value: "show_and_download" },
            ]}
            value={extra.afterSubmissionAction} onChange={v => setE({ afterSubmissionAction: v })} />
          {extra.afterSubmissionAction === "redirect" && (
            <TextField label={t("afterSubmission.redirectUrl")} value={extra.redirectUrl} onChange={v => setE({ redirectUrl: v })}
              placeholder={t("afterSubmission.redirectUrlPlaceholder")} autoComplete="off" />
          )}
          {(extra.afterSubmissionAction === "hide_and_show_message" || extra.afterSubmissionAction === "one_entry") && (
            <BlockStack gap="300">
              <TextField label={t("afterSubmission.timer")} type="number"
                value={extra.thankYouTimerSec}
                onChange={v => setE({ thankYouTimerSec: String(Math.min(30, Number(v))) })}
                autoComplete="off" />
              <RichArea label={t("afterSubmission.thankYouMessage")} value={extra.thankYouMessage} onChange={v => setE({ thankYouMessage: v })} />
            </BlockStack>
          )}
        </BlockStack>
      );

      case "after_submit_script": return (
        <BlockStack gap="400">
          <Banner tone="info">
            <Text as="p" variant="bodySm">
              <Trans i18nKey="forms:script.banner" components={{ code: <code /> }} />
            </Text>
          </Banner>
          <TextField label={t("script.label")} value={extra.afterSubmitScript}
            onChange={v => setE({ afterSubmitScript: v })} multiline={10}
            placeholder={"// Example:\ngtag('event', 'form_submit', { form_id: formData.id });"}
            autoComplete="off" monospaced />
        </BlockStack>
      );

      case "auto_responder_email": return (
        <BlockStack gap="400">
          <Divider />
          <Text as="h3" variant="headingSm" fontWeight="semibold">{t("autoResponder.emailDetails")}</Text>
          <TextField label={t("autoResponder.fromName")} value={extra.autoResponderFromName}
            onChange={v => setE({ autoResponderFromName: v })} placeholder={t("autoResponder.fromNamePlaceholder")} autoComplete="off" />
          <TextField label={t("autoResponder.fromEmail")} type="email" value={extra.autoResponderFromEmail}
            onChange={v => setE({ autoResponderFromEmail: v })} placeholder={t("autoResponder.fromEmailPlaceholder")}
            helpText={t("autoResponder.fromEmailHelp")} autoComplete="email" />
          <TextField label={t("autoResponder.subject")} value={extra.autoResponderSubject}
            onChange={v => setE({ autoResponderSubject: v })} placeholder={t("autoResponder.subjectPlaceholder")} autoComplete="off" />
          <Divider />
          <Text as="h3" variant="headingSm" fontWeight="semibold">{t("autoResponder.bodyHeading")}</Text>
          <RichArea label={t("autoResponder.message")} value={extra.autoResponderMessage} onChange={v => setE({ autoResponderMessage: v })} />
          <Checkbox
            label={<InlineStack gap="200" blockAlign="center"><span>{t("autoResponder.includeResponse")}</span><Badge tone="success" size="small">Pro</Badge></InlineStack>}
            checked={extra.autoResponderIncludeResponse}
            onChange={v => setE({ autoResponderIncludeResponse: v })} />
          <Divider />
          <Text as="h3" variant="headingSm" fontWeight="semibold">{t("autoResponder.footerHeading")}</Text>
          <RichArea label={t("autoResponder.footerMessage")} value={extra.autoResponderFooter} onChange={v => setE({ autoResponderFooter: v })} />
        </BlockStack>
      );

      case "admin_email": return (
        <BlockStack gap="400">
          <Text as="h3" variant="headingSm" fontWeight="semibold">{t("adminEmail.subjectHeading")}</Text>
          <TextField label={t("adminEmail.subject")} value={extra.adminEmailSubject}
            onChange={v => setE({ adminEmailSubject: v })} placeholder={t("adminEmail.subjectPlaceholder")} autoComplete="off" />
          <Checkbox label={t("adminEmail.includeDateTime")}
            checked={extra.adminEmailIncludeDateTime}
            onChange={v => setE({ adminEmailIncludeDateTime: v })} />
          {extra.adminEmailIncludeDateTime && (
            <Box paddingInlineStart="600">
              <Checkbox label={t("adminEmail.useShopTimezone")}
                checked={extra.adminEmailUseShopTimezone}
                onChange={v => setE({ adminEmailUseShopTimezone: v })} />
            </Box>
          )}
          <Divider />
          <Text as="h3" variant="headingSm" fontWeight="semibold">{t("adminEmail.bodyHeading")}</Text>
          <RichArea label={t("adminEmail.message")} value={extra.adminEmailMessage} onChange={v => setE({ adminEmailMessage: v })} />
          <Checkbox label={t("adminEmail.includeResponse")}
            checked={extra.adminEmailIncludeResponse}
            onChange={v => setE({ adminEmailIncludeResponse: v })} />
          {extra.adminEmailIncludeResponse && (
            <Box paddingInlineStart="600">
              <BlockStack gap="200">
                <Checkbox label={t("adminEmail.hideHidden")} checked={extra.adminEmailHideHidden} onChange={v => setE({ adminEmailHideHidden: v })} />
                <Checkbox label={t("adminEmail.hideEmpty")}  checked={extra.adminEmailHideEmpty}  onChange={v => setE({ adminEmailHideEmpty: v })} />
              </BlockStack>
            </Box>
          )}
        </BlockStack>
      );

      case "email_export": return (
        <BlockStack gap="400">
          <Checkbox label={t("emailExport.enable")}
            checked={extra.emailExportEnabled}
            onChange={v => setE({ emailExportEnabled: v })} />
          {extra.emailExportEnabled && (
            <BlockStack gap="300">
              <TextField label={t("emailExport.exportTo")} type="email" value={extra.emailExportTo}
                onChange={v => setE({ emailExportTo: v })} placeholder={t("emailExport.exportToPlaceholder")} autoComplete="email" />
              <Select label={t("emailExport.frequency")}
                options={[
                  { label: t("emailExport.daily"),   value: "daily" },
                  { label: t("emailExport.weekly"),  value: "weekly" },
                  { label: t("emailExport.monthly"), value: "monthly" },
                ]}
                value={extra.emailExportFrequency} onChange={v => setE({ emailExportFrequency: v })} />
            </BlockStack>
          )}
        </BlockStack>
      );

      /* ── POPUP ── */
      case "form_load_as_popup": return (
        <BlockStack gap="400">
          <Checkbox
            label={t("popup.enable")}
            checked={extra.popupEnabled}
            onChange={v => setE({ popupEnabled: v })}
            helpText={t("popup.enableHelp")}
          />

          {extra.popupEnabled && (
            <BlockStack gap="400">
              <Divider />

              <Select
                label={t("popup.trigger")}
                options={[
                  { label: t("popup.triggerButton"), value: "button" },
                  { label: t("popup.triggerDelay"),  value: "delay" },
                  { label: t("popup.triggerExit"),   value: "exit_intent" },
                ]}
                value={extra.popupTrigger}
                onChange={v => setE({ popupTrigger: v as any })}
              />

              {extra.popupTrigger === "button" && (
                <BlockStack gap="300">
                  <TextField
                    label={t("popup.buttonText")}
                    value={extra.popupButtonText}
                    onChange={v => setE({ popupButtonText: v })}
                    placeholder={t("popup.buttonTextPlaceholder")}
                    autoComplete="off"
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <ColorInput
                      label={t("popup.buttonBg")}
                      value={extra.popupButtonBg}
                      onChange={v => setE({ popupButtonBg: v })}
                    />
                    <ColorInput
                      label={t("popup.buttonTextColor")}
                      value={extra.popupButtonColor}
                      onChange={v => setE({ popupButtonColor: v })}
                    />
                  </div>
                  <div>
                    <Text as="p" variant="bodySm" tone="subdued">{t("popup.buttonPreview")}</Text>
                    <div style={{ marginTop: 8 }}>
                      <button style={{
                        padding: "10px 24px",
                        background: extra.popupButtonBg || "#000",
                        color: extra.popupButtonColor || "#fff",
                        border: "none", borderRadius: 6,
                        fontSize: 14, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                        {extra.popupButtonText || t("popup.buttonTextPlaceholder")}
                      </button>
                    </div>
                  </div>
                </BlockStack>
              )}

              {extra.popupTrigger === "delay" && (
                <TextField
                  label={t("popup.delay")}
                  type="number"
                  value={extra.popupDelay}
                  onChange={v => setE({ popupDelay: v })}
                  placeholder="3"
                  helpText={t("popup.delayHelp")}
                  autoComplete="off"
                />
              )}

              {extra.popupTrigger === "exit_intent" && (
                <Banner tone="info">
                  <Text as="p" variant="bodySm">
                    {t("popup.exitBanner")}
                  </Text>
                </Banner>
              )}

              <Divider />
              <Text as="h3" variant="headingSm" fontWeight="semibold">{t("popup.overlayHeading")}</Text>

              <ColorInput
                label={t("popup.overlayBg")}
                value={extra.popupOverlayBg || "#000000"}
                onChange={v => setE({ popupOverlayBg: v })}
              />

              <TextField
                label={t("popup.overlayOpacity")}
                type="number"
                value={extra.popupOverlayOpacity ?? "0.5"}
                onChange={v => setE({ popupOverlayOpacity: v })}
                helpText={t("popup.overlayOpacityHelp")}
                autoComplete="off"
              />
              <TextField
                label={t("popup.maxWidth")}
                type="number"
                value={extra.popupWidth}
                onChange={v => setE({ popupWidth: v })}
                placeholder="600"
                autoComplete="off"
              />
              <Checkbox
                label={t("popup.closeOnOverlay")}
                checked={extra.popupCloseOnOverlay}
                onChange={v => setE({ popupCloseOnOverlay: v })}
              />
              <Checkbox
                label={t("popup.showOnce")}
                checked={extra.popupShowOnce ?? false}
                onChange={v => setE({ popupShowOnce: v })}
                helpText={t("popup.showOnceHelp")}
              />
            </BlockStack>
          )}
        </BlockStack>
      );

      default: return null;
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     SETTINGS PANEL
     ══════════════════════════════════════════════════════════════ */
  function renderSettingsPanel() {
    return (
      <BlockStack gap="400">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PILLS.map(p => (
            <Pill key={p.key} label={t(`pills.${p.key}`)} plan={p.plan}
              active={activePill === p.key}
              onClick={() => setActivePill(p.key)} />
          ))}
        </div>
        <Divider />
        <Box paddingBlockStart="200">
          {renderPillContent()}
        </Box>
      </BlockStack>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     DESIGN PANEL
     ══════════════════════════════════════════════════════════════ */
  function renderHeadingTab() {
    function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = ev => {
        const url = ev.target?.result as string;
        setBannerPreview(url);
        setD({ formBannerUrl: url });
      };
      reader.readAsDataURL(file);
    }
    function handleRemoveBanner() {
      setBannerFile(null); setBannerPreview(""); setD({ formBannerUrl: "" });
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
    return (
      <BlockStack gap="500">
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="semibold">{t("heading.bannerHeading")}</Text>
          <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: "none" }} />
          {bannerPreview ? (
            <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #E5E7EB" }}>
              <div style={{ position: "relative" }}>
                <img src={bannerPreview} alt="Banner" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                <button onClick={handleRemoveBanner} style={{ position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12 }}>{t("heading.removeImage")}</button>
              </div>
              <div style={{ padding: "8px 12px", background: "#F9FAFB", borderTop: "1px solid #E5E7EB" }}>
                <button onClick={() => bannerInputRef.current?.click()} style={{ background:"none",border:"none",cursor:"pointer",color:"#5C6AC4",fontSize:13,fontWeight:500,padding:0,fontFamily:"inherit" }}>{t("heading.replaceImage")}</button>
                {bannerFile && <Text as="p" variant="bodySm" tone="subdued">{bannerFile.name} ({(bannerFile.size/1024).toFixed(1)} KB)</Text>}
              </div>
            </div>
          ) : (
            <div onClick={() => bannerInputRef.current?.click()}
              style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:"32px 16px",border:"2px dashed #D1D5DB",borderRadius:8,cursor:"pointer",background:"#F9FAFB" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#5C6AC4";e.currentTarget.style.background="#EEF0FB"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#D1D5DB";e.currentTarget.style.background="#F9FAFB"}}>
              <span style={{ fontSize: 32 }}>🖼️</span>
              <Text as="p" variant="bodySm" fontWeight="semibold">{t("heading.uploadPrompt")}</Text>
              <Text as="p" variant="bodySm" tone="subdued">{t("heading.uploadFormats")}</Text>
              <div style={{ marginTop:4,padding:"6px 16px",background:"#5C6AC4",color:"#fff",borderRadius:6,fontSize:13,fontWeight:500 }}>{t("heading.browseFiles")}</div>
            </div>
          )}
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="semibold">{t("heading.titleHeading")}</Text>
          <TextField label={t("heading.title")} value={formName} onChange={setFormName} autoComplete="off" multiline={2} />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="semibold">{t("heading.descriptionHeading")}</Text>
          <TextField label={t("heading.description")} value={d.formDescription} onChange={v=>setD({formDescription:v})} placeholder={t("heading.descriptionPlaceholder")} autoComplete="off" multiline={4} />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="semibold">{t("heading.positionHeading")}</Text>
          <TextField label={t("heading.imageHeight")} value={d.formBannerHeight} onChange={v=>setD({formBannerHeight:v})} autoComplete="off" suffix="px" />
          <TextField label={t("heading.imageWidth")}  value={d.formBannerWidth}  onChange={v=>setD({formBannerWidth:v})}  autoComplete="off" />
          <RadioGroup label={t("heading.imageAlignment")} value={d.formBannerAlignment}
            options={[{label:t("alignment.left"),value:"left"},{label:t("alignment.center"),value:"center"},{label:t("alignment.right"),value:"right"}]}
            onChange={v=>setD({formBannerAlignment:v as any})} />
        </BlockStack>
      </BlockStack>
    );
  }

  function renderElementsTab() {
    return (
      <BlockStack gap="400">
        {fields.length === 0 && (
          <div style={{padding:"40px 20px",textAlign:"center",color:"#9CA3AF",fontSize:13,border:"2px dashed #E5E7EB",borderRadius:8}}>
            {t("elements.empty")}
          </div>
        )}
        {fields.map((field, idx) => {
          const isExp = expandedFieldId === field.id;
          const ft    = FIELD_TYPES.find(f => f.type === field.type);
          return (
            <div key={field.id} style={{border:"1px solid #D1D5DB",borderRadius:8,overflow:"hidden",background:"#fff"}}>
              <div onClick={() => setExpandedFieldId(isExp ? null : field.id)}
                style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",background:isExp?"#F9FAFB":"#fff",borderBottom:isExp?"1px solid #E5E7EB":"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{display:"flex",flexDirection:"column",gap:2}}>
                    <button onClick={e=>{e.stopPropagation();moveField(field.id,"up")}}   disabled={idx===0}               style={{...iconBtn,padding:"1px 5px",fontSize:10,border:"none"}}>▲</button>
                    <button onClick={e=>{e.stopPropagation();moveField(field.id,"down")}} disabled={idx===fields.length-1} style={{...iconBtn,padding:"1px 5px",fontSize:10,border:"none"}}>▼</button>
                  </div>
                  <span style={{width:24,height:24,borderRadius:4,background:"#EEF0FB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#5C6AC4"}}>{ft?.icon ?? "?"}</span>
                  <Text as="span" variant="bodyMd" fontWeight="semibold">{ft ? t(`fieldTypes.${ft.type}`) : field.type} ({field.label})</Text>
                </div>
                <button onClick={e=>{e.stopPropagation();deleteField(field.id)}} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#9CA3AF",padding:"4px 8px"}}>🗑</button>
              </div>
              {isExp && (
                <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:20}}>
                  <BlockStack gap="300">
                    <Text as="h4" variant="headingSm" fontWeight="semibold">{t("elements.detailsHeading")}</Text>
                    <TextField label={t("elements.fieldLabel")} value={field.label} onChange={v=>updateField(field.id,{label:v})} autoComplete="off" />
                    {field.type !== "checkbox" && field.type !== "file" && field.type !== "date" && field.type !== "time" && (
                      <TextField label={t("elements.placeholder")} value={field.placeholder ?? ""} onChange={v=>updateField(field.id,{placeholder:v})} autoComplete="off" />
                    )}
                    {field.type === "number" && (
                      <InlineStack gap="300" wrap={false}>
                        <div style={{flex:1}}><TextField label={t("elements.minValue")} type="number" value={field.min ?? ""}
                          onChange={v=>updateField(field.id,{min:v})} autoComplete="off" /></div>
                        <div style={{flex:1}}><TextField label={t("elements.maxValue")} type="number" value={field.max ?? ""}
                          onChange={v=>updateField(field.id,{max:v})} placeholder={t("elements.noLimit")} autoComplete="off" /></div>
                      </InlineStack>
                    )}
                    {field.type === "date" && (
                      <>
                        <Select label={t("elements.dateFormat")}
                          options={[
                            { label: t("elements.dateFormatUs"), value: "us" },
                            { label: t("elements.dateFormatUk"), value: "uk" },
                          ]}
                          value={field.dateFormat ?? "us"}
                          onChange={v=>updateField(field.id,{dateFormat:v as "us" | "uk"})} />
                        <Checkbox label={t("elements.disablePastDates")} checked={field.disablePastDates ?? false}
                          onChange={v=>updateField(field.id,{disablePastDates:v})} />
                      </>
                    )}
                  </BlockStack>
                  {(field.type === "select" || field.type === "checkbox") && (
                    <BlockStack gap="200">
                      <Text as="p" variant="bodySm" fontWeight="semibold">{t("elements.options")}</Text>
                      {(field.options ?? []).map((opt, oi) => (
                        <InlineStack key={oi} gap="200" blockAlign="center">
                          <div style={{flex:1}}><TextField label="" labelHidden value={opt}
                            onChange={v=>{const n=[...(field.options??[])];n[oi]=v;updateField(field.id,{options:n})}} autoComplete="off" /></div>
                          <Button size="slim" tone="critical" variant="plain"
                            onClick={()=>{const n=[...(field.options??[])];n.splice(oi,1);updateField(field.id,{options:n})}}>✕</Button>
                        </InlineStack>
                      ))}
                      <InlineStack gap="200" blockAlign="end">
                        <div style={{flex:1}}><TextField label="" labelHidden placeholder={t("elements.newOption")}
                          value={optionInputs[field.id] ?? ""}
                          onChange={v=>setOptionInputs(p=>({...p,[field.id]:v}))} autoComplete="off" /></div>
                        <Button size="slim" onClick={()=>addOption(field.id)}>{t("elements.addOption")}</Button>
                      </InlineStack>
                    </BlockStack>
                  )}
                  {field.type === "email" && (
                    <><Divider />
                    <Checkbox label={t("elements.sendSubmissionEmail")} checked={field.sendSubmissionEmail ?? false}
                      onChange={v=>updateField(field.id,{sendSubmissionEmail:v})} helpText={t("elements.sendSubmissionEmailHelp")} /></>
                  )}
                  <Divider />
                  <BlockStack gap="300">
                    <Text as="h4" variant="headingSm" fontWeight="semibold">{t("elements.layoutHeading")}</Text>
                    <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
                      <Checkbox label={t("elements.halfWidth")} checked={field.halfWidth ?? false} onChange={v=>updateField(field.id,{halfWidth:v})} />
                      <Checkbox label={t("elements.required")}  checked={field.required}           onChange={v=>updateField(field.id,{required:v})} />
                    </div>
                    <Checkbox label={t("elements.fieldInCenter")} checked={field.fieldInCenter ?? false} onChange={v=>updateField(field.id,{fieldInCenter:v})} />
                  </BlockStack>
                  {field.type === "email" && (
                    <><Divider />
                    <BlockStack gap="200">
                      <Text as="h4" variant="headingSm" fontWeight="semibold">{t("elements.validationHeading")}</Text>
                      <Checkbox label={t("elements.emailValidation")} checked={field.emailValidation ?? false} onChange={v=>updateField(field.id,{emailValidation:v})} />
                    </BlockStack></>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div style={{position:"relative"}}>
          <Button variant="plain" onClick={()=>setShowAddElement(!showAddElement)}>{t("elements.addElement")}</Button>
          {showAddElement && (
            <div style={{position:"absolute",top:"100%",left:0,zIndex:10,marginTop:4,background:"#fff",border:"1px solid #D1D5DB",borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,0.1)",padding:8,minWidth:220}}>
              {FIELD_TYPES.map(ft => (
                <button key={ft.type} onClick={()=>addField(ft.type as FormField["type"])}
                  style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"8px 10px",background:"none",border:"none",borderRadius:6,cursor:"pointer",fontSize:13,fontFamily:"inherit",textAlign:"left"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="#F3F4F6")}
                  onMouseLeave={e=>(e.currentTarget.style.background="none")}>
                  <span style={{width:24,height:24,borderRadius:4,background:"#EEF0FB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#5C6AC4"}}>{ft.icon}</span>
                  {t(`fieldTypes.${ft.type}`)}
                </button>
              ))}
            </div>
          )}
        </div>
      </BlockStack>
    );
  }

  function renderFormTab() {
    return (
      <BlockStack gap="500">
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">{t("formTab.backgroundHeading")}</Text>
          <RadioGroup label={t("formTab.bgType")} value={d.bgType}
            options={[{label:t("formTab.transparent"),value:"transparent"},{label:t("formTab.color"),value:"color"},{label:t("formTab.gradient"),value:"gradient"}]}
            onChange={v=>setD({bgType:v as any})} />
          {(d.bgType==="color"||d.bgType==="gradient") && <ColorInput label={t("formTab.bgColor")} value={d.bgColor} onChange={v=>setD({bgColor:v})} />}
          {d.bgType==="gradient" && <ColorInput label={t("formTab.gradientEnd")} value={d.bgColor2} onChange={v=>setD({bgColor2:v})} />}
          <Select label={t("formTab.bgShadow")} options={[{label:t("formTab.shadowNone"),value:"none"},{label:t("formTab.shadowSmall"),value:"0 1px 3px rgba(0,0,0,0.12)"},{label:t("formTab.shadowMedium"),value:"0 4px 12px rgba(0,0,0,0.15)"},{label:t("formTab.shadowLarge"),value:"0 8px 24px rgba(0,0,0,0.2)"}]} value={d.bgShadow} onChange={v=>setD({bgShadow:v})} />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">{t("formTab.positionHeading")}</Text>
          <TextField label={t("formTab.formWidth")}   value={d.formWidth}   onChange={v=>setD({formWidth:v})}   autoComplete="off" helpText={t("formTab.formWidthHelp")} />
          <TextField label={t("formTab.formPadding")} value={d.formPadding} onChange={v=>setD({formPadding:v})} autoComplete="off" />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">{t("formTab.borderHeading")}</Text>
          <ColorInput label={t("formTab.borderColor")}  value={d.borderColor}  onChange={v=>setD({borderColor:v})} />
          <TextField  label={t("formTab.borderRadius")} value={d.borderRadius} onChange={v=>setD({borderRadius:v})} autoComplete="off" prefix="↺" />
          <TextField  label={t("formTab.borderSize")}   value={d.borderSize}   onChange={v=>setD({borderSize:v})}   autoComplete="off" prefix="↺" />
        </BlockStack>
      </BlockStack>
    );
  }

  function renderInputTab() {
    return (
      <BlockStack gap="500">
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">{t("inputTab.inputHeading")}</Text>
          <ColorInput label={t("inputTab.inputBg")}          value={d.inputBg}               onChange={v=>setD({inputBg:v})} />
          <ColorInput label={t("inputTab.inputBorderColor")} value={d.inputBorderColor}      onChange={v=>setD({inputBorderColor:v})} />
          <ColorInput label={t("inputTab.inputBorderFocus")} value={d.inputBorderFocusColor} onChange={v=>setD({inputBorderFocusColor:v})} />
          <TextField  label={t("inputTab.inputBorderRadius")} value={d.inputBorderRadius}    onChange={v=>setD({inputBorderRadius:v})} autoComplete="off" />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">{t("inputTab.fontHeading")}</Text>
          <TextField  label={t("inputTab.fontSize")}         value={d.inputFontSize}         onChange={v=>setD({inputFontSize:v})}         autoComplete="off" prefix="A" />
          <ColorInput label={t("inputTab.fontColor")}        value={d.inputFontColor}        onChange={v=>setD({inputFontColor:v})} />
          <ColorInput label={t("inputTab.placeholderColor")} value={d.inputPlaceholderColor} onChange={v=>setD({inputPlaceholderColor:v})} />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">{t("inputTab.labelHeading")}</Text>
          <TextField  label={t("inputTab.labelFontSize")}  value={d.labelFontSize} onChange={v=>setD({labelFontSize:v})} autoComplete="off" prefix="A" />
          <ColorInput label={t("inputTab.labelColor")}     value={d.labelColor}    onChange={v=>setD({labelColor:v})} />
        </BlockStack>
      </BlockStack>
    );
  }

  function renderButtonTab() {
    return (
      <BlockStack gap="500">
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">{t("buttonTab.positionHeading")}</Text>
          <RadioGroup label={t("buttonTab.alignment")} value={d.buttonAlignment}
            options={[{label:t("buttonTab.alignFull"),value:"full"},{label:t("buttonTab.alignLeft"),value:"left"},{label:t("buttonTab.alignCenter"),value:"center"},{label:t("buttonTab.alignRight"),value:"right"}]}
            onChange={v=>setD({buttonAlignment:v as any})} />
          <ColorInput label={t("buttonTab.bg")} value={d.buttonBg} onChange={v=>setD({buttonBg:v})} />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">{t("buttonTab.textHeading")}</Text>
          <TextField  label={t("buttonTab.text")}      value={d.buttonText}      onChange={v=>setD({buttonText:v})}      autoComplete="off" />
          <ColorInput label={t("buttonTab.textColor")} value={d.buttonTextColor} onChange={v=>setD({buttonTextColor:v})} />
          <TextField  label={t("buttonTab.fontSize")}  value={d.buttonFontSize}  onChange={v=>setD({buttonFontSize:v})}  autoComplete="off" prefix="A" />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">{t("buttonTab.borderHeading")}</Text>
          <ColorInput label={t("buttonTab.borderColor")}  value={d.buttonBorderColor}  onChange={v=>setD({buttonBorderColor:v})} />
          <TextField  label={t("buttonTab.borderRadius")} value={d.buttonBorderRadius} onChange={v=>setD({buttonBorderRadius:v})} autoComplete="off" prefix="↺" />
          <TextField  label={t("buttonTab.borderWidth")}  value={d.buttonBorderWidth}  onChange={v=>setD({buttonBorderWidth:v})} autoComplete="off" prefix="↺" />
        </BlockStack>
      </BlockStack>
    );
  }

  function renderLayoutTab() {
    return (
      <BlockStack gap="400">
        <Text as="h3" variant="headingSm" fontWeight="bold">{t("layoutTab.heading")}</Text>
        <Select label={t("layoutTab.labelStyle")} options={[
          {label:t("layoutTab.block"),value:"block"},{label:t("layoutTab.inline"),value:"inline"},{label:t("layoutTab.floating"),value:"floating"},
        ]} value={d.labelStyle} onChange={v=>setD({labelStyle:v as any})} />
      </BlockStack>
    );
  }

  function renderDesignPanel() {
    return (
      <BlockStack gap="400">
        <Tabs tabs={designTabs} selected={activeDesignTab} onSelect={setActiveDesignTab} fitted />
        <Box paddingBlockStart="200">
          {activeDesignTab === 0 && renderHeadingTab()}
          {activeDesignTab === 1 && renderElementsTab()}
          {activeDesignTab === 2 && <Banner tone="info"><p>{t("comingSoon.captcha")}</p></Banner>}
          {activeDesignTab === 3 && renderFormTab()}
          {activeDesignTab === 4 && renderInputTab()}
          {activeDesignTab === 5 && renderButtonTab()}
          {activeDesignTab === 6 && renderLayoutTab()}
        </Box>
      </BlockStack>
    );
  }

  function getFormBg() {
    if (d.bgType === "transparent") return "transparent";
    if (d.bgType === "color")       return d.bgColor;
    if (d.bgType === "gradient")    return `linear-gradient(135deg, ${d.bgColor}, ${d.bgColor2})`;
    return "transparent";
  }

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <Page
      title={t("createTitle")}
      backAction={{ content: t("backToForms"), url: "/app/formsly" }}
      primaryAction={{ content: saving ? t("saving") : t("savePublish"), onAction: () => handleSave(true), loading: saving }}
      secondaryActions={[{ content: t("saveDraft"), onAction: () => handleSave(false) }]}
    >
      {error && <Box paddingBlockEnd="400"><Banner tone="critical"><p>{error}</p></Banner></Box>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20, alignItems: "start" }}>
        <Card>
          <BlockStack gap="400">
            <Tabs tabs={mainTabs} selected={activeTab} onSelect={setActiveTab} />
            <Box paddingBlockStart="300">
              {activeTab === 0 && renderSettingsPanel()}
              {activeTab === 1 && renderDesignPanel()}
              {activeTab === 2 && <BlockStack gap="400"><Banner tone="info"><p>{t("comingSoon.integrations")}</p></Banner></BlockStack>}
            </Box>
          </BlockStack>
        </Card>

        <div style={{ position: "sticky", top: 20 }}>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">{t("preview.heading")}</Text>
                <Text as="p" variant="bodySm" tone="subdued">{t("preview.previewOnly")}</Text>
              </InlineStack>
              <Divider />
              <div style={{
                background: getFormBg(),
                border: `${d.borderSize}px solid ${d.borderColor}`,
                borderRadius: `${d.borderRadius}px`,
                padding: `${d.formPadding}px`,
                maxWidth: d.formWidth, margin: "0 auto", fontFamily: "sans-serif",
                boxShadow: d.bgShadow !== "none" ? d.bgShadow : undefined,
              }}>
                {d.formBannerUrl && (
                  <div style={{ marginBottom: 16, textAlign: d.formBannerAlignment }}>
                    <img src={d.formBannerUrl} alt="Banner"
                      style={{ maxWidth: d.formBannerWidth, height: `${d.formBannerHeight}px`, objectFit: "cover", borderRadius: 4 }} />
                  </div>
                )}
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, marginTop: 0 }}>
                  {formName || t("preview.formTitle")}
                </h2>
                {d.formDescription && (
                  <p style={{ fontSize: 13, color: "#6B7280", marginTop: 0, marginBottom: 16 }}>{d.formDescription}</p>
                )}
                {fields.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: 13 }}>
                    {t("preview.addFields")}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                    {fields.map(f => (
                      <div key={f.id} style={{ width: f.halfWidth ? "calc(50% - 8px)" : "100%", textAlign: f.fieldInCenter ? "center" : "left" }}>
                        {d.labelStyle === "block" && (
                          <><label style={{ display:"block", marginBottom:6, fontSize:`${d.labelFontSize}px`, fontWeight:500, color:d.labelColor }}>
                            {f.label}{f.required && <span style={{color:"red",marginLeft:2}}>*</span>}
                          </label>{renderPreview(f)}</>
                        )}
                        {d.labelStyle === "inline" && (
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <label style={{ fontSize:`${d.labelFontSize}px`, fontWeight:500, color:d.labelColor, whiteSpace:"nowrap", minWidth:"30%" }}>
                              {f.label}{f.required && <span style={{color:"red",marginLeft:2}}>*</span>}
                            </label>
                            <div style={{flex:1}}>{renderPreview(f)}</div>
                          </div>
                        )}
                        {d.labelStyle === "floating" && (
                          <div style={{ position:"relative" }}>
                            {renderPreview(f)}
                            <label style={{ position:"absolute", top:4, left:10, fontSize:10, color:d.labelColor, opacity:0.6, pointerEvents:"none" }}>
                              {f.label}{f.required && <span style={{color:"red",marginLeft:2}}>*</span>}
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={{ width:"100%", display:"flex", justifyContent:d.buttonAlignment==="full"?"stretch":d.buttonAlignment==="center"?"center":d.buttonAlignment==="right"?"flex-end":"flex-start" }}>
                      <button style={{ width:d.buttonAlignment==="full"?"100%":"auto", padding:"10px 24px", background:d.buttonBg, color:d.buttonTextColor, border:`${d.buttonBorderWidth}px solid ${d.buttonBorderColor}`, borderRadius:`${d.buttonBorderRadius}px`, fontSize:Number(d.buttonFontSize), fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                        {extra.submitButtonText || d.buttonText || "Submit"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </BlockStack>
          </Card>
        </div>
      </div>
    </Page>
  );
}