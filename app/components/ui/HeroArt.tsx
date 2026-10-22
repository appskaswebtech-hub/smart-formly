import Glyph, { type GlyphName } from "./Icon";
import { C } from "./theme";

/**
 * The illustration that sits on the right of every hero.
 *
 * One composition, reused across tabs: a soft blob, two stacked document cards,
 * a green emblem, and a floating checklist panel. Only the emblem glyph and the
 * four captions change per tab, which is what keeps the set looking like one
 * family rather than seven unrelated drawings.
 *
 * Drawn as SVG rather than bitmaps so it stays sharp at any width and takes its
 * colours from the palette.
 */
export type ArtVariant =
  | "forms" | "billing" | "manage" | "build" | "submissions" | "settings" | "help";

type Row = { icon: GlyphName; label: string };

/** `list` swaps the document card for the checklist treatment used on My Forms. */
type CardStyle = "document" | "list";

const VARIANTS: Record<ArtVariant, { emblem: GlyphName | "clipboard"; rows: Row[]; card?: CardStyle }> = {
  forms: {
    emblem: "clipboard",
    rows: [
      { icon: "document", label: "Easy Form Builder" },
      { icon: "external", label: "Show on Storefront" },
      { icon: "inbox",    label: "Collect Submissions" },
      { icon: "chart",    label: "Analytics & Insights" },
    ],
  },
  billing: {
    emblem: "dollar",
    rows: [
      { icon: "check",    label: "Secure Payments" },
      { icon: "star",     label: "Easy Plan Upgrades" },
      { icon: "gear",     label: "Manage Subscriptions" },
      { icon: "document", label: "Detailed Billing History" },
    ],
  },
  manage: {
    emblem: "plus",
    card: "list",
    rows: [
      { icon: "document", label: "Create Custom Forms" },
      { icon: "inbox",    label: "View Submissions" },
      { icon: "chart",    label: "Track Performance" },
      { icon: "gear",     label: "Edit Anytime" },
    ],
  },
  build: {
    emblem: "plus",
    card: "list",
    rows: [
      { icon: "document", label: "Drag & Drop Fields" },
      { icon: "star",     label: "Customize Design" },
      { icon: "inbox",    label: "Set Up Notifications" },
      { icon: "check",    label: "Publish in Minutes" },
    ],
  },
  submissions: {
    emblem: "chart",
    rows: [
      { icon: "inbox",    label: "View All Submissions" },
      { icon: "document", label: "Filter & Search" },
      { icon: "external", label: "Export Data" },
      { icon: "gear",     label: "Manage Responses" },
    ],
  },
  settings: {
    emblem: "gear",
    rows: [
      { icon: "gear",     label: "App Preferences" },
      { icon: "document", label: "Language Settings" },
      { icon: "inbox",    label: "Email Options" },
      { icon: "star",     label: "Integrations" },
    ],
  },
  help: {
    emblem: "chat",
    rows: [
      { icon: "check",    label: "Setup Guidance" },
      { icon: "chat",     label: "Helpful Answers" },
      { icon: "document", label: "Documentation" },
      { icon: "inbox",    label: "Contact Support" },
    ],
  },
};

