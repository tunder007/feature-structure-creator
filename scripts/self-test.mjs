#!/usr/bin/env node
// Self-test for the Feature-structure creator. Builds a throwaway FIXTURE features dir with two
// existing NN-slug dossiers + a FEATURES.md, scaffolds a new feature, and asserts the guarantees:
//   next number (NN+1) + kebab slug · folder created · .md has the 8 H2 sections IN ORDER · one
//   metadata syntax · .html generated and contains the title · index updated with one row ·
//   re-running the same create is a NO-OP (idempotent, no duplicate). Offline & deterministic.
// Uses a UNIQUE temp dir and never touches anything outside it.
import { fs, path, readText } from "./lib/util.mjs";
import { buildPlan, applyPlan, validateDossier, readCatalog, SECTIONS } from "./lib/run.mjs";

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? "  ✓" : "  ✗"} ${msg}`); if (!cond) failures++; };

// --- build a fixture features dir (UNIQUE path, per the task) ---
const fixture = "/tmp/feature-creator-selftest";
fs.rmSync(fixture, { recursive: true, force: true });
const write = (rel, content) => { const abs = path.join(fixture, rel); fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, content); };

// Two existing dossiers (numbers 01 and 02) + an index with a catalog table.
write("01-alpha-engine/alpha-engine.md", "# Alpha Engine\n\nOne-line scope: First.\n\n**Group:** Detection Engine\n**Status:** Implemented\n");
write("02-beta-layer/beta-layer.md", "# Beta Layer\n\nOne-line scope: Second.\n\n**Group:** Data & Infrastructure\n**Status:** Specified\n");
write("FEATURES.md", [
  "# LUMEN — Feature Catalog (AI index)",
  "",
  "| # | Feature | Scope |",
  "|---|---|---|",
  "| 01 | [Alpha Engine](01-alpha-engine/alpha-engine.md) | First. |",
  "| 02 | [Beta Layer](02-beta-layer/beta-layer.md) | Second. |",
  ""
].join("\n"));

console.log(`\nFeature-structure creator — self-test`);
console.log(`fixture: ${fixture}\n`);

// --- run 1: build + apply a new feature ---
const NAME = "Gamma Signal Router";
const opts = { group: "Detection Engine", status: "Specified only", scope: "Routes Gamma signals to the right branch." };

const before = readCatalog(fixture);
const plan = buildPlan(fixture, NAME, opts);

console.log("Numbering & slug");
ok(before.nextNum === 3, `next number derived from catalog is 03 (got ${String(before.nextNum).padStart(2, "0")})`);
ok(plan.num === 3, `new feature assigned number 03 (got ${String(plan.num).padStart(2, "0")})`);
ok(plan.slug === "gamma-signal-router", `kebab slug derived (got "${plan.slug}")`);
ok(plan.folder === "03-gamma-signal-router", `folder is NN-slug (got "${plan.folder}")`);

applyPlan(fixture, plan, { backup: false, backupDirName: "t1" });

console.log("Files created");
const mdAbs = path.join(fixture, "03-gamma-signal-router", "gamma-signal-router.md");
const htmlAbs = path.join(fixture, "03-gamma-signal-router", "gamma-signal-router.html");
const md = readText(mdAbs);
const html = readText(htmlAbs);
ok(md != null, "<slug>.md created");
ok(html != null, "<slug>.html created");

console.log("Schema: 8 H2 sections in order + one metadata syntax");
const h2 = (md || "").split("\n").filter((l) => /^## /.test(l)).map((l) => l.slice(3).trim());
ok(h2.length === 8, `exactly 8 H2 sections (got ${h2.length})`);
ok(JSON.stringify(h2) === JSON.stringify(SECTIONS), `H2 sections match canonical order: ${h2.join(" → ")}`);
ok(/^\*\*Group:\*\* Detection Engine/m.test(md) && /^\*\*Status:\*\* Specified only/m.test(md), "**Group:**/**Status:** metadata present");
ok(!/^---\s*$/.test((md || "").split("\n")[0] || ""), "no YAML frontmatter (single metadata syntax)");
const v = validateDossier(md, { slug: plan.slug });
ok(v.ok, `validateDossier passes (${v.errors.join("; ") || "no errors"})`);

console.log("HTML generation (from md)");
ok(html.includes("Gamma Signal Router"), ".html contains the feature title");
ok(html.includes("Routes Gamma signals"), ".html carries the one-line scope (constants identical to .md)");
ok((html.match(/<div/g) || []).length === (html.match(/<\/div>/g) || []).length, "<div> tags are balanced");

console.log("Index update");
const idx = readText(path.join(fixture, "FEATURES.md"));
ok(idx.includes("03-gamma-signal-router/gamma-signal-router.md"), "FEATURES.md gained a row linking the new dossier");
ok((idx.match(/^\| 0\d \|/gm) || []).length === 3, "catalog now has 3 numbered rows (01, 02, 03)");

console.log("Idempotency (re-run = no-op, no duplicate)");
const plan2 = buildPlan(fixture, NAME, opts);
const changed = [...plan2.files, plan2.index].filter(Boolean).filter((f) => f.status !== "unchanged").map((f) => f.rel);
ok(plan2.num === 3, "re-run reuses number 03 (does not allocate 04)");
ok(changed.length === 0, `re-run is a no-op (would change: ${changed.join(", ") || "nothing"})`);
const res2 = applyPlan(fixture, plan2, { backup: false, backupDirName: "t2" });
ok(res2.written.length === 0, `apply writes nothing on re-run (wrote: ${res2.written.join(", ") || "nothing"})`);
const idx2 = readText(path.join(fixture, "FEATURES.md"));
ok((idx2.match(/03-gamma-signal-router\/gamma-signal-router\.md/g) || []).length === 1, "no duplicate index row after re-run");

// --- cleanup (only inside the temp fixture) ---
fs.rmSync(fixture, { recursive: true, force: true });

console.log(failures ? `\nSELF-TEST FAILED (${failures} assertion${failures > 1 ? "s" : ""})\n` : `\nSELF-TEST PASSED\n`);
process.exit(failures ? 1 : 0);
