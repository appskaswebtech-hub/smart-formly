import type { ReactNode } from "react";

import Glyph, { IconChip, type GlyphName } from "./Icon";
import { C, RADIUS, cardStyle, primaryButton } from "./theme";

/**
 * Pieces of the form-builder chrome.
 *
 * Kept out of the route so the edit-form page can adopt the same look without
 * the markup being duplicated and drifting apart.
 */

/** A titled panel: icon chip, heading, subtitle, optional control on the right. */
export function SectionCard({
  glyph,
  title,
  subtitle,
  right,
  children,
}: {
  glyph: GlyphName;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section style={{ ...cardStyle, padding: 18 }}>
      <header
        className="sf-toolbar"
        style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}
      >
        <IconChip name={glyph} tint={C.soft} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 1 }}>{subtitle}</div>
          )}
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

/**
 * Numbered step control that doubles as the panel switcher.
 *
 * The underline sits at the bottom of each step button, inside the parent's
 * padding box. It was once pulled flush with the card's bottom edge by a
 * negative margin, which forced the parent to clip its overflow — and that
 * clipping cropped the buttons sitting beside it.
 *
 * `flex: 1 1 auto` with `minWidth: 0` lets the strip give up width when its
 * container is narrow, so it never pushes a sibling out of the card.
 */
export function Stepper({
  steps,
  active,
  onSelect,
}: {
  steps: string[];
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        flex: "1 1 auto",
        minWidth: 0,
      }}
    >
      {steps.map((label, i) => {
        const on = i === active;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(i)}
            aria-current={on ? "step" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "14px 18px",
              background: "none",
              border: "none",
              borderBottom: `3px solid ${on ? C.deep : "transparent"}`,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: on ? 600 : 500,
              color: on ? C.ink : C.muted,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 23,
                height: 23,
                borderRadius: "50%",
                background: on ? C.deep : "#EDEFF2",
                color: on ? "#fff" : C.muted,
                fontSize: 12,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** One tile in the Quick Settings grid. */
export function SettingTile({
  icon,
  label,
  badge,
  active,
  locked,
  onClick,
}: {
  icon: GlyphName;
  label: string;
  badge?: "pro" | "pro_plus";
  active: boolean;
  /** Above the shop's plan. Still selectable, so the panel can sell it. */
  locked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        width: "100%",
        padding: "11px 12px",
        textAlign: "left",
        background: active ? C.wash : "#fff",
        border: `1px solid ${active ? C.mid : C.line}`,
        borderRadius: RADIUS.control,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <Glyph name={locked ? "lock" : icon} size={16} color={active ? C.deep : locked ? C.faint : C.muted} />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 12.5,
          fontWeight: active ? 600 : 500,
          color: active ? C.deep : locked ? C.muted : C.body,
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
      {badge && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: RADIUS.pill,
            background: C.proBg,
            color: C.proText,
            flexShrink: 0,
          }}
        >
          {badge === "pro" ? "Pro" : "Pro+"}
        </span>
      )}
    </button>
  );
}

/**
 * Wraps a Quick Settings panel the shop's plan does not include.
 *
 * The panel is still rendered, greyed and inert, so the merchant can see what
 * they would be buying — hiding it would advertise nothing. The controls are
 * made unreachable by pointer *and* keyboard; `pointer-events: none` alone
 * would still let someone tab into the inputs.
 */
export function LockedPanel({
  title,
  body,
  cta,
  onUpgrade,
  children,
}: {
  title: string;
  body: string;
  cta: string;
  onUpgrade: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          marginBottom: 14,
          background: C.proBg,
          border: `1px solid ${C.proText}22`,
          borderRadius: RADIUS.control,
        }}
      >
        <span
          style={{
            width: 30, height: 30, borderRadius: 8, background: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <Glyph name="lock" size={15} color={C.proText} strokeWidth={1.8} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{title}</div>
          <div style={{ fontSize: 12, color: C.body, marginTop: 1 }}>{body}</div>
        </div>
        <button
          type="button"
          onClick={onUpgrade}
          style={{ ...primaryButton, flexShrink: 0, padding: "8px 14px", fontSize: 12.5 }}
        >
          {cta}
        </button>
      </div>

      {/* A disabled fieldset is the native way to switch off everything inside:
          it disables the controls and drops them from the tab order, which
          pointer-events alone would not do. */}
      <fieldset
        disabled
        style={{
          border: "none", margin: 0, padding: 0, minWidth: 0,
          opacity: 0.45, userSelect: "none",
        }}
      >
        {children}
      </fieldset>
    </div>
  );
}

