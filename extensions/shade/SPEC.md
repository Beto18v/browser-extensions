# Shade — Implementation Specification v1.0

> **For the executing agent:** Read this complete specification and `AGENTS.md` at the monorepo root before writing any code.
> This document is the single source of truth for architecture and design. Follow every section in order.

---

## 1. Repository Context

- **Monorepo:** `browser-extensions-suite`
- **Application Name:** **Shade**
- **Workspace:** `extensions/shade/`
- **Framework:** WXT 0.21.5 + TypeScript 5.9 + Vite (Chrome Manifest V3 — Chrome, Edge, Brave)
- **User Interface:** Pure TypeScript + native DOM. **Prohibited** from installing React, Vue, Svelte, or heavyweight CSS frameworks.
- **Global Monorepo Constraints (`AGENTS.md` root):**
  - Strictly prohibited to run `git commit` or `git push` without explicit user authorization in chat.
  - Zero network requests. 100% local persistence via `chrome.storage.local`.
  - Zero Unicode emojis in any user interface or visible text (use clean vector SVGs even for flags).
  - Guaranteed Frame 0 render (zero layout shift).
  - `"author": "Nicolas Valenzuela (Beto18v)"` in `package.json`.
  - Never remove or modify `patches/undici@8.13.1.patch` in `pnpm-workspace.yaml`.
  - Never modify other monorepo packages (`extensions/amplifier/`, `extensions/prompt-drawer/`, etc.) or break `@browser-extensions/shared`.

---

## 2. What This Extension Does

**Shade** is an opt-in, granular per-site light control, contrast calibrator, and dark mode engine. Unlike blunt dark mode extensions that invert the entire internet and break spreadsheets or documents, Shade leaves all websites untouched by default. It allows users to calibrate individual domains independently, providing native support for the `<canvas>` elements of **Google Docs, Google Sheets, and Google Slides**.

### Key Differentiators

1. **True Opt-In with Per-Domain Memory:** No website is altered until the user explicitly turns it on. Adjusting a slider on a site (e.g. `docs.google.com`, `wikipedia.org`) caches its profile in `chrome.storage.local` solely for that domain.
2. **Hybrid Engine for Google Workspace (Docs / Sheets / Slides):** Detects Google Workspace editors automatically and decouples UI dark mode from document canvas inversion, providing an instant **"Darken canvas (Docs / Sheets)"** toggle to switch between a dark canvas and true original document colors.
3. **4 Calibrated Presets + 3 Tactile Controls:** *Carbon*, *Warm Paper*, *Night Shift*, and *Crisp Dark*, adjustable in real time via **Brightness**, **Contrast**, and **Warmth** (blue light filter) sliders.
4. **Zero White Flash:** CSS injection at `document_start` via a single controlled `<style id="shade-engine">` tag, preserving original colors for `img`, `video`, `picture`, and `iframe`.
5. **Canonical 6-Locale System with SVG Flags:** English (`en`), Spanish (`es`), Brazilian Portuguese (`pt_BR`), French (`fr`), German (`de`), and Japanese (`ja`).
6. **Privacy & Store Standards:** Symmetrically localized `PRIVACY_POLICY.md` (6 locales) and official 1280 × 800 px promotional asset generator in `assets/webstore-promo.html`.

---

## 3. Manifest V3 Workspace Structure

```text
extensions/shade/
├── AGENTS.md
├── SPEC.md
├── PROMPT.md
├── README.md
├── PRIVACY_POLICY.md             # Symmetrically localized in 6 languages
├── package.json
├── tsconfig.json
├── wxt.config.ts
├── assets/
│   ├── icon.svg                  # Minimalist 128x128 SVG (split light/shadow dial with #E11D48 accent)
│   └── webstore-promo.html       # 1280x800 canvas promotional screenshot generator
├── public/
│   └── _locales/
│       ├── en/messages.json
│       ├── es/messages.json
│       ├── pt_BR/messages.json
│       ├── fr/messages.json
│       ├── de/messages.json
│       └── ja/messages.json
├── entrypoints/
│   ├── background.ts             # Lightweight Service Worker: updates tab badge when active
│   ├── content.ts                # Content script at document_start: injects/updates #shade-engine
│   └── popup/
│       ├── index.html            # Popup markup (fixed width 360px)
│       ├── main.ts               # DOM logic, keyboard shortcuts, live sync with content script
│       └── style.css             # "Leica Crimson — Tactile Hardware" visual system (Light + Dark)
├── src/
│   └── lib/
│       ├── types.ts              # Shared typings (DomainProfile, Settings, SiteAdapter, Messages)
│       ├── domain.ts             # Domain normalization, restricted page & adapter detection
│       ├── presets.ts            # 4 presets definitions, clamp helpers, and default factories
│       ├── css-engine.ts         # Pure CSS generator (Universal + Google Workspace canvas)
│       ├── storage.ts            # Persistence via chrome.storage.local (st_domains_v1 & st_settings_v1)
│       ├── flags.ts              # Standalone inline vector SVG flags (16x12) for all 6 locales
│       └── i18n.ts               # Complete 6-locale dictionary and locale detector
└── tests/
    ├── domain.test.ts
    ├── presets.test.ts
    ├── css-engine.test.ts
    ├── storage.test.ts
    └── i18n.test.ts
```

