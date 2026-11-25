# Prompt Vault — Implementation Specification v1.0

> **Para el agente ejecutor:** Lee este archivo completo antes de escribir una sola línea de código.
> Este documento es la única fuente de verdad del diseño. Sigue cada sección en orden.

---

## Contexto del Repositorio

- **Monorepo:** `d:/Documentos/Repositories/browser-extensions/`
- **Workspace:** `extensions/prompt-vault/` (esta extensión)
- **Framework:** WXT 0.21.5 + TypeScript 5.9 + Vite (Manifest V3, Chrome)
- **Paquete compartido:** `@browser-extensions/shared` → `packages/shared/src/`
  - Contiene el sistema de i18n: `t(key)`, `setLocale()`, `detectBrowserLocale()`, `STORAGE_LOCALE_KEY`
  - **Debes leer** `packages/shared/src/i18n.ts` antes de añadir cualquier texto visible
- **Reglas de arquitectura (AGENTS.md):** Lee `AGENTS.md` en la raíz del repo antes de empezar.
  Restricciones clave:
  - Prohibido `git commit` o `git push` sin autorización explícita del usuario en el chat.
  - Cero llamadas de red. 100% local.
  - Sin emojis en la interfaz.
  - Render en frame 0 (sin parpadeos ni layout shift).
  - `"author": "Nicolas Valenzuela (Beto18v)"` en `package.json`.
  - Al terminar: ejecuta test, typecheck, build; sugiere commit semántico pero no lo ejecutes.

---

## Qué Hace Esta Extensión

**Prompt Vault** es un gestor local de prompts para usuarios de asistentes de IA (ChatGPT, Claude, Gemini, etc.).

**El problema que resuelve:** Los usuarios repiten los mismos prompts todos los días (revisar código, resumir texto, generar commits, traducir, etc.) y los guardan en lugares incómodos (Notion, bloc de notas, .txt) donde tardan 1–2 minutos en encontrarlos y copiarlos.

**La solución:** Un popup de buscador instantáneo. El usuario presiona `Alt+Shift+P`, escribe 2 letras del nombre del prompt, hace clic y el prompt queda en el portapapeles. En menos de 5 segundos.

---

## Arquitectura: Solo Popup + Storage

**No se necesita content script ni background worker para v1.0.**

```
Popup (entrypoints/popup/)
  ├── index.html       — estructura HTML con todos los IDs necesarios
  ├── main.ts          — lógica DOM, búsqueda, CRUD, storage
  └── style.css        — estilos (misma paleta que md-for-ai)

src/lib/
  ├── storage.ts       — CRUD de prompts sobre chrome.storage.local
  ├── search.ts        — búsqueda fuzzy local sin dependencias externas
  └── variables.ts     — detección y resolución de variables {{nombre}}
```

---

## Modelo de Datos

```typescript
// En src/lib/storage.ts
export const STORAGE_PROMPTS_KEY = 'pv_prompts_v1';
export const STORAGE_SETTINGS_KEY = 'pv_settings_v1';

export interface PromptVariable {
  name: string;       // ej. "tema", "lenguaje"
  placeholder?: string; // ej. "TypeScript"
}

export interface Prompt {
  id: string;             // nanoid (8 chars) — genera sin dependencia: Math.random().toString(36).slice(2,10)
  title: string;          // nombre visible corto
  body: string;           // texto del prompt, puede tener {{variables}}
  tags: string[];         // etiquetas opcionales para filtrar
  variables: PromptVariable[]; // extraídas automáticamente del body
  createdAt: number;      // Date.now()
  updatedAt: number;
  usageCount: number;     // incrementa en cada copia
  pinned: boolean;        // aparece siempre al inicio
}

export interface Settings {
  locale: 'es' | 'en';
}
```

**Funciones a implementar en `storage.ts`:**
- `loadPrompts(): Promise<Prompt[]>` — devuelve array vacío si no existe
- `savePrompts(prompts: Prompt[]): Promise<void>`
- `createPrompt(title, body, tags): Promise<Prompt>`
- `updatePrompt(id, partial): Promise<Prompt>`
- `deletePrompt(id): Promise<void>`
- `incrementUsage(id): Promise<void>`

---

## Búsqueda: `src/lib/search.ts`

**Sin dependencias externas.** Implementar fuzzy search manual:

