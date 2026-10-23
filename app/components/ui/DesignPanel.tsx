import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { FormField } from "../../models/form.server";
import Glyph from "./Icon";
import { elementStyle, FIELD_TYPES } from "./fieldStyles";
import { C, RADIUS, secondaryButton } from "./theme";
import { clampPositiveInt, SUBMISSION_MAX_MB } from "../../utils/upload-limits";
import {
  fieldDescriptionAlign, submitDescriptionAlign, TEXT_ALIGNS, type TextAlign,
} from "../../utils/alignment";
import {
  PanelTabs, SubSection, ColorField, UnitField, SelectField, TextAreaField,
  CheckRow, ChoiceRow, DropZone, MiniButton, FieldRow,
} from "./Builder";

/**
 * Everything on the builder's Design tab.
 *
 * Lives here rather than in a route because the create and edit pages render
 * exactly the same panel — they previously held two copies that differed only
 * in whitespace, and drifted apart as a result.
 *
 * The seven tabs this replaces are grouped into three: a 420px column cannot
 * hold seven, and Polaris hid the last three behind a "More views" dropdown.
 */

export type DesignSettings = {
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
  /* Help text under the submit button — the same idea as a field's
     description, but the button is rendered outside the field loop, so it
     carries its own setting rather than hanging off a FormField. */
  buttonDescription: string;
  /* Empty follows the button, which is how it rendered before the control. */
  buttonDescriptionAlign: string;
  /* The upload picker's button. Only visible when a file field sets its own
     button text — without one the browser draws its own control, which a page
     cannot restyle. */
  uploadBtnBg: string; uploadBtnTextColor: string; uploadBtnFontSize: string;
  uploadBtnBorderColor: string; uploadBtnBorderRadius: string; uploadBtnBorderWidth: string;
  formBannerUrl: string; formBannerHeight: string; formBannerWidth: string;
  formBannerAlignment: "left" | "center" | "right";
  formDescription: string;
};

type TabId = "content" | "style" | "layout";

/** Quiet label marking which of the old tabs a run of sections came from. */
function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: C.faint,
        margin: "4px 0 14px",
        paddingBottom: 7,
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      {children}
    </div>
  );
}

