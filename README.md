# @softeneers/feature-structure-creator

> Scaffold a feature dossier on a canonical 8-section schema — a dense .md (AI source of truth) + generated .html (human view).

Zero runtime dependencies. Node ≥ 18. Part of the [Softeneers tools](https://github.com/tunder007/softeneers-tools) suite.

## Install

```bash
# one-off, no install
npx @softeneers/feature-structure-creator

# or install globally
npm i -g @softeneers/feature-structure-creator

# or as a dev dependency
npm i -D @softeneers/feature-structure-creator
```

## Usage

```bash
feature-structure-creator <slug>   # dry-run; add --write to apply
```

## What it does

See [`functionalities/`](./functionalities/) for the full per-feature documentation, and
[`example-output/`](./example-output/) for sample reports.

## Part of a suite

Install every Softeneers tool at once with the wrapper:

```bash
npm i -g softeneers-tools
softeneers-tools run feature-structure-creator -- [args]
```

## License

MIT © 2026 Softeneers
