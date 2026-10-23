/**
 * Where description text sits, for the builder and both previews.
 *
 * Both descriptions already had an effective alignment before the setting
 * existed — the field one inherited its wrapper, the submit one followed the
 * button. These helpers reproduce exactly that when nothing is set, so adding
 * the control does not silently re-align descriptions on live forms, and the
 * segmented control lights up the alignment actually in force.
 *
 * form.liquid mirrors this; it cannot import from here.
 */

export type TextAlign = "left" | "center" | "right" | "justify";

/** A field description inherits its wrapper, which "Field in center" centres. */
export function fieldDescriptionAlign(field: {
  descriptionAlign?: string;
  fieldInCenter?: boolean;
}): TextAlign {
  if (field.descriptionAlign) return field.descriptionAlign as TextAlign;
  return field.fieldInCenter ? "center" : "left";
}

/** The submit description follows the button unless told otherwise. */
export function submitDescriptionAlign(design: {
  buttonDescriptionAlign?: string;
  buttonAlignment?: string;
}): TextAlign {
  if (design.buttonDescriptionAlign) return design.buttonDescriptionAlign as TextAlign;
  // A full-width button spans the form, so its caption reads best centred.
  return design.buttonAlignment === "full"
    ? "center"
    : ((design.buttonAlignment || "left") as TextAlign);
}

/** The four choices offered, in the order the control shows them. */
export const TEXT_ALIGNS: TextAlign[] = ["left", "center", "right", "justify"];
