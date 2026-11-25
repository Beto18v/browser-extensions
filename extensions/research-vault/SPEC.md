# Research Vault — Implementation Specification v1.0

> **Para el agente ejecutor:** Lee este archivo completo antes de escribir una sola línea de código.
> Este documento es la única fuente de verdad del diseño. Sigue cada sección en orden.

---

## Contexto del Repositorio

- **Monorepo:** `d:/Documentos/Repositories/browser-extensions/`
- **Workspace:** `extensions/research-vault/` (esta extensión)
- **Framework:** WXT 0.21.5 + TypeScript 5.9 + Vite (Manifest V3, Chrome)
- **Paquete compartido:** `@browser-extensions/shared` → `packages/shared/src/`
  - Contiene el sistema de i18n: `t(key)`, `setLocale()`, `detectBrowserLocale()`, `STORAGE_LOCALE_KEY`
  - **Debes leer** `packages/shared/src/i18n.ts` antes de añadir cualquier texto visible
- **Referencia de arquitectura:** Lee el SPEC de Prompt Vault en `extensions/prompt-drawer/SPEC.md` como
  referencia de estilo de código. Research Vault sigue el mismo patrón: módulos en `src/lib/`, tests en `tests/`.
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

**Research Vault** es un capturador y organizador de clips de investigación web, 100% local.

**El problema que resuelve:** Cuando investigas un tema, lees decenas de páginas y pierdes información
valiosa. Copias fragmentos en Notion, Word o notas sueltas, sin contexto de dónde vinieron. Luego no
recuerdas la fuente, no puedes exportar de forma coherente y el contexto se fragmenta.

**La solución:** Seleccionas texto en cualquier página → `Alt+Shift+R` → aparece un mini popup con
el texto pre-cargado y la URL/título de la página capturados automáticamente → asignas a un proyecto,
añades una nota breve → guardas. En 5 segundos tienes el clip indexado con su fuente.

Cuando terminas de investigar, exportas todos los clips del proyecto como Markdown estructurado,
listo para pegarlo como contexto en un chat de IA.

---

## Arquitectura: Popup + Content Script + Background + Storage

```
Popup (entrypoints/popup/)
  ├── index.html       — estructura HTML con todos los IDs necesarios
  ├── main.ts          — lógica DOM, vistas (captura / biblioteca / proyectos)
  └── style.css        — estilos (misma paleta que prompt-drawer)

entrypoints/
  ├── background.ts    — service worker: captura shortcut, pasa texto seleccionado al popup
  └── content.ts       — inyectado en cada página: escucha mensajes, devuelve selección + meta

src/lib/
  ├── storage.ts       — CRUD de Clips y Projects sobre chrome.storage.local
  ├── search.ts        — búsqueda local por texto/dominio/nota/proyecto
  ├── export.ts        — genera Markdown exportable por proyecto
  └── url-utils.ts     — extrae dominio limpio de una URL
```

---

## Modelo de Datos

```typescript
// src/lib/storage.ts

export const STORAGE_CLIPS_KEY    = 'rv_clips_v1';
export const STORAGE_PROJECTS_KEY = 'rv_projects_v1';

export interface Clip {
  id: string;           // crypto.randomUUID()
  text: string;         // texto seleccionado por el usuario
  url: string;          // URL completa de la página fuente
  domain: string;       // dominio limpio, ej: "developer.mozilla.org"
  pageTitle: string;    // document.title de la página fuente
  note: string;         // nota breve del usuario (puede ser vacía)
  projectId: string;    // ID del proyecto al que pertenece
  tags: string[];       // etiquetas opcionales (reservado v1.1)
  createdAt: number;    // Date.now()
}

export interface Project {
  id: string;           // crypto.randomUUID()
  name: string;         // nombre del proyecto
  color: string;        // color hex o CSS var, ej: "#6366f1"
  createdAt: number;
}

// Proyecto por defecto que siempre existe
export const DEFAULT_PROJECT: Project = {
  id: 'default',
  name: 'General',
  color: '#6366f1',
  createdAt: 0,
};
```

