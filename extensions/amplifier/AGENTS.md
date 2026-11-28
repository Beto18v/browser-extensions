# Amplifier Tab — Agent Guidelines

Reglas específicas para el desarrollo y mantenimiento de **Amplifier Tab** (*Amplificador de Pestaña*).
Antes de hacer cambios, leer también el `AGENTS.md` de la raíz del monorepo.

## Identidad

- **Directorio:** `extensions/amplifier/`
- **pnpm filter name:** `amplifier`
- **UI name (EN / default):** Amplifier
- **UI name (ES):** Amplificador
- **UI name (PT):** Amplificador
- **UI name (FR):** Amplificateur
- **UI name (DE):** Verstärker
- **UI name (JA):** アンプ
- **Shortcut:** `Alt+Shift+A`

## Arquitectura (Manifest V3)

- **Popup (`entrypoints/popup/`):** TypeScript + DOM nativo (sin frameworks). Render en frame 0.
- **Background Service Worker (`entrypoints/background.ts`):** Coordina `chrome.tabCapture`, ciclo de vida del Offscreen Document, estado por pestaña y badge numérico (`160%`).
- **Offscreen Document (`entrypoints/offscreen/`):** Ejecuta `AudioContext` (Web Audio API) por pestaña con `GainNode` (0%–600%), filtros `BiquadFilterNode` por preset y `DynamicsCompressorNode` anti-distorsión.
- **Módulos puros (`src/lib/`):** `storage.ts`, `domain.ts`, `presets.ts`, `i18n.ts`. 100% testeables en Vitest sin depender de Web Audio real.

## Storage keys

```ts
STORAGE_DOMAINS_KEY = 'at_domains_v1'
STORAGE_SETTINGS_KEY = 'at_settings_v1'
```

No cambiar estas claves sin migración explícita.

## Sistema de Idiomas (6 locales)

- Idiomas soportados: `en` (default), `es`, `pt_BR`, `fr`, `de`, `ja`.
- El diccionario vive en `src/lib/i18n.ts` (propio de esta extensión para no alterar `packages/shared` ni afectar `prompt-drawer`).
- Los metadatos de la tienda viven en `public/_locales/{en,es,pt_BR,fr,de,ja}/messages.json`.
- Todas las claves deben existir simétricamente en los 6 idiomas. Fallback seguro a `en`.

## Reglas de UI y Paleta (Acoustic Slate)

- Tema claro y oscuro con detección inicial del sistema + selector manual persistido.
- **Paleta Acoustic Slate:** Pizarra frío (`#F3F5F7` / `#12151A`) y acento terracota mate (`#E05A47`).
- Selector de idioma con menú desplegable e iconos SVG vectoriales de banderas (sin emojis ni dependencias de red).
- Autofocus en el slider de volumen (`#volume-slider`) al abrir el popup.
- Porcentaje con `font-variant-numeric: tabular-nums` para evitar saltos visuales.
- Navegación por teclado: `←` / `→` ajustan volumen en pasos de 5%, `Shift+←` / `Shift+→` en pasos de 25%, `M` silencia/restaura, `R` resetea a 100%, `1–4` cambian preset.

## Marca Personal

- `"author": "Nicolas Valenzuela (Beto18v)"` en `package.json`.
- Footer con enlace a configuración de atajos de Chrome ("Agregar atajo" / `chrome://extensions/shortcuts`) + texto "Created by Nicolas Valenzuela" con enlace directo a `https://nival.is-a.dev`.

## Regla de Oro — Git y Verificación

- Prohibido ejecutar `git commit` o `git push` sin autorización explícita del usuario.
- Ciclo obligatorio al terminar cualquier cambio:

```bash
pnpm --filter amplifier-tab test
pnpm --filter amplifier-tab run compile
pnpm --filter amplifier-tab run build
pnpm --filter amplifier-tab run zip
```