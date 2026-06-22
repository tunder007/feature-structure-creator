// Shared helpers (standalone so the skill is portable). Deterministic: no random, no Date in output.
import fs from "node:fs";
import path from "node:path";

export const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
export const posix = (p) => p.split(path.sep).join("/");
export const readText = (abs) => { try { return fs.readFileSync(abs, "utf8"); } catch { return null; } };

// Kebab-case slug: lowercase, ASCII-fold common accents, non-alnum → "-", collapse + trim dashes.
export function slugify(name) {
  const folded = String(name)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, ""); // strip combining diacritics
  return folded
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

// Zero-pad a number to width 2 (01, 02, …, 10, 11). Keeps numbering machine-sortable.
export const pad2 = (n) => String(n).padStart(2, "0");

// List immediate sub-directories of a features dir, sorted. Missing dir → [].
export function listDirs(absDir) {
  let entries;
  try { entries = fs.readdirSync(absDir, { withFileTypes: true }); } catch { return []; }
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort(cmp);
}

export { fs, path };