---

## 4. Hybrid Injection Engine (`src/lib/css-engine.ts` + `entrypoints/content.ts`)

### Site Adapter Detection (`src/lib/domain.ts`)

- `detectSiteAdapter(url)`:
  - `docs.google.com/document/*` → `'google-docs'`
  - `docs.google.com/spreadsheets/*` → `'google-sheets'`
  - `docs.google.com/presentation/*` → `'google-slides'`
  - Any other `http:` / `https:` URL → `'generic'`
- `isSupportedUrl(url)`: returns `false` for `chrome://`, `edge://`, `about:`, `chrome-extension://`, `chrome.google.com/webstore`, `chromewebstore.google.com`.

### Generated CSS Rules (`buildThemeCss(profile, adapter)`)

If `!profile.enabled`, returns `''` (removes `#shade-engine` from DOM).

1. **Inverted Dark Modes (`carbon`, `night_shift`, `crisp_dark`):**
   - Applies compound filter to `html`:
     `filter: invert(1) hue-rotate(180deg) brightness(B%) contrast(C%) sepia(W%) !important;`
     and `background-color: #FFFFFF !important;` (which, upon inversion, yields a seamless dark canvas without white edge artifacts).
   - **Media Color Preservation:** Re-inverts `img, video, picture, [style*="background-image"], iframe` with `filter: invert(1) hue-rotate(180deg) !important;` ensuring photos, avatars, and videos retain their natural colors.
2. **Warm Non-Inverted Mode (`warm_paper`):**
   - Does not invert the page. Applies to `html`:
     `filter: brightness(B%) contrast(C%) sepia(W%) !important;`
     ideal for prolonged daytime reading without aggressive blue light emission.
3. **Google Workspace Adapter (`google-docs`, `google-sheets`, `google-slides`):**
   - When `profile.preset` is dark (`carbon`, `night_shift`, `crisp_dark`):
     - If `profile.darkenCanvas === true`: keeps the editor `<canvas>` elements inverted (`.kix-canvas-tile-content`, `.grid-container canvas`, `.punch-viewer-content canvas`, `canvas`), rendering document pages, spreadsheet grids, and slide decks in dark mode while protecting embedded images and avatars (`img`).
     - If `profile.darkenCanvas === false`: generates targeted re-inversion rules for the editor canvas (`canvas.kix-canvas-tile-content, .grid-container canvas, .punch-viewer-content canvas, #docs-editor canvas { filter: invert(1) hue-rotate(180deg) !important; }`), keeping toolbars and menus dark while preserving true white paper and original spreadsheet cell colors.
   - When on Google Workspace, the switch **"Darken canvas (Docs / Sheets)"** is highlighted as available. On generic sites, it remains available for canvas-heavy web applications (e.g. Figma, Excalidraw, PDF viewers).

### Real-Time Synchronization

- Upon opening the popup, loads the active domain's profile from `chrome.storage.local` (Frame 0 render).
- Adjusting any slider (`brightness`, `contrast`, `warmth`) or toggling a switch:
  - If Shade was disabled on that domain, automatically sets `enabled: true`.
  - Dispatches an immediate `APPLY_PROFILE` runtime message to `entrypoints/content.ts` in the active tab to update `#shade-engine` within the same frame (zero lag).
  - If `rememberSite` is active (default `true`), persists the profile to `chrome.storage.local` with a `120ms` debounce.
  - Notifies `background.ts` to update the tab icon badge (`ON` with `#E11D48` background when active, or empty when off).

