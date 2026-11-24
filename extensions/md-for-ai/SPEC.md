# MD for AI — Specification v2.0 (Rewrite)

> **Para el agente ejecutor:** Lee este archivo completo antes de tocar cualquier archivo.
> Esta es la fuente de verdad del rediseño. Sigue cada sección en orden estricto.

---

## Contexto del Repositorio

- **Monorepo:** `d:/Documentos/Repositories/browser-extensions/`
- **Esta extensión:** `extensions/md-for-ai/`
- **Framework:** WXT 0.21.5 + TypeScript 5.9 + Vite (Manifest V3, Chrome 114+)
- **Paquete compartido:** `@browser-extensions/shared` → `packages/shared/src/`
  - Lee `packages/shared/src/i18n.ts` antes de añadir cualquier texto visible.
  - Sistema de i18n: `t(key)`, `setLocale()`, `detectBrowserLocale()`, `STORAGE_LOCALE_KEY`
- **Lee obligatoriamente antes de empezar:**
  1. `AGENTS.md` en la raíz del repo (reglas de arquitectura y estilo)
  2. `packages/shared/src/i18n.ts` (traducciones existentes)
  3. `extensions/md-for-ai/src/lib/page-to-markdown.ts` (motor de extracción, NO reescribir)
  4. `extensions/md-for-ai/src/lib/protocol.ts` (protocolo ping+timeout, NO reescribir)
  5. `extensions/md-for-ai/src/lib/ui-state.ts` (máquina de estados, NO reescribir)

---

## Restricciones Absolutas (AGENTS.md)

- Prohibido `git commit` o `git push` sin autorización del usuario.
- Cero llamadas de red. 100% local.
- Sin emojis en la interfaz.
- Sin frameworks JS (React, Vue, Svelte). TypeScript + DOM puro.
- Render en frame 0 (sin parpadeos ni layout shift al abrir).
- `"author": "Nicolas Valenzuela (Beto18v)"` en `package.json`.
- Permisos del manifest: **SOLO** `activeTab`, `scripting`, `storage`, `clipboardWrite`, `sidePanel`.
- Al finalizar: ejecuta test, typecheck, build, zip. Sugiere commit semántico. No ejecutes git.

---

## Problema Central que Resuelve Esta Reescritura

El usuario reporta tres problemas críticos con la implementación actual (popup):

1. **Se queda cargando para siempre** — El content script no responde a tiempo o la condición de carrera entre `executeScript` y `sendMessage` mata el canal. Ya hay correcciones en `protocol.ts` pero la arquitectura de popup las limita.
2. **No es claro para qué sirve** — La UX no explica el flujo ni da contexto suficiente.
3. **Se cierra al cambiar de pestaña** — Un popup de Chrome se destruye al perder el foco. Es un problema estructural que el popup no puede resolver.

**La solución es cambiar de Popup a Side Panel.**

---

## Decisión Arquitectónica Central: Side Panel

### Por qué Side Panel en lugar de Popup

| | Popup | Side Panel |
|---|---|---|
| ¿Se cierra al cambiar de pestaña? | Sí (siempre) | No (persiste) |
| ¿Puede escuchar cambios de pestaña activa? | No | Sí (via `chrome.tabs.onActivated`) |
| ¿Puede volver a extraer al navegar? | No | Sí |
| Ancho disponible | 380–400 px | 320–480 px configurable |
| API requerida | Ninguna extra | `sidePanel` (Chrome 114+) |

El usuario explícitamente pide que **no se cierre al cambiar de pestaña**. La única solución honesta es Side Panel.

### Comportamiento del Side Panel

El side panel:
- Se abre y permanece visible mientras el usuario navega entre pestañas.
- Cuando el usuario cambia de pestaña, **vuelve a extraer automáticamente** la nueva pestaña activa.
- El usuario puede desactivar la re-extracción automática (toggle "Extraer al cambiar de pestaña").

---