---

## Colores Disponibles para Proyectos

Ofrecer una paleta fija de 8 colores (chips seleccionables en el editor de proyecto).
No campo de texto libre — reduce fricción y mantiene consistencia visual.

```typescript
export const PROJECT_COLORS = [
  '#6366f1', // índigo (default)
  '#10b981', // esmeralda
  '#f59e0b', // ámbar
  '#ef4444', // rojo
  '#3b82f6', // azul
  '#8b5cf6', // violeta
  '#ec4899', // rosa
  '#64748b', // slate
] as const;
```

---

## Flujo de Captura — Paso a Paso

### Triggering

El usuario activa la captura de dos formas:

1. **Shortcut `Alt+Shift+R`** mientras tiene texto seleccionado en la página.
2. **Botón "Capturar selección"** dentro del popup (modo manual, sin texto pre-cargado).

### Flujo con shortcut (ruta principal)

```
Usuario selecciona texto en la página
  → presiona Alt+Shift+R
  → background.ts recibe el comando (_execute_action)
  → background.ts envía mensaje al content script: { type: 'GET_SELECTION' }
  → content.ts responde: { text, url, pageTitle }
  → background.ts abre el popup via chrome.action.openPopup()
     y guarda { pendingClip: { text, url, pageTitle } } en chrome.storage.session
  → popup/main.ts al arrancar lee chrome.storage.session
     → si hay pendingClip → abre directamente la vista "Nueva Captura"
        con los campos pre-rellenados
     → si no hay pendingClip → abre la vista "Biblioteca"
```

> **Nota de implementación:** `chrome.action.openPopup()` solo funciona en Chrome 127+.
> En versiones anteriores, el popup se abre solo cuando el usuario hace clic en el icono.
> No es un bug, es una limitación del navegador. El shortcut igual captura el texto y lo guarda
> en `chrome.storage.session` para que esté listo cuando el popup abra.

### Vista "Nueva Captura" (captura con texto pre-cargado)

```
┌──────────────────────────────────────────┐
│ Research Vault             [?] [ES] [⚙]  │
├──────────────────────────────────────────┤
│ Texto capturado                          │
│ ┌──────────────────────────────────────┐ │
│ │ [textarea: texto seleccionado,       │ │
│ │  editable, máx 1000 chars]           │ │
│ │                                      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Fuente                                   │
│ developer.mozilla.org  [ver URL completa]│
│                                          │
│ Proyecto                                 │
│ [select: lista de proyectos + "Nuevo"]   │
│                                          │
│ Nota (opcional)                          │
│ [input: nota breve del usuario]          │
│                                          │
│ [Guardar clip]  [Cancelar]               │
└──────────────────────────────────────────┘
```

- El textarea del texto capturado es editable (el usuario puede recortar o ajustar).
- Mostrar el dominio limpio, no la URL completa. Tooltip o enlace para ver la URL entera.
- Si el `select` de proyecto está vacío, mostrar solo la opción "Proyecto General".
- "Nuevo proyecto" en el select abre un modal inline mínimo (nombre + color).
- Al guardar → `createClip()` → limpiar `chrome.storage.session` → ir a vista Biblioteca.

---

## Vista "Biblioteca" (pantalla principal al abrir sin selección)

```
┌──────────────────────────────────────────┐
│ Research Vault             [+] [ES] [⚙]  │
├──────────────────────────────────────────┤
│ [Buscar clips...]              [Exportar]│
├──────────────────────────────────────────┤
│ ● Proyecto A                        (12) │
│   ─────────────────────────────────────  │
│   "Fragmento de texto capturado..."      │
│   developer.mozilla.org · hace 2h  [···] │
│                                          │
│   "Otro fragmento..."                    │
│   github.com · hace 1d         [···]     │
│                                          │
│ ● Proyecto B                        (3)  │
│   ─────────────────────────────────────  │
│   ...                                    │
└──────────────────────────────────────────┘
```