```typescript
export function searchPrompts(prompts: Prompt[], query: string): Prompt[] {
  // Si query vacía → retorna prompts ordenados: pinned primero, luego por usageCount desc
  // Si query tiene contenido → filtra por:
  //   1. Coincidencia exacta en title (prioridad máxima)
  //   2. Coincidencia de subcadena en title
  //   3. Coincidencia en tags
  //   4. Coincidencia en body (prioridad mínima)
  // Pinned siempre al inicio del resultado filtrado
}
```

---

## Variables: `src/lib/variables.ts`

```typescript
// Detecta {{nombre}} en el body
export function extractVariables(body: string): PromptVariable[]

// Verifica si el prompt tiene variables
export function hasVariables(body: string): boolean

// Reemplaza {{nombre}} con los valores dados
export function resolveVariables(body: string, values: Record<string, string>): string
```

---

## Interfaz de Usuario

### Dimensiones y Estilo
- **Ancho fijo:** 400px
- **Paleta de colores:** Idéntica a `extensions/md-for-ai/entrypoints/popup/style.css`
  Lee ese archivo y copia las variables CSS (`--accent`, `--text`, `--surface`, `--border`, etc.)
- **Sin emojis.** Sin frameworks JS. TypeScript + DOM puro.
- **Accesibilidad:** labels con `for`, `role`, `aria-label`, `aria-live`, foco visible, navegación por teclado.

### Estructura HTML (IDs obligatorios)

```html
<!-- Header -->
<header>
  <span id="text-app-title">Prompt Vault</span>
  <div class="header-actions">
    <button id="btn-new" aria-label="Nuevo prompt">+</button>
    <button id="btn-lang-toggle"><span id="lang-current">ES</span></button>
  </div>
</header>

<!-- Buscador principal — autofocus al abrir -->
<input
  id="search-input"
  type="search"
  autofocus
  autocomplete="off"
  spellcheck="false"
  aria-label="Buscar prompts"
  placeholder="Buscar prompts..."
/>

<!-- Lista de resultados -->
<ul id="prompt-list" role="listbox" aria-label="Prompts">
  <!-- Cada item generado dinámicamente con este molde: -->
  <!-- <li class="prompt-item" role="option" data-id="{{id}}">
         <div class="prompt-item-header">
           <span class="prompt-title">{{title}}</span>
           <div class="prompt-actions">
             <button class="btn-pin" aria-label="Fijar">|</button>
             <button class="btn-edit" aria-label="Editar">...</button>
             <button class="btn-delete" aria-label="Eliminar">x</button>
             <button class="btn-copy-prompt btn-primary" aria-label="Copiar">Copiar</button>
           </div>
         </div>
         <p class="prompt-preview">{{primeros 80 chars del body}}</p>
         <div class="prompt-tags">{{tags como chips}}</div>
       </li> -->
</ul>

<!-- Estado vacío (oculto por defecto) -->
<div id="empty-state" hidden>
  <p id="text-empty-title">No hay prompts guardados</p>
  <p id="text-empty-desc">Crea tu primer prompt con el botón +</p>
  <button id="btn-create-first" class="btn btn-primary">Crear primer prompt</button>
</div>

<!-- Estado sin resultados de búsqueda (oculto por defecto) -->
<div id="no-results" hidden>
  <p id="text-no-results">Sin resultados para "<span id="search-query-display"></span>"</p>
</div>

<!-- Panel de creación/edición (oculto por defecto) -->
<div id="editor-panel" hidden>
  <h2 id="editor-title">Nuevo prompt</h2>

  <label for="input-title">Título</label>
  <input id="input-title" type="text" maxlength="80" autocomplete="off" />

  <label for="input-body">Prompt</label>
  <textarea id="input-body" rows="6" spellcheck="false"
    placeholder="Escribe el prompt. Usa {{variable}} para valores dinámicos."></textarea>
  <span id="body-variables-hint" aria-live="polite"></span>

  <label for="input-tags">Etiquetas (separadas por comas)</label>
  <input id="input-tags" type="text" placeholder="código, revisión, typescript" />

  <div class="editor-actions">
    <button id="btn-cancel-edit" class="btn btn-secondary">Cancelar</button>
    <button id="btn-save" class="btn btn-primary">Guardar</button>
  </div>
</div>

<!-- Modal de resolución de variables (oculto por defecto) -->
<div id="variables-modal" role="dialog" aria-modal="true" hidden>
  <h3 id="text-variables-title">Completar variables</h3>
  <div id="variables-fields">
    <!-- Campos generados dinámicamente uno por variable -->
  </div>
  <div class="modal-actions">
    <button id="btn-cancel-vars" class="btn btn-secondary">Cancelar</button>
    <button id="btn-confirm-vars" class="btn btn-primary">Copiar</button>
  </div>
</div>

<!-- Notificación de copiado (aria-live) -->
<div id="copy-toast" class="toast" role="status" aria-live="polite" hidden>
  <span id="text-copy-toast">Copiado</span>
</div>

<!-- Footer -->
<footer>
  <button id="btn-shortcut-settings" class="shortcut-btn">
    <span id="text-shortcut-hint">Atajo: Alt+Shift+P</span>
  </button>
  <a href="https://nival.is-a.dev" target="_blank" rel="noopener noreferrer">
    Nicolas Valenzuela (Beto18v)
  </a>
</footer>
```

