# Shade

**Real dark mode for Google Docs, Sheets & Slides — plus opt-in per-site light calibration for the entire web.**

Built with **WXT 0.21.5**, **TypeScript**, **Manifest V3**, and pure native DOM (zero component frameworks).

## Why Shade?

Most dark mode extensions invert the entire web blindly, breaking spreadsheets, washing out documents, and ruining slide presentations. **Shade** is built around two core principles:

1. **Google Workspace Hybrid Canvas Engine:** Automatically detects **Google Docs**, **Google Sheets**, and **Google Slides** (`docs.google.com`) and decouples the editor UI from your document canvas. Toggle **Darken canvas** at any time to switch between a dark workspace sheet and true original paper/cell/slide colors while keeping toolbars, menus, and rulers in dark mode.
2. **Opt-In Per-Site Control for Every Website:** Leaves all websites untouched by default. Enable Shade on any domain with instant activation (no page reload required), zero white flash (`document_start`), and per-domain persistence.

## Key Features

- **Google Docs, Sheets & Slides Native Adapters:**
  - **Docs:** Targets `canvas.kix-canvas-tile-content` with `#FFFFFF` paper restoration when `Darken canvas` is off.
  - **Sheets:** Targets `.grid-container canvas` to preserve true cell colors or darken the entire spreadsheet grid.
  - **Slides:** Targets `#pages > svg` in the editor and `.punch-viewer-content` in presenter mode to keep slide artwork intact.
- **4 Calibrated Optical Presets:** *Carbon*, *Warm Paper* (non-inverted daytime tint), *Night Shift*, and *Crisp Dark*.
- **Real-Time Tactile Calibration:** Fine-tune **Brightness** (`50–150%`), **Contrast** (`50–150%`), and **Warmth** (`0–100%`) with zero lag.
- **Media Color Preservation:** Keeps `img`, `video`, `picture`, and `iframe` elements in their natural colors.
- **Canonical 6-Locale System:** English (`en`), Spanish (`es`), Portuguese (`pt_BR`), French (`fr`), German (`de`), and Japanese (`ja`) with standalone inline SVG flags.
- **Keyboard Shortcuts:** `Alt+Shift+S` to open the popup; `Space`/`Enter` to toggle, `1–4` for presets, `R` to reset, `C` to toggle canvas darkening, `Escape` to close menus.

## Development & Verification

```bash
# Run unit tests
pnpm --filter shade test

# Typecheck
pnpm --filter shade run compile

# Production build
pnpm --filter shade run build

# Package release .zip
pnpm --filter shade run zip
```

## Privacy

100% Local-First with zero telemetry or network requests. See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md).

## Author

**Nicolas Valenzuela** — [nival.is-a.dev](https://nival.is-a.dev) · [github.com/Beto18v](https://github.com/Beto18v)
