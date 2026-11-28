# Amplifier — Agent Guidelines

Specific engineering rules and architectural standards for developing and maintaining **Amplifier**.  
Before making any changes, review the global guidelines in `AGENTS.md` at the repository root.

## Identity & Naming

- **Directory:** `extensions/amplifier/`
- **pnpm filter name:** `amplifier`
- **UI Name (EN / Default):** Amplifier
- **UI Name (ES):** Amplificador
- **UI Name (PT):** Amplificador
- **UI Name (FR):** Amplificateur
- **UI Name (DE):** Verstärker
- **UI Name (JA):** アンプ
- **Default Shortcut:** `Alt+Shift+A`

## Architecture (Manifest V3)

- **Popup UI (`entrypoints/popup/`):** Pure TypeScript + native DOM (zero component frameworks). Guaranteed Frame 0 render. Event listeners are bound immediately in `init()` to ensure theme and locale controls remain interactive even on restricted browser URLs (`chrome://`).
- **Background Service Worker (`entrypoints/background.ts`):** Coordinates `chrome.tabCapture`, manages the Offscreen Document lifecycle with per-tab mutex locks (`tabCaptureLocks`), tracks tab playback states, and updates numeric tab badges (`160%`).
- **Offscreen Document (`entrypoints/offscreen/`):** Executes low-latency Web Audio API graph (`latencyHint: 'interactive'`):  
  `tabCapture stream` → `MediaStreamAudioSourceNode` → `BiquadFilterNode` (presets) → `DynamicsCompressorNode` (anti-distortion limiter) → `GainNode` (0%–600%) → `audioCtx.destination`.
- **Pure Library Modules (`src/lib/`):** `storage.ts`, `domain.ts`, `presets.ts`, `i18n.ts`. 100% testable in Vitest without requiring actual Web Audio hardware.

## Storage Keys

```ts
STORAGE_DOMAINS_KEY = 'at_domains_v1'
STORAGE_SETTINGS_KEY = 'at_settings_v1'
```

Never alter these keys without an explicit schema migration strategy.

## Canonical 6-Locale System

- Symmetrically supported locales: `en` (default), `es`, `pt_BR`, `fr`, `de`, `ja`.
- Internal dictionary lives in `src/lib/i18n.ts`.
- Store metadata lives in `public/_locales/{en,es,pt_BR,fr,de,ja}/messages.json`.
- All dictionary keys must exist symmetrically across all 6 locales with safe fallback to `en`.

## UI & Design Rules (Acoustic Slate)

- Light and Dark modes with automatic system detection + persisted manual override.
- **Acoustic Slate Palette:** Cold slate background (`#F3F5F7` / `#12151A`) with matte terracotta accent (`#E05A47`).
- Language selector dropdown with standalone vector SVG flags (no emojis, no external CDN dependencies).
- Autofocus on `#volume-slider` upon opening popup.
- Volume percentage formatted with `font-variant-numeric: tabular-nums` to eliminate layout jitter.
- Comprehensive keyboard navigation: `←` / `→` for 5% steps, `Shift+←` / `Shift+→` for 25% jumps, `M` to mute/unmute, `R` to reset to 100%, `1–4` to select tone presets.

## Privacy & Chrome Web Store Publication

- Multilingual privacy policy in `PRIVACY_POLICY.md` covering all 6 supported locales.
- Canvas promotional asset generator in `assets/webstore-promo.html` exporting official 1280 × 800 px screenshots.
- Developer contact email: `nicolasalbertov18@gmail.com`.
- Bug tracker: `https://github.com/Beto18v/browser-extensions/issues`.

## Personal Branding

- `"author": "Nicolas Valenzuela (Beto18v)"` in `package.json`.
- Popup footer includes direct link to `chrome://extensions/shortcuts` ("Add shortcut") and "Created by Nicolas Valenzuela" linking to [nival.is-a.dev](https://nival.is-a.dev).

## Golden Rule — Git & Verification

- Prohibited from executing `git commit` or `git push` without explicit user authorization in chat.
- Mandatory verification cycle after every modification:

```bash
pnpm --filter amplifier test
pnpm --filter amplifier run compile
pnpm --filter amplifier run build
pnpm --filter amplifier run zip
```