/** One field type in the Form elements grid. */
export function ElementChip({
  glyph,
  tint,
  ink,
  label,
  onClick,
}: {
  glyph: GlyphName;
  tint: string;
  ink: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        width: "100%",
        padding: "9px 11px",
        textAlign: "left",
        background: "#fff",
        border: `1px solid ${C.line}`,
        borderRadius: RADIUS.control,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: tint,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Glyph name={glyph} size={14} color={ink} strokeWidth={1.8} />
      </span>
      <span style={{ fontSize: 12.5, color: C.body, lineHeight: 1.3 }}>{label}</span>
    </button>
  );
}

/** Two-up segmented control, used for the Desktop / Mobile preview switch. */
export function SegToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; glyph: GlyphName }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 4,
        padding: 3,
        background: "#F2F3F5",
        borderRadius: RADIUS.control,
      }}
    >
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={on}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: on ? C.deep : "transparent",
              color: on ? "#fff" : C.muted,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Glyph name={opt.glyph} size={14} color={on ? "#fff" : C.muted} strokeWidth={1.8} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   DESIGN PANEL CONTROLS
   ══════════════════════════════════════════════════════════════════ */

/** Pill tab strip for the design panel's top-level groups. */
export function PanelTabs<T extends string>({
  tabs,
  active,
  onSelect,
}: {
  tabs: { id: T; label: string; glyph: GlyphName }[];
  active: T;
  onSelect: (id: T) => void;
}) {
  return (
    /* Wraps rather than overflowing: this panel's width comes from its column,
       not the viewport, so no media query could get it right. */
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            aria-pressed={on}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              borderRadius: RADIUS.pill,
              border: `1px solid ${on ? C.deep : C.line}`,
              background: on ? C.deep : "#fff",
              color: on ? "#fff" : C.body,
              fontSize: 12.5,
              fontWeight: on ? 600 : 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Glyph name={tab.glyph} size={14} color={on ? "#fff" : C.muted} strokeWidth={1.8} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** A titled group of controls inside a design tab. */
export function SubSection({
  glyph,
  title,
  hint,
  children,
}: {
  glyph: GlyphName;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 22 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: C.soft,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Glyph name={glyph} size={14} color={C.deep} strokeWidth={1.8} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{title}</div>
          {hint && <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{hint}</div>}
        </div>
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </section>
  );
}

/** Shared label above a control. */
function ControlLabel({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: C.body, marginBottom: 5 }}>
      {children}
    </span>
  );
}

const inputShell: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  border: `1px solid ${C.line}`,
  borderRadius: RADIUS.control,
  background: "#fff",
  overflow: "hidden",
};

const bareInput: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "8px 10px",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 13,
  fontFamily: "inherit",
  color: C.ink,
};