- Clips agrupados por proyecto (nombre + punto de color del proyecto).
- Cada clip muestra: primeras 100 chars del texto, dominio, tiempo relativo, menú [···].
- Menú [···] por clip: Ver completo / Editar nota / Eliminar (con confirmación inline).
- **Búsqueda en tiempo real** filtra por: texto del clip, dominio, nota. Respeta el agrupado.
- Si la búsqueda activa, mostrar "X resultados" debajo del campo.
- Si no hay clips → empty state: "Sin clips guardados. Selecciona texto en cualquier página y
  presiona Alt+Shift+R para capturar."
- Botón `[+]` en el header → abre vista Nueva Captura sin texto pre-cargado (captura manual).

### Exportar clips de un proyecto

Botón `[Exportar]` abre un dropdown con la lista de proyectos. Al seleccionar uno:

1. Llama a `exportProjectAsMarkdown(projectId)`.
2. Copia el Markdown al portapapeles.
3. Muestra confirmación inline: "Copiado — X clips".

Formato del Markdown exportado:

```markdown
# Proyecto A — Research Vault Export
_Exportado el 2025-01-15 | 12 clips_

---

## developer.mozilla.org

### [Título de la página](https://developer.mozilla.org/...)
> Fragmento de texto capturado por el usuario. Puede ser multilinea.
_Nota: nota breve del usuario si existe_
_Guardado: 2025-01-14 15:32_

---

## github.com

### [Otro título](https://github.com/...)
> Otro fragmento...
_Guardado: 2025-01-13 10:00_
```

Clips agrupados por dominio dentro del proyecto. Cada fuente aparece una sola vez como header `##`.
Los clips del mismo dominio se listan bajo ese header.

---

## Vista "Proyectos" (accesible desde ⚙ o nav)

Lista de proyectos con:
- Nombre, color (punto), cantidad de clips.
- Botones: Editar nombre/color, Eliminar proyecto (pide confirmación; los clips del proyecto
  pasan a "General" para no perderlos).
- Botón "Nuevo proyecto" al pie.

---

## Estructura de Archivos a Crear

```text
extensions/research-vault/
├── entrypoints/
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── style.css
│   ├── background.ts
│   └── content.ts
├── src/
│   └── lib/
│       ├── storage.ts        — CRUD Clips + Projects
│       ├── search.ts         — filtrado local
│       ├── export.ts         — generación Markdown
│       └── url-utils.ts      — extracción de dominio
├── tests/
│   ├── storage.test.ts
│   ├── search.test.ts
│   ├── export.test.ts
│   └── url-utils.test.ts
├── assets/
│   └── icon.svg              — SVG 128×128 minimalista
├── public/
│   ├── _locales/
│   │   ├── es/messages.json
│   │   └── en/messages.json
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── wxt.config.ts
```

---

## Implementación de `src/lib/storage.ts`

```typescript
import { DEFAULT_PROJECT, type Clip, type Project } from './types';

// Leer todos los clips
export async function getClips(): Promise<Clip[]> {
  const result = await chrome.storage.local.get(STORAGE_CLIPS_KEY);
  return (result[STORAGE_CLIPS_KEY] as Clip[]) ?? [];
}

// Crear clip
export async function createClip(data: Omit<Clip, 'id' | 'createdAt'>): Promise<Clip> {
  const clip: Clip = { ...data, id: crypto.randomUUID(), createdAt: Date.now() };
  const clips = await getClips();
  await chrome.storage.local.set({ [STORAGE_CLIPS_KEY]: [...clips, clip] });
  return clip;
}

// Actualizar nota de un clip
export async function updateClipNote(id: string, note: string): Promise<void> {
  const clips = await getClips();
  const updated = clips.map(c => c.id === id ? { ...c, note } : c);
  await chrome.storage.local.set({ [STORAGE_CLIPS_KEY]: updated });
}

// Eliminar clip
export async function deleteClip(id: string): Promise<void> {
  const clips = await getClips();
  await chrome.storage.local.set({ [STORAGE_CLIPS_KEY]: clips.filter(c => c.id !== id) });
}

// Proyectos — mismo patrón
export async function getProjects(): Promise<Project[]> {
  const result = await chrome.storage.local.get(STORAGE_PROJECTS_KEY);
  const stored = (result[STORAGE_PROJECTS_KEY] as Project[]) ?? [];
  // El proyecto General siempre existe aunque no esté en storage
  if (!stored.find(p => p.id === DEFAULT_PROJECT.id)) {
    return [DEFAULT_PROJECT, ...stored];
  }
  return stored;
}

export async function createProject(data: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
  const project: Project = { ...data, id: crypto.randomUUID(), createdAt: Date.now() };
  const projects = await getProjects();
  const toStore = projects.filter(p => p.id !== DEFAULT_PROJECT.id);
  await chrome.storage.local.set({ [STORAGE_PROJECTS_KEY]: [...toStore, project] });
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  if (id === DEFAULT_PROJECT.id) return; // no se puede eliminar General
  // Mover clips del proyecto eliminado a General
  const clips = await getClips();
  const migrated = clips.map(c => c.projectId === id ? { ...c, projectId: DEFAULT_PROJECT.id } : c);
  const projects = await getProjects();
  await chrome.storage.local.set({
    [STORAGE_CLIPS_KEY]: migrated,
    [STORAGE_PROJECTS_KEY]: projects.filter(p => p.id !== id && p.id !== DEFAULT_PROJECT.id),
  });
}
```

