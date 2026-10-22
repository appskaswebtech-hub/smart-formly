import { useState, useEffect } from "react";
import {
  json, redirect,
  type ActionFunctionArgs, type LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData, useNavigation, useNavigate, useRouteLoaderData } from "@remix-run/react";
import { Trans, useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";
import i18next from "../i18n/i18next.server";
import { resolveLocale } from "../i18n/resolve.server";
import { getForm, updateForm } from "../models/form.server";
import type { FormField, FormSettings } from "../models/form.server";
import { v4 as uuidv4 } from "uuid";
import {
  Page, Card, Text, BlockStack, InlineStack,
  TextField, Select, Checkbox, Badge,
  Tabs, Divider, Box, Banner,
} from "@shopify/polaris";

import { SectionCard, FieldRow, ColorField, LockedPanel } from "../components/ui/Builder";
import { PILLS, tierAllows, applyTierToExtra, type Tier } from "../billing/features";
import { shopTier } from "../billing/tier.server";
import DesignPanel, { type DesignSettings } from "../components/ui/DesignPanel";
import { elementStyle, FIELD_TYPES } from "../components/ui/fieldStyles";
import Glyph from "../components/ui/Icon";
import { C } from "../components/ui/theme";

export const handle = { i18n: ["forms", "common"] };

/* ── Pill ── */
function Pill({ label, plan, active, onClick }: {
  label: string; plan?: "pro" | "pro_plus"; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 11px", borderRadius: 5, cursor: "pointer",
      border: active ? "2px solid #0B6B45" : "1px solid #D1D5DB",
      background: active ? "#EFF9F3" : "#fff",
      fontSize: 13, fontWeight: active ? 600 : 400,
      color: active ? "#0B6B45" : "#111827",
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
            style={{ padding: "6px 10px", border: "1px solid #D1D5DB", borderRadius: 4, background: "#fff", cursor: "pointer", color: "#6B7280", fontSize: 13 }}>
            ✕
          </button>
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
type ExtraSettings = {
  // Ticket
  ticketEnabled: boolean;
  // Access
  allowLoggedInOnly: boolean; loginMessage: string;
  // Schedule
  scheduleStartDate: string; scheduleEndDate: string;
  scheduleStartTime: string; scheduleEndTime: string;
  scheduleMaxSubmissions: string;
  beforeStartMessage: string; afterEndMessage: string; submissionClosedMessage: string;
  // Messages
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
  inputBg: "#ffffff", inputBorderColor: "#000000", inputBorderFocusColor: "#0B6B45",
  inputBorderRadius: "1", inputFontSize: "14", inputFontColor: "#000000",
  inputPlaceholderColor: "#9CA3AF",
  labelFontSize: "14", labelColor: "#000000", labelStyle: "block",
  /* Matches the picker button's built-in look, so turning on a custom
     label does not change its appearance until the merchant styles it. */
  uploadBtnBg: "#ffffff", uploadBtnTextColor: "#111827", uploadBtnFontSize: "13",
  uploadBtnBorderColor: "#D1D5DB", uploadBtnBorderRadius: "6", uploadBtnBorderWidth: "1",
  buttonBg: "#000000", buttonText: "Submit", buttonTextColor: "#ffffff",
  buttonAlignment: "full", buttonFontSize: "16",
  buttonBorderColor: "#000000", buttonBorderRadius: "2", buttonBorderWidth: "1",
  formBannerUrl: "", formBannerHeight: "200", formBannerWidth: "100%",
  formBannerAlignment: "center", formDescription: "",
};

// Labels live in the `forms` namespace under `fieldTypes.<type>` / `pills.<key>`
// and are resolved at render time — these constants are evaluated at import,
// before i18next knows the request's language.
// Local (not UTC) yyyy-mm-dd, to match what <input type="date"> expects.
function todayISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

/* ══════════════════════════════════════════════════════════════════════
   LOADER
   ══════════════════════════════════════════════════════════════════ */
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const t = await i18next.getFixedT(await resolveLocale(request), "forms");
  const { id } = params;
  if (!id) throw new Response(t("errors.formIdRequired"), { status: 400 });
  const form = await getForm(id, session.shop);
  if (!form) throw new Response(t("errors.notFound"), { status: 404 });
  return json({ form });
};

/* ══════════════════════════════════════════════════════════════════════
   ACTION
   ══════════════════════════════════════════════════════════════════ */
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  // These errors are rendered to the merchant, so they must follow the same
  // locale the page was rendered in — not the server's default.
  const t = await i18next.getFixedT(await resolveLocale(request), "forms");
  const { id } = params;
  if (!id) return json({ error: t("errors.formIdRequired") }, { status: 400 });

  const body     = await request.formData();
  const formName = body.get("formName") as string;
  const fields   = JSON.parse(body.get("fields")   as string) as FormField[];
  const settings = JSON.parse(body.get("settings") as string) as FormSettings;
  const isActive = body.get("isActive") === "true";

  if (!formName?.trim()) return json({ error: t("errors.nameRequired") }, { status: 422 });
  if (!fields || fields.length === 0) return json({ error: t("errors.addField") }, { status: 422 });

  // Features already switched on are grandfathered: a merchant below the tier
  // cannot change a gated setting, but whatever the form already has is kept
  // rather than wiped the next time they save anything.
  const tier = await shopTier(admin);
  const existing = await getForm(id, session.shop);
  const storedExtra = (existing?.settings as any)?.extra ?? null;
  const safeSettings = {
    ...settings,
    extra: applyTierToExtra((settings as any)?.extra ?? {}, storedExtra, tier),
  } as FormSettings;

  await updateForm(id, session.shop, { formName, fields, settings: safeSettings, isActive });
  return redirect("/app/formsly?updated=1");
};

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function EditForm() {
  const { form }   = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit     = useSubmit();
  const navigation = useNavigation();
  const saving     = navigation.state === "submitting";
  const { t } = useTranslation(["forms", "common"]);


  const savedDesign = (form.settings as any)?.design;
  const savedExtra  = (form.settings as any)?.extra ?? {};

  const [formName,        setFormName]        = useState(form.formName);
  const [fields,          setFields]          = useState<FormField[]>(form.fields);
  const [settings,        setSettings]        = useState<FormSettings>(form.settings);
  const [design,          setDesign]          = useState<DesignSettings>(() => ({ ...defaultDesign, ...(savedDesign || {}) }));

  // ✅ FIX: sanitize popupOverlayBg loaded from DB — if it's rgba(...) convert to hex
  // because <input type="color"> only accepts hex values and will cause React hydration error #418
  const [extra, setExtra] = useState<ExtraSettings>(() => {
    const merged = { ...defaultExtra, ...savedExtra };
    if (merged.popupOverlayBg && !merged.popupOverlayBg.startsWith("#")) {
      merged.popupOverlayBg = "#000000";
    }
    return merged;
  });

  const [activeTab,       setActiveTab]       = useState(0);
  const [activePill,      setActivePill]      = useState("form_details");
  const [clientError,     setClientError]     = useState("");

  const error = clientError || (actionData as any)?.error;

  /* Quick Settings are gated by plan. The tier is published by the app route's
     loader so neither builder page has to re-query the subscription. */
  const appData = useRouteLoaderData<{ tier: Tier }>("routes/app");
  const tier: Tier = appData?.tier ?? "base";
  const navigate = useNavigate();
  const activePillPlan = PILLS.find((p) => p.key === activePill)?.plan;
  const activePillLocked = !tierAllows(tier, activePillPlan);

  const d  = design;
  const setD = (p: Partial<DesignSettings>) => setDesign(prev => ({ ...prev, ...p }));
  const setE = (p: Partial<ExtraSettings>)  => setExtra(prev  => ({ ...prev, ...p }));

  useEffect(() => {
    if ((actionData as any)?.error) setClientError((actionData as any).error);
  }, [actionData]);

  /* ── Field helpers ── */
  function addField(type: FormField["type"]) {
    // Seeds the field's editable label in the merchant's language.
    const label = t(`fieldTypes.${type}`, { defaultValue: type });
    const nf: FormField = {
      id: uuidv4(), type, label, placeholder: "", required: false,
      halfWidth: false, fieldInCenter: false, sendSubmissionEmail: false, emailValidation: false,
      // Seeded in the merchant's language, like the label above — these are
      // stored on the form and rendered verbatim on the storefront.
      options: type === "select" || type === "checkbox"
        ? [t("elements.optionDefault", { n: 1 }), t("elements.optionDefault", { n: 2 })]
        : undefined,
      // Quantities start at 1 with no upper bound until the merchant sets one.
      min: type === "number" ? "1" : undefined,
      max: undefined,
      dateFormat: type === "date" ? "us" : undefined,
      // Shoppers attaching one file are the exception, so uploads start open to
      // several; the merchant can narrow it on the field.
      allowMultiple: type === "file" ? true : undefined,
    };
    setFields(prev => [...prev, nf]);
  }
  function updateField(id: string, patch: Partial<FormField>) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  }
  function deleteField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id));
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
  function handleSave(isActive: boolean) {
    if (!formName.trim()) { setClientError("Form name is required"); return; }
    if (fields.length === 0) { setClientError("Add at least one field"); return; }
    setClientError("");
    const fd = new FormData();
    fd.append("formName", formName);
    fd.append("fields",   JSON.stringify(fields));
    fd.append("settings", JSON.stringify({ ...settings, design, extra }));
    fd.append("isActive", String(isActive));
    submit(fd, { method: "POST" });
  }

  /* ── Tabs ── */
  const mainTabs = [
    { id: "settings",    content: t("mainTabs.settings") },
    { id: "design",      content: t("mainTabs.design") },
    { id: "integration", content: t("mainTabs.integration") },
  ];
  /* ── Preview styles ── */
  const pInput: React.CSSProperties = {
    width: "100%", padding: "8px 10px",
    border: `1px solid ${d.inputBorderColor}`,
    borderRadius: `${d.inputBorderRadius}px`,
    background: d.inputBg, fontSize: Number(d.inputFontSize),
    fontFamily: "inherit", boxSizing: "border-box", color: d.inputFontColor,
  };

  function renderPreview(field: FormField) {
    switch (field.type) {
      case "textarea": return <textarea placeholder={field.placeholder} style={pInput} rows={3} />;
      case "select":   return <select style={pInput}><option>{t("preview.pleaseSelect")}</option>{(field.options??[]).map(o=><option key={o}>{o}</option>)}</select>;
      case "checkbox": return <div style={{display:"flex",flexDirection:"column",gap:4}}>{(field.options??[]).map(o=><label key={o} style={{display:"flex",gap:8,alignItems:"center",fontSize:14}}><input type="checkbox"/>{o}</label>)}</div>;
      case "file":
        /* Never a real <input type="file">: the browser writes its button text
           from its own language, so it would sit in the preview in English
           whatever the merchant has selected. Mirrors the storefront, which
           draws the same control for the same reason. */
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex", alignItems: "center", padding: "9px 14px",
                background: d.uploadBtnBg,
                color: d.uploadBtnTextColor,
                border: `${d.uploadBtnBorderWidth}px solid ${d.uploadBtnBorderColor}`,
                borderRadius: `${d.uploadBtnBorderRadius}px`,
                fontSize: Number(d.uploadBtnFontSize),
                fontWeight: 500,
              }}
            >
              {field.uploadButtonText?.trim() ||
                (field.allowMultiple ? t("preview.chooseFiles") : t("preview.chooseFile"))}
            </span>
          </span>
        );
      case "number":   return <input type="number" placeholder={field.placeholder} min={field.min || undefined} max={field.max || undefined} style={pInput} />;
      case "date":     return <input type="date" min={todayISO()} style={pInput} />;
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
              {FIELD_TYPES.map(ft => {
                const style = elementStyle(ft.type);
                return (
                  <button key={ft.type} type="button" onClick={() => addField(ft.type as FormField["type"])}
                    style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"#fff",border:`1px solid ${C.line}`,borderRadius:8,cursor:"pointer",textAlign:"left",fontFamily:"inherit" }}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor=C.mid)}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor=C.line)}>
                    <span style={{width:28,height:28,borderRadius:6,background:style.tint,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Glyph name={style.glyph} size={14} color={style.ink} strokeWidth={1.8} />
                    </span>
                    <span style={{fontSize:12.5,fontWeight:500,color:C.ink}}>{t(`fieldTypes.${ft.type}`)}</span>
                  </button>
                );
              })}
            </div>
          </BlockStack>
          {fields.length > 0 && (
            <SectionCard
              glyph="sliders"
              title={t("details.fieldsCount", { count: fields.length })}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {fields.map((f, i) => {
                  const style = elementStyle(f.type);
                  return (
                    <FieldRow
                      key={f.id}
                      glyph={style.glyph}
                      tint={style.tint}
                      ink={style.ink}
                      label={f.label}
                      typeLabel={t(`fieldTypes.${f.type}`)}
                      required={f.required}
                      requiredLabel={t("details.requiredBadge")}
                      onMoveUp={i === 0 ? undefined : () => moveField(f.id, "up")}
                      onMoveDown={i === fields.length - 1 ? undefined : () => moveField(f.id, "down")}
                      onDelete={() => deleteField(f.id)}
                      moveUpLabel={t("elements.moveUp")}
                      moveDownLabel={t("elements.moveDown")}
                      deleteLabel={t("elements.remove")}
                    />
                  );
                })}
              </div>
            </SectionCard>
          )}
        </BlockStack>
      );

      case "ticket_system": return (
        <BlockStack gap="400">
          <Text as="p" variant="bodySm" tone="subdued">
            When enabled, the ticketing system assigns a unique ticket number to each submission,
            making it easy to identify and track requests. Great for return policy forms, order
            tracking forms, and similar.
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
          <Text as="h3" variant="headingSm" fontWeight="semibold">Body</Text>
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
          <Text as="h3" variant="headingSm" fontWeight="semibold">Body</Text>
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
                    <ColorField
                      label={t("popup.buttonBg")}
                      value={extra.popupButtonBg}
                      onChange={v => setE({ popupButtonBg: v })}
                    />
                    <ColorField
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
                    The popup will appear when the visitor moves their cursor toward the top of the
                    browser window (exit intent detection).
                  </Text>
                </Banner>
              )}

              <Divider />
              <Text as="h3" variant="headingSm" fontWeight="semibold">{t("popup.overlayHeading")}</Text>

              <ColorField
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
          {PILLS.map(p => {
            const pillLocked = !tierAllows(tier, p.plan);
            return (
              <span key={p.key} style={{ opacity: pillLocked ? 0.55 : 1 }}>
                <Pill label={t(`pills.${p.key}`)} plan={p.plan}
                  active={activePill === p.key}
                  onClick={() => setActivePill(p.key)} />
              </span>
            );
          })}
        </div>
        <Divider />
        <Box paddingBlockStart="200">
          {activePillLocked ? (
            <LockedPanel
              title={t("locked.title", { plan: activePillPlan === "pro_plus" ? "Pro+" : "Pro" })}
              body={t("locked.body")}
              cta={t("locked.cta")}
              onUpgrade={() => navigate("/app/pricing")}
            >
              {renderPillContent()}
            </LockedPanel>
          ) : (
            renderPillContent()
          )}
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
      title={t("editWithName", { name: form.formName })}
      backAction={{ content: t("backToForms"), url: "/app/formsly" }}
      primaryAction={{ content: saving ? t("saving") : t("savePublish"), onAction: () => handleSave(true), loading: saving }}
      secondaryActions={[{ content: t("saveDraft"), onAction: () => handleSave(false) }]}
    >
      {error && (
        <Box paddingBlockEnd="400">
          <Banner tone="critical"><p>{error}</p></Banner>
        </Box>
      )}

      <div className="sf-split" style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20, alignItems: "start" }}>

        {/* Left: Builder */}
        <Card>
          <BlockStack gap="400">
            <Tabs tabs={mainTabs} selected={activeTab} onSelect={setActiveTab} />
            <Box paddingBlockStart="300">
              {activeTab === 0 && renderSettingsPanel()}
              {activeTab === 1 && (
                <DesignPanel
                  d={d}
                  setD={setD}
                  formName={formName}
                  setFormName={setFormName}
                  fields={fields}
                  addField={addField}
                  updateField={updateField}
                  deleteField={deleteField}
                  moveField={moveField}
                />
              )}
              {activeTab === 2 && (
                <BlockStack gap="400">
                  <Banner tone="info"><p>{t("comingSoon.integrations")}</p></Banner>
                </BlockStack>
              )}
            </Box>
          </BlockStack>
        </Card>

        {/* Right: Preview */}
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
                  <p style={{ fontSize: 13, color: "#6B7280", marginTop: 0, marginBottom: 16 }}>
                    {d.formDescription}
                  </p>
                )}
                {fields.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: 13 }}>
                    {t("preview.addFields")}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                    {fields.map(f => (
                      <div key={f.id} style={{
                        width: f.halfWidth ? "calc(50% - 8px)" : "100%",
                        textAlign: f.fieldInCenter ? "center" : "left",
                      }}>
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