# MD for AI — Web to Markdown Converter (v1.0.0)

> Extensión de navegador local-first (Manifest V3 + WXT) para convertir artículos, páginas y selecciones web a Markdown estructurado y optimizado para prompts de Inteligencia Artificial (ChatGPT, Claude, Gemini, DeepSeek, Cursor o LLMs locales).
>
> **Autor:** Nicolas Valenzuela (Beto18v) | [Portfolio](https://nival.is-a.dev) | [GitHub](https://github.com/Beto18v)

---

## ⚡ Características Principales

- **100% Local-First ($0 costo, 0 ms):** Todo el procesamiento ocurre en tu navegador. Cero peticiones de red, cero telemetría y cero servidores externos.
- **Extractor de Artículos Inteligente:** Integra `@mozilla/readability` para aislar el contenido esencial, descartando navegación, anuncios, trackers y barras laterales.
- **3 Modos de Extracción:**
  - **Artículo:** Extrae el contenido central y metadatos relevantes en YAML frontmatter.
  - **Página Completa:** Convierte el `body` completo sanitizando scripts, estilos y elementos ruidosos.
  - **Selección:** Convierte únicamente el fragmento HTML que hayas seleccionado en la página (`window.getSelection()`).
- **Tablas GFM y Bloques de Código con Lenguaje:** Genera tablas Markdown nativas con alineación y bloques de código cercados con detección automática de sintaxis (TypeScript, Python, Rust, etc.).
- **Estimador de Tokens Local (0 ms):** Estimación inmediata sin conexión calibrada para modelos BPE, con chips de límite de contexto (8k, 32k, 128k, 200k).
- **Recorte Inteligente por Tokens:** `trimToTokens` recorta en límites de párrafos o líneas y asegura que los bloques de código cercados nunca queden abiertos, agregando `[...recortado]`.
- **Atajo de Teclado Rápido:** Invocación inmediata mediante `Alt+Shift+M` (o personalizable en `chrome://extensions/shortcuts`).
- **Copiar al Abrir Opcional:** Automatiza flujos copiando directamente al portapapeles al abrir la extensión.
- **Internacionalización y Accesibilidad:** Bilingüe nativo (Español / Inglés), navegación por teclado, soporte modo claro/oscuro y cero emojis.

---

## 🛠️ Desarrollo Local

Desde la raíz del monorepo (`browser-extensions-suite`):

```bash
# Instalar dependencias en todo el monorepo
pnpm install

# Iniciar servidor de desarrollo con recarga en caliente (HMR) para Chrome
pnpm --filter md-for-ai run dev
```

Esto abrirá una instancia de navegador con la extensión cargada automáticamente.

---

## 🧪 Pruebas y Validación

La extensión cuenta con pruebas unitarias exhaustivas con **Vitest** y **JSDOM**:

```bash
# Ejecutar todas las pruebas unitarias
pnpm --filter md-for-ai test

# Verificación de tipos TypeScript estricto
pnpm --filter md-for-ai run compile
```

---

## 📦 Compilación y Empaquetado para la Chrome Web Store

Para generar los artefactos de producción y el archivo `.zip` listo para publicar:

```bash
# Compilar build de producción
pnpm --filter md-for-ai run build

# Generar archivo comprimido .zip listo para la tienda
pnpm --filter md-for-ai run zip
```

El archivo empaquetado se generará en:
```text
extensions/md-for-ai/.output/md-for-ai-1.0.0-chrome.zip
```

---

## 🔒 Permisos y Privacidad

La extensión se adhiere al principio de mínimo privilegio bajo Manifest V3:
- **`activeTab`:** Acceso efímero a la pestaña activa únicamente cuando el usuario la invoca.
- **`scripting`:** Inyección en tiempo de ejecución del script de extracción.
- **`storage`:** Persistencia local de las preferencias del usuario.
- **`clipboardWrite`:** Copia del Markdown al portapapeles del sistema.

*No requiere `tabs` ni ningún `host_permissions`.*
