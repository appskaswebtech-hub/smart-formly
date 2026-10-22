/**
 * Upload ceilings, shared by the builder and the submit endpoint.
 *
 * The 18 MB figure is not arbitrary: uploads travel as base64, which inflates
 * them by about a third, and most mail servers reject anything over 25 MB. It
 * is a cap on a whole submission, not on one file.
 *
 * The storefront keeps its own copy in form.liquid, which cannot import from
 * here — if this number changes, that one has to change with it.
 */
export const SUBMISSION_MAX_MB = 18;
export const SUBMISSION_MAX_BYTES = SUBMISSION_MAX_MB * 1024 * 1024;

/**
 * Keeps a numeric setting sane as it is typed.
 *
 * Empty stays empty, because an empty limit means "no limit" — returning 0
 * would silently turn "unlimited" into "none allowed".
 */
export function clampPositiveInt(value: string, max?: number): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const n = Math.floor(Number(trimmed));
  if (!Number.isFinite(n) || n < 1) return "";
  return String(max != null ? Math.min(n, max) : n);
}

/** A file's limits, as stored on the field. Empty means unlimited. */
export type UploadLimits = { maxFiles?: string; maxFileSizeMb?: string };

/** Parsed to numbers, or null where no limit is set. */
export function parseLimits(limits: UploadLimits): {
  maxFiles: number | null;
  maxBytes: number | null;
} {
  const files = Number(limits.maxFiles);
  const mb = Number(limits.maxFileSizeMb);
  return {
    maxFiles: Number.isFinite(files) && files > 0 ? Math.floor(files) : null,
    maxBytes: Number.isFinite(mb) && mb > 0 ? Math.floor(mb) * 1024 * 1024 : null,
  };
}