---

## Flujos de Comportamiento

### 1. Apertura del popup
1. Cargar prompts de `chrome.storage.local`.
2. Cargar locale de storage (o detectar del navegador).
3. Aplicar traducciones.
4. Si hay prompts → renderizar lista (pinned primero, luego por `usageCount` desc).
5. Si no hay prompts → mostrar `#empty-state`.
6. Foco automático en `#search-input`.

### 2. Búsqueda en tiempo real
- Listener `input` en `#search-input` → llama `searchPrompts()` → re-renderiza `#prompt-list`.
- Si resultado vacío y query no vacía → mostrar `#no-results`.
- Navegación por teclado en la lista: `↑` / `↓` cambia el item seleccionado (class `focused`), `Enter` copia el prompt seleccionado.

### 3. Copiar un prompt
**Caso A — Sin variables:**
1. Llamar `navigator.clipboard.writeText(prompt.body)`.
2. Llamar `incrementUsage(id)`.
3. Mostrar `#copy-toast` con texto "Copiado" durante 1.5 segundos.

**Caso B — Con variables (`hasVariables(body) === true`):**
1. Llamar `extractVariables(body)`.
2. Mostrar `#variables-modal` con un `<input>` por cada variable (label = nombre de la variable).
3. Al confirmar: `resolveVariables(body, values)` → copiar resultado → cerrar modal → mostrar toast.
4. Foco al primer input del modal al abrirse. `Escape` cierra el modal sin copiar.

### 4. Crear / Editar prompt
- Botón `#btn-new` → mostrar `#editor-panel` con campos vacíos.
- Botón `.btn-edit` en un item → mostrar `#editor-panel` precargado.
- Mientras el usuario escribe en `#input-body`, si detecta `{{variable}}` → actualizar `#body-variables-hint` con la lista de variables detectadas.
- Botón `#btn-save` → validar que title y body no estén vacíos → `createPrompt()` o `updatePrompt()` → cerrar panel → actualizar lista.
- `#btn-cancel-edit` → cerrar panel sin guardar.

### 5. Eliminar prompt
- Botón `.btn-delete` → confirmación en texto inline en el item (sin `window.confirm`): el botón cambia a "¿Seguro?" durante 3 segundos. Si se pulsa de nuevo → `deletePrompt(id)`.

### 6. Fijar / desfijar prompt
- Botón `.btn-pin` → `updatePrompt(id, { pinned: !prompt.pinned })` → re-renderizar lista.
- Los items pinned muestran un indicador visual (punto o borde izquierdo con `--accent`).

---

## i18n — Claves a Añadir en `packages/shared/src/i18n.ts`

**Lee el archivo actual antes de añadir para no duplicar ni romper claves existentes.**

