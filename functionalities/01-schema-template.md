# Functionality 01 — Schema template

**Writes:** no (pure renderer) · **Idempotent:** yes · **Order:** first (everything renders from it)

## Purpose
Hold the **canonical 8-section schema** as the single source of truth and render a dossier `.md`
from it deterministically. This is what makes the catalog uniform and machine-parseable: every
dossier gets the same H2 headings, in the same order, with one metadata-header syntax.

## Inputs
- Feature metadata: `title`, one-line `scope`, `group`, `status`, and optional per-section bodies.

## Expected project structure
- None. The renderer is pure; it emits a string. The numbered folder is decided in functionality 02.

## How it works (deterministic)
1. `SECTIONS` is the ordered list ported verbatim from real dossiers: `Summary` →
   `What it does / mechanics` → `How it is built (implementation)` → `Data-contract touchpoints` →
   `Model B / rights notes` → `Key parameters / values` → `Related features` → `References`.
2. The header is rendered with **one** metadata syntax: `# Title`, then `One-line scope: …`, then
   `**Group:**` / `**Status:**` (strict markdown — **no YAML frontmatter**). This fixes the
   16/2/2 header-format variance the benchmark flagged.
3. Each section the author leaves empty is filled with a dense, instructive `_TODO_` placeholder
   (never lorem ipsum) so a human knows exactly what belongs there.

## Output
- A complete dossier `.md` string on the canonical schema (consumed by 03/04/06).

## Safety
- Pure: no console, no writes, no `Date`/random — same inputs → byte-identical output.

## Failure modes it prevents
- Heading drift (missing/renamed/re-ordered sections) that breaks deterministic parsing.
- Multiple metadata syntaxes coexisting (YAML vs. `**Group:**`) — only one is ever emitted.