---

## Implementación de `src/lib/search.ts`

```typescript
import type { Clip } from './storage';

export interface SearchResult {
  clip: Clip;
  score: number; // mayor = más relevante
}

export function searchClips(clips: Clip[], query: string): Clip[] {
  if (!query.trim()) return clips;
  const q = query.toLowerCase();
  return clips
    .map(clip => {
      let score = 0;
      if (clip.text.toLowerCase().includes(q))      score += 3;
      if (clip.note.toLowerCase().includes(q))      score += 2;
      if (clip.domain.toLowerCase().includes(q))    score += 1;
      if (clip.pageTitle.toLowerCase().includes(q)) score += 1;
      return { clip, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => r.clip);
}
```

---

## Implementación de `src/lib/export.ts`

```typescript
import type { Clip, Project } from './storage';

export function exportProjectAsMarkdown(
  project: Project,
  clips: Clip[],
): string {
  const projectClips = clips.filter(c => c.projectId === project.id);
  if (projectClips.length === 0) return '';

  const date = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `# ${project.name} — Research Vault Export`,
    `_Exportado el ${date} | ${projectClips.length} clips_`,
    '',
    '---',
    '',
  ];

  // Agrupar por dominio
  const byDomain = new Map<string, Clip[]>();
  for (const clip of projectClips) {
    if (!byDomain.has(clip.domain)) byDomain.set(clip.domain, []);
    byDomain.get(clip.domain)!.push(clip);
  }

  for (const [domain, domainClips] of byDomain) {
    lines.push(`## ${domain}`, '');
    for (const clip of domainClips) {
      const savedDate = new Date(clip.createdAt).toISOString().slice(0, 16).replace('T', ' ');
      lines.push(`### [${clip.pageTitle}](${clip.url})`);
      lines.push(`> ${clip.text.replace(/\n/g, '\n> ')}`);
      if (clip.note) lines.push(`_Nota: ${clip.note}_`);
      lines.push(`_Guardado: ${savedDate}_`, '');
    }
    lines.push('---', '');
  }

  return lines.join('\n');
}
```

---

## Implementación de `src/lib/url-utils.ts`

```typescript
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);
  if (minutes < 1)  return 'ahora';
  if (minutes < 60) return `hace ${minutes}m`;
  if (hours < 24)   return `hace ${hours}h`;
  return `hace ${days}d`;
}
```

---

## `entrypoints/content.ts`

```typescript
// Debe estar marcado como "matches: ['<all_urls>']" en wxt.config.ts
export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'GET_SELECTION') {
        sendResponse({
          text: window.getSelection()?.toString()?.trim() ?? '',
          url: window.location.href,
          pageTitle: document.title,
        });
        return true;
      }
    });
  },
});
```

---

## `entrypoints/background.ts`

```typescript
export default defineBackground(() => {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command !== '_execute_action') return;

    // Intentar obtener texto seleccionado del tab activo
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' });
      if (response?.text) {
        await chrome.storage.session.set({
          pendingClip: {
            text: response.text,
            url: response.url,
            pageTitle: response.pageTitle,
          },
        });
      }
    } catch {
      // El content script puede no estar inyectado en páginas especiales (chrome://, etc.)
      // En ese caso el popup abre sin texto pre-cargado. No es un error.
    }
  });
});
```

> **Nota:** `chrome.storage.session` almacena datos volátiles que se borran al cerrar el
> navegador. Es ideal para pasar el `pendingClip` entre background y popup sin usar
> `chrome.storage.local` para datos temporales.

---

## `entrypoints/popup/main.ts` — Estructura

```typescript
// Patrón principal: leer pendingClip al arrancar, decidir vista inicial

