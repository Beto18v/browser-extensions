# Browser Extensions Suite

High-performance, local-first browser productivity extensions for developers, researchers, and AI workflows. 100% private, serverless, and zero-telemetry.

[![Manifest V3](https://img.shields.io/badge/Manifest_V3-Chrome_%7C_Edge_%7C_Brave-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![WXT](https://img.shields.io/badge/WXT-0.21.5-6366f1?logo=vite&logoColor=white)](https://wxt.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Extensions Directory

| Extension | Directory | Description | Shortcut | Status |
|---|---|---|---|---|
| **Prompt Drawer** | `extensions/prompt-drawer/` | Offline prompt manager and dynamic variable resolver for AI workflows | `Alt+Shift+V` | v1.0 Published |
| **Amplifier** | `extensions/amplifier/` | Tab audio booster (up to 600%), studio tone equalizer, and anti-clipping limiter | `Alt+Shift+A` | v1.0 Release Candidate |
| **Shade** | `extensions/shade/` | Real dark mode for Google Docs, Sheets & Slides + opt-in per-site light calibration | `Alt+Shift+S` | v1.0 Release Candidate |

## Core Architecture Principles

- **Zero-Backend & 100% Local-First:** No proprietary remote servers, no user tracking, and no telemetry. All persistence is isolated in `chrome.storage.local` / `IndexedDB`.
- **Pure Native DOM & TypeScript:** No component framework overhead (no React, Vue, or Svelte). Extensions achieve instant Frame 0 render with zero layout shift.
- **Canonical 6-Locale System:** Every extension provides native symmetric translations across 6 languages: English (`en`), Spanish (`es`), Portuguese (`pt_BR`), French (`fr`), German (`de`), and Japanese (`ja`).
- **Store-Ready Documentation:** Every package includes standalone architecture specifications, a 6-language `PRIVACY_POLICY.md`, and a promotional asset generator in `assets/webstore-promo.html`.

## Monorepo Commands

```bash
# Install dependencies across all packages
pnpm install

# Build all extensions for production
pnpm run build

# Package all extensions into release .zip files
pnpm run zip

# Work on a specific extension
pnpm --filter <name> test
pnpm --filter <name> run compile
pnpm --filter <name> run build
pnpm --filter <name> run zip
```

## Node.js 22.14 Compatibility

Node.js 22.14.0 introduced partial `zstd` support without `zlib.createZstdDecompress`, which can trigger a `TypeError` in `undici` when running Vitest and JSDOM. This repository includes `patches/undici@8.13.1.patch` (configured in `pnpm-workspace.yaml`) to patch this upstream behavior and ensure deterministic local test runs.

## Author & Support

**Nicolas Valenzuela** — *AI & Full-Stack Software Engineer*

- **Portfolio:** [nival.is-a.dev](https://nival.is-a.dev)
- **Email:** [nicolasalbertov18@gmail.com](mailto:nicolasalbertov18@gmail.com)
- **GitHub:** [github.com/Beto18v](https://github.com/Beto18v)
- **LinkedIn:** [linkedin.com/in/beto18v](https://www.linkedin.com/in/beto18v)
- **Issue Tracker:** [github.com/Beto18v/browser-extensions/issues](https://github.com/Beto18v/browser-extensions/issues)

All extensions in this repository are licensed under the [MIT License](LICENSE).