export default function DesignPanel({
  d,
  setD,
  formName,
  setFormName,
  fields,
  addField,
  updateField,
  deleteField,
  moveField,
}: {
  d: DesignSettings;
  setD: (patch: Partial<DesignSettings>) => void;
  formName: string;
  setFormName: (next: string) => void;
  fields: FormField[];
  addField: (type: FormField["type"]) => void;
  updateField: (id: string, patch: Partial<FormField>) => void;
  deleteField: (id: string) => void;
  moveField: (id: string, dir: "up" | "down") => void;
}) {
  const { t } = useTranslation("forms");

  const [tab, setTab] = useState<TabId>("content");
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [showAddElement, setShowAddElement] = useState(false);
  const [optionInputs, setOptionInputs] = useState<Record<string, string>>({});
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>(d.formBannerUrl ?? "");
  const bannerInputRef = useRef<HTMLInputElement>(null);

  /* The page owns `fields`, so a newly added one can only be identified after
     it arrives. Watching the count lets the panel open it, which is what the
     page's own addField used to do before that state moved here. */
  const prevCount = useRef(fields.length);
  const expandNext = useRef(false);
  useEffect(() => {
    if (fields.length > prevCount.current && expandNext.current) {
      setExpandedFieldId(fields[fields.length - 1]?.id ?? null);
      expandNext.current = false;
    }
    prevCount.current = fields.length;
  }, [fields]);

  /* Don't keep a deleted field open. */
  useEffect(() => {
    if (expandedFieldId && !fields.some((f) => f.id === expandedFieldId)) {
      setExpandedFieldId(null);
    }
  }, [fields, expandedFieldId]);

  function addFieldAndOpen(type: FormField["type"]) {
    expandNext.current = true;
    addField(type);
    setShowAddElement(false);
  }

  function addOption(fid: string) {
    const val = (optionInputs[fid] ?? "").trim();
    if (!val) return;
    const field = fields.find((f) => f.id === fid);
    updateField(fid, { options: [...(field?.options ?? []), val] });
    setOptionInputs((p) => ({ ...p, [fid]: "" }));
  }

  function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setBannerPreview(url);
      setD({ formBannerUrl: url });
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveBanner() {
    setBannerFile(null);
    setBannerPreview("");
    setD({ formBannerUrl: "" });
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  }

  /* ── Content ─────────────────────────────────────────────────────────── */
  function renderContent() {
    return (
      <>
        <GroupLabel>{t("designTabs.heading")}</GroupLabel>

        <SubSection glyph="image" title={t("heading.bannerHeading")}>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            style={{ display: "none" }}
          />
          {bannerPreview ? (
            <div style={{ borderRadius: RADIUS.control, overflow: "hidden", border: `1px solid ${C.line}` }}>
              <div style={{ position: "relative" }}>
                <img src={bannerPreview} alt="" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
                <button
                  type="button"
                  onClick={handleRemoveBanner}
                  style={{
                    position: "absolute", top: 8, right: 8,
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(17,24,39,0.72)", color: "#fff", border: "none",
                    borderRadius: 6, padding: "5px 10px", cursor: "pointer",
                    fontSize: 12, fontFamily: "inherit",
                  }}
                >
                  <Glyph name="trash" size={13} color="#fff" strokeWidth={2} />
                  {t("heading.removeImage")}
                </button>
              </div>
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  padding: "8px 12px", background: C.mint, borderTop: `1px solid ${C.line}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.deep, fontSize: 12.5, fontWeight: 600, padding: 0, fontFamily: "inherit" }}
                >
                  {t("heading.replaceImage")}
                </button>
                {bannerFile && (
                  <span style={{ fontSize: 11.5, color: C.muted, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {bannerFile.name} ({(bannerFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
            </div>
          ) : (
            <DropZone
              title={t("heading.uploadPrompt")}
              hint={t("heading.uploadFormats")}
              cta={t("heading.browseFiles")}
              onClick={() => bannerInputRef.current?.click()}
            />
          )}
        </SubSection>

        <SubSection glyph="text" title={t("heading.titleHeading")}>
          <TextAreaField label={t("heading.title")} value={formName} onChange={setFormName} rows={2} />
        </SubSection>

        <SubSection glyph="paragraph" title={t("heading.descriptionHeading")}>
          <TextAreaField
            label={t("heading.description")}
            value={d.formDescription}
            onChange={(v) => setD({ formDescription: v })}
            placeholder={t("heading.descriptionPlaceholder")}
            rows={4}
          />
        </SubSection>

        <SubSection glyph="square" title={t("heading.positionHeading")}>
          <UnitField label={t("heading.imageHeight")} value={d.formBannerHeight} onChange={(v) => setD({ formBannerHeight: v })} unit="px" />
          <UnitField label={t("heading.imageWidth")} value={d.formBannerWidth} onChange={(v) => setD({ formBannerWidth: v })} />
          <ChoiceRow
            label={t("heading.imageAlignment")}
            value={d.formBannerAlignment}
            options={[
              { label: t("alignment.left"), value: "left" },
              { label: t("alignment.center"), value: "center" },
              { label: t("alignment.right"), value: "right" },
            ]}
            onChange={(v) => setD({ formBannerAlignment: v as DesignSettings["formBannerAlignment"] })}
          />
        </SubSection>

        <GroupLabel>{t("designTabs.elements")}</GroupLabel>
        <SubSection glyph="grid" title={t("details.fieldsCount", { count: fields.length })}>
          {renderElements()}
        </SubSection>

        <GroupLabel>{t("designTabs.captcha")}</GroupLabel>
        <SubSection glyph="shield" title={t("designTabs.captcha")}>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "11px 12px", borderRadius: RADIUS.control,
              background: C.draftBg, color: C.draftText, fontSize: 12.5,
            }}
          >
            <Glyph name="info" size={15} color={C.draftText} />
            {t("comingSoon.captcha")}
          </div>
        </SubSection>
      </>
    );
  }

  /* ── The field accordion ─────────────────────────────────────────────── */
  function renderElements() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {fields.length === 0 && (
          <div
            style={{
              padding: "32px 20px", textAlign: "center", color: C.faint, fontSize: 12.5,
              border: `2px dashed ${C.line}`, borderRadius: RADIUS.control,
            }}
          >
            {t("elements.empty")}
          </div>
        )}

        {fields.map((field, idx) => {
          const isExp = expandedFieldId === field.id;
          const style = elementStyle(field.type);
          return (
            <FieldRow
              key={field.id}
              glyph={style.glyph}
              tint={style.tint}
              ink={style.ink}
              label={field.label}
              typeLabel={t(`fieldTypes.${field.type}`)}
              required={field.required}
              requiredLabel={t("elements.required")}
              active={isExp}
              onClick={() => setExpandedFieldId(isExp ? null : field.id)}
              onMoveUp={idx === 0 ? undefined : () => moveField(field.id, "up")}
              onMoveDown={idx === fields.length - 1 ? undefined : () => moveField(field.id, "down")}
              onDelete={() => deleteField(field.id)}
              moveUpLabel={t("elements.moveUp", { defaultValue: "Move up" })}
              moveDownLabel={t("elements.moveDown", { defaultValue: "Move down" })}
              deleteLabel={t("elements.remove", { defaultValue: "Remove" })}
            >
              {isExp && renderFieldDetail(field)}
            </FieldRow>
          );
        })}

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowAddElement(!showAddElement)}
            style={{ ...secondaryButton, width: "100%", justifyContent: "center" }}
          >
            <Glyph name="plus" size={14} color={C.deep} strokeWidth={2} />
            {t("elements.addElement")}
          </button>
          {showAddElement && (
            <div
              style={{
                position: "absolute", bottom: "100%", left: 0, right: 0, zIndex: 10, marginBottom: 6,
                background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.control,
                boxShadow: "0 8px 24px rgba(17,24,39,0.12)", padding: 6, maxHeight: 280, overflowY: "auto",
              }}
            >
              {FIELD_TYPES.map((ft) => {
                const s = elementStyle(ft.type);
                return (
                  <button
                    key={ft.type}
                    type="button"
                    onClick={() => addFieldAndOpen(ft.type as FormField["type"])}
                    style={{
                      display: "flex", alignItems: "center", gap: 9, width: "100%",
                      padding: "7px 9px", background: "none", border: "none", borderRadius: 6,
                      cursor: "pointer", fontSize: 12.5, fontFamily: "inherit", textAlign: "left", color: C.body,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.mint)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <span
                      style={{
                        width: 24, height: 24, borderRadius: 6, background: s.tint,
                        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}
                    >
                      <Glyph name={s.glyph} size={13} color={s.ink} strokeWidth={1.8} />
                    </span>
                    {t(`fieldTypes.${ft.type}`)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderFieldDetail(field: FormField) {
    const hasPlaceholder =
      field.type !== "checkbox" && field.type !== "file" && field.type !== "date" && field.type !== "time";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{t("elements.detailsHeading")}</span>
        <UnitField label={t("elements.fieldLabel")} value={field.label} onChange={(v) => updateField(field.id, { label: v })} />

        {hasPlaceholder && (
          <UnitField
            label={t("elements.placeholder")}
            value={field.placeholder ?? ""}
            onChange={(v) => updateField(field.id, { placeholder: v })}
          />
        )}

        {field.type === "number" && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <UnitField label={t("elements.minValue")} type="number" value={field.min ?? ""} onChange={(v) => updateField(field.id, { min: v })} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <UnitField
                label={t("elements.maxValue")}
                type="number"
                value={field.max ?? ""}
                placeholder={t("elements.noLimit")}
                onChange={(v) => updateField(field.id, { max: v })}
              />
            </div>
          </div>
        )}

        {field.type === "date" && (
          <SelectField
            label={t("elements.dateFormat")}
            value={field.dateFormat ?? "us"}
            options={[
              { label: t("elements.dateFormatUs"), value: "us" },
              { label: t("elements.dateFormatUk"), value: "uk" },
            ]}
            onChange={(v) => updateField(field.id, { dateFormat: v as "us" | "uk" })}
          />
        )}

        {field.type === "file" && (
          <>
            <CheckRow
              label={t("elements.allowMultipleFiles")}
              checked={field.allowMultiple ?? false}
              onChange={(v) => updateField(field.id, { allowMultiple: v })}
            />
            <UnitField
              label={t("elements.uploadButtonText")}
              value={field.uploadButtonText ?? ""}
              placeholder={t("elements.uploadButtonTextPlaceholder")}
              onChange={(v) => updateField(field.id, { uploadButtonText: v })}
              help={t("elements.uploadButtonTextHelp")}
            />

            <TextAreaField
              label={t("elements.fieldDescription")}
              value={field.description ?? ""}
              placeholder={t("elements.fieldDescriptionPlaceholder")}
              onChange={(v) => updateField(field.id, { description: v })}
              rows={2}
              help={t("elements.fieldDescriptionHelp")}
            />

            {/* Seeded from the helper, so the lit segment is the alignment
                actually in force rather than an arbitrary default. */}
            <ChoiceRow
              label={t("elements.descriptionAlign")}
              value={fieldDescriptionAlign(field)}
              options={TEXT_ALIGNS.map((a) => ({ value: a, label: t(`alignment.${a}`) }))}
              onChange={(v) => updateField(field.id, { descriptionAlign: v as TextAlign })}
            />

            {/* Only meaningful alongside "Allow multiple files" — with it off
                the answer is always one, and a box saying otherwise would lie. */}
            {field.allowMultiple && (
              <UnitField
                label={t("elements.maxFiles")}
                type="number"
                value={field.maxFiles ?? ""}
                placeholder={t("elements.noLimit")}
                onChange={(v) => updateField(field.id, { maxFiles: clampPositiveInt(v) })}
                help={t("elements.maxFilesHelp")}
              />
            )}

            <UnitField
              label={t("elements.maxFileSize")}
              type="number"
              unit="MB"
              value={field.maxFileSizeMb ?? ""}
              placeholder={t("elements.noLimit")}
              onChange={(v) =>
                updateField(field.id, { maxFileSizeMb: clampPositiveInt(v, SUBMISSION_MAX_MB) })
              }
              help={t("elements.maxFileSizeHelp", { max: SUBMISSION_MAX_MB })}
            />
          </>
        )}

        {(field.type === "select" || field.type === "checkbox") && (
          <div>
            <span style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: C.body, marginBottom: 6 }}>
              {t("elements.options")}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(field.options ?? []).map((opt, oi) => (
                <div key={oi} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <UnitField
                      label=""
                      value={opt}
                      onChange={(v) => {
                        const n = [...(field.options ?? [])];
                        n[oi] = v;
                        updateField(field.id, { options: n });
                      }}
                    />
                  </div>
                  <MiniButton
                    glyph="trash"
                    danger
                    label={t("elements.remove", { defaultValue: "Remove" })}
                    onClick={() => {
                      const n = [...(field.options ?? [])];
                      n.splice(oi, 1);
                      updateField(field.id, { options: n });
                    }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <UnitField
                    label=""
                    value={optionInputs[field.id] ?? ""}
                    placeholder={t("elements.newOption")}
                    onChange={(v) => setOptionInputs((p) => ({ ...p, [field.id]: v }))}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addOption(field.id)}
                  style={{ ...secondaryButton, padding: "8px 12px", fontSize: 12.5, flexShrink: 0 }}
                >
                  {t("elements.addOption")}
                </button>
              </div>
            </div>
          </div>
        )}

        {field.type === "email" && (
          <CheckRow
            label={t("elements.sendSubmissionEmail")}
            checked={field.sendSubmissionEmail ?? false}
            onChange={(v) => updateField(field.id, { sendSubmissionEmail: v })}
            help={t("elements.sendSubmissionEmailHelp")}
          />
        )}

        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
          <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
            {t("elements.layoutHeading")}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <CheckRow label={t("elements.halfWidth")} checked={field.halfWidth ?? false} onChange={(v) => updateField(field.id, { halfWidth: v })} />
            <CheckRow label={t("elements.required")} checked={field.required} onChange={(v) => updateField(field.id, { required: v })} />
            <CheckRow label={t("elements.fieldInCenter")} checked={field.fieldInCenter ?? false} onChange={(v) => updateField(field.id, { fieldInCenter: v })} />
          </div>
        </div>

        {field.type === "email" && (
          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
            <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
              {t("elements.validationHeading")}
            </span>
            <CheckRow
              label={t("elements.emailValidation")}
              checked={field.emailValidation ?? false}
              onChange={(v) => updateField(field.id, { emailValidation: v })}
            />
          </div>
        )}
      </div>
    );
  }

  /* ── Style ───────────────────────────────────────────────────────────── */
  function renderStyle() {
    return (
      <>
        <GroupLabel>{t("designTabs.form")}</GroupLabel>

        <SubSection glyph="palette" title={t("formTab.backgroundHeading")}>
          <ChoiceRow
            label={t("formTab.bgType")}
            value={d.bgType}
            options={[
              { label: t("formTab.transparent"), value: "transparent" },
              { label: t("formTab.color"), value: "color" },
              { label: t("formTab.gradient"), value: "gradient" },
            ]}
            onChange={(v) => setD({ bgType: v as DesignSettings["bgType"] })}
          />
          {(d.bgType === "color" || d.bgType === "gradient") && (
            <ColorField label={t("formTab.bgColor")} value={d.bgColor} onChange={(v) => setD({ bgColor: v })} />
          )}
          {d.bgType === "gradient" && (
            <ColorField label={t("formTab.gradientEnd")} value={d.bgColor2} onChange={(v) => setD({ bgColor2: v })} />
          )}
          <SelectField
            label={t("formTab.bgShadow")}
            value={d.bgShadow}
            options={[
              { label: t("formTab.shadowNone"), value: "none" },
              { label: t("formTab.shadowSmall"), value: "0 1px 3px rgba(0,0,0,0.12)" },
              { label: t("formTab.shadowMedium"), value: "0 4px 12px rgba(0,0,0,0.15)" },
              { label: t("formTab.shadowLarge"), value: "0 8px 24px rgba(0,0,0,0.2)" },
            ]}
            onChange={(v) => setD({ bgShadow: v })}
          />
        </SubSection>

        <SubSection glyph="square" title={t("formTab.positionHeading")}>
          <UnitField label={t("formTab.formWidth")} value={d.formWidth} onChange={(v) => setD({ formWidth: v })} help={t("formTab.formWidthHelp")} />
          <UnitField label={t("formTab.formPadding")} value={d.formPadding} onChange={(v) => setD({ formPadding: v })} unit="px" />
        </SubSection>

        <SubSection glyph="square" title={t("formTab.borderHeading")}>
          <ColorField label={t("formTab.borderColor")} value={d.borderColor} onChange={(v) => setD({ borderColor: v })} />
          <UnitField label={t("formTab.borderRadius")} value={d.borderRadius} onChange={(v) => setD({ borderRadius: v })} unit="px" />
          <UnitField label={t("formTab.borderSize")} value={d.borderSize} onChange={(v) => setD({ borderSize: v })} unit="px" />
        </SubSection>

        <GroupLabel>{t("designTabs.input")}</GroupLabel>

        <SubSection glyph="text" title={t("inputTab.inputHeading")}>
          <ColorField label={t("inputTab.inputBg")} value={d.inputBg} onChange={(v) => setD({ inputBg: v })} />
          <ColorField label={t("inputTab.inputBorderColor")} value={d.inputBorderColor} onChange={(v) => setD({ inputBorderColor: v })} />
          <ColorField label={t("inputTab.inputBorderFocus")} value={d.inputBorderFocusColor} onChange={(v) => setD({ inputBorderFocusColor: v })} />
          <UnitField label={t("inputTab.inputBorderRadius")} value={d.inputBorderRadius} onChange={(v) => setD({ inputBorderRadius: v })} unit="px" />
        </SubSection>

        <SubSection glyph="text" title={t("inputTab.fontHeading")}>
          <UnitField label={t("inputTab.fontSize")} value={d.inputFontSize} onChange={(v) => setD({ inputFontSize: v })} unit="px" />
          <ColorField label={t("inputTab.fontColor")} value={d.inputFontColor} onChange={(v) => setD({ inputFontColor: v })} />
          <ColorField label={t("inputTab.placeholderColor")} value={d.inputPlaceholderColor} onChange={(v) => setD({ inputPlaceholderColor: v })} />
        </SubSection>

        <SubSection glyph="text" title={t("inputTab.labelHeading")}>
          <UnitField label={t("inputTab.labelFontSize")} value={d.labelFontSize} onChange={(v) => setD({ labelFontSize: v })} unit="px" />
          <ColorField label={t("inputTab.labelColor")} value={d.labelColor} onChange={(v) => setD({ labelColor: v })} />
        </SubSection>

        <GroupLabel>{t("designTabs.button")}</GroupLabel>

        <SubSection glyph="cursor" title={t("buttonTab.positionHeading")}>
          <ChoiceRow
            label={t("buttonTab.alignment")}
            value={d.buttonAlignment}
            options={[
              { label: t("buttonTab.alignFull"), value: "full" },
              { label: t("buttonTab.alignLeft"), value: "left" },
              { label: t("buttonTab.alignCenter"), value: "center" },
              { label: t("buttonTab.alignRight"), value: "right" },
            ]}
            onChange={(v) => setD({ buttonAlignment: v as DesignSettings["buttonAlignment"] })}
          />
          <ColorField label={t("buttonTab.bg")} value={d.buttonBg} onChange={(v) => setD({ buttonBg: v })} />
        </SubSection>

        <SubSection glyph="text" title={t("buttonTab.textHeading")}>
          <UnitField label={t("buttonTab.text")} value={d.buttonText} onChange={(v) => setD({ buttonText: v })} />
          <TextAreaField
            label={t("buttonTab.description")}
            value={d.buttonDescription}
            placeholder={t("buttonTab.descriptionPlaceholder")}
            onChange={(v) => setD({ buttonDescription: v })}
            rows={2}
            help={t("buttonTab.descriptionHelp")}
          />
          <ChoiceRow
            label={t("buttonTab.descriptionAlign")}
            value={submitDescriptionAlign(d)}
            options={TEXT_ALIGNS.map((a) => ({ value: a, label: t(`alignment.${a}`) }))}
            onChange={(v) => setD({ buttonDescriptionAlign: v })}
          />
          <ColorField label={t("buttonTab.textColor")} value={d.buttonTextColor} onChange={(v) => setD({ buttonTextColor: v })} />
          <UnitField label={t("buttonTab.fontSize")} value={d.buttonFontSize} onChange={(v) => setD({ buttonFontSize: v })} unit="px" />
        </SubSection>

        <SubSection glyph="square" title={t("buttonTab.borderHeading")}>
          <ColorField label={t("buttonTab.borderColor")} value={d.buttonBorderColor} onChange={(v) => setD({ buttonBorderColor: v })} />
          <UnitField label={t("buttonTab.borderRadius")} value={d.buttonBorderRadius} onChange={(v) => setD({ buttonBorderRadius: v })} unit="px" />
          <UnitField label={t("buttonTab.borderWidth")} value={d.buttonBorderWidth} onChange={(v) => setD({ buttonBorderWidth: v })} unit="px" />
        </SubSection>

        <GroupLabel>{t("designTabs.uploadButton")}</GroupLabel>

        <SubSection
          glyph="upload"
          title={t("uploadBtn.heading")}
          hint={t("uploadBtn.hint")}
        >
          <ColorField label={t("uploadBtn.bg")} value={d.uploadBtnBg} onChange={(v) => setD({ uploadBtnBg: v })} />
          <ColorField label={t("uploadBtn.textColor")} value={d.uploadBtnTextColor} onChange={(v) => setD({ uploadBtnTextColor: v })} />
          <UnitField label={t("uploadBtn.fontSize")} value={d.uploadBtnFontSize} onChange={(v) => setD({ uploadBtnFontSize: v })} unit="px" />
          <ColorField label={t("uploadBtn.borderColor")} value={d.uploadBtnBorderColor} onChange={(v) => setD({ uploadBtnBorderColor: v })} />
          <UnitField label={t("uploadBtn.borderRadius")} value={d.uploadBtnBorderRadius} onChange={(v) => setD({ uploadBtnBorderRadius: v })} unit="px" />
          <UnitField label={t("uploadBtn.borderWidth")} value={d.uploadBtnBorderWidth} onChange={(v) => setD({ uploadBtnBorderWidth: v })} unit="px" />
        </SubSection>
      </>
    );
  }

  /* ── Layout ──────────────────────────────────────────────────────────── */
  function renderLayout() {
    return (
      <>
        <GroupLabel>{t("designTabs.layout")}</GroupLabel>
        <SubSection glyph="grid" title={t("layoutTab.heading")}>
          <SelectField
            label={t("layoutTab.labelStyle")}
            value={d.labelStyle}
            options={[
              { label: t("layoutTab.block"), value: "block" },
              { label: t("layoutTab.inline"), value: "inline" },
              { label: t("layoutTab.floating"), value: "floating" },
            ]}
            onChange={(v) => setD({ labelStyle: v as DesignSettings["labelStyle"] })}
          />
        </SubSection>
      </>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <PanelTabs<TabId>
          active={tab}
          onSelect={setTab}
          tabs={[
            { id: "content", label: t("designGroups.content"), glyph: "document" },
            { id: "style",   label: t("designGroups.style"),   glyph: "palette" },
            { id: "layout",  label: t("designGroups.layout"),  glyph: "grid" },
          ]}
        />
      </div>

      {tab === "content" && renderContent()}
      {tab === "style" && renderStyle()}
      {tab === "layout" && renderLayout()}
    </div>
  );
}