async function init() {
  // 1. Inicializar i18n
  await setLocale(detectBrowserLocale());
  applyI18n(); // aplica t() a todos los [data-i18n]

  // 2. Leer estado pendiente
  const session = await chrome.storage.session.get('pendingClip');
  const pendingClip = session['pendingClip'] as PendingClip | undefined;

  // 3. Limpiar sesión (evitar que persista entre aperturas)
  await chrome.storage.session.remove('pendingClip');

  // 4. Cargar datos
  const [clips, projects] = await Promise.all([getClips(), getProjects()]);

  // 5. Renderizar vista inicial
  if (pendingClip?.text) {
    renderCaptureView(pendingClip, clips, projects);
  } else {
    renderLibraryView(clips, projects);
  }
}

document.addEventListener('DOMContentLoaded', init);
```

Implementar las tres funciones de vista como funciones puras que reciben estado y construyen el DOM.
Usar `innerHTML` templating con interpolación de texto (igual que prompt-drawer).
Nunca usar `.innerHTML` con datos del usuario sin sanitizar con `textContent` asignación.

---

## `entrypoints/popup/index.html`

El HTML solo contiene el esqueleto mínimo. Todo el contenido lo genera `main.ts`.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Research Vault</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="app">
    <!-- Renderizado por main.ts -->
    <div id="loading" class="loading-state">Cargando...</div>
  </div>
  <script type="module" src="main.ts"></script>
</body>
</html>
```

---

## Sistema de Diseño (style.css)

Reutilizar **exactamente la misma paleta de variables CSS** que `extensions/prompt-drawer/entrypoints/popup/style.css`.
Leer ese archivo antes de escribir el CSS de Research Vault.

Variables base mínimas que deben estar presentes:
```css
:root {
  --bg: #0f0f0f;
  --surface: #1a1a1a;
  --surface-2: #242424;
  --border: #2a2a2a;
  --text: #e4e4e7;
  --text-muted: #71717a;
  --accent: #6366f1;
  --accent-hover: #4f46e5;
  --radius: 8px;
  --radius-sm: 4px;
  --font: 'Inter', system-ui, sans-serif;
}
```

Dimensiones del popup:
```css
body {
  width: 400px;
  min-height: 300px;
  max-height: 580px;
  overflow-y: auto;
}
```

---

## Manifest (wxt.config.ts)

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    default_locale: 'es',
    name: '__MSG_rvExtName__',
    short_name: '__MSG_rvExtShortName__',
    description: '__MSG_rvExtDescription__',
    version: '1.0.0',
    permissions: ['storage', 'clipboardWrite', 'activeTab', 'scripting'],
    action: {
      default_title: 'Research Vault',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+R',
          mac: 'Alt+Shift+R',
        },
        description: '__MSG_rvCommandCapture__',
      },
    },
  },
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      // WXT puede inyectar host_permissions automáticamente. Eliminarlos.
      delete (manifest as Record<string, unknown>)['host_permissions'];
    },
  },
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: { baseIconPath: 'assets/icon.svg' },
});
```

---

## i18n — Claves a Añadir en `packages/shared/src/i18n.ts`

**Lee el archivo actual antes de añadir para no duplicar ni romper claves existentes.**

```typescript
// Añadir a TRANSLATIONS.es y TRANSLATIONS.en simétricamente:

// ES
rv_app_name: 'Research Vault',
rv_capture_title: 'Nueva captura',
rv_label_captured_text: 'Texto capturado',
rv_label_source: 'Fuente',
rv_label_project: 'Proyecto',
rv_label_note: 'Nota (opcional)',
rv_placeholder_note: 'Añade contexto breve...',
rv_btn_save_clip: 'Guardar clip',
rv_btn_cancel: 'Cancelar',
rv_library_title: 'Biblioteca',
rv_search_placeholder: 'Buscar clips...',
rv_btn_export: 'Exportar',
rv_empty_title: 'Sin clips guardados',
rv_empty_desc: 'Selecciona texto en cualquier página y presiona Alt+Shift+R para capturar.',
rv_btn_capture_manual: 'Captura manual',
rv_menu_view: 'Ver completo',
rv_menu_edit_note: 'Editar nota',
rv_menu_delete: 'Eliminar',
rv_delete_confirm: '¿Eliminar?',
rv_projects_title: 'Proyectos',
rv_btn_new_project: 'Nuevo proyecto',
rv_project_clips_count: '{n} clips',
rv_export_copied: 'Copiado — {n} clips',
rv_export_empty: 'El proyecto no tiene clips',
rv_project_name_placeholder: 'Nombre del proyecto',
rv_btn_create_project: 'Crear proyecto',
rv_shortcut_hint: 'Atajo: Alt+Shift+R',
rv_shortcut_hint_mac: 'Atajo: ⌥⇧R',
rv_view_full_url: 'Ver URL completa',
rv_new_project_option: 'Nuevo proyecto...',
rv_general_project: 'General',

// EN (mismas claves, traducidas)
rv_app_name: 'Research Vault',
rv_capture_title: 'New capture',
rv_label_captured_text: 'Captured text',
rv_label_source: 'Source',
rv_label_project: 'Project',
rv_label_note: 'Note (optional)',
rv_placeholder_note: 'Add brief context...',
rv_btn_save_clip: 'Save clip',
rv_btn_cancel: 'Cancel',
rv_library_title: 'Library',
rv_search_placeholder: 'Search clips...',
rv_btn_export: 'Export',
rv_empty_title: 'No clips saved',
rv_empty_desc: 'Select text on any page and press Alt+Shift+R to capture.',
rv_btn_capture_manual: 'Manual capture',
rv_menu_view: 'View full',
rv_menu_edit_note: 'Edit note',
rv_menu_delete: 'Delete',
rv_delete_confirm: 'Delete?',
rv_projects_title: 'Projects',
rv_btn_new_project: 'New project',
rv_project_clips_count: '{n} clips',
rv_export_copied: 'Copied — {n} clips',
rv_export_empty: 'Project has no clips',
rv_project_name_placeholder: 'Project name',
rv_btn_create_project: 'Create project',
rv_shortcut_hint: 'Shortcut: Alt+Shift+R',
rv_shortcut_hint_mac: 'Shortcut: ⌥⇧R',
rv_view_full_url: 'View full URL',
rv_new_project_option: 'New project...',
rv_general_project: 'General',
```

---

## Locales del Manifest

Crear `public/_locales/es/messages.json`:
```json
{
  "rvExtName":       { "message": "Research Vault" },
  "rvExtShortName":  { "message": "Research Vault" },
  "rvExtDescription": { "message": "Captura y organiza fragmentos de investigación web. 100% local." },
  "rvCommandCapture": { "message": "Capturar texto seleccionado" }
}
```

Crear `public/_locales/en/messages.json`:
```json
{
  "rvExtName":       { "message": "Research Vault" },
  "rvExtShortName":  { "message": "Research Vault" },
  "rvExtDescription": { "message": "Capture and organize web research clips. 100% local." },
  "rvCommandCapture": { "message": "Capture selected text" }
}
```

---

## `package.json`

```json
{
  "name": "research-vault",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "author": "Nicolas Valenzuela (Beto18v)",
  "scripts": {
    "dev": "wxt",
    "build": "wxt build",
    "zip": "wxt zip",
    "compile": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "postinstall": "wxt prepare"
  },
  "dependencies": {
    "@browser-extensions/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/jsdom": "^30.0.0",
    "@wxt-dev/auto-icons": "^2.0.0",
    "jsdom": "^31.0.1",
    "sharp": "^0.33.0",
    "typescript": "^5.7.3",
    "vitest": "^5.1.1",
    "wxt": "^0.21.5"
  }
}
```

---

## `vitest.config.ts`

Copiar el mismo patrón que `extensions/prompt-drawer/vitest.config.ts`. El test environment debe ser `jsdom`.

---

## `tsconfig.json`

```json
{
  "extends": "./.wxt/tsconfig.json"
}
```

---

## Icono (`assets/icon.svg`)

SVG minimalista 128×128 que represente un clip o documento con un marcador de posición (pin).
Sin texto. Color principal `#6366f1`. Estilo limpio, sin sombras complejas.

