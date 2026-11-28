# Amplifier Tab — Implementation Specification v1.0

> **Para el agente ejecutor:** Lee este archivo completo y el `AGENTS.md` de la raíz del monorepo antes de escribir una sola línea de código.
> Este documento es la única fuente de verdad del diseño. Sigue cada sección en orden.

---

## 1. Contexto del Repositorio

- **Monorepo:** `browser-extensions-suite`
- **Workspace:** `extensions/amplifier-tab/`
- **Framework:** WXT 0.21.5 + TypeScript 5.9 + Vite (Manifest V3 — Chrome, Edge, Brave)
- **UI:** TypeScript + DOM nativo. **Prohibido** instalar React, Vue, Svelte o frameworks CSS pesados.
- **Restricciones globales del monorepo (`AGENTS.md` raíz):**
  - Prohibido `git commit` o `git push` sin autorización explícita del usuario.
  - Cero llamadas de red. 100% local (`chrome.storage.local`).
  - Sin emojis en ninguna interfaz ni texto visible.
  - Render en frame 0 (sin layout shift).
  - `"author": "Nicolas Valenzuela (Beto18v)"` en `package.json`.
  - No modificar ni eliminar `patches/undici@8.13.1.patch` en `pnpm-workspace.yaml`.
  - No modificar `extensions/prompt-drawer/` ni romper `packages/shared/`.

---

## 2. Qué Hace Esta Extensión

**Amplifier Tab** (*Amplificador de Pestaña* / *タブアンプ*) es un amplificador y ecualizador de audio por pestaña que permite subir el volumen hasta **600%** sin distorsión agresiva, elegir presets de tono con un clic, recordar automáticamente el ajuste de cada sitio web y controlar todas las pestañas que están reproduciendo audio desde un solo panel.

### Diferenciadores clave frente a boosters genéricos
1. **Memoria por dominio:** Guarda automáticamente el volumen y el preset por sitio (ej. `youtube.com` al `160%` en modo `Voice`) en `chrome.storage.local` (con opción para activar/desactivar el guardado automático por sitio).
2. **Presets de tono + limitador anti-distorsión:** Usa `DynamicsCompressorNode` (soft limiter) + `BiquadFilterNode` en Web Audio API con 4 perfiles en 1 clic: `Normal`, `Voice` (claridad vocal), `Bass` (refuerzo de graves) y `Night` (rango dinámico comprimido para ver contenido de noche).
3. **Panel de pestañas con audio:** Lista en tiempo real las pestañas audibles del navegador para saltar a ellas o silenciarlas en 1 clic.
4. **6 idiomas nativos:** `en`, `es`, `pt_BR`, `fr`, `de`, `ja`.

---

## 3. Arquitectura Manifest V3

```text
extensions/amplifier-tab/
├── AGENTS.md
├── SPEC.md
├── README.md
├── package.json
├── tsconfig.json
├── wxt.config.ts
├── assets/
│   └── icon.svg                  # SVG 128x128 minimalista (amplificador / onda sonora en #D97706)
├── public/
│   └── _locales/
│       ├── en/messages.json
│       ├── es/messages.json
│       ├── pt_BR/messages.json
│       ├── fr/messages.json
│       ├── de/messages.json
│       └── ja/messages.json
├── entrypoints/
│   ├── background.ts             # Service Worker: coordina tabCapture, offscreen, estado y badge
│   ├── offscreen/
│   │   ├── index.html            # Documento offscreen mínimo para AudioContext
│   │   └── main.ts               # Motor Web Audio API por tabId (Gain + EQ + Limiter)
│   └── popup/
│       ├── index.html            # UI del popup (ancho fijo 360px)
│       ├── main.ts               # Lógica DOM, atajos, sincronización con background y storage
│       └── style.css             # Sistema visual "Studio Brass" (Light + Dark)
├── src/
│   └── lib/
│       ├── types.ts              # Tipos compartidos (TabAudioState, DomainProfile, Messages)
│       ├── domain.ts             # Extracción y normalización segura de dominios
│       ├── presets.ts            # Definición de presets EQ, clamp de volumen y zonas del vúmetro
│       ├── storage.ts            # Persistencia en chrome.storage.local (dominios y ajustes)
│       └── i18n.ts               # Diccionario completo de 6 idiomas + detector de locale
└── tests/
    ├── domain.test.ts
    ├── presets.test.ts
    ├── storage.test.ts
    └── i18n.test.ts
```

---

## 4. Flujo Técnico de Audio (Chrome MV3 Safe)

