import { useState, useEffect } from "react";
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useSubmit, useActionData, useNavigation, useNavigate, useLoaderData, useRouteLoaderData } from "@remix-run/react";
import { Trans, useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import i18next from "../i18n/i18next.server";
import { resolveLocale } from "../i18n/resolve.server";
import { countForms, createForm } from "../models/form.server";
import type { FormField, FormSettings } from "../models/form.server";
import { v4 as uuidv4 } from "uuid";
import {
  Page, Text, BlockStack, InlineStack,
  TextField, Select, Checkbox, Badge,
  Divider, Box, Banner,
} from "@shopify/polaris";

import Hero from "../components/ui/Hero";
import { SectionCard, Stepper, SettingTile, ElementChip, SegToggle, FieldRow, ColorField, LockedPanel } from "../components/ui/Builder";
import { PILLS, tierAllows, applyTierToExtra, canCreateForm, formLimitFor, type Tier } from "../billing/features";
import { shopTier } from "../billing/tier.server";
import DesignPanel, { type DesignSettings } from "../components/ui/DesignPanel";
import { elementStyle, FIELD_TYPES } from "../components/ui/fieldStyles";
import SupportForm from "../components/ui/SupportForm";
import Glyph, { IconChip, type GlyphName } from "../components/ui/Icon";
import { C, RADIUS, cardStyle, primaryButton, secondaryButton } from "../components/ui/theme";

/** Icon per quick-setting, matching the reference tiles. */
const PILL_ICON: Record<string, GlyphName> = {
  form_details: "document", ticket_system: "tickbox", allow_form_access: "gear",
  form_schedule: "calendar", customize_form_messages: "info", customize_form_scrolling: "grid",
  after_submission_action: "document", after_submit_script: "external", auto_responder_email: "inbox",
  admin_email: "inbox", email_export: "upload", form_load_as_popup: "info",
};

export const handle = { i18n: ["forms", "common"] };

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
   LOADER / ACTION
   ══════════════════════════════════════════════════════════════════ */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Guarding the builder itself rather than each button that links here: the
  // dashboard, the forms list and the nav menu all lead to this page, and this
  // is the one place they share.
  const tier = await shopTier(admin);
  const formCount = await countForms(session.shop);

  return json({
    atLimit: !canCreateForm(tier, formCount),
    formCount,
    formLimit: formLimitFor(tier),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
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

    // Re-checked here, not just in the loader: the loader only decides what to
    // render, and a crafted POST never passes through it.
    const planTierNow = await shopTier(admin);
    if (!canCreateForm(planTierNow, await countForms(session.shop))) {
      return json(
        { error: t("limit.reached", { count: formLimitFor(planTierNow) ?? 0 }) },
        { status: 402 },
      );
    }

    // Resolved server-side: the tier the browser rendered with cannot be
    // trusted. Nothing is stored yet, so a gated setting is simply dropped.
    const tier = await shopTier(admin);
    const safeExtra = applyTierToExtra(extra ?? {}, null, tier);

    await createForm(session.shop, formName, fields, {
      settings: { ...settings, extra: safeExtra },
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
  const { atLimit, formCount, formLimit } = useLoaderData<typeof loader>();
  const submit     = useSubmit();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const saving     = navigation.state === "submitting";
  const { t } = useTranslation(["forms", "common"]);


  // Presentation-only state for the rebuilt chrome.
  const [fieldSearch,   setFieldSearch]   = useState("");
  const [previewMode,   setPreviewMode]   = useState<"desktop" | "mobile">("desktop");

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
  const [error,           setError]           = useState("");


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
    if ((actionData as any)?.error) setError((actionData as any).error);
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

  /* ── Styles ── */
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
          <SectionCard
            glyph="document"
            title={t("details.heading")}
            subtitle={t("sectionSub.settings")}
          >
            <div className="sf-grid-2" style={{ gap: 16 }}>
              <TextField label={t("details.formName")} value={formName} onChange={setFormName} autoComplete="off" />
              <TextField label={t("details.notificationEmail")} value={settings.recipientEmail}
                onChange={v => setSettings(s => ({...s, recipientEmail: v}))} placeholder={t("details.notificationEmailPlaceholder")} autoComplete="off" />
              <TextField label={t("details.successMessage")} value={settings.successMessage}
                onChange={v => setSettings(s => ({...s, successMessage: v}))} multiline={3} autoComplete="off" />
              <div style={{ paddingTop: 24 }}>
                <Checkbox label={t("details.notifyOnSubmit")} checked={settings.notifyOnSubmit}
                  onChange={v => setSettings(s => ({...s, notifyOnSubmit: v}))}
                  helpText={t("details.notifyOnSubmitHelp", { defaultValue: "" })} />
              </div>
            </div>
          </SectionCard>
          <SectionCard
            glyph="grid"
            title={t("details.elementsHeading")}
            subtitle={t("sectionSub.elements")}
            right={
              <div style={{ position: "relative", width: 190 }}>
                <span style={{ position: "absolute", left: 10, top: 8, pointerEvents: "none" }}>
                  <Glyph name="search" size={15} color={C.faint} />
                </span>
                <input
                  value={fieldSearch}
                  onChange={e => setFieldSearch(e.target.value)}
                  placeholder={t("searchFields")}
                  style={{
                    width: "100%", padding: "7px 10px 7px 31px", fontSize: 12.5,
                    border: `1px solid ${C.line}`, borderRadius: RADIUS.control,
                    fontFamily: "inherit", color: C.ink, boxSizing: "border-box",
                  }}
                />
              </div>
            }
          >
            <div className="sf-elements">
              {FIELD_TYPES
                .filter(ft => t(`fieldTypes.${ft.type}`).toLowerCase().includes(fieldSearch.trim().toLowerCase()))
                .map(ft => {
                  const style = elementStyle(ft.type);
                  return (
                    <ElementChip
                      key={ft.type}
                      glyph={style.glyph}
                      tint={style.tint}
                      ink={style.ink}
                      label={t(`fieldTypes.${ft.type}`)}
                      onClick={() => addField(ft.type as FormField["type"])}
                    />
                  );
                })}
            </div>
          </SectionCard>
          {fields.length > 0 && (
            <SectionCard
              glyph="sliders"
              title={t("details.fieldsCount", { count: fields.length })}
              subtitle={t("sectionSub.fields", { defaultValue: "" })}
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
                    {t("popup.exitBanner")}
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
        <SectionCard
          glyph="sliders"
          title={t("pills.quickHeading", { defaultValue: "Quick Settings" })}
          subtitle={t("sectionSub.quick")}
        >
          <div className="sf-grid-3" style={{ gap: 10 }}>
            {PILLS.map(p => (
              <SettingTile
                key={p.key}
                icon={PILL_ICON[p.key] ?? "document"}
                label={t(`pills.${p.key}`)}
                badge={p.plan}
                active={activePill === p.key}
                locked={!tierAllows(tier, p.plan)}
                onClick={() => setActivePill(p.key)}
              />
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 16, paddingTop: 16 }}>
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
          </div>
        </SectionCard>
      </BlockStack>
    );
  }

  function getFormBg() {
    if (d.bgType === "transparent") return "transparent";
    if (d.bgType === "color")       return d.bgColor;
    if (d.bgType === "gradient")    return `linear-gradient(135deg, ${d.bgColor}, ${d.bgColor2})`;
    return "transparent";
  }

  // The shop is out of forms on its plan. Shown instead of the builder so the
  // merchant finds out before filling one in, not when they press save.
  if (atLimit) {
    return (
      <Page title={t("hero.title")}>
        <div style={{ ...cardStyle, padding: 32, textAlign: "center", maxWidth: 520, margin: "40px auto" }}>
          <div style={{ display: "inline-flex", marginBottom: 14 }}>
            <IconChip name="lock" tint={C.proBg} color={C.proText} size={52} />
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>
            {t("limit.title")}
          </h2>
          <p style={{ fontSize: 13.5, color: C.muted, margin: "0 0 20px", lineHeight: 1.55 }}>
            {t("limit.body", { count: formLimit ?? 0, used: formCount })}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" style={primaryButton} onClick={() => navigate("/app/pricing")}>
              <Glyph name="rocket" size={15} color="#fff" />
              {t("limit.upgrade")}
            </button>
            <button type="button" style={secondaryButton} onClick={() => navigate("/app/formsly")}>
              {t("limit.manage")}
            </button>
          </div>
        </div>
      </Page>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <Page
      title={t("createTitle")}
      backAction={{ content: t("backToForms"), url: "/app/formsly" }}
    >
      {error && <Box paddingBlockEnd="400"><Banner tone="critical"><p>{error}</p></Banner></Box>}

      <Box paddingBlockEnd="400">
        <Hero
          art="build"
          eyebrow={t("hero.eyebrow")}
          title={t("hero.title")}
          titleAccent={t("hero.accent")}
          subtitle={t("hero.sub")}
        />
      </Box>

      <div className="sf-split" style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20, alignItems: "start" }}>
        <BlockStack gap="400">
          <div
            className="sf-toolbar"
            style={{
              ...cardStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              columnGap: 16,
              // The children carry the vertical padding, so a wrapped second
              // row needs no row gap of its own.
              rowGap: 0,
              padding: "0 18px",
            }}
          >
            <Stepper
              steps={mainTabs.map(tab => tab.content)}
              active={activeTab}
              onSelect={setActiveTab}
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                padding: "12px 0",
                flexShrink: 0,
                // space-between does not right-align a lone item on a wrapped
                // line, so the buttons keep themselves there.
                marginLeft: "auto",
              }}
            >
              <button type="button" style={secondaryButton} onClick={() => handleSave(false)}>
                <Glyph name="save" size={15} color={C.ink} />
                {t("saveDraft")}
              </button>
              <button
                type="button"
                style={{ ...primaryButton, opacity: saving ? 0.6 : 1 }}
                disabled={saving}
                onClick={() => handleSave(true)}
              >
                <Glyph name="rocket" size={15} color="#fff" />
                {saving ? t("saving") : t("savePublish")}
              </button>
            </div>
          </div>

          {activeTab === 0 && renderSettingsPanel()}
          {activeTab === 1 && (
            <div style={{ ...cardStyle, padding: 18 }}>
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
            </div>
          )}
          {activeTab === 2 && (
            <div style={{ ...cardStyle, padding: 18 }}>
              <Banner tone="info"><p>{t("comingSoon.integrations")}</p></Banner>
            </div>
          )}
        </BlockStack>

        <div style={{ position: "sticky", top: 20 }}>
          <BlockStack gap="400">

          {/* Direct line to support, from where the merchant is building. */}
          <SectionCard
            glyph="chat"
            title={t("common:support.title")}
            subtitle={t("common:support.body")}
          >
            <SupportForm />
          </SectionCard>

          <SectionCard
            glyph="eye"
            title={t("preview.heading")}
            subtitle={t("sectionSub.preview")}
            right={
              <SegToggle
                options={[
                  { value: "desktop", label: t("previewDesktop"), glyph: "desktop" },
                  { value: "mobile",  label: t("previewMobile"),  glyph: "mobile"  },
                ]}
                value={previewMode}
                onChange={setPreviewMode}
              />
            }
          >
            {/* Mint stage behind the form, as in the reference. */}
            <div style={{
              background: `linear-gradient(160deg, ${C.mint} 0%, ${C.wash} 100%)`,
              borderRadius: RADIUS.card,
              padding: 20,
            }}>
              <div style={{ maxWidth: previewMode === "mobile" ? 380 : undefined, margin: "0 auto" }}>
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
              </div>
            </div>

            {/* Amber note under the stage, as in the reference. */}
            <p style={{ margin: "12px 0 0", fontSize: 11.5, color: "#B45309", lineHeight: 1.5 }}>
              {t("previewNote")}
            </p>
          </SectionCard>
          </BlockStack>
        </div>
      </div>
    </Page>
  );
}