#!/usr/bin/env node
// Feature-structure creator — CLI. Scaffolds a new feature dossier on the lumen-features
// 8-section schema (.md source of truth + generated .html), in NN-<slug>/, and updates the index.
//
// Usage:
//   node create.mjs "<Feature Name>" --features-dir <dir> [--group G] [--status S]
//                    [--scope "..."] [--slug s] [--write] [--no-backup]
//
// Default is DRY-RUN: prints the plan, writes nothing. Pass --write to apply (backs up any
// overwritten index file first). Re-running the same create is a no-op (idempotent).
import { fs, path } from "./lib/util.mjs";
import { buildPlan, applyPlan, validateDossier } from "./lib/run.mjs";

function parseArgs(argv) {
  const a = { name: null, featuresDir: ".", group: "", status: "", scope: "", slug: "", title: "", write: false, backup: true };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i];
    if (t === "--features-dir") a.featuresDir = rest[++i];
    else if (t === "--group") a.group = rest[++i];
    else if (t === "--status") a.status = rest[++i];
    else if (t === "--scope") a.scope = rest[++i];
    else if (t === "--slug") a.slug = rest[++i];
    else if (t === "--title") a.title = rest[++i];
    else if (t === "--write") a.write = true;
    else if (t === "--no-backup") a.backup = false;
    else if (!t.startsWith("--") && a.name == null) a.name = t;
  }
  return a;
}

function usage() {
  console.error(`Usage: node create.mjs "<Feature Name>" --features-dir <dir> [--group G] [--status S] [--scope "..."] [--slug s] [--write] [--no-backup]`);
}

function lineCount(s) { return s.split("\n").length; }

function main() {
  const args = parseArgs(process.argv);
  if (!args.name) { console.error("Error: feature name is required.\n"); usage(); process.exit(2); }

  const featuresDir = path.resolve(args.featuresDir);
  if (!fs.existsSync(featuresDir)) { console.error(`Error: --features-dir not found: ${featuresDir}`); process.exit(2); }

  const plan = buildPlan(featuresDir, args.name, {
    group: args.group, status: args.status, scope: args.scope,
    slug: args.slug, title: args.title || args.name
  });

  // Validate the generated .md before we offer to write it.
  const mdFile = plan.files.find((f) => f.rel.endsWith(`${plan.slug}.md`));
  const v = validateDossier(mdFile.content, { slug: plan.slug });

  console.log(`\nFeature-structure creator — "${plan.meta.title}"  (${args.write ? "--write" : "dry-run"})`);
  console.log(`features dir: ${featuresDir}`);
  console.log(`derived: number=${String(plan.num).padStart(2, "0")}  slug=${plan.slug}  folder=${plan.folder}/`);
  console.log(`schema check: ${v.ok ? "PASS (8 sections in order, one metadata syntax)" : "FAIL"}`);
  if (!v.ok) for (const e of v.errors) console.log(`   ✗ ${e}`);

  console.log(`\nPlan:`);
  for (const f of plan.files) console.log(`  ${f.status.padEnd(9)} ${f.rel}${f.status === "create" ? `  (+${lineCount(f.content)} lines)` : ""}`);
  if (plan.index) console.log(`  ${plan.index.status.padEnd(9)} ${plan.index.rel}${plan.index.status === "update" ? "  (+1 catalog row)" : ""}`);
  else console.log(`  (no FEATURES.md found — index update skipped)`);

  if (!args.write) {
    console.log(`\n(dry-run — no files written. Re-run with --write to apply.)\n`);
    process.exit(v.ok ? 0 : 1);
  }
  if (!v.ok) { console.log(`\nRefusing to --write: schema validation failed.\n`); process.exit(1); }

  const backupDirName = new Date().toISOString().replace(/[:.]/g, "-"); // backup folder name only
  const res = applyPlan(featuresDir, plan, { backup: args.backup, backupDirName });
  console.log(`\nApplied: ${res.written.length} written, ${res.skipped.length} unchanged.` + (res.backupDir && res.written.length ? `  Backups: ${res.backupDir}/` : ""));
  console.log(`Next: edit ${plan.folder}/${plan.slug}.md (fill the _TODO_ placeholders) then re-run to regenerate the .html.\n`);
}

main();