En Manifest V3, `chrome.tabCapture.getMediaStreamId({ targetTabId })` requiere un gesto activo del usuario (abrir el popup en esa pestaña otorga permiso `activeTab` / gesto).

1. **Al abrir el popup en una pestaña válida (`http:` / `https:`):**
   - El popup consulta en paralelo: pestaña activa, lista de pestañas con `audible: true`, estado en vivo desde `background.ts`, y el perfil guardado para ese dominio en `chrome.storage.local`.
   - Renderiza en frame 0 con los valores actuales (o el perfil guardado del dominio si aún no estaba capturada).
   - Si el dominio tiene un perfil guardado distinto de `100% / normal` y la pestaña aún no está capturada, el popup solicita automáticamente al background iniciar la captura con ese perfil aprovechando el gesto de apertura del popup.
2. **Al mover el slider, cambiar preset o silenciar:**
   - El popup envía un mensaje tipado (`SET_TAB_AUDIO`) a `background.ts`.
   - `background.ts` asegura que el documento `offscreen` exista (`chrome.offscreen.createDocument` con `reasons: ['USER_MEDIA']`).
   - Si el `tabId` aún no tiene stream activo, `background.ts` llama a `chrome.tabCapture.getMediaStreamId({ targetTabId })` y envía el `streamId` al `offscreen`.
   - El `offscreen` abre el `MediaStream` con `navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } }, video: false })` y construye el grafo:
     `MediaStreamAudioSourceNode` → `lowShelfFilter` → `midPeakFilter` → `highShelfFilter` → `GainNode` → `DynamicsCompressorNode` → `AudioContext.destination`.
   - `background.ts` actualiza el badge de esa pestaña (`160%`, o vacío si está en `100%` y `normal`, o `MUTE` si está en `0%`).
   - Si el usuario tiene activado **"Recordar este sitio"** (activado por defecto), guarda el perfil en `chrome.storage.local` con debounce ligero (150ms) sin bloquear la UI.
3. **Al cerrar la pestaña (`chrome.tabs.onRemoved`) o pulsar Reset (`100%` + `normal`):**
   - El `offscreen` cierra el `AudioContext`, detiene los tracks del `MediaStream` y libera memoria.
   - Si no quedan pestañas activas en el `offscreen`, se limpia el estado y el badge.
4. **Páginas restringidas (`chrome://`, `edge://`, Chrome Web Store):**
   - `isCapturableUrl(url)` retorna `false`. El popup deshabilita limpiamente el slider principal con un mensaje claro ("Esta página del navegador no permite capturar audio"), manteniendo visible la lista de otras pestañas que estén sonando.

---

## 5. Modelo de Datos y Constantes

### Claves de Storage (`src/lib/storage.ts`)
```ts
export const STORAGE_DOMAINS_KEY = 'at_domains_v1';
export const STORAGE_SETTINGS_KEY = 'at_settings_v1';
```

### Tipos (`src/lib/types.ts`)
```ts
export type Locale = 'en' | 'es' | 'pt_BR' | 'fr' | 'de' | 'ja';
export type Theme = 'light' | 'dark';
export type TonePresetId = 'normal' | 'voice' | 'bass' | 'night';
export type MeterZone = 'muted' | 'safe' | 'boost' | 'overdrive';

export interface DomainProfile {
  volume: number;         // 0 a 600 (entero)
  preset: TonePresetId;
  limiter: boolean;       // true por defecto (anti-distorsión)
  updatedAt: number;
}

export interface Settings {
  locale: Locale;
  theme: Theme;
  rememberByDomain: boolean; // true por defecto
}

export interface TabAudioState {
  tabId: number;
  volume: number;
  preset: TonePresetId;
  limiter: boolean;
  muted: boolean;
  previousVolume: number; // para restaurar al quitar mute
  active: boolean;        // si el AudioContext está conectado
}
```

### Presets de Tono (`src/lib/presets.ts`)
- `normal`: LowShelf `0 dB` (120Hz), Peaking `0 dB` (1800Hz), HighShelf `0 dB` (8000Hz).
- `voice`: LowShelf `-5 dB` (140Hz), Peaking `+6 dB` (2200Hz, Q: 1.1), HighShelf `+2 dB` (7500Hz). Ideal para clases, podcasts y reuniones.
- `bass`: LowShelf `+7 dB` (100Hz), Peaking `-1 dB` (1000Hz, Q: 0.8), HighShelf `+1 dB` (8000Hz).
- `night`: LowShelf `-3 dB` (120Hz), Peaking `+2 dB` (1800Hz, Q: 1.0), HighShelf `-2 dB` (7000Hz) + compresión más agresiva (`threshold: -24`, `ratio: 8`).
- **Compresor anti-distorsión (cuando `limiter: true`):** `threshold: -6 dB`, `knee: 12`, `ratio: 12`, `attack: 0.003`, `release: 0.15`.
- **Zonas del indicador (`getMeterZone(volume)`):**
  - `0` → `'muted'`
  - `1–100` → `'safe'`
  - `101–300` → `'boost'`
  - `301–600` → `'overdrive'`

