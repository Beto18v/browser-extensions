# Prompt Vault

Biblioteca local de prompts para usuarios de asistentes de IA (ChatGPT, Claude, Gemini) que permite buscar, completar variables y copiar cualquier instrucción al portapapeles en menos de 5 segundos.

## Captura de pantalla

<!-- screenshot -->

## Por qué esta extensión

- Los prompts de uso diario suelen quedar dispersos en notas externas, documentos o archivos de texto donde buscarlos y copiarlos toma entre 1 y 2 minutos.
- Reutilizar una misma instrucción con pequeños cambios obliga a editar manualmente el texto antes de pegarlo en el asistente de IA.
- Dependencias en la nube, cuentas o sincronizaciones innecesarias añaden latencia y exponen contenido privado de trabajo.

## Funciones principales

- **Búsqueda instantánea:** Filtrado local sin dependencias externas con prioridad por coincidencia exacta en título, subcadena en título, etiquetas y contenido del cuerpo.
- **Variables dinámicas:** Detección y resolución automática de marcadores `{{variable}}` mediante un formulario rápido al momento de copiar.
- **Prompts fijados (pinned):** Fija prompts frecuentes para mantenerlos siempre al inicio de la lista, incluso al filtrar resultados.
- **Etiquetas (tags):** Organización mediante etiquetas separadas por comas visibles en cada tarjeta e indexadas en la búsqueda.
- **Categorías con color:** Categorías creadas por el propio usuario con nombre y color personalizado desde el editor; filtro superior combinable con la búsqueda de texto e indicador de color en cada tarjeta.
- **Plantillas de ejemplo integradas:** Conjunto de 5 plantillas generales (correos, resúmenes, estudio, agenda de reunión y revisión de texto) disponibles en español e inglés.
- **i18n ES/EN y tema claro/oscuro:** Interfaz bilingüe con detección automática del idioma del navegador y sincronización de plantillas no modificadas, además de cambio manual entre tema claro y oscuro con valor por defecto del navegador.

## Variables dinámicas

Al incluir texto entre llaves dobles dentro del cuerpo de un prompt, `extractVariables` detecta automáticamente cada marcador mientras escribes en el editor.

Ejemplo real:

```text
Revisa este código en {{lenguaje}} enfocándote en {{aspecto}} y sugiere mejoras concretas.
```

Al pulsar **Copiar** (o `Enter` sobre el elemento seleccionado):

1. `hasVariables` detecta que el prompt contiene `{{lenguaje}}` y `{{aspecto}}`.
2. Se abre el modal **Completar variables** con un campo de texto por cada variable y el foco automático en el primero (`lenguaje`).
3. Al confirmar con **Copiar** o `Enter`, `resolveVariables` sustituye cada marcador por los valores introducidos, copia el texto final al portapapeles, incrementa el contador de uso (`usageCount`) y muestra la confirmación **Copiado**.

## Tech Stack

| Categoría | Tecnología | Versión | Rol |
|---|---|---|---|
| Framework de extensión | WXT | 0.21.5 | Build, manifest MV3, HMR en dev |
| Lenguaje | TypeScript | 5.9.3 | Tipado estático en todo el proyecto |
| Bundler | Vite | 8.3.8 | Compilación y tree-shaking |
| Plataforma | Chrome Extension Manifest V3 | - | Runtime del navegador |
| Almacenamiento | chrome.storage.local | - | Persistencia 100% local, sin backend |
| Testing | Vitest + jsdom | 5.1.1 / 31.0.1 | 22 tests unitarios |
| Iconos | @wxt-dev/auto-icons + sharp | 2.0.0 | Generación de iconos desde SVG fuente |
| i18n | Sistema propio (@browser-extensions/shared) | - | ES/EN, locale guardado en storage |
| Portapapeles | navigator.clipboard (clipboardWrite) | - | Copia al portapapeles sin red |

Sin frameworks de UI (React/Vue/Svelte). Interfaz construida con TypeScript y DOM nativo para cero dependencias en runtime.

## Cómo instalar en modo desarrollador

1. Instala las dependencias desde la raíz del monorepo y compila la extensión:
   ```bash
   pnpm install
   pnpm --filter prompt-vault run build
   ```
2. Abre `chrome://extensions/` en Google Chrome y activa el **Modo de desarrollador** en la esquina superior derecha.
3. Haz clic en **Cargar descomprimida**.
4. Selecciona la carpeta `extensions/prompt-vault/.output/chrome-mv3`.

## Comandos disponibles

Scripts definidos en `extensions/prompt-vault/package.json`:

| Comando | Resultado |
|---|---|
| `dev` (`wxt`) | Inicia el servidor de desarrollo con recarga en caliente (HMR) para Chrome. |
| `build` (`wxt build`) | Genera el bundle de producción en `.output/chrome-mv3/`. |
| `zip` (`wxt zip`) | Compila la extensión y empaqueta el archivo distribuible `.output/prompt-vault-1.0.0-chrome.zip`. |
| `compile` (`tsc --noEmit`) | Ejecuta la verificación estática de tipos de TypeScript sin emitir archivos. |
| `test` (`vitest run`) | Ejecuta la suite completa de 22 tests unitarios en una sola pasada. |
| `test:watch` (`vitest`) | Ejecuta Vitest en modo observación continua durante el desarrollo. |
| `postinstall` (`wxt prepare`) | Genera los tipos y configuración interna de WXT en `.wxt/`. |

## Desarrollo local

Ejecuta estos comandos desde la raíz del monorepo:

```bash
pnpm --filter prompt-vault run dev
pnpm --filter prompt-vault test
pnpm --filter prompt-vault run compile
pnpm --filter prompt-vault run zip
```

## Atajo de teclado

- Atajo predeterminado: `Alt+Shift+V` (en Windows, Linux y macOS).
- Para personalizarlo, abre `chrome://extensions/shortcuts` en Chrome (o haz clic en el indicador del atajo en el pie del popup) y asigna una nueva combinación en el comando **Abrir Prompt Vault** / **Open Prompt Vault**.
- Dentro del popup: `↑` / `↓` navegan por la lista, `Enter` copia el elemento enfocado y `Esc` cierra el modal, la ayuda o el editor.

## Privacidad

Prompt Vault funciona de forma 100% local en el navegador del usuario, sin llamadas de red, sin telemetría y sin servidores propios ni de terceros. Todos los prompts, etiquetas, contadores de uso y preferencias de idioma o tema se almacenan únicamente en `chrome.storage.local` mediante los permisos mínimos `storage` y `clipboardWrite`.

## Licencia y autor

Licencia MIT.

**Nicolas Valenzuela (Beto18v)** | [nival.is-a.dev](https://nival.is-a.dev) | [github.com/Beto18v](https://github.com/Beto18v)