```typescript
// Añadir a TRANSLATIONS.es y TRANSLATIONS.en simétricamente:
pv_app_name: 'Prompt Vault',
pv_search_placeholder: 'Buscar prompts...',
pv_btn_new: 'Nuevo',
pv_empty_title: 'Sin prompts guardados',
pv_empty_desc: 'Crea tu primer prompt con el botón Nuevo.',
pv_btn_create_first: 'Crear primer prompt',
pv_no_results: 'Sin resultados para "{query}"',
pv_editor_new_title: 'Nuevo prompt',
pv_editor_edit_title: 'Editar prompt',
pv_label_title: 'Título',
pv_label_body: 'Prompt',
pv_label_tags: 'Etiquetas (separadas por comas)',
pv_placeholder_body: 'Escribe el prompt. Usa {{variable}} para valores dinámicos.',
pv_placeholder_tags: 'código, revisión, typescript',
pv_variables_hint: 'Variables detectadas: {vars}',
pv_btn_save: 'Guardar',
pv_btn_cancel: 'Cancelar',
pv_btn_copy: 'Copiar',
pv_btn_copied: 'Copiado',
pv_btn_delete: 'Eliminar',
pv_btn_delete_confirm: '¿Seguro?',
pv_btn_pin: 'Fijar',
pv_btn_unpin: 'Desfijar',
pv_variables_modal_title: 'Completar variables',
pv_btn_confirm_vars: 'Copiar',
pv_shortcut_hint: 'Atajo: Alt+Shift+P',
pv_shortcut_hint_mac: 'Atajo: ⌥⇧P',
```

---

## Manifest (wxt.config.ts)

Reemplazar el contenido actual de `wxt.config.ts` con:

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    default_locale: 'es',
    name: '__MSG_pvExtName__',
    short_name: '__MSG_pvExtShortName__',
    description: '__MSG_pvExtDescription__',
    version: '1.0.0',
    permissions: ['storage', 'clipboardWrite'],
    action: {
      default_title: 'Prompt Vault',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+P',
          mac: 'Alt+Shift+P',
        },
        description: '__MSG_pvCommandOpen__',
      },
    },
  },
});
```

Crear `public/_locales/es/messages.json` y `public/_locales/en/messages.json` con:

```json
// es/messages.json
{
  "pvExtName": { "message": "Prompt Vault" },
  "pvExtShortName": { "message": "Prompt Vault" },
  "pvExtDescription": { "message": "Tu biblioteca de prompts para IA, local y sin servidores." },
  "pvCommandOpen": { "message": "Abrir Prompt Vault" }
}

// en/messages.json
{
  "pvExtName": { "message": "Prompt Vault" },
  "pvExtShortName": { "message": "Prompt Vault" },
  "pvExtDescription": { "message": "Your local AI prompt library. No servers, no subscriptions." },
  "pvCommandOpen": { "message": "Open Prompt Vault" }
}
```

---

## Icono (assets/icon.svg)

Crear un SVG minimalista 128×128 que represente una bóveda o carpeta con un rayo. Sin texto. El color principal debe ser el mismo `--accent` del sistema de diseño (`#6366f1` aprox). Usar `@wxt-dev/auto-icons` igual que en `md-for-ai`.

Añadir en `package.json` devDependencies:
```json
"@wxt-dev/auto-icons": "^2.0.0",
"sharp": "^0.33.0"
```

Y en `wxt.config.ts`:
```typescript
modules: ['@wxt-dev/auto-icons'],
autoIcons: { baseIconPath: 'assets/icon.svg' },
```

---

## Pruebas con Vitest

Añadir `vitest`, `jsdom`, `@types/jsdom` a `devDependencies` en `package.json`.

Crear `tests/` con al menos:

1. `tests/storage.test.ts` — CRUD básico mockeando `chrome.storage.local`.
2. `tests/search.test.ts` — búsqueda vacía, por título, por tags, por body, pinned primero.
3. `tests/variables.test.ts` — extracción de variables, resolución, casos sin variables.

Script en `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

---

## Cierre de la Implementación

Al terminar todo el código, ejecutar **en este orden**:

```bash
pnpm install          # desde la raíz del monorepo
pnpm --filter prompt-vault test
pnpm --filter prompt-vault run compile
pnpm --filter prompt-vault run build
pnpm --filter prompt-vault run zip
```

Si todos los comandos pasan sin errores, sugerir el commit semántico:
```
feat(prompt-vault): implement full v1.0 — search, CRUD, variables, i18n, keyboard nav
```

**No ejecutar `git commit` ni `git push`.** Solo sugerirlo.

---

## Lo Que NO Entra en v1.0 (reservado para v1.1)

- Pegado directo en ChatGPT / Claude (requiere content script + detección del input activo).
- Importar / exportar prompts como JSON.
- Sincronización entre dispositivos.
- Categorías anidadas.
- Snippets de texto (sin IA).

Mantener el scope pequeño y funcional.
