# 🤖 AI Agent Guidelines & Architecture Standards
> **Repository:** `browser-extensions-suite`  
> **Author:** Nicolás Valenzuela ([Portfolio](https://nival.is-a.dev/) | [GitHub](https://github.com/Beto18v))

Este documento establece las reglas obligatorias de arquitectura, rendimiento, diseño, marca personal y control de versiones que cualquier agente de IA o desarrollador debe seguir al mantener o crear extensiones en este repositorio.

> 🛑 **REGLA DE ORO DE CONTROL DE VERSIONES (ESTRICTA):**  
> Queda **estrictamente prohibido** ejecutar `git commit` o `git push` de forma automática o por iniciativa propia del agente.  
> **Cualquier commit o push a Git requiere autorización explícita del usuario en el chat.**

---

## 🏛️ 1. Arquitectura y Stack Tecnológico

1. **Framework Obligatorio: WXT (`wxt.dev`)**
   - Todas las extensiones residen dentro de su propio directorio dedicado: `extensions/<nombre-extension>/`.
   - Compilación basada en **Vite + TypeScript 5.9** bajo **Manifest V3**.
   - Cada extensión es **autónoma, autocontenida y especializada**. No debe depender de capas o Web Components compartidos pesados que introduzcan latencia o bloqueos de renderizado.
   - La configuración del manifiesto se define estrictamente en `wxt.config.ts`.
2. **Estructura Estándar de cada Extensión:**
   ```text
   extensions/<extension-name>/
   ├── entrypoints/
   │   ├── popup/           # Popup rápido (index.html, main.ts, style.css)
   │   ├── sidepanel/       # Panel lateral persistente (si aplica)
   │   ├── content.ts       # Script inyectado (si aplica)
   │   └── background.ts    # Service worker central
   ├── utils/ o modules/    # Lógica de negocio modular tipada
   ├── public/              # Assets e iconos locales (icon-16.png, icon-48.png, icon-128.png)
   ├── package.json         # Dependencias y scripts autónomos (build, dev, zip)
   ├── tsconfig.json        # Extiende ./.wxt/tsconfig.json
   └── wxt.config.ts
   ```

---

## ⚡ 2. Rendimiento y Cero Latencia (0 ms)

1. **Renderizado en Frame 0:**
   - La interfaz de usuario (popup, sidepanel o modal) debe pintarse de forma inmediata en el primer frame.
   - Prohibido encadenar llamadas asíncronas bloqueantes que retrasen el primer pintado o generen saltos visuales (*layout shift*).
2. **Navegación Fluida Keyboard-First:**
   - En herramientas de búsqueda o productividad, el input principal debe tener `autofocus` al abrirse.
   - Soportar navegación por flechas (`↑` / `↓`), confirmación con `Enter` y escape con `Esc`.
3. **Persistencia No Bloqueante:**
   - La persistencia a disco (`chrome.storage.local` o `IndexedDB`) debe ejecutarse en segundo plano sin bloquear la UI ni congelar animaciones.

---

## 🔒 3. Filosofía Local-First ($0 Costo en la Nube)

1. **Privacidad y Costos Nulos:**
   - Ninguna extensión debe depender de servidores backend propios de pago.
   - El almacenamiento de datos (prompts, notas, snippets, configuraciones) es 100% local en el navegador del usuario (`chrome.storage.local` / `IndexedDB`).
2. **Seguridad Total:**
   - Si una extensión utiliza APIs de IA externas opcionales, aplicar estrictamente el patrón **BYOK (Bring Your Own Key)**.
   - Nunca incluir API keys o credenciales privadas en el código fuente.

---

## 👤 4. Marca Personal y Atribución

Cada extensión debe integrar de forma limpia, elegante y nativa (sin Shadow DOM pesado ni retrasos) la autoría de Nicolás Valenzuela en su pie de interfaz o configuración:
- Nombre: **Nicolas Valenzuela (Beto18v)**
- Enlace al Portfolio: [nival.is-a.dev](https://nival.is-a.dev)
- Enlace a GitHub: [github.com/Beto18v](https://github.com/Beto18v)
- Campo en `package.json`: `"author": "Nicolas Valenzuela (Beto18v)"`

---

## 🛑 5. Política de Git: Autorización Explícita Requerida (MANDATORIO)

1. **Prohibido Commit o Push Autónomo:**
   - Ningún agente de IA debe ejecutar `git commit`, `git push` o alterar el historial remoto de Git sin autorización expresa y puntual del usuario en el chat.
2. **Ciclo de Trabajo Seguro:**
   - Desarrollar, probar, verificar localmente y presentar el resultado al usuario para su aprobación antes de cualquier acción en Git.
