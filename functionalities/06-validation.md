# Functionality 06 — Validation

**Writes:** no (gate) · **Idempotent:** yes · **Order:** last (before any `--write`)

## Purpose
Assert the generated dossier actually conforms to the canonical schema **before** it is written —
the same contract the Deterministic Checker (task 01) measures across the catalog. A failed
validation blocks `--write`, so a malformed dossier can never enter the catalog.

## Inputs
- The generated dossier `.md` string and the derived `slug`.

## Expected project structure
- None; operates on the in-memory string.

## How it works (deterministic)
`validateDossier(md, { slug })` checks, deterministically:
1. **No YAML frontmatter** on line 1 (single metadata syntax → `**Group:**`/`**Status:**`).
2. An `# H1` title on line 1, a `One-line scope:` line, and both `**Group:**` and `**Status:**`.
3. The **8 H2 sections are present and in the canonical order** (compares the extracted `## `
   headings against `SECTIONS` index-by-index, and asserts the count is exactly 8).
4. **No self-reference** in Related features (no link target of `slug/slug.md`).
Returns `{ ok, errors[] }`; the CLI prints `schema check: PASS/FAIL` and refuses `--write` on FAIL.

## Output
- A pass/fail verdict + a list of precise errors (which section is wrong, what was expected).

## Safety
- Pure and read-only; runs in both dry-run and `--write` (as the write gate).

## Failure modes it prevents
- The exact issues the benchmark flagged: header-format variance, missing/reordered sections,
  and broken/self-referential `Related features` links entering the catalog.
