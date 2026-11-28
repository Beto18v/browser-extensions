# AI Agent Guidelines — Browser Extensions Suite

Mandatory global rules for any agent or developer contributing to this monorepo.

## Golden Rule — Git

- It is **strictly prohibited** to run `git commit` or `git push` without explicit user authorization in the chat.
- Mandatory verification cycle after completing every task: **test → typecheck → build**.
- When all checks pass in green, suggest the semantic commit command and commit message, but **do not execute it**.

## Monorepo Architecture

- Each extension lives in `extensions/<name>/`, self-contained with its own `package.json`, `AGENTS.md`, `README.md`, tests, and build outputs.
- Shared package: `packages/shared/` → `@browser-extensions/shared` (i18n helpers, shared types).
- Root workspace orchestrates builds and tasks via `pnpm` workspace scripts.

## Tech Stack

- **Framework & Platform:** WXT 0.21.5 + Vite + TypeScript 5.9 + Chrome Manifest V3 (Chrome, Edge, Brave).
- **UI:** Zero component frameworks (no React, Vue, or Svelte). Pure TypeScript + native DOM.
- **Testing:** Vitest + jsdom.

## Local-First Philosophy

- Zero proprietary backend. 100% local persistence via `chrome.storage.local` / `IndexedDB`.
- Zero API keys or private credentials in source code. Any optional external AI integration follows the **BYOK (Bring Your Own Key)** pattern.

## Performance & Rendering

- Frame 0 render. Zero layout shift. Non-blocking asynchronous persistence.
- Autofocus on primary input or control upon popup open.

## Standard 6-Locale System (MANDATORY)

Every extension in this suite must symmetrically support the 6 canonical locales established in **Amplifier**:

1. **`en`** — English (Default)
2. **`es`** — Spanish (Español)
3. **`pt_BR`** — Portuguese (Português do Brasil)
4. **`fr`** — French (Français)
5. **`de`** — German (Deutsch)
6. **`ja`** — Japanese (日本語)

- Translation keys must match symmetrically across all 6 locales with safe fallback to `en`.
- Store metadata must be mirrored in `public/_locales/{en,es,pt_BR,fr,de,ja}/messages.json`.
- UI language selectors must use clean, vector SVG country flags with no external CDN dependencies and zero Unicode emojis.

## Personal Branding & Support

- `"author": "Nicolas Valenzuela (Beto18v)"` in every `package.json`.
- UI footer: developer name with link to [nival.is-a.dev](https://nival.is-a.dev) and [github.com/Beto18v](https://github.com/Beto18v).
- Official developer support email: `nicolasalbertov18@gmail.com`.
- Official bug tracker: `https://github.com/Beto18v/browser-extensions/issues`.
- Zero Unicode emojis in any user interface (use clean vector SVGs exclusively).

## Chrome Web Store & Privacy Standards

- **Mandatory Privacy Policy:** Every extension in `extensions/<name>/` MUST include a `PRIVACY_POLICY.md` file symmetrically covering all 6 supported locales.
- **Privacy Policy Requirements:**
  - Formal 100% Local-First declaration: zero telemetry, zero analytics, zero remote database connections.
  - Granular technical justification for every Manifest V3 permission requested.
  - Official developer contact details: name, portfolio ([nival.is-a.dev](https://nival.is-a.dev)), and official email (`nicolasalbertov18@gmail.com`).
- **Store Promotional Assets:** Every extension must provide a standalone generator in `assets/webstore-promo.html` exporting official 1280 × 800 px canvas promotional screenshots.

## Node.js 22.14 Compatibility

- The repository includes `patches/undici@8.13.1.patch` to address incomplete `zstd` support in Node.js 22.14.0 during Vitest/jsdom execution.
- Never remove this patch from `pnpm-workspace.yaml`.

## Individual Extension Documentation

- Every extension maintains its own `AGENTS.md` and `README.md` with domain-specific architecture and guidelines.
- Always read the extension-specific `AGENTS.md` before making changes to any workspace.
