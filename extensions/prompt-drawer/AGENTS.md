# Prompt Drawer — Agent Guidelines

Specific engineering rules and architectural standards for developing and maintaining **Prompt Drawer**.  
Before making any changes, review the global guidelines in `AGENTS.md` at the repository root.

## Identity

- **Directory:** `extensions/prompt-drawer/`
- **pnpm filter name:** `prompt-drawer`
- **UI Name:** Prompt Drawer
- **Default Shortcut:** `Alt+Shift+V`

## Architecture

- Pure Popup UI + `chrome.storage.local`. Zero content scripts. Zero background service worker.
- Pure library modules in `src/lib/`: `storage.ts`, `search.ts`, `variables.ts`, `examples.ts`.

## Storage Keys

```ts
STORAGE_PROMPTS_KEY = 'pv_prompts_v1'
STORAGE_SETTINGS_KEY = 'pv_settings_v1'
STORAGE_CATEGORIES_KEY = 'pv_categories_v1'
```

Never alter these keys without an explicit schema migration strategy.

## Variable System

- Variables `{{name}}` detected via `/\{\{(\w+)\}\}/g`.
- When copying a prompt containing variables → triggers interactive modal to fill in parameters before writing to clipboard.

## UI Rules

- Autofocus on search input upon opening popup.
- Keyboard navigation: arrow keys `↑` / `↓` navigate the prompt list, `Enter` copies selected item, `Esc` dismisses modal/editor.
- Inline deletion confirmation: button toggles to `"Sure?"` for 3 seconds. Never use blocking `window.confirm`.
- Frame 0 render: load prompts from local storage and render initial view before first frame paint.

## Colorized Categories

- Users can create categories with custom name + hex color code.
- Category chips render across the top for one-click list filtering.

## Verification & Build

```bash
pnpm --filter prompt-drawer test
pnpm --filter prompt-drawer run compile
pnpm --filter prompt-drawer run build
```
