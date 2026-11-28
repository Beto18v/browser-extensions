# Shade

Per-site dark mode, light control, and contrast calibrator with native `<canvas>` support for **Google Docs, Google Sheets, and Google Slides**.

Built with **WXT 0.21.5**, **TypeScript**, **Manifest V3**, and pure native DOM (zero component frameworks).

## Key Features

- **Per-Domain Opt-In:** Leaves every website untouched by default until you enable Shade or adjust a control on that domain.
- **Google Workspace Hybrid Engine:** Automatically detects `docs.google.com/document`, `/spreadsheets`, and `/presentation`, letting you toggle **Darken canvas (Docs / Sheets)** independently of toolbars and menus.
- **4 Calibrated Optical Presets:** *Carbon*, *Warm Paper* (non-inverted daytime tint), *Night Shift*, and *Crisp Dark*.
- **Real-Time Tactile Calibration:** Fine-tune **Brightness** (`50–150%`), **Contrast** (`50–150%`), and **Warmth** (`0–100%`) with zero lag.
- **Zero White Flash:** Injects `<style id="shade-engine">` at `document_start` while preserving natural colors in `img`, `video`, `picture`, and `iframe`.
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

**Nicolas Valenzuela (Beto18v)** — [nival.is-a.dev](https://nival.is-a.dev) · [github.com/Beto18v](https://github.com/Beto18v)