## Cambios al Manifest (wxt.config.ts)

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  manifest: {
    default_locale: 'es',
    name: '__MSG_extName__',
    short_name: '__MSG_extShortName__',
    description: '__MSG_extDescription__',
    version: '2.0.0',
    permissions: ['activeTab', 'scripting', 'storage', 'clipboardWrite', 'sidePanel'],
    side_panel: {
      default_path: 'sidepanel.html',
    },
    action: {
      default_title: '__MSG_extShortName__',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+M',
          mac: 'Alt+Shift+M',
        },
        description: '__MSG_commandOpen__',
      },
    },
  },
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      delete (manifest as any).host_permissions;
    },
  },
});
```

---

## Estructura de Archivos Final

```
extensions/md-for-ai/
├── entrypoints/
│   ├── sidepanel/           ← NUEVO (reemplaza popup)
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── style.css        ← copiar y adaptar de popup/style.css
│   ├── background.ts        ← NUEVO (service worker mínimo)
│   ├── extract.content.ts   ← ya existe, mantener y adaptar
│   └── popup/               ← ELIMINAR todo el contenido interno
│       └── (vaciar o dejar index.html mínimo que redirige al side panel)
├── src/lib/
│   ├── page-to-markdown.ts  ← NO tocar
│   ├── token-estimator.ts   ← NO tocar
│   ├── trim-to-tokens.ts    ← NO tocar
│   ├── protocol.ts          ← NO tocar
│   ├── ui-state.ts          ← adaptar para side panel
│   └── options.ts           ← añadir autoExtractOnTabChange
├── public/
│   ├── _locales/es/messages.json
│   ├── _locales/en/messages.json
│   └── icons/
├── assets/icon.svg
├── tests/                   ← mantener y ampliar
└── wxt.config.ts
```

---

## Background Service Worker (`entrypoints/background.ts`)

Necesario para abrir el side panel al hacer clic en el icono de acción.

```typescript
// entrypoints/background.ts
export default defineBackground(() => {
  // Abre el side panel al hacer clic en el icono de la extensión
  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
  });

  // Permite al side panel abrirse en cualquier pestaña
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
```

---

## Side Panel (`entrypoints/sidepanel/`)

### index.html — IDs Obligatorios

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>MD for AI</title>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <div class="panel-container">

    <!-- Header compacto -->
    <header class="panel-header">
      <div class="brand">
        <span id="text-app-title">MD for AI</span>
        <span id="text-app-tagline">Conversor Web a Markdown</span>
      </div>
      <div class="header-actions">
        <button id="btn-auto-extract" class="btn-icon" aria-pressed="true"
                title="Extraer al cambiar pestaña" aria-label="Extraer al cambiar pestaña">
          <!-- icono de sincronización — SVG inline simple, sin emoji -->
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" aria-hidden="true">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
        </button>
        <button id="btn-lang-toggle" class="btn-lang" aria-label="Cambiar idioma">
          <span id="lang-current">ES</span>
        </button>
      </div>
    </header>

    <!-- Contexto de la pestaña activa -->
    <div class="page-context" id="page-context" hidden>
      <span class="page-domain" id="page-domain"></span>
      <span class="page-title" id="page-title"></span>
    </div>

    <!-- Banner explicativo (descartable, primer uso) -->
    <div class="onboarding-banner" id="onboarding-banner" hidden>
      <span id="text-app-description">Convierte esta página en Markdown limpio para tu IA</span>
      <button id="btn-dismiss-onboarding" class="btn-dismiss" aria-label="Cerrar">
        <span id="text-onboarding-dismiss">Entendido</span>
      </button>
    </div>

    <!-- Banner de fallback (artículo → página completa) -->
    <div id="fallback-banner" class="fallback-banner" role="status" hidden>
      <span id="text-fallback-notice"></span>
    </div>

    <!-- Banner de error con botón Reintentar -->
    <div id="error-banner" class="error-banner" role="alert" hidden>
      <span id="error-message"></span>
      <button id="btn-retry" class="btn-retry" hidden>
        <span id="text-btn-retry">Reintentar</span>
      </button>
    </div>

    <!-- Selector de modo -->
    <section class="section-mode">
      <fieldset class="mode-fieldset">
        <legend class="sr-only" id="text-mode-legend">Modo de extracción</legend>
        <div class="mode-selector" role="radiogroup">
          <label class="mode-option" for="mode-article">
            <input type="radio" id="mode-article" name="extract-mode" value="article" checked />
            <span id="text-mode-article">Artículo</span>
          </label>
          <label class="mode-option" for="mode-full">
            <input type="radio" id="mode-full" name="extract-mode" value="full" />
            <span id="text-mode-full">Completa</span>
          </label>
          <label class="mode-option" for="mode-selection">
            <input type="radio" id="mode-selection" name="extract-mode" value="selection" />
            <span id="text-mode-selection">Selección</span>
          </label>
        </div>
      </fieldset>
    </section>

    <!-- Toggles de opciones -->
    <section class="section-toggles">
      <label class="toggle-control" for="toggle-links">
        <input type="checkbox" id="toggle-links" checked />
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
        <span class="toggle-label" id="text-toggle-links">Incluir enlaces</span>
      </label>
      <label class="toggle-control" for="toggle-images-alt">
        <input type="checkbox" id="toggle-images-alt" />
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
        <span class="toggle-label" id="text-toggle-images-alt">Imágenes como alt</span>
      </label>
      <label class="toggle-control" for="toggle-meta">
        <input type="checkbox" id="toggle-meta" checked />
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
        <span class="toggle-label" id="text-toggle-meta">Encabezado meta</span>
      </label>
      <label class="toggle-control" for="toggle-copy-on-open">
        <input type="checkbox" id="toggle-copy-on-open" />
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
        <span class="toggle-label" id="text-toggle-copy-on-open">Copiar al abrir</span>
      </label>
    </section>

    <!-- Vista previa -->
    <section class="section-preview">
      <div class="preview-header">
        <label for="markdown-preview" class="preview-label" id="text-preview-label">Vista previa</label>
        <span id="token-counter" class="token-counter" aria-live="polite">≈ 0 tokens</span>
      </div>

      <div class="preview-wrapper">
        <div id="loading-indicator" class="loading-indicator" hidden>
          <div class="loading-spinner"></div>
          <span id="text-loading-status">Extrayendo...</span>
        </div>
        <div id="empty-state" class="empty-state" hidden>
          <p id="text-empty-title">Sin contenido legible</p>
          <p id="text-empty-desc">No se detectó contenido en esta página.</p>
        </div>
        <textarea
          id="markdown-preview"
          class="markdown-textarea"
          readonly
          spellcheck="false"
          aria-label="Vista previa Markdown"
        ></textarea>
      </div>
    </section>

    <!-- Chips de límite de tokens -->
    <section class="section-limits">
      <div class="limit-chips" role="radiogroup" aria-label="Límite de tokens">
        <button type="button" class="chip active" data-limit="8192" aria-pressed="true">
          <span class="chip-name">8k</span>
          <span class="chip-status" id="chip-status-8192"></span>
        </button>
        <button type="button" class="chip" data-limit="32768" aria-pressed="false">
          <span class="chip-name">32k</span>
          <span class="chip-status" id="chip-status-32768"></span>
        </button>
        <button type="button" class="chip" data-limit="131072" aria-pressed="false">
          <span class="chip-name">128k</span>
          <span class="chip-status" id="chip-status-131072"></span>
        </button>
        <button type="button" class="chip" data-limit="204800" aria-pressed="false">
          <span class="chip-name">200k</span>
          <span class="chip-status" id="chip-status-204800"></span>
        </button>
      </div>
    </section>

    <!-- Acciones -->
    <section class="section-actions">
      <button type="button" id="btn-extract" class="btn btn-secondary">
        <span id="text-btn-extract">Extraer de nuevo</span>
      </button>
      <button type="button" id="btn-trim" class="btn btn-secondary" disabled>
        <span id="text-btn-trim">Recortar</span>
      </button>
      <button type="button" id="btn-copy" class="btn btn-primary" disabled>
        <span id="text-btn-copy">Copiar</span>
      </button>
    </section>

    <!-- Footer -->
    <footer class="panel-footer">
      <button id="btn-shortcut-settings" class="shortcut-btn">
        <span id="text-shortcut-hint">Atajo: Alt+Shift+M</span>
      </button>
      <a href="https://nival.is-a.dev" target="_blank" rel="noopener noreferrer" class="footer-link">
        Nicolas Valenzuela (Beto18v)
      </a>
    </footer>

  </div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

---

## main.ts — Lógica del Side Panel

### Diferencias clave respecto al popup anterior

1. **El side panel no muere al cambiar de pestaña.** La inicialización ocurre UNA sola vez.
2. **Escucha `chrome.tabs.onActivated`** para detectar cambios de pestaña y volver a extraer si `autoExtract` está activado.
3. **Escucha `chrome.tabs.onUpdated`** para detectar cuando la pestaña activa carga una URL nueva.
4. No necesita `browser.tabs.query` repetido en cada extracción — mantiene `activeTabId` actualizado por los listeners.

### Lógica de inicialización

```typescript
async function init(): Promise<void> {
  // 1. Cargar locale y opciones de storage
  // 2. Aplicar i18n a la UI
  // 3. Registrar listeners de pestañas:
  //    - chrome.tabs.onActivated → si autoExtract activado → performExtraction()
  //    - chrome.tabs.onUpdated (status === 'complete') → si es pestaña activa y autoExtract → performExtraction()
  // 4. Cargar pestaña activa actual y extraer
  // 5. Inicializar onboarding si es primer uso
}
```

### Listener de cambio de pestaña

```typescript
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  activeTabId = tabId;
  activeTabUrl = tab.url || '';
  activeTabTitle = tab.title || '';
  renderPageContext(activeTabUrl, activeTabTitle);

  if (currentOptions.autoExtractOnTabChange) {
    await performExtraction();
  } else {
    // Mostrar el contexto de la nueva pestaña pero no extraer
    applyUIState('idle', getUIElements());
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.status === 'complete' && tab.url) {
    activeTabUrl = tab.url;
    activeTabTitle = tab.title || '';
    renderPageContext(activeTabUrl, activeTabTitle);

    if (currentOptions.autoExtractOnTabChange) {
      await performExtraction();
    }
  }
});
```

### Toggle de Auto-Extracción

El botón `#btn-auto-extract` alterna `currentOptions.autoExtractOnTabChange`:
- `true` (default) → extrae al cambiar de pestaña → `aria-pressed="true"`, estilo activo.
- `false` → el usuario navega libremente y pulsa "Extraer de nuevo" cuando quiera.

