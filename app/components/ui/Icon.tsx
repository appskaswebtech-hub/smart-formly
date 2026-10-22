import { C, RADIUS } from "./theme";

/**
 * Small inline glyph set.
 *
 * Inline SVG rather than an icon package: these appear inside tinted chips at
 * one or two sizes only, and drawing them here keeps stroke weight and colour
 * under the palette's control.
 */
export type GlyphName =
  | "document" | "inbox" | "book" | "crown" | "star"
  | "chart" | "gear" | "chat" | "plus" | "external" | "check" | "dollar" | "info"
  | "save" | "rocket" | "eye" | "search" | "sliders" | "grid" | "trash"
  | "desktop" | "mobile" | "calendar" | "clock" | "phone" | "at" | "paragraph"
  | "caret" | "tickbox" | "upload" | "hash" | "text" | "copy"
  | "image" | "palette" | "square" | "cursor" | "shield" | "chevron" | "lock";

const PATHS: Record<GlyphName, JSX.Element> = {
  save: (
    <>
      <path d="M4 4.5h9L16 7.5v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-11Z" />
      <path d="M7 4.5v4h5v-4M7 16.5v-4h6v4" />
    </>
  ),
  rocket: (
    <>
      <path d="M8.5 13.5c-3 1-4.5 3.5-4.5 3.5s2.5-1.5 3.5-4.5" />
      <path d="M11 15.5 8 12.5 5 9.5c4-6 8.5-7 11.5-6.5.5 3-.5 7.5-6.5 11.5Z" />
      <circle cx="12.5" cy="7.5" r="1.4" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 10S5.5 5 10 5s7.5 5 7.5 5-3 5-7.5 5-7.5-5-7.5-5Z" />
      <circle cx="10" cy="10" r="2.4" />
    </>
  ),
  search: (
    <>
      <circle cx="9" cy="9" r="5.2" />
      <path d="m13 13 4 4" />
    </>
  ),
  sliders: (
    <>
      <path d="M3.5 6.5h13M3.5 13.5h13" />
      <circle cx="8" cy="6.5" r="2" />
      <circle cx="13" cy="13.5" r="2" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1.5" />
      <rect x="11" y="3.5" width="5.5" height="5.5" rx="1.5" />
      <rect x="3.5" y="11" width="5.5" height="5.5" rx="1.5" />
      <rect x="11" y="11" width="5.5" height="5.5" rx="1.5" />
    </>
  ),
  trash: (
    <>
      <path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" />
      <path d="M5.5 5.5 6.3 16a1 1 0 0 0 1 .9h5.4a1 1 0 0 0 1-.9l.8-10.5" />
    </>
  ),
  desktop: (
    <>
      <rect x="2.8" y="4" width="14.4" height="9.5" rx="1.5" />
      <path d="M7.5 17h5M10 13.5V17" />
    </>
  ),
  mobile: (
    <>
      <rect x="6" y="2.8" width="8" height="14.4" rx="2" />
      <path d="M9 15h2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.2" y="4.5" width="13.6" height="12" rx="2" />
      <path d="M3.2 8.5h13.6M7 3v3M13 3v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 6v4.3l2.8 1.7" />
    </>
  ),
  phone: (
    <>
      <path d="M6.8 3.5 8.6 7l-1.7 1.7a11 11 0 0 0 4.4 4.4L13 11.4l3.5 1.8v2.6a1.3 1.3 0 0 1-1.4 1.3C8.9 16.6 3.4 11.1 2.9 4.9A1.3 1.3 0 0 1 4.2 3.5h2.6Z" />
    </>
  ),
  at: (
    <>
      <circle cx="10" cy="10" r="3" />
      <path d="M13 7v4a2.2 2.2 0 0 0 4.3.7A7.6 7.6 0 1 0 14 16.6" />
    </>
  ),
  paragraph: (
    <>
      <path d="M11 3.5v13M14.5 3.5v13" />
      <path d="M11 3.5H8a4 4 0 0 0 0 8h3" />
    </>
  ),
  caret: <path d="m5.5 8 4.5 4.5L14.5 8" />,
  tickbox: (
    <>
      <rect x="3.5" y="3.5" width="13" height="13" rx="2.5" />
      <path d="m6.8 10.2 2.3 2.3 4.4-4.8" />
    </>
  ),
  upload: (
    <>
      <path d="M10 13.5v-10M6.3 7.2 10 3.5l3.7 3.7" />
      <path d="M3.5 13v2.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V13" />
    </>
  ),
  hash: (
    <>
      <path d="M7.2 3.5 5.8 16.5M14.2 3.5l-1.4 13M3.8 7.6h12.4M3 12.4h12.4" />
    </>
  ),
  text: <path d="M4 5V3.6h12V5M10 3.6v12.8M7.5 16.4h5" />,
  info: (
    <>
      <circle cx="10" cy="10" r="7.4" />
      <path d="M10 9.2v4.2" />
      <path d="M10 6.7v.6" />
    </>
  ),
  check: <path d="m4.5 10.5 3.5 3.5 7.5-8" />,
  image: (
    <>
      <rect x="2.8" y="4" width="14.4" height="12" rx="2" />
      <circle cx="7.2" cy="8.2" r="1.3" />
      <path d="m3.2 13.6 3.6-3.3 3 2.7 3-2.6 4 3.6" />
    </>
  ),
  palette: (
    <>
      <path d="M10 2.6a7.4 7.4 0 0 0 0 14.8c1 0 1.6-.7 1.6-1.5 0-.9-.7-1.4-.7-2.1 0-.7.6-1.2 1.3-1.2h1.3a3.9 3.9 0 0 0 3.9-4c0-3.3-3.3-6-7.4-6Z" />
      <circle cx="6.6" cy="9.1" r="1" />
      <circle cx="9.4" cy="6.3" r="1" />
      <circle cx="13" cy="7.6" r="1" />
    </>
  ),
  square: <rect x="3.2" y="3.2" width="13.6" height="13.6" rx="2.4" />,
  cursor: (
    <>
      <path d="M5 3.2 15.2 9.4l-4.3 1.1-1.9 4.1L5 3.2Z" />
      <path d="m11.4 11.4 3.4 3.4" />
    </>
  ),
  shield: (
    <>
      <path d="M10 2.8 4.4 5.1v4.4c0 3.3 2.3 6.4 5.6 7.7 3.3-1.3 5.6-4.4 5.6-7.7V5.1L10 2.8Z" />
      <path d="m7.6 9.8 1.8 1.8 3.2-3.4" />
    </>
  ),
  chevron: <path d="m5.5 7.8 4.5 4.4 4.5-4.4" />,
  lock: (
    <>
      <rect x="4.2" y="8.8" width="11.6" height="8.4" rx="2" />
      <path d="M7 8.8V6.6a3 3 0 0 1 6 0v2.2" />
    </>
  ),
  copy: (
    <>
      <rect x="7.5" y="7.5" width="9" height="9" rx="2" />
      <path d="M12.5 7.5v-2a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h2" />
    </>
  ),
  dollar: (
    <>
      <path d="M10 2.6v14.8" />
      <path d="M13.4 6.6c0-1.6-1.5-2.5-3.4-2.5S6.6 5 6.6 6.7c0 3.7 6.8 2 6.8 5.5 0 1.7-1.5 2.6-3.4 2.6s-3.4-.9-3.4-2.6" />
    </>
  ),
  document: (
    <>
      <path d="M6 2.5h6l4 4v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z" />
      <path d="M12 2.5v4h4" />
      <path d="M8 11h6M8 14.5h4" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 11.5 5.5 4h9L17 11.5v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5Z" />
      <path d="M3 11.5h4l1 2h4l1-2h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H16v14H5.5A1.5 1.5 0 0 0 4 18.5v-14Z" />
      <path d="M4 15.5h12" />
    </>
  ),
  crown: (
    <>
      <path d="M3 7l3.5 3L10 4.5 13.5 10 17 7l-1.5 9h-11L3 7Z" />
    </>
  ),
  star: (
    <>
      <path d="m10 3 2.2 4.6 5 .7-3.6 3.5.85 5-4.45-2.35L5.55 16.8l.85-5L2.8 8.3l5-.7L10 3Z" />
    </>
  ),
  chart: (
    <>
      <path d="M4 16.5V9M9 16.5V4.5M14 16.5v-5" />
      <path d="M2.5 16.5h15" />
    </>
  ),
  gear: (
    <>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.6v2M10 15.4v2M17.4 10h-2M4.6 10h-2M15.2 4.8l-1.4 1.4M6.2 13.8l-1.4 1.4M15.2 15.2l-1.4-1.4M6.2 6.2 4.8 4.8" />
    </>
  ),
  chat: (
    <>
      <path d="M3.5 5.5A1.5 1.5 0 0 1 5 4h10a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 15 14H8l-4 3v-3H5a1.5 1.5 0 0 1-1.5-1.5v-7Z" />
    </>
  ),
  plus: (
    <>
      <path d="M10 4.5v11M4.5 10h11" />
    </>
  ),
  external: (
    <>
      <path d="M11 3.5h5.5V9" />
      <path d="M16.5 3.5 9 11" />
      <path d="M14.5 11.5v4a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h4" />
    </>
  ),
};

export function Glyph({
  name,
  size = 20,
  color = C.deep,
  strokeWidth = 1.6,
}: {
  name: GlyphName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

/** A glyph on a tinted rounded square, as used on stat tiles and plan cards. */
export function IconChip({
  name,
  tint,
  color = C.deep,
  size = 44,
}: {
  name: GlyphName;
  tint: string;
  color?: string;
  size?: number;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: RADIUS.control + 2,
        background: tint,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Glyph name={name} color={color} size={Math.round(size * 0.46)} />
    </span>
  );
}

export default Glyph;
