# Functionality 03 — Markdown generation

**Writes:** yes (`NN-<slug>/<slug>.md`, gated) · **Idempotent:** yes · **Order:** after 01 + 02

## Purpose
Generate the dossier's **`.md` — the AI source of truth** — by feeding the resolved metadata
(functionality 02) through the schema renderer (functionality 01), and write it to
`NN-<slug>/<slug>.md`. Per project convention, the `.md` is authored/generated first; the `.html`
(functionality 04) is derived from it.

## Inputs
- The metadata bundle (`title`, `scope`, `group`, `status`, optional per-section bodies).
- The derived `folder` + `slug`.

## Expected project structure
- The features dir. The `NN-<slug>/` folder is created on `--write` if absent.

## How it works (deterministic)
1. Build the dossier string via `renderDossierMd(meta)` (functionality 01).
2. Target path = `<folder>/<slug>.md` (filename is the **slug only**, matching every real dossier
   — e.g. `03-signal-taxonomy/signal-taxonomy.md`, not `03-signal-taxonomy.md`).
3. Diff against any existing file: status is `create` / `update` / `unchanged`. On `--write`, an
   existing file is backed up before being overwritten.

## Output
- `NN-<slug>/<slug>.md` on the canonical schema (or, in dry-run, the planned content + status).

## Safety
- **Dry-run by default**; `--write` required to touch disk; overwrites backed up to
  `.feature-creator/backup/<run>/`; re-running with identical inputs is a no-op.

## Failure modes it prevents
- Hand-authored dossiers that silently skip a section or invent a heading.
- Filename drift (numbered-prefix filenames) that breaks relative links between dossiers.
