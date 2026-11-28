# Prompt Drawer

Offline prompt manager for AI assistant users (ChatGPT, Claude, Gemini) allowing you to search, fill in dynamic variables, and copy instructions to the clipboard in under 5 seconds.

## Screenshot

<!-- screenshot -->

## Why This Extension

- Everyday prompts often end up scattered across external notes, documents, or text files where locating and copying them takes 1 to 2 minutes.
- Reusing the same prompt template with minor adjustments forces tedious manual edits before pasting into an AI assistant.
- Cloud dependencies, mandatory user accounts, and remote syncing introduce unnecessary latency and expose sensitive proprietary prompts.

## Key Features

- **Instant Search:** Local-first query engine with prioritized matching: exact title, title substring, tags, and body content.
- **Dynamic Variables:** Automatic detection and interactive resolution of `{{variable}}` placeholders via a fast popup modal at copy time.
- **Pinned Prompts:** Pin frequent prompts to keep them at the top of the list, even when filtering.
- **Tag Organization:** Organize prompts with comma-separated tags, displayed on each card and indexed in real-time search.
- **Custom Color Categories:** Create and assign categories with custom labels and hex colors; filter prompts via top category chips.
- **Built-in Templates:** 5 starter templates for emails, summaries, learning, meeting agendas, and code reviews.
- **Bilingual & Light/Dark Theme:** Automatic browser locale detection, manual language toggle, and system-adaptive light/dark theme.

## Dynamic Variable Resolution

When including text inside double curly braces within a prompt body, `extractVariables` automatically detects each token as you type in the editor.

Real-world example:

```text
Review this code in {{language}} focusing on {{aspect}} and suggest concrete improvements.
```

When clicking **Copy** (or pressing `Enter` on the selected prompt):

1. `hasVariables` identifies `{{language}}` and `{{aspect}}`.
2. The **Fill Variables** modal opens with dedicated input fields and autofocuses on the first field (`language`).
3. Upon confirming with **Copy** or `Enter`, `resolveVariables` injects the provided values into the template, writes the resulting text to the clipboard, increments `usageCount`, and shows the **Copied** confirmation toast.

## Tech Stack

| Category | Technology | Version | Role |
|---|---|---|---|
| Extension Framework | WXT | 0.21.5 | Build system, MV3 manifest generation, development HMR |
| Language | TypeScript | 5.9.3 | Strict static typing across all modules |
| Bundler | Vite | 8.3.8 | Fast bundling and tree-shaking |
| Platform | Chrome Extension Manifest V3 | - | Browser runtime |
| Storage | chrome.storage.local | - | 100% local persistence, zero backend |
| Testing | Vitest + jsdom | 5.1.1 / 31.0.1 | 22 comprehensive unit tests |
| Asset Icons | @wxt-dev/auto-icons + sharp | 2.0.0 | Icon generation from source SVG |
| i18n | Internal engine (@browser-extensions/shared) | - | Locale persistence in storage |
| Clipboard | navigator.clipboard (clipboardWrite) | - | Secure local clipboard writing |

Built with zero component frameworks (no React, Vue, or Svelte). The user interface is pure TypeScript and native DOM for zero runtime bundle overhead.

## Developer Installation

1. Install dependencies and compile the extension from the monorepo root:
   ```bash
   pnpm install
   pnpm --filter prompt-drawer run build
   ```
2. Navigate to `chrome://extensions/` in Google Chrome and enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** (*Cargar descomprimida*).
4. Select the build directory: `extensions/prompt-drawer/.output/chrome-mv3`.

## Available Scripts

Defined in `extensions/prompt-drawer/package.json`:

| Command | Action |
|---|---|
| `dev` (`wxt`) | Starts Vite development server with Hot Module Replacement (HMR). |
| `build` (`wxt build`) | Generates production bundle in `.output/chrome-mv3/`. |
| `zip` (`wxt zip`) | Compiles and packages release `.output/prompt-drawer-1.0.0-chrome.zip`. |
| `compile` (`tsc --noEmit`) | Runs TypeScript type check without emitting files. |
| `test` (`vitest run`) | Executes the complete suite of 22 unit tests. |
| `test:watch` (`vitest`) | Runs tests in continuous watch mode. |

## Keyboard Shortcuts

- Default shortcut: `Alt+Shift+V` (Windows, Linux, macOS).
- Customize via `chrome://extensions/shortcuts` or click the shortcut indicator in the popup footer.
- Within the popup: `↑` / `↓` navigates items, `Enter` copies the selected prompt, `Esc` dismisses modals or editors.

## Privacy & Security

Prompt Drawer operates 100% locally in your browser. It makes zero outbound network requests, gathers no telemetry, and uses no remote databases. All prompts, categories, and settings are stored strictly in `chrome.storage.local`.

Read the complete policy at:  
👉 [**PRIVACY_POLICY.md**](PRIVACY_POLICY.md)

## License & Author

Distributed under the [MIT License](LICENSE).

Authored by **[Nicolas Valenzuela](https://nival.is-a.dev)** (*Beto18v*).
- **Portfolio:** [nival.is-a.dev](https://nival.is-a.dev)
- **Email:** [nicolasalbertov18@gmail.com](mailto:nicolasalbertov18@gmail.com)
- **GitHub:** [github.com/Beto18v](https://github.com/Beto18v)
- **Issues & Support:** [github.com/Beto18v/browser-extensions/issues](https://github.com/Beto18v/browser-extensions/issues)
