# 🤖 AI Agent Guidelines & Architecture Standards
> **Repository:** `browser-extensions-suite`  
> **Author:** Nicolás Valenzuela ([Portfolio](https://nival.is-a.dev/) | [GitHub](https://github.com/Beto18v))

Este documento establece las reglas obligatorias de arquitectura, rendimiento, diseño, marca personal y control de versiones que cualquier agente de IA o desarrollador debe seguir al mantener o crear extensiones en este repositorio.

> 🛑 **REGLA DE ORO DE CONTROL DE VERSIONES:**  
> Queda **estrictamente prohibido** ejecutar `git commit` o `git push` de forma automática o por iniciativa propia del agente.  
> **Cualquier commit o push a Git requiere autorización explícita del usuario en el chat.**

---

## 🏛️ 1. Arquitectura y Stack Tecnológico

1. **Framework Obligatorio: WXT (`wxt.dev`)**
   - Todas las extensiones deben residir dentro del directorio `extensions/<nombre-extension>/`.
   - Compilación basada en **Vite + TypeScript 5.9** bajo **Manifest V3**.
   - No se permiten archivos sueltos de Vanilla JS ni `manifest.json` manuales en la raíz de las extensiones; la configuración del manifiesto se define estrictamente en `wxt.config.ts`.
2. **Estructura Estándar de Extensiones:**
   ```text
   extensions/<extension-name>/
   ├── entrypoints/
   │   ├── popup/           # Popup de acción rápida (index.html, main.ts, style.css)
   │   ├── sidepanel/       # Panel lateral persistente (si aplica)
   │   ├── content.ts       # Script inyectado en la página
   │   ├── background.ts    # Service worker central
   │   └── <custom-view>/   # Vistas auxiliares (ej. preview, recorder)
   ├── modules/ o utils/    # Lógica de negocio modular desacoplada y tipada
   ├── public/              # Assets estáticos (icons/, _locales/)
   ├── package.json
   ├── tsconfig.json        # Extiende ./.wxt/tsconfig.json
   └── wxt.config.ts
   ```

---

## ⚡ 2. Rendimiento y Cero Latencia (0 ms)

1. **Activación basada en Atributos del DOM:**
   - Para cambios de estado o temas (ej. modo oscuro o paneles flotantes), **nunca** destruir y re-crear elementos `<style>` en bucle.
   - Usar scoping por atributos en el elemento raíz: `html[data-<attr>="true"]` o toggling de clases CSS.
2. **Eliminación de Cuellos de Botella Asíncronos:**
   - La interacción del usuario (clic en toggle o atajo) debe enviar mensajes directos (`chrome.tabs.sendMessage`) para actualizar el DOM en el **frame 0**.
   - La persistencia a disco (`chrome.storage.local`) debe ejecutarse en segundo plano sin bloquear la interfaz.
   - En `chrome.storage.onChanged`, leer directamente `newValue` de los cambios en lugar de invocar `storage.local.get` repetidamente.
3. **Comportamiento Zero-Flashbang:**
   - En scripts con `runAt: "document_start"`, utilizar caché síncrona en memoria o `sessionStorage` para aplicar el estado antes del primer pintado de la página.

---

## 🔒 3. Filosofía Local-First ($0 Costo en la Nube)

1. **Privacidad y Costos Nulos:**
   - Ninguna extensión debe depender de servidores backend propios de pago.
   - Todo procesamiento de audio, video (WebM/MP4), shingling NLP o parsing de texto debe ocurrir **en el hardware local del cliente**.
2. **Persistencia Segura:**
   - Usar `IndexedDB` para archivos pesados (videos, audios, documentos) y `chrome.storage.local` para preferencias de usuario.
3. **Integración de IA (BYOK):**
   - Si una extensión utiliza IA generativa, aplicar el patrón **BYOK (Bring Your Own Key)** para APIs como Google Gemini Flash.
   - **Prohibido terminantemente** incluir API keys en el código fuente o en los paquetes compilados.
4. **Liberación Limpia de Hardware:**
   - Al detener capturas de pantalla, audio o webcam, siempre iterar y ejecutar `track.stop()` sobre todos los MediaStreams activos para evitar bloquear los drivers de hardware del sistema.

---

## 👤 4. Marca Personal y Atribución Unificada (MANDATORIO)

Cada extensión desarrollada **DEBE** incluir de forma visible la atribución del autor en sus interfaces de usuario utilizando el Web Component nativo centralizado en `@shared/components/nival-footer`:

```html
<!-- Web Component estándar de autor -->
<nival-footer></nival-footer>
```

- El componente utiliza Shadow DOM encapsulado y adapta automáticamente el color del enlace consumiendo la variable CSS `--accent-color` de cada extensión:
  - **DocGuard**: `--accent-color: #10b981;` (Esmeralda)
  - **Eclipse**: `--accent-color: #14b8a6;` (Turquesa)
  - **RecordFlow**: `--accent-color: #6366f1;` (Índigo)
- En `package.json` raíz y de cada extensión, mantener el campo:
  `"author": "Nicolas Valenzuela (Beto18v)"`

---

## 🌐 5. Internacionalización Bilingüe (ES / EN)

- Toda interfaz de usuario y mensaje debe contar con soporte nativo tanto en **Español (ES)** como en **Inglés (EN)**.
- Se debe integrar el Web Component compartido `@shared/components/nival-lang-switch`:
  ```html
  <nival-lang-switch></nival-lang-switch>
  ```
  Este botón conmuta dinámicamente entre ES y EN, guarda la preferencia en `chrome.storage.local` y emite el evento global `langchange` para actualizar toda la UI activa instantáneamente.

---

## 📦 6. Empaquetado y Releases Centralizadas

1. **Identificación Automática:**
   - El script raíz `scripts/pack-all.js` escanea automáticamente cada extensión en `extensions/`, lee su nombre y versión de `package.json`, y genera su archivo compilado en la carpeta raíz `releases/`:
     ```text
     releases/<nombre-extension>-v<version>.zip
     ```
2. **Comando de empaquetado:**
   - Para compilar y empaquetar toda la suite de un solo paso:
     ```bash
     npm run pack
     ```
3. **Automatización:**
   - El hook de Git `pre-commit` y el flujo de trabajo de GitHub Actions (`.github/workflows/build-and-release.yml`) garantizan que los ZIPs en `/releases` siempre reflejen la última versión estable del código.

---

## 🎨 7. Gestión Centralizada y Modular de Iconos

1. **Directorio Raíz `/icons`:**
   - Todas las imágenes maestras de los iconos residen de forma centralizada en la raíz del monorepo, agrupadas por extensión:
     ```text
     icons/
     ├── docguard/      # icon-16.png, icon-48.png, icon-128.png
     ├── dark-mode/     # icon-16.png, icon-48.png, icon-128.png
     └── recordflow/    # icon-16.png, icon-48.png, icon-128.png
     ```
2. **Sincronización Automática:**
   - Antes de empaquetar o compilar, el script `scripts/sync-icons.js` (o `npm run sync:icons`) replica los iconos automáticamente dentro del `public/` de cada extensión según su nombre.
   - El comando `npm run pack` ejecuta la sincronización de iconos como primer paso obligatorio.
3. **Generación Programática:**
   - Para crear nuevos conjuntos de iconos con diseño moderno en alta resolución (512px downsampled con Lanczos a 128, 48, 16px), utilizar `npm run generate:icons` (`scripts/generate-icons.py`).

---

## 🛑 8. Política de Git: Autorización Explícita Requerida (MANDATORIO)

1. **Prohibido Commit o Push Autónomo:**
   - Ningún agente de IA debe ejecutar `git commit`, `git push` o alterar el historial remoto de Git sin que el usuario lo solicite o autorice explícitamente en el hilo de conversación.
2. **Ciclo de Trabajo Seguro:**
   - Realizar cambios, compilar, ejecutar pruebas y mostrar el resumen del trabajo al usuario.
   - Esperar a que el usuario valide y dé luz verde antes de ejecutar comandos que modifiquen el control de versiones remoto.
