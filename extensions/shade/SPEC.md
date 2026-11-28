# Shade — Implementation Specification v1.0

> **Para el agente ejecutor:** Lee este archivo completo y el `AGENTS.md` de la raíz del monorepo antes de escribir una sola línea de código.
> Este documento es la única fuente de verdad del diseño. Sigue cada sección en orden.

---

## 1. Contexto del Repositorio

- **Monorepo:** `browser-extensions-suite`
- **Nombre de la app:** **Shade**
- **Workspace:** `extensions/shade-tab/`
- **Framework:** WXT 0.21.5 + TypeScript 5.9 + Vite (Manifest V3 — Chrome, Edge, Brave)
- **UI:** TypeScript + DOM nativo. **Prohibido** instalar React, Vue, Svelte o frameworks CSS pesados.
- **Restricciones globales del monorepo (`AGENTS.md` raíz):**
  - Prohibido `git commit` o `git push` sin autorización explícita del usuario.
  - Cero llamadas de red. 100% local (`chrome.storage.local`).
  - Sin emojis Unicode en ninguna interfaz ni texto visible (usar SVG limpio incluso para banderas).
  - Render en frame 0 (sin layout shift).
  - `"author": "Nicolas Valenzuela (Beto18v)"` en `package.json`.
  - No modificar ni eliminar `patches/undici@8.13.1.patch` en `pnpm-workspace.yaml`.
  - No modificar otras extensiones del monorepo (`extensions/amplifier-tab/`, etc.) ni romper `packages/shared/`.

---

## 2. Qué Hace Esta Extensión

**Shade** es una herramienta de control de luz, contraste y modo oscuro **granular por sitio web** (opt-in). A diferencia de los bloqueadores de luz genéricos que alteran todo Internet y rompen hojas de cálculo o documentos, Shade mantiene intactos todos los sitios por defecto y permite calibrar cada dominio de forma independiente, con soporte real para el lienzo (`<canvas>`) de **Google Docs, Google Sheets y Google Slides**.

### Diferenciadores clave
1. **Opt-in real con memoria por dominio:** Ninguna web se modifica sin que el usuario la active. Al activar o mover un slider en un sitio (ej. `docs.google.com`, `wikipedia.org`), su perfil exacto se guarda en caché local (`chrome.storage.local`) solo para ese dominio.
2. **Motor híbrido para Google Workspace (Docs / Sheets / Slides):** Detecta automáticamente aplicaciones de Google Workspace y separa el control de la interfaz del control del lienzo (`<canvas>`), ofreciendo un interruptor rápido de **1 clic: "Oscurecer lienzo (Docs / Sheets)"** para trabajar en modo oscuro real o revisar colores originales al instante.
3. **4 Presets calibrados + 3 controles táctiles:** *Carbon*, *Warm Paper*, *Night Shift* y *Crisp Dark*, ajustables en tiempo real con sliders de **Brillo**, **Contraste** y **Calidez** (filtro de luz azul).
4. **Cero destello blanco:** Inyección en `document_start` mediante una única hoja de estilos controlada (`#shade-tab-engine`), preservando los colores reales de `img`, `video`, `picture` e `iframe`.
5. **6 idiomas nativos con selector de banderas SVG:** `en`, `es`, `pt_BR`, `fr`, `de`, `ja`.

---

## 3. Arquitectura Manifest V3

