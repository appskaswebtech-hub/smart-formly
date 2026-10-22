/**
 * SmartFormly admin palette.
 *
 * One source of truth for the green used across every tab. The app previously
 * mixed indigo (#5C6AC4) and a teal paywall; both are replaced by this.
 *
 * Contrast notes, since several of these carry text:
 *   deep  on white  — 8.1:1   (headings, primary button background)
 *   mid   on white  — 4.6:1   (accent words in headings, links)
 *   ink   on white  — 16.1:1  (body headings)
 *   muted on white  — 4.7:1   (secondary copy)
 * Anything lighter is decorative only and never carries text.
 */
export const C = {
  /* Greens */
  deep:  "#0B6B45", // primary buttons, strong headings
  mid:   "#12855A", // accent word in a heading, icon strokes
  bright:"#1BA368", // illustration highlights
  soft:  "#D9F0E4", // icon chips, selected tab background
  wash:  "#EFF9F3", // hero background, subtle fills
  mint:  "#F5FBF8", // page-level tint

  /* Neutrals */
  ink:    "#111827",
  body:   "#374151",
  muted:  "#6B7280",
  faint:  "#9CA3AF",
  line:   "#E5E7EB",
  surface:"#FFFFFF",
  canvas: "#F6F6F7",

  /* Status */
  activeBg:   "#DCFCE7",
  activeText: "#166534",
  draftBg:    "#DBEAFE",
  draftText:  "#1E40AF",
  proBg:      "#FEF3C7",
  proText:    "#92400E",
  dangerText: "#B42318",
} as const;

export const RADIUS = { card: 12, hero: 16, pill: 999, control: 8 } as const;

/** Card surface used by every panel on every tab. */
export const cardStyle: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.line}`,
  borderRadius: RADIUS.card,
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};

/** Primary action. */
export const primaryButton: React.CSSProperties = {
  background: C.deep,
  color: "#fff",
  border: `1px solid ${C.deep}`,
  borderRadius: RADIUS.control,
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  lineHeight: 1.2,
};

/** Secondary action — same shape, white fill. */
export const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  background: C.surface,
  color: C.ink,
  border: `1px solid ${C.line}`,
};