---

## 5. Data Model & Presets

### Storage Keys (`src/lib/storage.ts`)

```ts
export const STORAGE_DOMAINS_KEY = 'st_domains_v1';
export const STORAGE_SETTINGS_KEY = 'st_settings_v1';
```

### Typings (`src/lib/types.ts`)

```ts
export type Locale = 'en' | 'es' | 'pt_BR' | 'fr' | 'de' | 'ja';
export type Theme = 'light' | 'dark';
export type PresetId = 'carbon' | 'warm_paper' | 'night_shift' | 'crisp_dark';
export type SiteAdapter = 'generic' | 'google-docs' | 'google-sheets' | 'google-slides';

export interface DomainProfile {
  enabled: boolean;
  preset: PresetId;
  brightness: number;    // 50 to 150 (integer, %)
  contrast: number;      // 50 to 150 (integer, %)
  warmth: number;        // 0 to 100 (integer, % sepia/warmth)
  darkenCanvas: boolean; // default true
  rememberSite: boolean; // default true
  updatedAt: number;
}

export interface Settings {
  locale: Locale;
  theme: Theme;
}
```

### Preset Calibrations (`src/lib/presets.ts`)

| Preset (`id`) | Inversion | `brightness` | `contrast` | `warmth` | Description |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `carbon` | Yes | `92` | `96` | `0` | Soft graphite for daily workflow without glare. |
| `warm_paper` | No | `94` | `98` | `28` | Warm daytime paper tint without color inversion. |
| `night_shift` | Yes | `84` | `92` | `35` | Deep dark mode with a rich warm blue-light filter. |
| `crisp_dark` | Yes | `98` | `114` | `0` | High-contrast black for dense spreadsheets and code. |

---

## 6. Visual Design: "Leica Crimson — Tactile Hardware"

Inspired by *Leica* optics, *Nothing OS*, and *Teenage Engineering* hardware. **Zero fuzzy neon. Zero Unicode emojis.**

### CSS Design Tokens (`entrypoints/popup/style.css`)

- **Popup Fixed Width:** `360px`
- **Dark Theme (`[data-theme="dark"]` — Primary Aesthetic Reference):**
  - `--bg: #111111`
  - `--surface: #18181A`
  - `--surface-subtle: #202023`
  - `--border: #2B2B2F`
  - `--border-strong: #3E3E44`
  - `--text: #F4F4F5`
  - `--text-muted: #8E8E96`
  - `--accent: #E11D48`
  - `--accent-hover: #F43F5E`
  - `--accent-soft: rgba(225, 29, 72, 0.14)`
  - `--led-glow: 0 0 8px rgba(225, 29, 72, 0.75)`
- **Light Theme (`:root` / `[data-theme="light"]`):**
  - `--bg: #F4F3F0`
  - `--surface: #FFFFFF`
  - `--surface-subtle: #ECEAE4`
  - `--border: #D8D6CE`
  - `--border-strong: #B8B5AA`
  - `--text: #141416`
  - `--text-muted: #64646C`
  - `--accent: #E11D48`
  - `--accent-hover: #BE123C`
  - `--accent-soft: rgba(225, 29, 72, 0.10)`
  - `--led-glow: 0 0 6px rgba(225, 29, 72, 0.45)`

### Mandatory Tactile Hardware Visual Tokens

1. **Crimson LED Indicator (`.led-dot`):** A circular `6px` dot located on the active preset card and beside active hardware switches, illuminated with `--accent` and `box-shadow: var(--led-glow)`. On inactive elements, it remains dormant or dark (`#333`).
2. **Technical Micro-Dots & Dotted Separators:**
   - Dotted divider lines between sections (`border-bottom: 1px dotted var(--border-strong)`).
   - Micro-corner marks on preset cards evoking CNC-machined hardware.
3. **Technical Typography:**
   - Section headers and preset titles use a clean monospace font (`ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace`) with technical letter spacing.
   - Numeric readouts (`92%`, `96%`, `35%`) use `font-variant-numeric: tabular-nums`.
4. **Millimeter Scale Ticks on Sliders (`.tick-scale`):**
   - Beneath `#slider-brightness`, `#slider-contrast`, and `#slider-warmth`, render a fine gradient tick scale with labeled endpoints (`50` / `150` or `0` / `100`), resembling a manual camera exposure dial.