---

## Opciones Actualizadas (`src/lib/options.ts`)

Añadir el nuevo campo:

```typescript
export interface StoredOptions {
  mode: 'article' | 'full' | 'selection';
  includeLinks: boolean;
  imagesAsAlt: boolean;
  includeMeta: boolean;
  copyOnOpen: boolean;
  selectedLimit: number;
  autoExtractOnTabChange: boolean;  // ← NUEVO
}

export const DEFAULT_OPTIONS: StoredOptions = {
  mode: 'article',
  includeLinks: true,
  imagesAsAlt: true,
  includeMeta: true,
  copyOnOpen: false,
  selectedLimit: 8192,
  autoExtractOnTabChange: true,     // ← NUEVO, activado por defecto
};
```

---

## Claves de i18n a Añadir (`packages/shared/src/i18n.ts`)

Lee el archivo actual antes de modificarlo. Añadir simétricamente en ES y EN:

```typescript
// ES
auto_extract_toggle: 'Extraer al cambiar pestaña',
btn_extract_again: 'Extraer de nuevo',
status_loading: 'Extrayendo...', // actualizar si ya existe
notice_fallback_full: 'Esta página no parece un artículo; se usó la página completa.',
error_timeout: 'La extracción tardó demasiado (tiempo límite agotado).',
btn_retry: 'Reintentar',
app_description: 'Convierte esta página en Markdown limpio para tu IA',
onboarding_steps: '1) Elige modo · 2) Revisa el Markdown · 3) Copia y pega en tu IA',
onboarding_dismiss: 'Entendido',
page_context_label: 'Página actual',
shortcut_hint_mac: 'Atajo: ⌥⇧M',

// EN
auto_extract_toggle: 'Extract on tab change',
btn_extract_again: 'Extract again',
status_loading: 'Extracting...',
notice_fallback_full: 'This page does not appear to be an article; full page was used.',
error_timeout: 'Extraction timed out.',
btn_retry: 'Retry',
app_description: 'Convert this page to clean Markdown for your AI',
onboarding_steps: '1) Choose mode · 2) Review Markdown · 3) Copy and paste into your AI',
onboarding_dismiss: 'Got it',
page_context_label: 'Current page',
shortcut_hint_mac: 'Shortcut: ⌥⇧M',
```

