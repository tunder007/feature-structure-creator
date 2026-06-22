# Feature-structure creator — skill specification (AI-optimized)

> **Source of truth for this skill.** This `.md` is written for AI agents (dense, machine-parseable).
> The human view is [`README.html`](./README.html), generated from this file. Per project
> convention: **`.md` = AI optimization, `.html` = human view.**

The Feature-structure creator **scaffolds a new feature dossier** on the proven `lumen-features`
8-section schema: a dense `<slug>.md` (the AI source of truth) plus a generated `<slug>.html`
(the human view), inside a numbered `NN-<slug>/` folder, and it keeps the catalog index
(`FEATURES.md`) in sync. It is the authoring complement to the
[Deterministic Checker](../skill-deterministic-checker/README.md), which *measures* a catalog's
uniformity — this skill *produces* dossiers that pass that check by construction.

- **Task:** [`../03-skill-feature-structure-creator.md`](../03-skill-feature-structure-creator.md)
- **Status:** built (self-test passing)
- **Targets:** Claude Code · Codex · Cursor (one generator, three shells)

---

## 1. The problem it solves

LUMEN's feature catalog scored **9/9** on uniformity because all 20 dossiers share the **exact
same 8 H2 headings in the same order**, slugs are predictable (`01`–`20`, slug == folder minus the
number prefix), and numbering is gap-free. That uniformity is what makes the catalog
deterministically parseable. Authoring dossiers by hand invites the drift the benchmark found:
**three different metadata-header formats** (16 dossiers one way, 2 another, 2 a third) and
**broken `Related features` links**. This skill removes the drift at the source — a generator that
can only emit the canonical schema, with one metadata syntax, and that refuses to write a dossier
that fails validation.

---

## 2. What it does (functionalities)

A pipeline of **6 functionalities**, each documented under [`functionalities/`](./functionalities/)
on a uniform schema (Purpose · Inputs · Expected project structure · How it works · Output · Safety
· Failure modes it prevents).

| # | Functionality | Writes? |
|---|---|---|
| 01 | [Schema template](./functionalities/01-schema-template.md) | no (renderer) |
| 02 | [Slug & numbering](./functionalities/02-slug-and-numbering.md) | no (derivation) |
| 03 | [Markdown generation](./functionalities/03-md-generation.md) | yes (gated) |
| 04 | [HTML generation (from md)](./functionalities/04-html-generation.md) | yes (gated) |
| 05 | [Index & manifest update](./functionalities/05-index-and-manifest-update.md) | yes (gated) |
| 06 | [Validation](./functionalities/06-validation.md) | no (write gate) |

Functionality 01 holds the canonical schema and renders the `.md`; 02 derives the slug + next
number; 03 writes the `.md`; 04 generates the `.html` **from** that `.md`; 05 updates the index;
06 validates the result and gates `--write`.

---

## 3. Expected input

| Input | Required | Default | Notes |
|---|---|---|---|
| `"<Feature Name>"` | **yes** | — | First positional arg; derives the title + slug. |
| `--features-dir <dir>` | no | `.` | The catalog root to scan + write into. |
| `--group <G>` | no | `TODO` placeholder | The dossier's `**Group:**` (e.g. `Detection Engine`). |
| `--status <S>` | no | `Specified only (TODO)` | The dossier's `**Status:**`. |
| `--scope "<…>"` | no | `TODO` placeholder | The one-line scope under the title. |
| `--slug <s>` | no | derived from name | Override the kebab slug. |
| `--title <t>` | no | the name | Override the H1 title. |
| `--write` | no | off (dry-run) | Required to write; otherwise prints the plan. |
| `--no-backup` | no | off | By default an overwritten index/file is backed up first. |

**Invocation per agent**
- **Claude Code:** `/feature-structure-creator "<name>" --features-dir lumen-features` (Skill tool).
- **Codex:** read `AGENTS.md` → run `scripts/create.mjs "<name>" --features-dir lumen-features`.
- **Cursor:** rule `feature-structure-creator.mdc` → same script.

**Default is dry-run.** Nothing is written unless `--write` is passed.

---

## 4. Expected structure of catalogs it works in

Runs on any features catalog shaped like `lumen-features/`:

| Signal | Looks like | How it's used |
|---|---|---|
| **Numbered dossiers** | `NN-<slug>/` folders (`01-…`, `02-…`) | scanned for the next contiguous number |
| **Dossier files** | `<slug>.md` + `<slug>.html` inside each folder | the new dossier mirrors this exact shape |
| **Catalog index** | a `FEATURES.md` with a Markdown table | a row is appended (skipped if no index exists) |
| **Manifest** *(optional)* | a `MANIFEST.json` if present | an entry is upserted; `lumen-features/` has none today |

An empty catalog is valid — the first feature becomes `01-<slug>`.

---