```text
extensions/shade-tab/
├── AGENTS.md
├── SPEC.md
├── README.md
├── package.json
├── tsconfig.json
├── wxt.config.ts
├── assets/
│   └── icon.svg                  # SVG 128x128 minimalista (círculo dividido luz/sombra con acento #E11D48)
├── public/
│   └── _locales/
│       ├── en/messages.json
│       ├── es/messages.json
│       ├── pt_BR/messages.json
│       ├── fr/messages.json
│       ├── de/messages.json
│       └── ja/messages.json
├── entrypoints/
│   ├── background.ts             # Service Worker ligero: actualiza badge cuando el dominio actual está activo
│   ├── content.ts                # Content script en document_start: aplica/remueve #shade-tab-engine
│   └── popup/
│       ├── index.html            # UI del popup (ancho fijo 360px)
│       ├── main.ts               # Lógica DOM, atajos, sincronización en vivo con content script y storage
│       └── style.css             # Sistema visual "Leica Crimson — Hardware Táctil" (Light + Dark)
├── src/
│   └── lib/
│       ├── types.ts              # Tipos compartidos (DomainProfile, Settings, SiteAdapter, Messages)
│       ├── domain.ts             # Normalización de dominios, detección de páginas restringidas y adaptadores
│       ├── presets.ts            # Definición de los 4 presets, rangos y helpers de clamp
│       ├── css-engine.ts         # Generador puro de CSS híbrido (Universal + Google Workspace canvas)
│       ├── storage.ts            # Persistencia en chrome.storage.local (st_domains_v1 y st_settings_v1)
│       ├── flags.ts              # Banderas SVG inline limpias (16x12) para los 6 idiomas
│       └── i18n.ts               # Diccionario completo de 6 idiomas + detector de locale
└── tests/
    ├── domain.test.ts
    ├── presets.test.ts
    ├── css-engine.test.ts
    ├── storage.test.ts
    └── i18n.test.ts
```

---

## 4. Motor de Inyección Híbrido (`src/lib/css-engine.ts` + `entrypoints/content.ts`)

### Detección de Adaptador (`src/lib/domain.ts`)
- `detectSiteAdapter(url)`:
  - `docs.google.com/document/*` → `'google-docs'`
  - `docs.google.com/spreadsheets/*` → `'google-sheets'`
  - `docs.google.com/presentation/*` → `'google-slides'`
  - Cualquier otra URL `http:` / `https:` → `'generic'`
- `isSupportedUrl(url)`: retorna `false` para `chrome://`, `edge://`, `about:`, `chrome-extension://`, `chrome.google.com/webstore`, `chromewebstore.google.com`.

### Reglas CSS generadas (`buildThemeCss(profile, adapter)`)
Si `!profile.enabled`, retorna `''` (remueve `#shade-tab-engine` del DOM).

1. **Modos con inversión (`carbon`, `night_shift`, `crisp_dark`):**
   - Aplica filtro compuesto a `html`:
     `filter: invert(1) hue-rotate(180deg) brightness(B%) contrast(C%) sepia(W%) !important;`
     y `background-color: #FFFFFF !important;` (que al invertirse produce un lienzo oscuro uniforme sin bordes blancos).
   - **Preservación de medios:** Re-invierte `img, video, picture, [style*="background-image"], iframe` con `filter: invert(1) hue-rotate(180deg) !important;` para que fotos, miniaturas y videos mantengan sus colores naturales.
2. **Modo cálido sin inversión (`warm_paper`):**
   - No invierte el sitio. Aplica sobre `html`:
     `filter: brightness(B%) contrast(C%) sepia(W%) !important;`
     ideal para lectura prolongada de día sin brillo azul agresivo.
3. **Adaptador Google Workspace (`google-docs`, `google-sheets`, `google-slides`):**
   - Cuando `profile.preset` es oscuro (`carbon`, `night_shift`, `crisp_dark`):
     - Si `profile.darkenCanvas === true`: mantiene invertido el lienzo `<canvas>` (`.kix-canvas-tile-content`, `.grid-container canvas`, `.punch-viewer-content canvas`, `canvas`) para que el documento, las celdas de Sheets o las diapositivas se vean en modo oscuro real; solo protege imágenes embebidas y avatares (`img`).
     - Si `profile.darkenCanvas === false`: añade una regla de re-inversión específica para los `<canvas>` del editor (`canvas.kix-canvas-tile-content, .grid-container canvas, .punch-viewer-content canvas, #docs-editor canvas { filter: invert(1) hue-rotate(180deg) !important; }`) dejando la interfaz de menús/barras oscura mientras el documento/hoja conserva sus colores originales exactos.
   - Si el usuario está en `google-docs` / `google-sheets` / `google-slides`, el switch **"Oscurecer lienzo (Docs / Sheets)"** aparece resaltado como activo/disponible para esa app. En sitios genéricos también se permite alternar si el sitio usa `<canvas>` (ej. Figma, Excalidraw, PDFs renderizados).

