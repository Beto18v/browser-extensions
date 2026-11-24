# Checklist Manual de QA - MD for AI

Este checklist define los escenarios prioritarios para validar manualmente el comportamiento de la extensión en Chrome antes de la publicación en la Chrome Web Store.

---

## 🔬 Pasos Detallados para los 4 Escenarios Clave

### 1. Wikipedia (Artículo enciclopédico extenso)
- **URL sugerida:** `https://es.wikipedia.org/wiki/Inteligencia_artificial` (o cualquier artículo con > 20.000 palabras).
- **Pasos:**
  1. Abrir la página y presionar el atajo `Alt+Shift+M` (o `⌥⇧M` en Mac).
  2. Verificar que se muestre el indicador de carga y se resuelva en menos de 2 segundos.
  3. Observar el contador de tokens: debe superar los límites iniciales (ej. > 32k o 128k tokens).
  4. Seleccionar el chip **8k** (el estado cambiará a "Excede").
  5. Hacer clic en **"Recortar para que quepa"**:
     - El contador se ajustará a menos de 8.192 tokens.
     - La vista previa terminará limpiamente con `[...recortado]`.
     - No debe quedar ningún bloque de código ni tabla rota.
  6. Hacer clic en **"Copiar"** y verificar el feedback visual "¡Copiado!".

---

### 2. README de GitHub (Página de repositorio con código)
- **URL sugerida:** Un repositorio público de GitHub (ej. `https://github.com/mozilla/readability`).
- **Pasos:**
  1. Abrir el repositorio y abrir la extensión.
  2. Verificar que en la cabecera del popup se detecte el dominio `github.com` y el título del repositorio.
  3. En modo **Artículo**, comprobar que extraiga la documentación y el README principal omitiendo las cabeceras de navegación de GitHub.
  4. Revisar la vista previa de código: los bloques de código deben tener su triple acento grave (\`\`\`) y el lenguaje reconocido (ej. `javascript` o `typescript`).
  5. Desactivar el interruptor **"Incluir enlaces"**: los enlaces markdown `[texto](url)` deben convertirse a texto plano `texto`.

---

### 3. Página de Aplicación / SPA (No es un artículo estándar)
- **URL sugerida:** Una SPA o panel interactivo (ej. `https://excalidraw.com`, `https://trello.com`, un dashboard local o una aplicación web sin texto editorial continuo).
- **Pasos:**
  1. Abrir la aplicación y activar la extensión en modo **Artículo**.
  2. Observar el comportamiento inteligente:
     - Readability detectará que la página no tiene estructura editorial de artículo.
     - La extensión ejecutará el **respaldo automático a página completa** sanitizada.
     - Aparecerá el banner informativo: *"Esta página no parece un artículo; se usó la página completa."*
  3. Comprobar que el indicador de carga se apague de inmediato y la vista previa muestre el contenido sanitizado sin scripts ni estilos rotos.
  4. En caso de fallo de conexión o timeout (si la página bloquea ejecución), verificar que aparezca el botón **"Reintentar"**.

---

### 4. Selección Parcial (Texto sombreado vs. sin selección)
- **Caso A (Con selección activa):**
  1. En cualquier página web, sombrear con el cursor del mouse un párrafo o tabla específica.
  2. Abrir el popup y cambiar el modo a **"Selección"**.
  3. Verificar que la vista previa contenga **únicamente** el fragmento sombreado.
- **Caso B (Sin selección activa):**
  1. Abrir cualquier página web y deseleccionar todo (hacer clic en un espacio vacío).
  2. Abrir el popup y seleccionar el modo **"Selección"**.
  3. Verificar que la vista previa se vacíe, los botones de acción se deshabiliten y se muestre claramente el mensaje explicativo:
     *"Selecciona texto en la página y vuelve a abrir esta ventana (Alt+Shift+M)"*.

---

## 📋 Matriz Complementaria de 8 Páginas

| ID | Tipo de Página | URL / Escenario Sugerido | Objetivo de Prueba | Criterio de Aceptación |
|---|---|---|---|---|
| **QA-01** | **Artículo de blog** | Substack, Medium o dev.to | Modo Artículo con Readability | Extrae título, autor y cuerpo principal sin barras de navegación ni comentarios. |
| **QA-02** | **Documentación técnica** | MDN Web Docs o docs oficiales de Stripe | Preservar jerarquía de títulos y enlaces | Convierte `<h1>`-`<h6>` ordenados y preserva URLs si los enlaces están activos. |
| **QA-03** | **README de GitHub** | Repositorio público en github.com | Contenido de repositorio | Extrae documentación y código cercado con lenguaje detectado. |
| **QA-04** | **Wikipedia** | Artículo enciclopédico extenso | Documento largo con referencias | Convierte párrafos extensos; recorte de tokens a 8k/32k/128k funciona limpiamente. |
| **QA-05** | **Página de Aplicación / SPA** | Dashboard, Notion web o SPA interactiva | Fallback automático | Si Readability no halla artículo, respalda a página completa y muestra aviso informativo. |
| **QA-06** | **Página con tabla compleja** | Documentación de API con tablas | Conversión GFM | Tablas formateadas con `| col | col |` y alineadas. |
| **QA-07** | **Página con código múltiple** | Blog de ingeniería con snippets variados | Preservar sintaxis | Código formateado con \`\`\` y lenguaje sin romper indentación. |
| **QA-08** | **Selección parcial** | Selección con mouse vs sin selección | Modo Selección | Extrae solo lo seleccionado; si está vacío, avisa cómo usarlo. |