Sugerencia de forma: rectángulo de documento (esquina doblada) con un pequeño pin/marcador
encima, sugiriendo "guardar una referencia". El mismo estilo de trazos que prompt-drawer.

---

## Tests (`tests/`)

### `tests/storage.test.ts`

Cubrir:
- `getClips()` retorna array vacío si storage vacío.
- `createClip()` persiste el clip con id y createdAt generados.
- `updateClipNote()` actualiza solo la nota del clip correcto.
- `deleteClip()` elimina solo el clip correcto.
- `getProjects()` siempre incluye el proyecto General.
- `createProject()` persiste sin sobreescribir General.
- `deleteProject()` migra clips al proyecto General antes de eliminar.
- `deleteProject('default')` no hace nada (protección).

Mockear `chrome.storage.local` con un objeto en memoria (mismo patrón que prompt-drawer tests).

### `tests/search.test.ts`

Cubrir:
- Query vacía retorna todos los clips sin filtrar.
- Búsqueda por texto del clip.
- Búsqueda por nota.
- Búsqueda por dominio.
- Búsqueda por título de página.
- Sin resultados retorna array vacío.
- Scoring: texto > nota > dominio/título.

### `tests/export.test.ts`

Cubrir:
- Proyecto sin clips retorna string vacío.
- Markdown exportado contiene nombre del proyecto.
- Clips agrupados correctamente por dominio.
- Notas opcionales aparecen solo cuando existen.
- Fecha de exportación presente.

### `tests/url-utils.test.ts`

Cubrir:
- `extractDomain('https://www.developer.mozilla.org/...')` → `'developer.mozilla.org'`
- `extractDomain('https://github.com/user/repo')` → `'github.com'`
- `extractDomain('invalid-url')` → `'invalid-url'` (no lanza)
- `formatRelativeTime` para: ahora (<1m), hace Xm, hace Xh, hace Xd.

---

## Cierre de la Implementación

Al terminar todo el código, ejecutar **en este orden** desde la raíz del monorepo:

```bash
pnpm install
pnpm --filter research-vault test
pnpm --filter research-vault run compile
pnpm --filter research-vault run build
pnpm --filter research-vault run zip
```

Si todos los comandos pasan sin errores, sugerir el commit semántico:
```
feat(research-vault): implement v1.0 — capture, library, projects, export
```

**No ejecutar `git commit` ni `git push`.** Solo sugerirlo.

---

## Lo Que NO Entra en v1.0 (reservado para v1.1+)

- Menú contextual con clic derecho para capturar sin shortcut.
- Tags por clip (el campo existe en el modelo pero la UI no los expone).
- Importar/exportar colección completa como JSON.
- Búsqueda por rango de fechas.
- Ordenar clips dentro de un proyecto (drag & drop).
- Límite configurable de clips por proyecto.
- Sincronización entre dispositivos.
- Integración con `md-for-ai` para exportar con contexto de página completa.

Mantener el scope pequeño y funcional en v1.0.