### Sincronización en tiempo real
- Al abrir el popup, lee el estado del dominio actual desde `chrome.storage.local` (render en frame 0).
- Al mover cualquier slider (`brightness`, `contrast`, `warmth`) o pulsar un preset/switch:
  - Si la extensión estaba apagada en ese sitio, la enciende automáticamente (`enabled: true`) al tocar un preset o slider.
  - Envía un mensaje inmediato `APPLY_PROFILE` al `content.ts` de la pestaña activa para actualizar `#shade-tab-engine` en el mismo frame (cero lag).
  - Si `rememberSite` está activo (por defecto `true`), persiste el perfil en `chrome.storage.local` con debounce de `120ms`.
  - Notifica a `background.ts` para actualizar el badge (`ON` en color `#E11D48` cuando está activo en la pestaña actual, o vacío cuando está apagado).

---

## 5. Modelo de Datos y Presets

### Claves de Storage (`src/lib/storage.ts`)
```ts
export const STORAGE_DOMAINS_KEY = 'st_domains_v1';
export const STORAGE_SETTINGS_KEY = 'st_settings_v1';
```

### Tipos (`src/lib/types.ts`)
```ts
export type Locale = 'en' | 'es' | 'pt_BR' | 'fr' | 'de' | 'ja';
export type Theme = 'light' | 'dark';
export type PresetId = 'carbon' | 'warm_paper' | 'night_shift' | 'crisp_dark';
export type SiteAdapter = 'generic' | 'google-docs' | 'google-sheets' | 'google-slides';

export interface DomainProfile {
  enabled: boolean;
  preset: PresetId;
  brightness: number;    // 50 a 150 (entero, %)
  contrast: number;      // 50 a 150 (entero, %)
  warmth: number;        // 0 a 100 (entero, % sepia/calidez)
  darkenCanvas: boolean; // true por defecto
  rememberSite: boolean; // true por defecto
  updatedAt: number;
}

export interface Settings {
  locale: Locale;
  theme: Theme;
}
```

### Valores de los 4 Presets (`src/lib/presets.ts`)
| Preset (`id`) | Inversión | `brightness` | `contrast` | `warmth` | Descripción |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `carbon` | Sí | `92` | `96` | `0` | Grafito suave para trabajo diario sin halo. |
| `warm_paper` | No | `94` | `98` | `28` | Papel cálido sin inversión para lectura de día. |
| `night_shift` | Sí | `84` | `92` | `35` | Oscuro profundo con filtro cálido de luz azul. |
| `crisp_dark` | Sí | `98` | `114` | `0` | Alto contraste para hojas de cálculo y tablas. |

---

## 6. Diseño Visual: "Leica Crimson — Hardware Táctil"

Inspirado en cámaras ópticas *Leica*, *Nothing OS* y sintetizadores *Teenage Engineering*. **Cero neón difuso. Cero emojis Unicode.**

### Variables CSS (`entrypoints/popup/style.css`)
- **Ancho fijo del popup:** `360px`
- **Modo Oscuro (`[data-theme="dark"]` — estética principal de referencia):**
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
- **Modo Claro (`:root` / `[data-theme="light"]`):**
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

### Rasgos Visuales Obligatorios (Hardware Táctil)
1. **Indicador LED Carmesí (`.led-dot`):** Un punto circular de `6px` en la esquina superior derecha de la tarjeta del preset activo (y junto al interruptor de lienzo cuando está encendido) con color `--accent` y `box-shadow: var(--led-glow)`. En tarjetas inactivas permanece oculto o apagado (`#333`).
2. **Micro-puntos técnicos y separadores punteados:**
   - Separadores horizontales con patrón de puntos (`radial-gradient` o `border-bottom: 1px dotted var(--border-strong)`).
   - Micro-marcas sutiles en las esquinas de las tarjetas de presets para simular hardware ensamblado.
3. **Tipografía técnica:**
   - Etiquetas de sección y títulos de preset con fuente monoespaciada limpia (`ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace`) y `letter-spacing` técnico.
   - Lecturas numéricas (`92%`, `96%`, `35%`) con `font-variant-numeric: tabular-nums`.
4. **Sliders con escala milimetrada (`.tick-scale`):**
   - Debajo de cada `<input type="range">` (`#slider-brightness`, `#slider-contrast`, `#slider-warmth`), una regla de marcas finas CSS (`repeating-linear-gradient`) con extremos etiquetados (`50` / `150` o `0` / `100`) como un dial de exposición de cámara.
