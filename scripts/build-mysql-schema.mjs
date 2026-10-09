/**
 * Generates prisma/schema.mysql.prisma from prisma/schema.prisma.
 *
 * Production runs MySQL while local development stays on SQLite, and a single
 * Prisma schema cannot serve both: `@db.LongText` and `@db.VarChar` are
 * MySQL-only native types and Prisma rejects them under the sqlite provider
 * ("Native type LongText is not supported for sqlite connector"). Rather than
 * hand-maintain two schemas that drift apart, the MySQL one is derived from the
 * SQLite one, which stays the single source of truth.
 *
 * Why these columns:
 *   LongText  — they hold serialised JSON. `FormConfig.design` is the worst
 *               case, carrying the banner image as a base64 data URL, so it can
 *               run to megabytes. Prisma's default is VARCHAR(191).
 *   VarChar   — fieldLabel and filename come from outside our control (whatever
 *               the merchant titled the field, whatever the shopper uploaded),
 *               so 191 is too tight but LongText would be wasteful.
 *
 * Every substitution must match exactly once. A renamed model or column fails
 * the build loudly instead of silently shipping a VARCHAR(191) that truncates
 * merchant data.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "prisma", "schema.prisma");
const TARGET = path.join(ROOT, "prisma", "schema.mysql.prisma");

/** Columns that need a MySQL native type, and which one. */
const NATIVE_TYPES = [
  { model: "FormConfig",     column: "fields",     attribute: "@db.LongText" },
  { model: "FormConfig",     column: "settings",   attribute: "@db.LongText" },
  { model: "FormConfig",     column: "design",     attribute: "@db.LongText" },
  { model: "FormSubmission", column: "data",       attribute: "@db.LongText" },
  { model: "FormAttachment", column: "fieldLabel", attribute: "@db.VarChar(512)" },
  { model: "FormAttachment", column: "filename",   attribute: "@db.VarChar(512)" },
];

const BANNER = `// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — DO NOT EDIT.
// Produced by scripts/build-mysql-schema.mjs from prisma/schema.prisma.
// Edit the source schema instead, then re-run \`npm run setup:mysql\`.
// ─────────────────────────────────────────────────────────────────────────────

`;

const problems = [];

function replaceOnce(text, pattern, replacement, what) {
  const matches = text.match(pattern);
  if (!matches || matches.length !== 1) {
    problems.push(`${what}: expected 1 match, found ${matches ? matches.length : 0}`);
    return text;
  }
  return text.replace(pattern, replacement);
}

/**
 * Finds `  <column>  String ...` inside `model <model> { ... }`, capturing the
 * preamble and the column's own line separately.
 *
 * The split matters: the attribute has to be placed relative to that one line,
 * not to the whole captured block. Capturing them together once put the
 * attribute on the preceding field, before a comment several lines above.
 */
function columnPattern(model, column) {
  return new RegExp(
    `(model\\s+${model}\\s*\\{[\\s\\S]*?\\n)(\\s*${column}\\s+String[^\\n]*)`,
    "g",
  );
}

/**
 * Appends the attribute to a field line, before any trailing `//` comment —
 * otherwise the attribute lands inside the comment and Prisma ignores it.
 */
function appendAttribute(line, attribute) {
  const comment = line.indexOf("//");
  if (comment === -1) return `${line} ${attribute}`;
  return `${line.slice(0, comment).trimEnd()} ${attribute} ${line.slice(comment)}`;
}

let schema = fs.readFileSync(SOURCE, "utf8");
const eol = schema.includes("\r\n") ? "\r\n" : "\n";

schema = replaceOnce(
  schema,
  /provider\s*=\s*"sqlite"/g,
  'provider = "mysql"',
  "datasource provider",
);

for (const { model, column, attribute } of NATIVE_TYPES) {
  schema = replaceOnce(
    schema,
    columnPattern(model, column),
    (_match, preamble, columnLine) => preamble + appendAttribute(columnLine, attribute),
    `${model}.${column}`,
  );
}

if (problems.length > 0) {
  console.error("[build-mysql-schema] schema does not match expectations:");
  for (const p of problems) console.error(`  - ${p}`);
  console.error("Update NATIVE_TYPES in scripts/build-mysql-schema.mjs to match prisma/schema.prisma.");
  process.exit(1);
}

fs.writeFileSync(TARGET, BANNER.split("\n").join(eol) + schema, "utf8");
console.log(
  `[build-mysql-schema] wrote prisma/schema.mysql.prisma ` +
  `(provider=mysql, ${NATIVE_TYPES.length} native types applied)`,
);