---

## 6. Diseño Visual: Paleta "Studio Brass"

Inspirada en amplificadores analógicos y consolas de estudio. **Cero clichés neón. Cero emojis.**

### Variables CSS (`entrypoints/popup/style.css`)
- **Ancho fijo del popup:** `360px`
- **Modo Claro (`:root`):**
  - `--bg: #F6F5F1`
  - `--surface: #FFFFFF`
  - `--surface-subtle: #ECEAE3`
  - `--border: #DCD9CE`
  - `--text: #1C1B18`
  - `--text-muted: #66635A`
  - `--accent: #D97706`
  - `--accent-hover: #B45309`
  - `--accent-soft: rgba(217, 119, 6, 0.12)`
  - `--meter-safe: #15803D`
  - `--meter-boost: #D97706`
  - `--meter-overdrive: #DC2626`
- **Modo Oscuro (`[data-theme="dark"]`):**
  - `--bg: #161614`
  - `--surface: #22211E`
  - `--surface-subtle: #2C2A26`
  - `--border: #36342E`
  - `--text: #F2F0EA`
  - `--text-muted: #A39F94`
  - `--accent: #F59E0B`
  - `--accent-hover: #D97706`
  - `--accent-soft: rgba(245, 158, 11, 0.16)`
  - `--meter-safe: #22C55E`
  - `--meter-boost: #F59E0B`
  - `--meter-overdrive: #EF4444`

### Estructura HTML del Popup (IDs obligatorios)
1. **Header:**
   - Logo SVG minimalista + `#text-app-title` (*Amplifier Tab* / *Amplificador de Pestaña* / *タブアンプ*)
   - Controles a la derecha: selector compacto de idioma `#select-locale` (`EN`, `ES`, `PT`, `FR`, `DE`, `JA`) y botón de tema claro/oscuro `#btn-theme-toggle` (icono SVG sol/luna).
2. **Tarjeta principal de amplificación (`#main-deck`):**
   - Fila superior: dominio actual `#current-domain` (ej. `youtube.com`) + badge de zona `#meter-badge` + botón `#btn-mute` (icono SVG) + botón `#btn-reset` (`100%`).
   - Display gigante del volumen `#volume-display` (`100%`) con `font-variant-numeric: tabular-nums` y color reactivo a la zona (`safe` / `boost` / `overdrive`).
   - Barra vúmetro segmentada (visual limpia de 12 bloques CSS que se iluminan según el porcentaje `0–600%`).
   - Slider principal `<input id="volume-slider" type="range" min="0" max="600" step="5" autofocus />` con etiquetas `0%`, `100%`, `300%`, `600%`.
   - Botones de salto rápido: `0%`, `100%`, `200%`, `400%`.
3. **Presets de Tono y Protecciones:**
   - Grid 2×2 de botones táctiles (`[data-preset="normal|voice|bass|night"]`) con estado `aria-pressed`.
   - Dos switches limpios en fila:
     - `#toggle-limiter`: Protección anti-distorsión (activada por defecto).
     - `#toggle-remember`: Recordar ajuste para este sitio (activada por defecto).
4. **Aviso de página restringida (`#restricted-banner`, oculto por defecto):**
   - Mensaje claro cuando la pestaña activa es `chrome://` o no capturable.
5. **Sección "Pestañas sonando" (`#audible-section`):**
   - Título `#text-audible-title` + lista `#audible-list`.
   - Cada ítem muestra favicon (con fallback SVG), título truncado, botón para ir a la pestaña (`.btn-focus-tab`) y botón para silenciar/activar (`.btn-mute-tab`).
   - Si no hay pestañas sonando, muestra estado vacío limpio (`#audible-empty`).
6. **Footer:**
   - Botón `#btn-shortcut-settings` con texto del atajo (`Alt+Shift+A` / abre `chrome://extensions/shortcuts`).
   - Marca personal: `Nicolas Valenzuela (Beto18v)` con enlaces a `https://nival.is-a.dev` y `https://github.com/Beto18v`.