## 5. The schema it produces (ported verbatim)

`# Title` → `One-line scope: …` → `**Group:** …` → `**Status:** …` → `---` → then the **8 H2
sections, in this exact order**:

1. `## Summary`
2. `## What it does / mechanics`
3. `## How it is built (implementation)`
4. `## Data-contract touchpoints`
5. `## Model B / rights notes`
6. `## Key parameters / values`
7. `## Related features`
8. `## References`

**One metadata syntax only:** strict markdown `**Group:**` / `**Status:**` (matching all real
dossiers) — **never** YAML frontmatter. This is the decision that fixes the benchmark's header
variance. The filename is the **slug only** (`signal-taxonomy.md`, not `03-signal-taxonomy.md`).

---

## 6. Output

In `--write` mode (otherwise a printed plan):

- `NN-<slug>/<slug>.md` — the dossier on the canonical schema (AI source of truth).
- `NN-<slug>/<slug>.html` — the human view, generated from the `.md` (dark theme, self-contained).
- `FEATURES.md` — one catalog row added (if an index exists).
- `.feature-creator/backup/<run>/` — backups of any overwritten file.

Empty sections carry dense, instructive `_TODO_` placeholders telling the author exactly what
belongs there. The intended loop: scaffold → fill the `.md` `_TODO_`s → re-run to regenerate the
`.html` (and refresh the index if needed).

---

## 7. Safety & determinism guarantees

- **Dry-run by default.** No writes without `--write`; the plan shows create/update/unchanged.
- **Validated before write.** Functionality 06 asserts the 8 sections in order + one metadata
  syntax + no self-reference; a FAIL blocks `--write`.
- **Idempotent.** Same name + same catalog → the existing number is reused, content matches, and
  a second run writes nothing (no duplicate folder, no duplicate index row).
- **Backups.** Every overwritten file is copied to `.feature-creator/backup/<run>/` first.
- **Deterministic.** No `Math.random`/`Date` inside any output content — the only `Date` use is a
  backup *folder name*, never written into a dossier. Same inputs → byte-identical output.

---

## 8. Acceptance criteria (from the task)

- [x] New dossier passes the schema-uniformity check (same 8 headings, same order).
- [x] Metadata header uses **one** syntax (`**Group:**`/`**Status:**`) — fixes the 16/2/2 variance.
- [x] `Related features` links resolve; the validator rejects a self-reference.
- [x] `.html` is generated from the `.md` (load-bearing constants identical between the two).
- [x] `FEATURES.md` updated atomically with the dossier; numbering stays contiguous.

## 9. Build status & how to run

- ✅ This spec + the 6 functionality docs + human [`README.html`](./README.html).
- ✅ **Implementation:** [`scripts/`](./scripts/) — zero-dependency Node.js (≥18). Pure core
  `lib/run.mjs` (`readCatalog` / `buildPlan` / `upsertIndexRow` / `applyPlan` / `validateDossier`),
  renderers `templates/schema.mjs` (canonical `.md`) + `templates/render-html.mjs` (md→html),
  helpers `lib/util.mjs`, and the `create.mjs` CLI (dry-run by default · `--write` · backups).
- ✅ **Cross-tool shells:** `.claude/skills/feature-structure-creator/SKILL.md` and
  `.cursor/rules/feature-structure-creator.mdc` — both wrap `create.mjs`.
- ✅ **Self-test:** `node scripts/self-test.mjs` builds a throwaway fixture (`/tmp/feature-creator-selftest`)
  with two existing dossiers, scaffolds a third, and asserts numbering, folder + files, the 8
  sections in order, one metadata syntax, the generated `.html`, the index row, and
  **idempotency** (second run = no-op, no duplicate). **PASSED.** Example output committed under
  [`example-output/`](./example-output/).

```
# Dry-run (read-only): print the plan, write nothing
node tasks/skill-feature-structure-creator/scripts/create.mjs "My Feature" --features-dir lumen-features

# Apply: create the dossier + update the index (backs up overwritten files)
node tasks/skill-feature-structure-creator/scripts/create.mjs "My Feature" --features-dir lumen-features \
  --group "Detection Engine" --status "Specified only" --scope "One-line scope here." --write

# Self-test (idempotency + schema gate)
node tasks/skill-feature-structure-creator/scripts/self-test.mjs
```

## References
- [`../03-skill-feature-structure-creator.md`](../03-skill-feature-structure-creator.md) — the task.
- [`../skill-deterministic-checker/`](../skill-deterministic-checker/) — the checker this skill's output passes by construction.
- [`../../lumen-features/`](../../lumen-features/) — the catalog whose schema is ported (exemplars: `03-signal-taxonomy`, `10-data-contract-and-repository-seam`, `14-the-agent-analyzer`).
- [`example-output/`](./example-output/) — a sample generated dossier (`.md` + `.html`).
