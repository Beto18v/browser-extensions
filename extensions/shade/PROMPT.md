Lee primero estos tres archivos en orden estricto antes de escribir cualquier código:

1. `AGENTS.md` en la raíz del monorepo.

2. `extensions/shade-tab/AGENTS.md`.

3. `extensions/shade-tab/SPEC.md`.

Tu objetivo es construir la versión `1.0.0` completa y lista para la Chrome Web Store de **Shade** dentro del workspace `extensions/shade-tab/`, siguiendo el mismo estándar de calidad y estructura que `extensions/amplifier-tab/`.

### Reglas críticas no negociables:

1. **Identidad:** El nombre visible de la aplicación en el header, metadatos y en los 6 archivos `_locales/*/messages.json` debe ser únicamente **Shade**.

2. **Stack del monorepo:** WXT `0.21.5`, TypeScript `5.9`, Vite, Manifest V3, Vitest + jsdom. **Cero frameworks de UI** (TypeScript + DOM nativo puro).

3. **No romper nada existente:** No modifiques `extensions/amplifier-tab/`, `packages/shared/` ni `patches/undici@8.13.1.patch` en `pnpm-workspace.yaml`.

4. **Estética "Leica Crimson — Hardware Táctil" (Light + Dark):** Respeta exactamente las variables CSS y rasgos visuales definidos en `SPEC.md`: superficies planas mate (`#111111` oscuro / `#F4F3F0` claro), acento rojo carmesí (`#E11D48`), indicadores LED carmesí (`.led-dot`) en el preset/control activo, separadores punteados, tipografía técnica en títulos/etiquetas, `font-variant-numeric: tabular-nums` en los valores, sliders con escala milimetrada (`.tick-scale`) y **cero emojis Unicode** en todo el código e interfaz.

5. **Selector de idiomas con banderas SVG:** Implementa un dropdown personalizado accesible (`#locale-switcher`, `#btn-locale-trigger`, `#locale-menu`) que muestre **banderas en SVG inline** (`src/lib/flags.ts`) para los 6 idiomas (`en`, `es`, `pt_BR`, `fr`, `de`, `ja`) junto a su código/nombre. No uses emojis Unicode de banderas.

6. **Opt-in por dominio + Motor Híbrido Google Workspace:**

   * Por defecto ningún sitio se modifica hasta que el usuario lo active o mueva un control en ese dominio.

   * `entrypoints/content.ts` debe ejecutarse en `document_start` para evitar destellos blancos, inyectando/actualizando `<style id="shade-tab-engine">` generado por `src/lib/css-engine.ts`.

   * Soporte real para `docs.google.com` (Docs, Sheets y Slides) con control independiente del lienzo (`darkenCanvas`) y preservación de colores en `img`, `video`, `picture` e `iframe`.

7. **Regla de Oro de Git:** Prohibido ejecutar `git commit` o `git push`.

### Plan de ejecución paso a paso:

1. Crea `extensions/shade-tab/package.json` (con `"author": "Nicolas Valenzuela (Beto18v)"` y mismas versiones de WXT/Vitest/auto-icons que `amplifier-tab`), `tsconfig.json`, `wxt.config.ts` y el icono minimalista `assets/icon.svg`.

2. Implementa los módulos puros en `src/lib/` (`types.ts`, `domain.ts`, `presets.ts`, `css-engine.ts`, `storage.ts`, `flags.ts`, `i18n.ts`) y los 6 archivos de `public/_locales/*/messages.json` con nombre **Shade**.

3. Implementa `entrypoints/content.ts` (`runAt: 'document_start'`), `entrypoints/background.ts` (badge sutil por pestaña) y `entrypoints/popup/` (`index.html`, `style.css` Leica Crimson Hardware Táctil, `main.ts` con render en frame 0, dropdown de banderas SVG, actualización en vivo sin lag y atajos de teclado).

4. Escribe las 5 suites de tests en `tests/` (`domain.test.ts`, `presets.test.ts`, `css-engine.test.ts`, `storage.test.ts`, `i18n.test.ts`, incluyendo verificación de las 6 banderas SVG).

5. Actualiza el `package.json` raíz (scripts `*:shade-tab`), el `README.md` raíz y redacta `extensions/shade-tab/README.md`.

6. Ejecuta desde la raíz del monorepo:

   * `pnpm install`

   * `pnpm --filter shade-tab test`

   * `pnpm --filter shade-tab run compile`

   * `pnpm --filter shade-tab run build`

   * `pnpm --filter shade-tab run zip`

7. Corrige cualquier advertencia o error hasta que todos los comandos pasen en verde y al final sugiéreme el mensaje de commit semántico sin ejecutarlo.

Empieza ahora con el paso 1.