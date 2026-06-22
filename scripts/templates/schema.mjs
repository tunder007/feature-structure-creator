// The canonical lumen-features 8-section schema, ported verbatim from the real dossiers.
// ONE metadata-header syntax is enforced: **Group:** / **Status:** (strict markdown, not YAML),
// matching every existing dossier (03-signal-taxonomy, 10-data-contract, 14-the-agent-analyzer, …).

// The exact ordered list of H2 section titles the validator and renderer rely on.
export const SECTIONS = [
  "Summary",
  "What it does / mechanics",
  "How it is built (implementation)",
  "Data-contract touchpoints",
  "Model B / rights notes",
  "Key parameters / values",
  "Related features",
  "References"
];

// Per-section placeholder body when the author supplies nothing. Deterministic, dense, and
// written so a human knows exactly what belongs there — never lorem ipsum.
const PLACEHOLDER = {
  "Summary":
    "_TODO: one dense paragraph — what this feature is, where it lives, and its honest implementation status (mockup / specified / partial). State the single sentence a reader must retain._",
  "What it does / mechanics":
    "- _TODO: bullet the observable behaviour and the rules that govern it (inputs → transforms → outputs)._\n- _Keep it content-free and pattern-level where rights apply: describe aggregate behaviour, never named accounts._",
  "How it is built (implementation)":
    "_TODO: name the concrete files/symbols that implement this (e.g. `domain/<x>.ts`, `components/<Y>.tsx`), with verbatim key signatures in a fenced block. End with an honest status line: what is real code vs. specified only._",
  "Data-contract touchpoints":
    "- **Reads / defines:** _TODO: the domain types/fields this touches (`Study`, `AnalysisResult`, `SignalReading`, …)._\n- **Integration seam:** _TODO: what a real backend must populate; link the Data Contract doc._",
  "Model B / rights notes":
    "- _TODO: how this honours the standing rulings — patterns not people; describe, never enforce; no behavioural signal, no verdict; Model B autonomous publish with uncertainty + external audit (no per-output human gate)._",
  "Key parameters / values":
    "| Parameter | Value | Source |\n|---|---|---|\n| _TODO_ | _TODO_ | _`path:line`_ |",
  "Related features":
    "- _TODO: link sibling dossiers with a relative path and a one-line reason, e.g._ [03 — Signal Taxonomy](../03-signal-taxonomy/signal-taxonomy.md) — _why it relates._",
  "References":
    "- _TODO: link the grounding/source files (relative paths into `../../lumen-docs/…` or source `.ts`/`.tsx`), each with a one-line note on what it backs._"
};

// Render the canonical Markdown dossier deterministically. Pure: returns a string, no I/O.
// `meta`: { title, scope, group, status, sections?: { "<Section title>": "markdown body" } }
export function renderDossierMd(meta) {
  const scope = meta.scope && meta.scope.trim()
    ? meta.scope.trim()
    : `_TODO: one-line scope — the single sentence describing ${meta.title}._`;
  const group = meta.group && meta.group.trim() ? meta.group.trim() : "TODO — assign a group";
  const status = meta.status && meta.status.trim() ? meta.status.trim() : "Specified only (TODO)";
  const provided = meta.sections || {};

  const lines = [];
  lines.push(`# ${meta.title}`);
  lines.push("");
  lines.push(`One-line scope: ${scope}`);
  lines.push("");
  lines.push(`**Group:** ${group}`);
  lines.push(`**Status:** ${status}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  for (const title of SECTIONS) {
    lines.push(`## ${title}`);
    lines.push("");
    const body = (provided[title] != null && String(provided[title]).trim())
      ? String(provided[title]).trim()
      : PLACEHOLDER[title];
    lines.push(body);
    lines.push("");
    lines.push("---");
    lines.push("");
  }
  // Drop the trailing separator after References (last section keeps no divider, matching dossiers).
  while (lines.length && (lines[lines.length - 1] === "" || lines[lines.length - 1] === "---")) lines.pop();
  return lines.join("\n") + "\n";
}
