import type { GlyphName } from "./Icon";
import { C } from "./theme";

/**
 * Icon and tint per field type, so a field reads at a glance wherever it
 * appears — the element picker, the field list and the accordion header.
 *
 * Shared because both the create and edit pages render all three.
 */
export const ELEMENT_STYLE: Record<string, { glyph: GlyphName; tint: string; ink: string }> = {
  text:     { glyph: "text",      tint: "#EEF0FB", ink: "#4F46E5" },
  email:    { glyph: "at",        tint: "#E7F6EF", ink: "#0B6B45" },
  phone:    { glyph: "phone",     tint: "#E6F1FD", ink: "#1D4ED8" },
  textarea: { glyph: "paragraph", tint: "#F3EAFB", ink: "#7E22CE" },
  select:   { glyph: "caret",     tint: "#FDECEC", ink: "#DC2626" },
  checkbox: { glyph: "tickbox",   tint: "#E6F1FD", ink: "#1D4ED8" },
  file:     { glyph: "upload",    tint: "#EEF0FB", ink: "#4F46E5" },
  number:   { glyph: "hash",      tint: "#F3EAFB", ink: "#7E22CE" },
  date:     { glyph: "calendar",  tint: "#FDECEC", ink: "#DC2626" },
  time:     { glyph: "clock",     tint: "#FDE8EF", ink: "#BE185D" },
};

/** Falls back to a neutral document chip for any type not in the map. */
export function elementStyle(type: string) {
  return ELEMENT_STYLE[type] ?? { glyph: "document" as GlyphName, tint: C.soft, ink: C.deep };
}

/** The field types offered by the builder, in picker order. */
export const FIELD_TYPES = [
  { type: "text" },
  { type: "email" },
  { type: "phone" },
  { type: "textarea" },
  { type: "select" },
  { type: "checkbox" },
  { type: "file" },
  { type: "number" },
  { type: "date" },
  { type: "time" },
] as const;
