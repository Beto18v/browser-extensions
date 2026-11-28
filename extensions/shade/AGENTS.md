# Shade — Agent Guidelines

Specific engineering rules and architectural standards for developing and maintaining **Shade** (per-site light and dark mode manager).  
Before making any changes, review the global guidelines in `AGENTS.md` at the repository root.

## Identity

- **UI & Store Name:** Shade
- **Directory:** `extensions/shade/`
- **pnpm filter name:** `shade`
- **Default Shortcut:** `Alt+Shift+S`

## Architecture (Manifest V3)

- **Popup UI (`entrypoints/popup/`):** Pure TypeScript + native DOM (zero component frameworks). Frame 0 render.
- **Content Script (`entrypoints/content.ts`):** Runs at `document_start` to eliminate white flashes on page loads. Reads the active domain profile from `chrome.storage.local`, injects/updates a single `<style id="shade-engine">` tag, and listens for live messages from the popup to adjust sliders with zero latency.
- **Background Service Worker (`entrypoints/background.ts`):** Lightweight coordinator; synchronizes the tab icon badge when Shade is active on the current domain.
- **Pure Library Modules (`src/lib/`):** `types.ts`, `domain.ts`, `presets.ts`, `css-engine.ts`, `storage.ts`, `i18n.ts`, `flags.ts`. 100% testable in Vitest without requiring a real browser.

## Opt-In Per-Domain Principle

- By default, **no website is modified** until the user explicitly toggles the main switch or selects a preset on that domain.
- Each domain saves its own independent profile (`enabled`, `preset`, `brightness`, `contrast`, `warmth`, `darkenCanvas`) in `chrome.storage.local`.

## Storage Keys

```ts
STORAGE_DOMAINS_KEY = 'st_domains_v1'
STORAGE_SETTINGS_KEY = 'st_settings_v1'
```

Never alter these keys without an explicit schema migration strategy.

## Canonical 6-Locale System with Vector SVG Flags

- Symmetrically supported locales: `en` (default), `es`, `pt_BR`, `fr`, `de`, `ja`.
- Internal dictionary lives in `src/lib/i18n.ts` and standalone SVG flags live in `src/lib/flags.ts`.
- **Vector SVG Flag Selector:** Custom accessible dropdown (`#locale-switcher`) displaying standalone vector flags (`16×12px`). Never use Unicode flag emojis, as Windows renders them as raw letters (`US`, `ES`) breaking visual quality.
- Store metadata lives in `public/_locales/{en,es,pt_BR,fr,de,ja}/messages.json`.
- All dictionary keys must exist symmetrically across all 6 locales with safe fallback to `en`.

## UI & Design Rules — Leica Crimson + Tactile Hardware

- Aesthetic inspired by precision optical and industrial hardware (*Leica*, *Nothing OS*, *Teenage Engineering*):
  - Flat matte surfaces, 1px precision borders, corner micro-dots, and dotted separators.
  - Sliders with millimeter tick marks and tabular readings (`font-variant-numeric: tabular-nums`).
  - Crimson LED accent (`#E11D48`) glowing subtly only on active controls.
- Light and Dark modes with automatic system detection + persisted manual override.
- Zero Unicode emojis across all interfaces and code.
- Keyboard navigation: `Space` or `Enter` toggles main switch, `1–4` selects presets, `R` resets sliders to preset defaults, `C` toggles canvas darkening (`darkenCanvas`), `Escape` dismisses menus.

## Personal Branding

- `"author": "Nicolas Valenzuela (Beto18v)"` in `package.json`.
- Popup footer includes direct link to `chrome://extensions/shortcuts` and author link to [nival.is-a.dev](https://nival.is-a.dev) and [github.com/Beto18v](https://github.com/Beto18v).

## Golden Rule — Git & Verification

- Prohibited from executing `git commit` or `git push` without explicit user authorization in chat.
- Mandatory verification cycle after every modification:

```bash
pnpm --filter shade test
pnpm --filter shade run compile
pnpm --filter shade run build
pnpm --filter shade run zip
```
