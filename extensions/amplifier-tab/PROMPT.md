Lee primero estos tres archivos en orden estricto antes de escribir cualquier código:
1. `AGENTS.md` en la raíz del monorepo.
2. `extensions/amplifier-tab/AGENTS.md`.
3. `extensions/amplifier-tab/SPEC.md`.

Tu objetivo es construir la versión `1.0.0` completa y lista para la Chrome Web Store de **Amplifier Tab** (*Amplificador de Pestaña* / *タブアンプ*) dentro del workspace `extensions/amplifier-tab/`, siguiendo exactamente el estándar de calidad y estructura de `extensions/prompt-drawer/`.

### Reglas críticas no negociables:
1. **Stack del monorepo:** WXT `0.21.5`, TypeScript `5.9`, Vite, Manifest V3, Vitest + jsdom. **Cero frameworks de UI** (TypeScript + DOM nativo puro).
2. **No romper nada existente:** No modifiques `extensions/prompt-drawer/`, `packages/shared/` ni `patches/undici@8.13.1.patch` en `pnpm-workspace.yaml`.
3. **Paleta "Studio Brass" (Light + Dark):** Respeta exactamente las variables CSS definidas en `SPEC.md`, con vúmetro segmentado, `font-variant-numeric: tabular-nums` en el porcentaje, autofocus en `#volume-slider` y **cero emojis Unicode** en todo el código e interfaz (usa solo SVGs limpios).
4. **Arquitectura MV3 de audio real:** Implementa `entrypoints/background.ts` + `entrypoints/offscreen/` usando `chrome.tabCapture.getMediaStreamId`, `chrome.offscreen.createDocument` y Web Audio API (`GainNode` 0–600%, `BiquadFilterNode` para los 4 presets `normal`, `voice`, `bass`, `night` y `DynamicsCompressorNode` anti-distorsión), con limpieza de recursos al cerrar pestañas o resetear.
5. **6 idiomas completos:** `en` (default), `es`, `pt_BR`, `fr`, `de`, `ja` tanto en `src/lib/i18n.ts` como en `public/_locales/{en,es,pt_BR,fr,de,ja}/messages.json`.
6. **Regla de Oro de Git:** Prohibido ejecutar `git commit` o `git push`.

### Plan de ejecución paso a paso:
1. Crea `extensions/amplifier-tab/package.json` (con `"author": "Nicolas Valenzuela (Beto18v)"` y mismas versiones de WXT/Vitest/auto-icons que `prompt-drawer`), `tsconfig.json`, `wxt.config.ts` y el icono minimalista `assets/icon.svg`.
2. Implementa los módulos puros en `src/lib/` (`types.ts`, `domain.ts`, `presets.ts`, `storage.ts`, `i18n.ts`) y los 6 archivos de `public/_locales/*/messages.json`.
3. Implementa `entrypoints/offscreen/` (motor Web Audio API), `entrypoints/background.ts` (coordinación de `tabCapture`, offscreen, badge y limpieza) y `entrypoints/popup/` (`index.html`, `style.css` Studio Brass, `main.ts` con render en frame 0 y atajos de teclado).
4. Escribe las 4 suites de tests en `tests/` (`domain.test.ts`, `presets.test.ts`, `storage.test.ts`, `i18n.test.ts`).
5. Actualiza el `package.json` raíz (scripts `*:amplifier-tab`), el `README.md` raíz y redacta `extensions/amplifier-tab/README.md`.
6. Ejecuta desde la raíz del monorepo:
   - `pnpm install`
   - `pnpm --filter amplifier-tab test`
   - `pnpm --filter amplifier-tab run compile`
   - `pnpm --filter amplifier-tab run build`
   - `pnpm --filter amplifier-tab run zip`
7. Corrige cualquier advertencia o error hasta que los 4 comandos pasen en verde y al final sugiéreme el mensaje de commit semántico sin ejecutarlo.

Empieza ahora con el paso 1.