---

## 7. Internacionalización (6 Idiomas)

### `public/_locales/*/messages.json`
Crear los 6 archivos con claves `atExtName`, `atExtShortName`, `atExtDescription`, `atCommandOpen`:
- **`en`:** `Amplifier Tab` — *"Boost tab volume up to 600% with anti-distortion limiter, tone presets, and per-site memory."*
- **`es`:** `Amplificador de Pestaña` — *"Aumenta el volumen de cada pestaña hasta 600% con limitador anti-distorsión, presets de tono y memoria por sitio."*
- **`pt_BR`:** `Amplificador de Aba` — *"Aumente o volume de cada aba até 600% com limitador antidistorção, perfis de som e memória por site."*
- **`fr`:** `Amplificateur d'Onglet` — *"Augmentez le volume de chaque onglet jusqu'à 600 % avec limiteur anti-distorsion, profils audio et mémoire par site."*
- **`de`:** `Tab-Verstärker` — *"Erhöhe die Tab-Lautstärke auf bis zu 600 % mit Verzerrungsschutz, Klangprofilen und Seiten-Speicher."*
- **`ja`:** `タブアンプ` — *"歪み防止リミッター、音質プリセット、サイト別メモリ機能付きでタブの音量を最大600%まで増幅。"*

### `src/lib/i18n.ts`
Implementar `detectBrowserLocale()`, `t(locale, key, params?)` y `SUPPORTED_LOCALES` con cobertura 100% simétrica en los 6 idiomas (`en`, `es`, `pt_BR`, `fr`, `de`, `ja`) para todos los textos de la UI.

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
    name: '__MSG_atExtName__',
    short_name: '__MSG_atExtShortName__',
    description: '__MSG_atExtDescription__',
    version: '1.0.0',
    permissions: ['tabCapture', 'offscreen', 'storage', 'tabs'],
    action: {
      default_title: '__MSG_atExtName__',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+A',
          mac: 'Alt+Shift+A',
        },
        description: '__MSG_atCommandOpen__',
      },
    },
  },
});
```

---

## 9. Pruebas Unitarias (Vitest + jsdom)

Crear al menos 4 suites de prueba completas en `tests/`:
1. `tests/domain.test.ts`: extracción de hostname, eliminación de `www.`, rechazo de `chrome://`, `edge://`, `about:`, URLs vacías o malformadas.
2. `tests/presets.test.ts`: `clampVolume` (límites 0–600 y redondeo), `getMeterZone` (`muted`, `safe`, `boost`, `overdrive`), `volumeToGain`, y validez de los 4 presets (`normal`, `voice`, `bass`, `night`).
3. `tests/storage.test.ts`: mock de `chrome.storage.local` para guardar/leer/eliminar perfiles por dominio y leer/guardar configuración global.
4. `tests/i18n.test.ts`: verificar que los 6 idiomas (`en`, `es`, `pt_BR`, `fr`, `de`, `ja`) tengan exactamente las mismas claves, ningún string vacío y que `detectBrowserLocale` mapee correctamente variantes (`es-CO` → `es`, `pt-PT`/`pt-BR` → `pt_BR`, `ja-JP` → `ja`, desconocido → `en`).

---

## 10. Integración en el Monorepo y Cierre

1. Actualizar el `package.json` de la raíz añadiendo los scripts:
   - `"build:amplifier-tab": "pnpm --filter amplifier-tab run build"`
   - `"zip:amplifier-tab": "pnpm --filter amplifier-tab run zip"`
   - `"dev:amplifier-tab": "pnpm --filter amplifier-tab run dev"`
   - `"test:amplifier-tab": "pnpm --filter amplifier-tab run test"`
2. Actualizar la tabla de extensiones en el `README.md` raíz agregando **Amplifier Tab** (`extensions/amplifier-tab/`, `Alt+Shift+A`, `v1.0`).
3. Crear `extensions/amplifier-tab/README.md` siguiendo la misma calidad documental que `extensions/prompt-drawer/README.md`.
4. Ejecutar **en este orden exacto**:
   ```bash
   pnpm install
   pnpm --filter amplifier-tab test
   pnpm --filter amplifier-tab run compile
   pnpm --filter amplifier-tab run build
   pnpm --filter amplifier-tab run zip
   ```
5. Si todo pasa en verde, sugerir el commit semántico:
   ```text
   feat(amplifier-tab): implement v1.0 — 600% tab boost, tone presets, domain memory, and 6-locale i18n
   ```
   **Nunca ejecutar `git commit` ni `git push`.**