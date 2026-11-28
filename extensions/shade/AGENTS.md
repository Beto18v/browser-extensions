# Shade — Agent Guidelines

Reglas específicas para el desarrollo y mantenimiento de **Shade** (control de luz y modo oscuro granular por sitio web).
Antes de hacer cambios, leer también el `AGENTS.md` de la raíz del monorepo.

## Identidad

- **Nombre de la app (UI y tienda):** Shade
- **Directorio:** `extensions/shade-tab/`
- **pnpm filter name:** `shade-tab`
- **Shortcut:** `Alt+Shift+S`

## Arquitectura (Manifest V3)

- **Popup (`entrypoints/popup/`):** TypeScript + DOM nativo (sin frameworks). Render en frame 0.
- **Content Script (`entrypoints/content.ts`):** Se ejecuta en `document_start` para evitar el destello blanco al cargar. Lee el perfil guardado del dominio en `chrome.storage.local`, inyecta/actualiza una única etiqueta `<style id="shade-tab-engine">` y escucha mensajes en vivo del popup para reflejar sliders sin latencia.
- **Background Service Worker (`entrypoints/background.ts`):** Ligero; sincroniza el indicador visual del icono (badge sutil cuando el dominio actual tiene Shade activo).
- **Módulos puros (`src/lib/`):** `types.ts`, `domain.ts`, `presets.ts`, `css-engine.ts`, `storage.ts`, `i18n.ts`, `flags.ts`. 100% testeables en Vitest sin depender de un navegador real.

## Principio Opt-In por Dominio

- Por defecto, **ningún sitio web se modifica** hasta que el usuario active el interruptor principal o seleccione un preset/slider en ese dominio.
- Cada dominio guarda su propio perfil independiente (`enabled`, `preset`, `brightness`, `contrast`, `warmth`, `darkenCanvas`) en `chrome.storage.local`.

## Storage Keys

```ts
STORAGE_DOMAINS_KEY = 'st_domains_v1'
STORAGE_SETTINGS_KEY = 'st_settings_v1'
```

No cambiar estas claves sin migración explícita.

## Sistema de Idiomas (6 locales con banderas SVG)

- Idiomas soportados: `en` (default), `es`, `pt_BR`, `fr`, `de`, `ja`.
- El diccionario vive en `src/lib/i18n.ts` y las banderas SVG inline viven en `src/lib/flags.ts` (propios de esta extensión para no alterar `packages/shared` ni otras extensiones del monorepo).
- **Selector de idioma con banderas SVG:** Usar un dropdown personalizado accesible (`#locale-switcher`) que muestre la bandera en SVG limpio (`16×12px`) junto al código/nombre del idioma. **Nunca usar emojis Unicode de banderas**, ya que en Windows se renderizan como letras planas (`US`, `ES`) y rompen la regla de cero emojis.
- Los metadatos de la tienda viven en `public/_locales/{en,es,pt_BR,fr,de,ja}/messages.json` manteniendo siempre el nombre de marca **Shade**.
- Todas las claves deben existir simétricamente en los 6 idiomas. Fallback seguro a `en`.

## Reglas de UI — Leica Crimson + Hardware Táctil

- Estética inspirada en hardware óptico e industrial (*Leica* / *Nothing OS* / *Teenage Engineering*):
  - Superficies planas mate, bordes finos de precisión (`1px`), micro-puntos en esquinas y separadores punteados.
  - Sliders con **escala milimetrada** (tick marks) y lectura numérica con `font-variant-numeric: tabular-nums`.
  - Indicador **LED rojo carmesí** (`#E11D48`) con brillo sutil solo en el preset o control activo.
- Tema claro y oscuro con detección inicial del sistema + selector manual persistido.
- **Cero emojis Unicode** en toda la interfaz, código o metadatos. Solo iconos y banderas SVG limpios.
- Navegación por teclado: `Space` o `Enter` en el toggle principal, `1–4` cambian preset, `R` resetea sliders al preset activo, `C` alterna el oscurecimiento de lienzo (`darkenCanvas`) cuando está disponible, `Escape` cierra el menú de idiomas.

## Marca Personal

- `"author": "Nicolas Valenzuela (Beto18v)"` en `package.json`.
- Footer con acceso directo al atajo (`chrome://extensions/shortcuts`) + nombre y enlaces a `https://nival.is-a.dev` y `https://github.com/Beto18v`.

## Regla de Oro — Git y Verificación

- Prohibido ejecutar `git commit` o `git push` sin autorización explícita del usuario.
- Ciclo obligatorio al terminar cualquier cambio:

```bash
pnpm --filter shade-tab test
pnpm --filter shade-tab run compile
pnpm --filter shade-tab run build
pnpm --filter shade-tab run zip
```