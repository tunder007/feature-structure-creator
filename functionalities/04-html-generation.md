# Functionality 04 — HTML generation (from the md)

**Writes:** yes (`NN-<slug>/<slug>.html`, gated) · **Idempotent:** yes · **Order:** after 03

## Purpose
Generate the **`.html` — the human view — *from* the `.md`**, so the two never diverge: every
load-bearing constant (title, scope, parameter values, code blocks) is identical because the HTML
is rendered from the same Markdown string, not authored separately.

## Inputs
- The generated dossier `.md` string (functionality 03).
- The metadata (used for `<title>`, hero heading, and the group/status badges).

## Expected project structure
- The `NN-<slug>/` folder (created on `--write`). The `.html` sits beside the `.md`.

## How it works (deterministic)
1. `renderDossierHtml(md, meta)` parses the Markdown subset the dossiers use — H1/H2/H3,
   `- ` bullets, `| … |` tables (with a header separator row), fenced ``` code blocks, and inline
   `code` / `**bold**` / `*italic*` / `[link](url)` — and emits a self-contained, **dark-themed**
   page reusing the exemplars' `:root` token palette (`--bg`, `--panel`, `--blue`, `--violet`, …).
2. The metadata header is rendered as a hero (`<h1>` + scope `<div class="sub">`) plus group/status
   badges; the body sections follow from the first `## ` onward.
3. No external assets, no scripts, no `Date`/random → byte-stable for a given `.md`.

## Output
- `NN-<slug>/<slug>.html` — a portable single file viewable offline.

## Safety
- Dry-run by default; `--write` required; existing file backed up on overwrite; idempotent.
- All text is HTML-escaped; code spans are extracted before escaping so they round-trip exactly.

## Failure modes it prevents
- `.md` ↔ `.html` drift (numbers or status that disagree between the two views).
- Hand-maintained HTML that rots as the `.md` evolves — regenerate instead of editing the `.html`.
