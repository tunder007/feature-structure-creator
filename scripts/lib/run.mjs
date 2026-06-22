// Core: derive numbering+slug → render .md + .html → plan (and apply) the new dossier + index update.
// Pure builders (no console, no writes) used by both the CLI (create.mjs) and the self-test, so
// behaviour is identical. `applyPlan` is the ONLY writer. Deterministic: no Date/random in output.
import { fs, path, posix, slugify, pad2, listDirs, readText } from "./util.mjs";
import { renderDossierMd, SECTIONS } from "../templates/schema.mjs";
import { renderDossierHtml } from "../templates/render-html.mjs";

const NN_SLUG = /^(\d{2,})-(.+)$/; // "03-signal-taxonomy" → ["03","signal-taxonomy"]

// Read the catalog: existing NN-slug folders + the next contiguous number.
export function readCatalog(featuresDir) {
  const dirs = listDirs(featuresDir);
  const entries = [];
  let max = 0;
  for (const d of dirs) {
    const m = NN_SLUG.exec(d);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    entries.push({ folder: d, num: n, slug: m[2] });
    if (n > max) max = n;
  }
  entries.sort((a, b) => a.num - b.num);
  return { entries, nextNum: max + 1 };
}

// Build the full plan for creating a feature. Pure: returns paths + content + per-file status.
// Idempotency: if a folder for the SAME slug already exists, we reuse its number (no duplicate,
// no renumber) and mark files unchanged/update accordingly.
export function buildPlan(featuresDir, name, opts = {}) {
  const slug = opts.slug ? slugify(opts.slug) : slugify(name);
  if (!slug) throw new Error(`Cannot derive a slug from "${name}"`);

  const { entries, nextNum } = readCatalog(featuresDir);
  const existing = entries.find((e) => e.slug === slug);
  const num = existing ? existing.num : nextNum;
  const folder = `${pad2(num)}-${slug}`;

  const meta = {
    title: opts.title || name,
    scope: opts.scope || "",
    group: opts.group || "",
    status: opts.status || "",
    slug,
    sections: opts.sections || {}
  };

  const mdRel = posix(path.join(folder, `${slug}.md`));
  const htmlRel = posix(path.join(folder, `${slug}.html`));
  const mdContent = renderDossierMd(meta);
  const htmlContent = renderDossierHtml(mdContent, meta);

  const files = [
    { rel: mdRel, content: mdContent },
    { rel: htmlRel, content: htmlContent }
  ];

  // Index (FEATURES.md): add a row if the feature isn't already listed. The index is OPTIONAL —
  // only planned when the file exists, and only changed when our slug is absent.
  const indexRel = "FEATURES.md";
  const indexAbs = path.join(featuresDir, indexRel);
  const indexCurrent = readText(indexAbs);
  let indexFile = null;
  if (indexCurrent != null) {
    const next = upsertIndexRow(indexCurrent, { num, slug, folder, title: meta.title, scope: meta.scope });
    indexFile = { rel: indexRel, content: next };
  }

  // Annotate status (create | update | unchanged) for each file.
  const annotate = (f) => {
    const cur = readText(path.join(featuresDir, f.rel));
    f.current = cur;
    f.status = cur == null ? "create" : (cur === f.content ? "unchanged" : "update");
    return f;
  };
  files.forEach(annotate);
  if (indexFile) annotate(indexFile);

  return { slug, num, folder, meta, files, index: indexFile };
}

// Insert (or refresh) a single catalog row for this feature into FEATURES.md, idempotently.
// We append to the LAST markdown table in the file (the catalog body) if the slug is not present.
// Row format mirrors the dossiers' index: `| NN | [Title](folder/slug.md) | scope |`.
export function upsertIndexRow(indexText, { num, slug, folder, title, scope }) {
  const linkTarget = `${folder}/${slug}.md`;
  if (indexText.includes(linkTarget)) return indexText; // already listed → no-op (idempotent)

  const scopeCell = (scope && scope.trim()) ? scope.trim().replace(/\|/g, "\\|") : "—";
  const row = `| ${pad2(num)} | [${title.replace(/\|/g, "\\|")}](${linkTarget}) | ${scopeCell} |`;

  const lines = indexText.split("\n");
  // Find the last table-row line (starts with "|"); insert our row right after it.
  let lastTableRow = -1;
  for (let i = 0; i < lines.length; i++) if (/^\s*\|/.test(lines[i])) lastTableRow = i;

  if (lastTableRow === -1) {
    // No table at all — append a fresh catalog table.
    const sep = indexText.endsWith("\n") ? "" : "\n";
    return indexText + `${sep}\n| # | Feature | Scope |\n|---|---|---|\n${row}\n`;
  }
  lines.splice(lastTableRow + 1, 0, row);
  return lines.join("\n");
}

// Apply the plan. Idempotent (skips unchanged). Backs up overwritten files unless backup=false.
// `backupDirName` is supplied by the caller (CLI uses a timestamp) so this stays Date-free.
export function applyPlan(featuresDir, plan, { backup = true, backupDirName = "backup" } = {}) {
  const written = [], skipped = [];
  const all = [...plan.files];
  if (plan.index) all.push(plan.index);
  const backupRoot = path.join(featuresDir, ".feature-creator", "backup", backupDirName);

  for (const f of all) {
    if (f.status === "unchanged") { skipped.push(f.rel); continue; }
    const abs = path.join(featuresDir, f.rel);
    if (backup && f.current != null) {
      const bAbs = path.join(backupRoot, f.rel);
      fs.mkdirSync(path.dirname(bAbs), { recursive: true });
      fs.writeFileSync(bAbs, f.current);
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, f.content);
    written.push(f.rel);
  }
  return { written, skipped, backupDir: backup ? posix(path.relative(featuresDir, backupRoot)) : null };
}

// Validate a rendered dossier .md against the canonical schema. Returns { ok, errors[] }.
// Checks: 8 H2 sections present, IN ORDER; exactly one metadata syntax (**Group:**/**Status:**,
// no YAML frontmatter); a one-line scope; and that no Related-features link is a self-reference.
export function validateDossier(md, { slug } = {}) {
  const errors = [];
  const lines = md.split("\n");

  if (/^---\s*$/.test(lines[0] || "")) errors.push("YAML frontmatter detected — use **Group:**/**Status:** (one metadata syntax only).");
  if (!/^# .+/.test(lines[0] || "")) errors.push("Missing H1 title on line 1.");
  if (!lines.some((l) => /^One-line scope:\s*\S/.test(l))) errors.push("Missing 'One-line scope:' line.");
  if (!lines.some((l) => /^\*\*Group:\*\*\s*\S/.test(l))) errors.push("Missing **Group:** metadata line.");
  if (!lines.some((l) => /^\*\*Status:\*\*\s*\S/.test(l))) errors.push("Missing **Status:** metadata line.");

  const h2 = lines.filter((l) => /^## /.test(l)).map((l) => l.slice(3).trim());
  for (let k = 0; k < SECTIONS.length; k++) {
    if (h2[k] !== SECTIONS[k]) {
      errors.push(`Section ${k + 1} should be "## ${SECTIONS[k]}" but found "${h2[k] ?? "(missing)"}".`);
    }
  }
  if (h2.length !== SECTIONS.length) errors.push(`Expected ${SECTIONS.length} H2 sections, found ${h2.length}.`);

  if (slug) {
    const selfRe = new RegExp(`\\]\\([^)]*${slug}/${slug}\\.md\\)`);
    if (selfRe.test(md)) errors.push("Related features contains a self-reference link.");
  }

  return { ok: errors.length === 0, errors };
}

export { SECTIONS };