5. **Selector de idioma con banderas SVG (`#locale-switcher`):**
   - Como un `<select>` nativo no soporta SVG y Windows no renderiza banderas Unicode, implementar un dropdown personalizado ligero y accesible:
     - Botón disparador `#btn-locale-trigger` (`aria-haspopup="listbox"`, `aria-expanded`) que muestra la **bandera SVG (`16×12px`, `border-radius: 2px`)** del idioma activo + código corto (`EN`, `ES`, `PT`, `FR`, `DE`, `JA`) + chevron SVG.
     - Menú flotante `#locale-menu` (`role="listbox"`) con las 6 opciones (`role="option"`, `data-locale="..."`), cada una con su bandera SVG + nombre nativo (`English`, `Español`, `Português`, `Français`, `Deutsch`, `日本語`) y punto indicador carmesí en la opción activa.
     - Banderas SVG definidas localmente en `src/lib/flags.ts`: `en` (EE. UU.), `es` (España), `pt_BR` (Brasil), `fr` (Francia), `de` (Alemania), `ja` (Japón).
     - Cierra automáticamente al seleccionar, hacer clic fuera o presionar `Escape`.

### Estructura HTML del Popup (IDs obligatorios)
1. **Header:**
   - Logo SVG minimalista (círculo dividido luz/sombra) + `#text-app-title` (**Shade**)
   - Controles a la derecha: dropdown de idiomas con banderas SVG (`#locale-switcher`, `#btn-locale-trigger`, `#locale-menu`) y botón de tema `#btn-theme-toggle` (SVG sol/luna).
2. **Barra de dominio y encendido maestro:**
   - `#current-domain` (ej. `docs.google.com`), badge de estado `#status-badge` (`ACTIVE` / `OFF`) + chip opcional de adaptador `#adapter-badge` (`DOCS` / `SHEETS` / `SLIDES`, oculto en sitios genéricos).
   - Interruptor maestro `#toggle-enabled` (activar/desactivar en este dominio).
3. **Aviso de página restringida (`#restricted-banner`, oculto por defecto):**
   - Mensaje claro cuando la pestaña es `chrome://` o Chrome Web Store, deshabilitando limpiamente los controles.
4. **Panel de Presets (`#presets-panel`):**
   - Etiqueta técnica `THEME PRESETS` + separador punteado.
   - Grid 2×2 de botones `[data-preset="carbon|warm_paper|night_shift|crisp_dark"]`, cada uno con su `.led-dot`, nombre en fuente técnica y descripción corta de 1 línea.
5. **Panel de Calibración (Sliders con escala milimetrada):**
   - `#slider-brightness` (`50–150`, lectura `#val-brightness`)
   - `#slider-contrast` (`50–150`, lectura `#val-contrast`)
   - `#slider-warmth` (`0–100`, lectura `#val-warmth`)
   - Botón compacto `#btn-reset-sliders` para restaurar los valores por defecto del preset activo.
6. **Controles de Lienzo y Memoria:**
   - Fila 1: `#toggle-darken-canvas` — *"Darken canvas (Docs / Sheets)"* con `.led-dot` activo.
   - Fila 2: `#toggle-remember-site` — *"Remember for this site"* + botón discreto `#btn-clear-site` (olvidar ajustes de este sitio y volver a estado original).
7. **Footer:**
   - Botón `#btn-shortcut-settings` (`Alt+Shift+S` → abre `chrome://extensions/shortcuts`).
   - Marca personal: `Created by Nicolas Valenzuela` con enlaces a `https://nival.is-a.dev` y `https://github.com/Beto18v`.

---

## 7. Internacionalización (6 Idiomas)

