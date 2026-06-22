# Temporal Burst Detector

One-line scope: Flags sub-minute co-posting bursts as the cheap first screen that feeds the behavioural coordination scorer — the `co-timing` signal's data source.

**Group:** Detection Engine
**Status:** Specified only (no real detector yet; the signal shape and its `SignalReading` slot exist in the data contract, but values are produced by the deterministic fake engine).

---

## Summary

The Temporal Burst Detector is the cheapest stage in LUMEN's cost-scaled pipeline: it scans a window of posts for **sub-minute co-posting bursts** — many accounts emitting near-identical content inside a few seconds, faster than independent people plausibly act. It produces the `co-timing` signal reading that the behavioural coordination scorer consumes. It is content-free and identity-free by construction: it counts *events in time*, never who posted them. Today its values come from the deterministic mock engine; a real implementation would compute them from ingestion timestamps. Crucially it carries **no verdict and no threshold** — it emits a 0–100 value and a plain-language note; convergence and caps live one layer down in scoring.

---

## What it does / mechanics

- **Buckets a window's posts by timestamp** into fixed-width intervals (default 60s) and finds the densest interval.
- **Computes a burst value (0–100)** from how far the densest interval's count exceeds the window's baseline rate — high when a spike is sharp and narrow, low when posting is spread out.
- **Emits a single `SignalReading`** `{ id: "co-timing", value, note }`, where `note` describes the aggregate ("202 posts in 41 seconds vs. a baseline of ~6/min") — never an account name.
- **Stays a screen, not a verdict:** a high burst value alone never produces a high coordination score; the scorer requires 3+ signals to converge (floor 60) before escalating.
- **Abstains gracefully:** windows below a minimum post count return a low value with a "insufficient volume" note rather than a false spike.

---

## How it is built (implementation)

Specified against the data contract; the value is currently supplied by the fake engine.

The reading slots into the existing `SignalReading` type and is keyed by the taxonomy id `co-timing`:

```ts
// domain/study.ts (existing contract)
export type SignalReading = { id: string; value: number; note: string };

// a real detector would expose:
export function detectBurst(timestamps: number[], bucketMs = 60_000): SignalReading {
  // bucket → densest interval → value vs. baseline; pure, deterministic, identity-free
}
```

**Honest status:** the `co-timing` id, its branch (Coordination), and the `SignalReading` shape are real, typed domain data; the `detectBurst` function above is **specified only**. Today `Study.readings` / `AnalysisResult.readings` carry hardcoded `co-timing` values from `engine/analyze.ts`.

---

## Data-contract touchpoints

- **Reads / defines:** emits one `SignalReading { id: "co-timing", value, note }` (`domain/study.ts`); joins to the taxonomy `SignalDef` for `co-timing` (`domain/signals.ts`).
- **Feeds:** the Coordination branch score (`branchScore`) and `convergeCount` (feature 02 — Behavioural Coordination Scorer; feature 05 — Bands & Convergence).
- **Integration seam:** a real backend computes `value` from the ingestion row's `timestamp` field (`03-working/MVP-SCENARIO.md` schema) and writes it into `Study.readings`; nothing else in the frontend changes. See [`../../lumen-docs/04-architecture-and-data/04-DATA-CONTRACT.md`](../../lumen-docs/04-architecture-and-data/04-DATA-CONTRACT.md).

---

## Model B / rights notes

- **Patterns, not people.** The detector consumes timestamps only; its `note` reports aggregate counts, never account identities — "describe, never enforce" holds by construction.
- **No behavioural signal, no verdict.** It is one signal among twelve; convergence (3+ ≥ 60) and caps in the scorer prevent a single burst from manufacturing a CIB verdict.
- **Model B fit.** The 0–100 value is one of the calibrated, uncertainty-bearing numbers LUMEN publishes autonomously; accountability is external audit + rectification, not a per-output human gate.
- **Protects organic spikes.** A genuine breaking-news surge can co-time; that is why a high burst value alone is insufficient and the organic counter-signal layer can suppress it.

---

## Key parameters / values

| Parameter | Value | Source |
|---|---|---|
| Signal id | `co-timing` | `domain/signals.ts` |
| Branch | Coordination | `domain/branches.ts` |
| Bucket width | `60_000` ms (default) | `detectBurst` (specified) |
| Convergence floor | `60` (shared) | `domain/scoring.ts:7` |
| Value range | `0`–`100` | `SignalReading.value` |

---

## Related features

- [02 — Behavioural Coordination Scorer](../02-behavioural-coordination-scorer/behavioural-coordination-scorer.md) — consumes the `co-timing` value into the Coordination branch score and the convergence rule.
- [03 — Signal Taxonomy](../03-signal-taxonomy/signal-taxonomy.md) — defines the `co-timing` `SignalDef` this detector populates.
- [04 — Cost-Scaled Pipeline & Gates](../04-cost-scaled-pipeline-and-gates/cost-scaled-pipeline-and-gates.md) — the staged pipeline whose cheap first screen this detector is.
- [06 — Organic Counter-Signal Layer](../06-organic-counter-signal-layer/organic-counter-signal-layer.md) — can suppress a burst value when a public-event marker is present.

## References

- [`../../lumen-docs/04-architecture-and-data/04-DATA-CONTRACT.md`](../../lumen-docs/04-architecture-and-data/04-DATA-CONTRACT.md) — the `SignalReading` contract and the repository seam this detector writes through.
- [`../../lumen-docs/05-app-mockup/domain/signals.ts`](../../lumen-docs/05-app-mockup/domain/signals.ts) — the `co-timing` `SignalDef` (id, name, branch, plain gloss).
- [`../../lumen-docs/06-grounding/disinfo-cib-detection-tree/extract.html`](../../lumen-docs/06-grounding/disinfo-cib-detection-tree/extract.html) — EU DisinfoLab "similar posting timestamps" symptom this detector operationalises.