5. **Standalone Vector SVG Flag Selector (`#locale-switcher`):**
   - Interactive dropdown matching Amplifier:
     - Trigger button `#btn-locale-trigger` displaying the active **SVG flag (`16×12px`)** + chevron.
     - Floating menu `#locale-menu` displaying all 6 standalone SVG flags without text labels in a compact 3x2 grid.
     - Local SVG vectors defined in `src/lib/flags.ts`: `en` (USA), `es` (Spain), `pt_BR` (Brazil), `fr` (France), `de` (Germany), `ja` (Japan).

---

## 7. Internationalization (6 Locales)

### `public/_locales/*/messages.json`

Create symmetric messages for `stExtName`, `stExtShortName`, `stExtDescription`, `stCommandOpen`. Across all locales, the brand name is strictly **`Shade`**:
- **`en`:** `Shade` — *"Per-site dark mode and light control with real canvas darkening for Google Docs, Sheets & Slides."*
- **`es`:** `Shade` — *"Modo oscuro y control de luz por sitio con soporte real de lienzo para Google Docs, Sheets y Slides."*
- **`pt_BR`:** `Shade` — *"Modo escuro e controle de luz por site com suporte real de tela para Google Docs, Sheets e Slides."*
- **`fr`:** `Shade` — *"Mode sombre et contrôle de luminosité par site avec prise en charge réelle de Google Docs, Sheets et Slides."*
- **`de`:** `Shade` — *"Dunkelmodus und Lichtsteuerung pro Website mit echter Canvas-Abdunkelung für Google Docs, Sheets & Slides."*
- **`ja`:** `Shade` — *"Googleドキュメント・スプレッドシート対応のサイト別ダークモード＆明るさ調整拡張機能。"*

---

## 8. WXT Configuration (`wxt.config.ts`)

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  manifest: {
    default_locale: 'en',
    name: '__MSG_stExtName__',
    short_name: '__MSG_stExtShortName__',
    description: '__MSG_stExtDescription__',
    version: '1.0.0',
    permissions: ['storage', 'tabs'],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: '__MSG_stExtName__',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+S',
          mac: 'Alt+Shift+S',
        },
        description: '__MSG_stCommandOpen__',
      },
    },
  },
});
```

---

## 9. Unit Testing (Vitest + jsdom)

Create 5 complete test suites in `tests/`:
1. `tests/domain.test.ts`: domain normalization (`www.` stripped), restricted URL detection (`chrome://`, `edge://`, Chrome Web Store), and adapter matching (`google-docs`, `google-sheets`, `google-slides`, `generic`).
2. `tests/presets.test.ts`: default values for the 4 presets, clamp helpers (`clampBrightness`, `clampContrast`, `clampWarmth`), and default profile factory (`enabled: false`).
3. `tests/css-engine.test.ts`:
   - Returns empty string when `enabled: false`.
   - `warm_paper` excludes `invert(1)`.
   - `carbon`, `night_shift`, and `crisp_dark` apply `invert(1) hue-rotate(180deg)` and preserve `img, video`.
   - In Google Docs/Sheets, when `darkenCanvas: false`, generates re-inversion rules for editor `<canvas>`, and when `darkenCanvas: true`, keeps canvas dark.
4. `tests/storage.test.ts`: mock `chrome.storage.local` verifying get, set, and clear operations for domain profiles (`st_domains_v1`) and global settings (`st_settings_v1`).
5. `tests/i18n.test.ts`: 100% key symmetry across all 6 languages (`en`, `es`, `pt_BR`, `fr`, `de`, `ja`), zero empty strings, locale detection fallback, and valid SVG flags for all 6 locales.

---

## 10. Monorepo Integration & Verification

1. Update root `package.json` scripts:
   - `"build:shade": "pnpm --filter shade run build"`
   - `"zip:shade": "pnpm --filter shade run zip"`
   - `"dev:shade": "pnpm --filter shade run dev"`
   - `"test:shade": "pnpm --filter shade run test"`
2. Update root `README.md` extension directory table.
3. Author `extensions/shade/PRIVACY_POLICY.md` (6 locales) and `extensions/shade/assets/webstore-promo.html` (1280 × 800 px).
4. Run the mandatory verification cycle:
   ```bash
   pnpm install
   pnpm --filter shade test
   pnpm --filter shade run compile
   pnpm --filter shade run build
   pnpm --filter shade run zip
   ```
5. When all checks are green, suggest the semantic commit command without executing it.
