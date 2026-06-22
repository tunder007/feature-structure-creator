# Functionality 02 — Slug & numbering

**Writes:** no (derivation) · **Idempotent:** yes · **Order:** before generation

## Purpose
Derive the two identifiers that keep a catalog predictable: a **kebab-case slug** from the feature
name and the **next contiguous number** (`NN`), then compose the folder `NN-<slug>/`. This is the
property the benchmark scored 9/9 on — slugs are predictable and numbering is gap-free.

## Inputs
- The feature name (or an explicit `--slug` override).
- The features directory (to scan existing `NN-<slug>` folders).

## Expected project structure
- A features dir containing zero or more `NN-<slug>/` folders (e.g. `01-…`, `02-…`). A fresh,
  empty dir is fine — the first feature becomes `01`.

## How it works (deterministic)
1. `slugify(name)`: NFKD-fold accents, lowercase, `&` → `and`, non-alphanumerics → `-`, collapse
   and trim dashes. `"Gamma Signal Router"` → `gamma-signal-router`.
2. `readCatalog(dir)`: list immediate sub-dirs matching `^(\d{2,})-(.+)$`, parse their numbers,
   take `max + 1` as the next number (zero-padded to width 2 → `03`).
3. If a folder for the **same slug** already exists, **reuse its number** (don't allocate a new one,
   don't renumber siblings) — this is the root of idempotency.

## Output
- `{ slug, num, folder }` — e.g. `{ "gamma-signal-router", 3, "03-gamma-signal-router" }`.

## Safety
- Pure read-only scan; sorted, locale-independent comparisons → stable across machines.

## Failure modes it prevents
- Number collisions / gaps (two `03`s, or jumping `02` → `04`).
- Unpredictable slugs (spaces, capitals, accents) that break relative links and lookups.
- Duplicate folders when the same feature is scaffolded twice.