---

## Qué NO Reescribir

Estos archivos ya funcionan correctamente. **No los toques:**

| Archivo | Razón |
|---|---|
| `src/lib/page-to-markdown.ts` | Motor de extracción + fallback a página completa ya implementado |
| `src/lib/token-estimator.ts` | Estimador de tokens probado |
| `src/lib/trim-to-tokens.ts` | Recorte de Markdown probado (8 tests pasando) |
| `src/lib/protocol.ts` | Protocolo ping+retries+timeout ya implementado y probado |
| `src/lib/ui-state.ts` | Máquina de estados ya implementada y probada |
| `entrypoints/extract.content.ts` | Content script con handshake mdai:ping ya correcto |
| `tests/protocol.test.ts` | 9 tests del protocolo |
| `tests/ui-state.test.ts` | 5 tests de la máquina de estados |
| `tests/page-to-markdown.test.ts` | 8 tests de extracción |
| `tests/trim-to-tokens.test.ts` | 8 tests de recorte |
| `tests/token-estimator.test.ts` | 6 tests del estimador |

---

## Qué Eliminar / Limpiar

- `entrypoints/popup/main.ts` → reemplazar con un archivo mínimo que abre el side panel:
  ```typescript
  // entrypoints/popup/main.ts — redirige al side panel
  chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  window.close();
  ```
