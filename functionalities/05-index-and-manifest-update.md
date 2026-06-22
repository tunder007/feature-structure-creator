# Functionality 05 — Index & manifest update

**Writes:** yes (`FEATURES.md`; a manifest if present, gated) · **Idempotent:** yes · **Order:** after 03/04

## Purpose
Keep the catalog index in sync so the new dossier is discoverable the moment it exists. The skill
appends a single row to the catalog's machine-parseable table in `FEATURES.md` (and, if a manifest
file is present, an entry there too), atomically with the dossier write.

## Inputs
- The derived `{ num, slug, folder, title, scope }`.
- The existing `FEATURES.md` content (and a manifest, if the catalog has one).

## Expected project structure
- A `FEATURES.md` at the features-dir root containing at least one Markdown table. The update is
  **optional**: if no `FEATURES.md` exists, the step is skipped (the dossier still gets created).
  The current `lumen-features/` has no `MANIFEST.json`, so none is required.

## How it works (deterministic)
1. `upsertIndexRow`: if the index already contains the link target `folder/slug.md`, **return
   unchanged** (idempotent). Otherwise build the row
   `| NN | [Title](folder/slug.md) | scope |` and insert it **after the last existing table row**,
   so it lands in the catalog body and numbering stays contiguous.
2. Pipe characters in title/scope are escaped so a cell can't break the table.
3. If a manifest file is detected, the same upsert logic adds/refreshes its entry (keyed by slug).
4. Status (`update` / `unchanged`) is computed by diffing the rewritten file against the current one.

## Output
- An updated `FEATURES.md` (one new row) — or unchanged, if the feature is already listed.

## Safety
- Dry-run by default; `--write` required; the index file is backed up before overwrite; re-running
  never produces a duplicate row.

## Failure modes it prevents
- Orphan dossiers absent from the index (invisible to readers and to programmatic navigation).
- Duplicate or out-of-order index rows when a feature is scaffolded more than once.
