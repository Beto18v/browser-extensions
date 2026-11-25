# AI Agent Guidelines — Browser Extensions Suite

Reglas globales obligatorias para cualquier agente o desarrollador que trabaje en este monorepo.

## Regla de Oro — Git

- Queda **estrictamente prohibido** ejecutar `git commit` o `git push` sin autorización explícita del usuario en el chat.
- Ciclo obligatorio al terminar cada tarea: **test → typecheck → build**.
- Al finalizar con todas las verificaciones en verde, sugerir el comando y mensaje de commit semántico pero **no ejecutarlo**.

## Estructura del Monorepo

- Cada extensión vive en `extensions/<nombre>/`, es autónoma y tiene su propio `package.json`, `AGENTS.md`, `README.md`, tests y build.
- Paquete compartido: `packages/shared/` → `@browser-extensions/shared` (i18n, tipos).
- El workspace raíz solo orquesta con `pnpm` scripts.

## Stack Tecnológico

- **Framework y plataforma:** WXT 0.21.5 + Vite + TypeScript 5.9 + Manifest V3 (Chrome, Edge, Brave).
- **UI:** Sin frameworks de componentes (React, Vue, Svelte). TypeScript + DOM nativo.
- **Tests:** Vitest + jsdom.

## Filosofía Local-First

- Cero backend propio. Almacenamiento 100% local en `chrome.storage.local` / `IndexedDB`.
- Sin API keys ni credenciales privadas en el código fuente. Si se integra IA externa opcional, aplicar el patrón **BYOK (Bring Your Own Key)**.

## Rendimiento

- Render en frame 0. Sin layout shift. Persistencia no bloqueante.
- Autofocus en el input principal al abrir cada extensión.

## Marca Personal

- `"author": "Nicolas Valenzuela (Beto18v)"` en cada `package.json`.
- Pie de UI: nombre + enlace a [nival.is-a.dev](https://nival.is-a.dev) y [github.com/Beto18v](https://github.com/Beto18v).
- Sin emojis en ninguna interfaz.

## Nota de compatibilidad Node 22.14

- El repo incluye `patches/undici@8.13.1.patch` para Node 22.14.0.
- No eliminar esta sección del `pnpm-workspace.yaml`.

## Docs individuales por extensión

- Cada extensión tiene su propio `AGENTS.md` con reglas específicas.
- Leer ese archivo antes de trabajar en cualquier extensión.