export function HeroArt({ variant }: { variant: ArtVariant }) {
  const { emblem, rows, card = "document" } = VARIANTS[variant];
  const isList = card === "list";

  return (
    <svg viewBox="0 0 460 300" width="100%" height="100%" role="presentation" focusable="false">
      <defs>
        <linearGradient id="sf-emblem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.bright} />
          <stop offset="100%" stopColor={C.deep} />
        </linearGradient>
        {/* Backdrop gets direction rather than being one flat wash. */}
        <linearGradient id="sf-blob" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.soft} />
          <stop offset="100%" stopColor={C.wash} />
        </linearGradient>
        {/* Faint sheen so card surfaces are not dead white. */}
        <linearGradient id="sf-card" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FBFDFC" />
        </linearGradient>
        {/* Highlight across the emblem, so it reads as an object. */}
        <linearGradient id="sf-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* Two planes: paper sits close, the emblem and panel float above it. */}
        <filter id="sf-shadow-sm" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#0B6B45" floodOpacity="0.08" />
        </filter>
        <filter id="sf-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="18" floodColor="#0B6B45" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Organic blob behind the whole scene */}
      <path
        d="M78 108c14-46 56-80 108-86 54-7 104 10 148 40 42 29 70 64 66 106-4 43-40 72-88 88-49 17-110 22-158 4-49-18-90-62-96-106-3-18 6-32 20-46Z"
        fill="url(#sf-blob)"
      />
      {/* Balances the weight and fills the empty top-right corner. */}
      <circle cx="392" cy="58" r="38" fill={C.soft} opacity="0.5" />

      {/* Four-point accents, placed in the gaps so the eye travels the whole
          composition rather than stopping at the cards. */}
      <path
        d="M60 69Q61.3 74.7 67 76Q61.3 77.3 60 83Q58.7 77.3 53 76Q58.7 74.7 60 69Z"
        fill={C.bright}
        opacity="0.9"
      />
      <path
        d="M418 187Q419.6 194.4 427 196Q419.6 197.6 418 205Q416.4 197.6 409 196Q416.4 194.4 418 187Z"
        fill={C.bright}
        opacity="0.55"
      />
      <path
        d="M268 36Q269.1 40.9 274 42Q269.1 43.1 268 48Q266.9 43.1 262 42Q266.9 40.9 268 36Z"
        fill={C.bright}
        opacity="0.4"
      />

      {/* Back card, offset and tilted to suggest a stack */}
      <g transform="rotate(-8 185 140)" opacity="0.85" filter="url(#sf-shadow-sm)">
        <rect x="68" y="54" width="210" height="152" rx="16" fill="#fff" stroke={C.line} />
      </g>

      {/* Front card */}
      <g filter="url(#sf-shadow-sm)">
        <rect x="92" y="72" width="212" height="152" rx="16" fill="url(#sf-card)" stroke={C.line} />
        {isList ? (
          <>
            {/* Green heading bar, then bulleted rows */}
            <rect x="112" y="90" width="150" height="14" rx="7" fill="url(#sf-emblem)" />
            {[126, 150, 174, 198].map((y, i) => (
              <g key={y}>
                <rect x="112" y={y - 7} width="14" height="14" rx="4" fill={C.bright} />
                <rect
                  x="136"
                  y={y - 5}
                  width={[108, 124, 96, 116][i]}
                  height="10"
                  rx="5"
                  fill="#EDF0EF"
                />
              </g>
            ))}
            {/* Pen angled over the top-right corner */}
            <g transform="translate(268 74) rotate(32)">
              <path d="M0 0h8v20l-4 7-4-7Z" fill={C.bright} />
              <path d="M0 15h8" stroke="#fff" strokeWidth="1.6" />
            </g>
          </>
        ) : (
          <>
            {/* Amber accent dot */}
            <circle cx="112" cy="95" r="4.5" fill="#F5A623" />
            <rect x="126" y="90" width="118" height="9" rx="4.5" fill={C.soft} />
            {/* Body lines */}
            <rect x="112" y="118" width="160" height="9" rx="4.5" fill="#EDF0EF" />
            <rect x="112" y="138" width="134" height="9" rx="4.5" fill="#EDF0EF" />
            <rect x="112" y="158" width="150" height="9" rx="4.5" fill="#EDF0EF" />
            <rect x="112" y="178" width="106" height="9" rx="4.5" fill="#EDF0EF" />
          </>
        )}
      </g>

      {/* Checklist panel, overlapping the card's right edge */}
      <g filter="url(#sf-shadow)">
        <rect x="282" y="70" width="170" height="172" rx="16" fill="url(#sf-card)" stroke={C.line} />
        {rows.map((row, i) => {
          const y = 102 + i * 38;
          return (
            <g key={row.label}>
              <rect x="298" y={y - 13} width="26" height="26" rx="8" fill={C.soft} />
              <g transform={`translate(${303} ${y - 8})`}>
                <Glyph name={row.icon} size={16} color={C.deep} strokeWidth={1.9} />
              </g>
              <text x="334" y={y + 4} fontSize="10.5" fill={C.body} fontFamily="inherit">
                {row.label}
              </text>
            </g>
          );
        })}
      </g>

      {/* Emblem last, so it sits above the checklist panel it overlaps.
          The dashboard bag keeps its own spot on the card; every other tab
          uses the centre-right circle with a soft halo. */}
      {variant === "build" ? (
        <g>
          {/* Dashed drop target plus the cursor, as in the reference */}
          <rect
            x="140" y="150" width="140" height="46" rx="8"
            fill="#fff" fillOpacity="0.65"
            stroke={C.mid} strokeWidth="1.8" strokeDasharray="5 4"
          />
          <g filter="url(#sf-shadow)">
            <path
              d="M246 176l5 26 6-10 11 2-22-18Z"
              fill="#fff" stroke={C.deep} strokeWidth="2" strokeLinejoin="round"
            />
          </g>
        </g>
      ) : emblem === "clipboard" ? (
        <g>
          <rect x="88" y="142" width="78" height="78" rx="24" fill={C.bright} opacity="0.18" />
          <g filter="url(#sf-shadow)">
            <rect x="96" y="150" width="62" height="62" rx="17" fill="url(#sf-emblem)" />
            <rect x="96" y="150" width="62" height="31" rx="17" fill="url(#sf-gloss)" />
          </g>
          {/* Board */}
          <rect x="112" y="166" width="30" height="34" rx="4" fill="#fff" />
          {/* Clip across the top */}
          <rect x="120" y="161" width="14" height="7" rx="2.5" fill="#fff" />
          <rect x="121.5" y="162.5" width="11" height="4" rx="1.5" fill={C.deep} />
          {/* Tick, cut in green so it reads against the white board */}
          <path
            d="m118.5 183 4.5 4.5 9-9.5"
            fill="none"
            stroke={C.deep}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : (
        <g>
          <circle cx={isList ? 256 : 286} cy={isList ? 180 : 168} r={isList ? 44 : 40} fill={C.bright} opacity="0.16" />
          <g filter="url(#sf-shadow)">
            <circle cx={isList ? 256 : 286} cy={isList ? 180 : 168} r={isList ? 34 : 31} fill="url(#sf-emblem)" />
            <path
              d={isList
                ? "M222 180a34 34 0 0 1 68 0Z"
                : "M255 168a31 31 0 0 1 62 0Z"}
              fill="url(#sf-gloss)"
            />
          </g>
          <g transform={isList ? "translate(241 165)" : "translate(272 154)"}>
            <Glyph name={emblem} size={isList ? 30 : 28} color="#fff" strokeWidth={2} />
          </g>
        </g>
      )}
    </svg>
  );
}

export default HeroArt;