- `entrypoints/popup/style.css` → vaciar (el popup mínimo no necesita estilos).
- `entrypoints/popup/index.html` → dejar vacío/mínimo, el popup real ahora es el side panel.

---

## Consideración de Permisos

El permiso `sidePanel` está disponible desde Chrome 114 (mayo 2023).
Brave, Edge y Arc también lo soportan desde sus versiones equivalentes.
No requiere `host_permissions`.

---

## Verifica el Manifest Generado

Después del build, leer `.output/chrome-mv3/manifest.json` y confirmar:

```json
{
  "permissions": ["activeTab", "scripting", "storage", "clipboardWrite", "sidePanel"],
  "side_panel": { "default_path": "sidepanel.html" },
  "version": "2.0.0"
}
```

Sin `host_permissions`. El hook en `wxt.config.ts` lo elimina automáticamente.

---

## Cierre de la Implementación

Ejecutar en orden desde la raíz del monorepo:

```bash
pnpm --filter md-for-ai test
pnpm --filter md-for-ai run compile
pnpm --filter md-for-ai run build
pnpm --filter md-for-ai run zip
```

Si todos pasan sin errores, sugerir commit semántico:

```
feat(md-for-ai): migrate to side panel, auto-extract on tab change, v2.0
```

**No ejecutar `git commit` ni `git push`.** Solo sugerirlo.

---

## Lo Que NO Entra en v2.0 (reservado para v2.1)

- Pegado directo en ChatGPT / Claude / Gemini (requiere content script adicional con detección de input activo).
- Historial de extracciones recientes.
- Resaltado de diferencias entre extracciones.
- Exportar a archivo `.md`.
