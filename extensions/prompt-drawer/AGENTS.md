# Prompt Drawer — Agent Guidelines

Reglas específicas para el desarrollo y mantenimiento de **Prompt Drawer**.

## Identidad

- **Directorio:** `extensions/prompt-drawer/`
- **pnpm filter name:** `prompt-drawer`
- **UI name:** Prompt Drawer
- **Shortcut:** `Alt+Shift+V`

## Arquitectura

- Solo Popup + `chrome.storage.local`. Sin content script. Sin background worker.
- Módulos en `src/lib/`: `storage.ts`, `search.ts`, `variables.ts`, `examples.ts`.

## Storage keys

```ts
STORAGE_PROMPTS_KEY = 'pv_prompts_v1'
STORAGE_SETTINGS_KEY = 'pv_settings_v1'
STORAGE_CATEGORIES_KEY = 'pv_categories_v1'
```

No cambiar estas claves sin migración explícita.

## Sistema de variables

- Variables `{{nombre}}` detectadas con `/\{\{(\w+)\}\}/g`.
- Al copiar un prompt con variables → modal para completarlas antes de copiar.

## Reglas de UI

- Autofocus en búsqueda al abrir.
- Teclado: flechas `↑` `↓` navegan lista, `Enter` copia, `Esc` cierra modal/editor.
- Confirmación de borrado inline: botón → `"¿Seguro?"` durante 3s. Sin `window.confirm`.
- Render en frame 0: cargar prompts de storage y renderizar lista antes del primer frame.

## Categorías con color

- El usuario crea categorías con nombre + color hex.
- Los chips de categoría aparecen en la parte superior para filtrar la lista.

## Tests y verificación

```bash
pnpm --filter prompt-drawer test
pnpm --filter prompt-drawer run compile
pnpm --filter prompt-drawer run build
```