/** Colour swatch plus hex entry, in one control. */
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label style={{ display: "block" }}>
      <ControlLabel>{label}</ControlLabel>
      <div style={inputShell}>
        {/* The native picker is the input itself, scaled up behind a round
            swatch so it reads as a colour chip rather than a form control. */}
        <span
          style={{
            position: "relative",
            width: 34,
            height: 34,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRight: `1px solid ${C.line}`,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: value,
              boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.12)`,
            }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              width: "100%",
              height: "100%",
              cursor: "pointer",
              border: "none",
              padding: 0,
            }}
          />
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          style={{ ...bareInput, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5 }}
        />
      </div>
    </label>
  );
}

/** Text entry with an optional unit chip and leading glyph. */
export function UnitField({
  label,
  value,
  onChange,
  unit,
  glyph,
  placeholder,
  help,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  unit?: string;
  glyph?: GlyphName;
  placeholder?: string;
  help?: string;
  type?: "text" | "number";
}) {
  return (
    <label style={{ display: "block" }}>
      <ControlLabel>{label}</ControlLabel>
      <div style={inputShell}>
        {glyph && (
          <span style={{ paddingLeft: 10, display: "inline-flex", flexShrink: 0 }}>
            <Glyph name={glyph} size={14} color={C.faint} strokeWidth={1.8} />
          </span>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={bareInput}
        />
        {unit && (
          <span
            style={{
              flexShrink: 0,
              alignSelf: "stretch",
              display: "inline-flex",
              alignItems: "center",
              padding: "0 10px",
              background: "#F7F8F9",
              borderLeft: `1px solid ${C.line}`,
              fontSize: 12,
              color: C.muted,
            }}
          >
            {unit}
          </span>
        )}
      </div>
      {help && <span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 4 }}>{help}</span>}
    </label>
  );
}

/** Dropdown styled to match the other fields. */
export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (next: string) => void;
}) {
  return (
    <label style={{ display: "block" }}>
      <ControlLabel>{label}</ControlLabel>
      <div style={{ ...inputShell, position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...bareInput,
            appearance: "none",
            paddingRight: 32,
            cursor: "pointer",
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "inline-flex" }}>
          <Glyph name="chevron" size={13} color={C.faint} strokeWidth={2} />
        </span>
      </div>
    </label>
  );
}

/** Multi-line text entry. */
export function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  help,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  placeholder?: string;
  help?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <ControlLabel>{label}</ControlLabel>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 10px",
          border: `1px solid ${C.line}`,
          borderRadius: RADIUS.control,
          fontSize: 13,
          fontFamily: "inherit",
          color: C.ink,
          boxSizing: "border-box",
          resize: "vertical",
        }}
      />
      {help && <span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 4 }}>{help}</span>}
    </label>
  );
}

/** Checkbox with label and optional help text. */
export function CheckRow({
  label,
  checked,
  onChange,
  help,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  help?: string;
}) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: C.deep, width: 15, height: 15, marginTop: 1, flexShrink: 0, cursor: "pointer" }}
      />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12.5, color: C.body }}>{label}</span>
        {help && <span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 2 }}>{help}</span>}
      </span>
    </label>
  );
}

/** Segmented choice, replacing a row of radio buttons. */
export function ChoiceRow({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      {label && <ControlLabel>{label}</ControlLabel>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map((opt) => {
          const on = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={on}
              style={{
                padding: "7px 13px",
                borderRadius: RADIUS.control,
                border: `1px solid ${on ? C.mid : C.line}`,
                background: on ? C.wash : "#fff",
                color: on ? C.deep : C.body,
                fontSize: 12.5,
                fontWeight: on ? 600 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Dashed upload target for the form banner. */
export function DropZone({
  title,
  hint,
  cta,
  onClick,
}: {
  title: string;
  hint: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        width: "100%",
        padding: "28px 16px",
        border: `2px dashed ${C.line}`,
        borderRadius: RADIUS.control,
        background: C.mint,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.mid;
        e.currentTarget.style.background = C.wash;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.line;
        e.currentTarget.style.background = C.mint;
      }}
    >
      <Glyph name="image" size={26} color={C.mid} strokeWidth={1.5} />
      <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{title}</span>
      <span style={{ fontSize: 12, color: C.muted }}>{hint}</span>
      <span
        style={{
          marginTop: 3,
          padding: "6px 14px",
          borderRadius: RADIUS.control,
          background: C.deep,
          color: "#fff",
          fontSize: 12.5,
          fontWeight: 600,
        }}
      >
        {cta}
      </span>
    </button>
  );
}

/** Small square icon button used for reordering and removing a field. */
export function MiniButton({
  glyph,
  label,
  onClick,
  disabled,
  danger,
  rotate,
}: {
  glyph: GlyphName;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  danger?: boolean;
  rotate?: number;
}) {
  const tone = danger ? C.dangerText : C.muted;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 22,
        padding: 0,
        border: `1px solid ${C.line}`,
        borderRadius: 6,
        background: "#fff",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
        flexShrink: 0,
      }}
    >
      <span style={{ display: "inline-flex", transform: rotate ? `rotate(${rotate}deg)` : undefined }}>
        <Glyph name={glyph} size={13} color={tone} strokeWidth={2} />
      </span>
    </button>
  );
}

/** One field in a list: type chip, label, badges, reorder and remove. */
export function FieldRow({
  glyph,
  tint,
  ink,
  label,
  typeLabel,
  required,
  requiredLabel,
  onMoveUp,
  onMoveDown,
  onDelete,
  onClick,
  active,
  moveUpLabel,
  moveDownLabel,
  deleteLabel,
  children,
}: {
  glyph: GlyphName;
  tint: string;
  ink: string;
  label: string;
  typeLabel: string;
  required?: boolean;
  requiredLabel?: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  onClick?: () => void;
  active?: boolean;
  moveUpLabel: string;
  moveDownLabel: string;
  deleteLabel: string;
  /** Expanded detail, rendered under the row when present. */
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${active ? C.mid : C.line}`,
        borderRadius: RADIUS.control,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      <div
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-expanded={onClick ? !!active : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick();
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          cursor: onClick ? "pointer" : "default",
          background: active ? C.mint : "#fff",
        }}
      >
        {(onMoveUp || onMoveDown) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
            <MiniButton
              glyph="chevron"
              rotate={180}
              label={moveUpLabel}
              disabled={!onMoveUp}
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
            />
            <MiniButton
              glyph="chevron"
              label={moveDownLabel}
              disabled={!onMoveDown}
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
            />
          </div>
        )}

        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: tint,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Glyph name={glyph} size={14} color={ink} strokeWidth={1.8} />
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 11.5, color: C.muted }}>{typeLabel}</span>
            {required && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: RADIUS.pill,
                  background: C.proBg,
                  color: C.proText,
                }}
              >
                {requiredLabel}
              </span>
            )}
          </div>
        </div>

        <MiniButton
          glyph="trash"
          danger
          label={deleteLabel}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        />
      </div>

      {children && (
        <div style={{ padding: "14px 14px 16px", borderTop: `1px solid ${C.line}` }}>{children}</div>
      )}
    </div>
  );
}
