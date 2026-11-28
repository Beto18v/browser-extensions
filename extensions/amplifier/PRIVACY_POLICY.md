# Privacy Policy — Amplifier

**Last updated:** November 28, 2026  
**Developer:** Nicolas Valenzuela (Beto18v) — [nival.is-a.dev](https://nival.is-a.dev) | [github.com/Beto18v](https://github.com/Beto18v)

## English

**Amplifier** does not collect, store, transmit, sell, or share any personal data, browsing history, or user activity.

- **100% Local Execution:** All audio stream processing, per-site volume memory, tone presets, language settings, and theme preferences operate exclusively in your browser without external servers.
- **Zero Network Requests:** The extension makes no external network calls, uses no analytics, tracking, or telemetry scripts, and connects to no backend databases.
- **Permissions Used:**
  - `tabCapture`: Captures the audio stream of the active tab only when you interact with the volume controls, routing it into the browser's local Web Audio API engine.
  - `offscreen`: Creates an offscreen document required by Chrome Manifest V3 to host the Web Audio API processing graph (`GainNode`, `BiquadFilterNode`, and `DynamicsCompressorNode`).
  - `storage`: Saves per-site volume levels, active presets, limiter toggles, and user preferences locally in your browser using `chrome.storage.local`.
  - `tabs`: Queries the current tab to identify its domain for per-site audio memory and checks which background tabs are playing audio to provide quick-mute controls.

---

## Español

**Amplifier** no recopila, almacena, transmite, vende ni comparte datos personales, historial de navegación ni actividad del usuario.

- **Ejecución 100% Local:** Todo el procesamiento de audio, la memoria de volumen por dominio, los presets de tono, el idioma y el tema funcionan de forma estrictamente local en tu navegador.
- **Cero Peticiones de Red:** La extensión no realiza ninguna petición a servidores externos, no incluye analítica ni telemetría y no se conecta a ninguna base de datos remota.
- **Permisos utilizados:**
  - `tabCapture`: Captura el flujo de audio de la pestaña activa únicamente cuando interactúas con los controles para dirigirlo al motor local de Web Audio API.
  - `offscreen`: Crea un documento offscreen requerido por Manifest V3 para alojar el grafo de procesamiento de Web Audio API (`GainNode`, `BiquadFilterNode` y `DynamicsCompressorNode`).
  - `storage`: Guarda localmente en tu navegador los volúmenes por sitio web, presets seleccionados, estado del limitador y tema mediante `chrome.storage.local`.
  - `tabs`: Consulta el dominio de la pestaña activa para recordar el volumen asignado y detecta pestañas audibles para permitir silenciarlas con un clic.
