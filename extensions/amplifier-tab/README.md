# Amplifier Tab

Amplificador y ecualizador de audio por pestaña que permite elevar el volumen hasta **600%** con limitador dinámico anti-distorsión, presets de tono analógicos en 1 clic y memoria persistente por sitio web.

## Por qué esta extensión

- Muchos videos, grabaciones, clases en vivo, podcasts o reuniones virtuales tienen niveles de audio sumamente bajos e inaudibles incluso con el volumen del sistema al 100%.
- La mayoría de boosters de pestañas genéricos generan saturación digital agresiva y chasquidos (clipping) al superar el volumen estándar.
- Otras extensiones requieren ajustar el volumen manualmente cada vez que se abre una pestaña en el mismo sitio.
- Amplifier Tab soluciona esto con una arquitectura segura en Manifest V3 mediante `tabCapture`, Web Audio API con `DynamicsCompressorNode`, 4 presets de ecualización y almacenamiento 100% local por dominio.

## Funciones principales

- **Amplificación de 0% a 600%:** Control preciso mediante slider, pasos de teclado o saltos rápidos (0%, 100%, 200%, 400%).
- **Limitador suave anti-distorsión:** `DynamicsCompressorNode` calibrado para prevenir la saturación agresiva por encima del 100%.
- **4 Presets de tono de estudio:**
  - **Normal:** Respuesta plana y balanceada.
  - **Voz:** Realce en frecuencias de inteligibilidad vocal (2.2 kHz) para clases y videollamadas.
  - **Graves:** Refuerzo profundo en bajas frecuencias (100 Hz).
  - **Noche:** Rango dinámico comprimido para ver contenido de noche sin sobresaltos.
- **Memoria automática por sitio web:** Guarda automáticamente en `chrome.storage.local` el volumen y preset elegido para dominios frecuentes (ej. `youtube.com`).
- **Panel de pestañas audibles:** Visualiza en tiempo real las otras pestañas del navegador que están reproduciendo sonido para silenciarlas o cambiar a ellas en 1 clic.
- **Paleta Acoustic Slate (Light & Dark):** Diseño inspirado en monitores de estudio analógicos con fondo pizarra frío, acentos terracota mate (`#E05A47`), vúmetro segmentado y tipografía con números tabulares para evitar saltos.
- **Internacionalización en 6 idiomas con banderas:** Selector con banderas SVG vectoriales para inglés, español, portugués brasileño, francés, alemán y japonés.

## Atajos de teclado

- **Atajo personalizable:** Haz clic en **Agregar atajo** en el pie del popup para configurarlo en `chrome://extensions/shortcuts` (por defecto `Alt+Shift+A`).
- **Dentro del popup:**
  - `←` / `→` o `↓` / `↑`: Ajuste fino de volumen (±5%).
  - `Shift + ←` / `Shift + →`: Ajuste rápido (±25%).
  - `M`: Silenciar / reactivar sonido.
  - `R`: Restablecer a 100% y preset normal.
  - `1`, `2`, `3`, `4`: Cambiar a los presets Normal, Voz, Graves o Noche.

## Tech Stack

| Categoría | Tecnología | Versión | Rol |
|---|---|---|---|
| Framework de extensión | WXT | 0.21.5 | Build, manifest MV3, HMR en dev |
| Lenguaje | TypeScript | 5.9.3 | Tipado estático en todo el proyecto |
| Bundler | Vite | 8.3.8 | Compilación y tree-shaking |
| Plataforma | Chrome Extension Manifest V3 | - | TabCapture, Offscreen Document |
| Motor de audio | Web Audio API | - | GainNode, BiquadFilterNode, DynamicsCompressorNode |
| Almacenamiento | chrome.storage.local | - | Persistencia 100% local, sin backend |
| Testing | Vitest + jsdom | 5.1.1 / 31.0.1 | 4 suites de pruebas unitarias |
| Iconos | @wxt-dev/auto-icons | 2.0.0 | Generación de iconos desde SVG fuente |
| UI | TypeScript + DOM nativo | - | Sin frameworks para cero peso en runtime |

## Instalación en modo desarrollador

1. Instala las dependencias y compila desde la raíz del monorepo:
   ```bash
   pnpm install
   pnpm --filter amplifier-tab run build
   ```
2. Ve a `chrome://extensions/` en Google Chrome y activa el **Modo de desarrollador**.
3. Haz clic en **Cargar descomprimida**.
4. Selecciona el directorio `extensions/amplifier-tab/.output/chrome-mv3`.

## Comandos de desarrollo

```bash
# Ejecutar tests unitarios
pnpm --filter amplifier-tab test

# Verificación de tipos TypeScript
pnpm --filter amplifier-tab run compile

# Compilación de producción
pnpm --filter amplifier-tab run build

# Generación del archivo zip para publicación
pnpm --filter amplifier-tab run zip
```

## Privacidad

Amplifier Tab funciona de manera 100% local en tu navegador. No realiza ninguna llamada a servidores externos, no recopila datos de telemetría y solo procesa el flujo de audio de las pestañas que decides amplificar directamente en tu máquina.

## Licencia y autor

Licencia MIT.

Created by **[Nicolas Valenzuela](https://nival.is-a.dev)**.