### `public/_locales/*/messages.json`
Crear los 6 archivos con claves `stExtName`, `stExtShortName`, `stExtDescription`, `stCommandOpen`. En los 6 idiomas el nombre de la app es **`Shade`**:
- **`en`:** `Shade` — *"Per-site dark mode and light control with real canvas darkening for Google Docs, Sheets & Slides."*
- **`es`:** `Shade` — *"Modo oscuro y control de luz por sitio con soporte real de lienzo para Google Docs, Sheets y Slides."*
- **`pt_BR`:** `Shade` — *"Modo escuro e controle de luz por site com suporte real de tela para Google Docs, Sheets e Slides."*
- **`fr`:** `Shade` — *"Mode sombre et contrôle de luminosité par site avec prise en charge réelle de Google Docs, Sheets et Slides."*
- **`de`:** `Shade` — *"Dunkelmodus und Lichtsteuerung pro Website mit echter Canvas-Abdunkelung für Google Docs, Sheets & Slides."*
- **`ja`:** `Shade` — *"Googleドキュメント・スプレッドシート対応のサイト別ダークモード＆明るさ調整拡張機能。"*

### `src/lib/i18n.ts` y `src/lib/flags.ts`
- Implementar `detectBrowserLocale()`, `t(locale, key, params?)` y `SUPPORTED_LOCALES` con cobertura 100% simétrica en los 6 idiomas (`en`, `es`, `pt_BR`, `fr`, `de`, `ja`) para todos los textos de la UI.
- Implementar `LOCALE_FLAGS: Record<Locale, string>` y `getFlagSvg(locale)` en `src/lib/flags.ts` con SVGs ligeros y limpios (`viewBox="0 0 24 18"`).

---

## 8. Configuración de WXT (`wxt.config.ts`)

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

## 9. Pruebas Unitarias (Vitest + jsdom)

Crear 5 suites completas en `tests/`:
1. `tests/domain.test.ts`: normalización de dominios (`www.` removido), detección de URLs restringidas (`chrome://`, `edge://`, Chrome Web Store) y detección de adaptadores (`google-docs`, `google-sheets`, `google-slides`, `generic`).
2. `tests/presets.test.ts`: valores por defecto de los 4 presets (`carbon`, `warm_paper`, `night_shift`, `crisp_dark`), `clampBrightness`, `clampContrast`, `clampWarmth` y creación de perfil por defecto (`enabled: false`).
3. `tests/css-engine.test.ts`:
   - Retorna string vacío cuando `enabled: false`.
   - `warm_paper` NO incluye `invert(1)`.
   - `carbon` / `night_shift` / `crisp_dark` incluyen `invert(1) hue-rotate(180deg)` y preservación de `img, video`.
   - En `google-docs` / `google-sheets`, cuando `darkenCanvas: false` se genera la regla de re-inversión para `<canvas>`, y cuando `darkenCanvas: true` el `<canvas>` permanece oscuro.
4. `tests/storage.test.ts`: mock de `chrome.storage.local` para leer, guardar y borrar perfiles por dominio (`st_domains_v1`) y configuración global (`st_settings_v1`).
5. `tests/i18n.test.ts`: simetría exacta de claves entre los 6 idiomas (`en`, `es`, `pt_BR`, `fr`, `de`, `ja`), cero strings vacíos, mapeo correcto en `detectBrowserLocale` y verificación de que los 6 locales tienen un SVG válido en `src/lib/flags.ts`.

---

## 10. Integración en el Monorepo y Cierre

1. Actualizar el `package.json` de la raíz añadiendo los scripts:
   - `"build:shade-tab": "pnpm --filter shade-tab run build"`
   - `"zip:shade-tab": "pnpm --filter shade-tab run zip"`
   - `"dev:shade-tab": "pnpm --filter shade-tab run dev"`
   - `"test:shade-tab": "pnpm --filter shade-tab run test"`
2. Actualizar la tabla de extensiones en el `README.md` raíz agregando **Shade** (`extensions/shade-tab/`, `Alt+Shift+S`, `v1.0`).
3. Crear `extensions/shade-tab/README.md` documentando el motor híbrido para Google Workspace, los 4 presets, la arquitectura opt-in y los comandos de desarrollo.
4. Ejecutar **en este orden exacto**:
   ```bash
   pnpm install
   pnpm --filter shade-tab test
   pnpm --filter shade-tab run compile
   pnpm --filter shade-tab run build
   pnpm --filter shade-tab run zip
   ```
5. Si todo pasa en verde, sugerir el commit semántico:
   ```text
   feat(shade): implement v1.0 — per-site dark mode, Google Workspace canvas support, tactile hardware UI, and 6-locale flag switcher
   ```
   **Nunca ejecutar `git commit` ni `git push`.**