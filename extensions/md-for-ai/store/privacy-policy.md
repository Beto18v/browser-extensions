# Política de Privacidad — MD for AI
> **Última actualización:** Noviembre 2026  
> **Responsable:** Nicolas Valenzuela (Beto18v) — [Portfolio](https://nival.is-a.dev) | [GitHub](https://github.com/Beto18v)

Esta Política de Privacidad describe el tratamiento de datos de la extensión de navegador **MD for AI**.

---

### 1. Filosofía Local-First y Cero Recolección de Datos
**MD for AI** ha sido diseñada bajo una estricta arquitectura **Local-First**:
- **Cero transmisión de datos:** La extensión **no transmite ningún dato fuera de su navegador**. No existen servidores backend, bases de datos remotas ni endpoints de sincronización propios o de terceros.
- **Cero telemetría y analítica:** No se utilizan rastreadores, cookies de seguimiento ni herramientas de analítica (como Google Analytics o Mixpanel).
- **Cero venta o transferencia:** Ningún dato personal, historial de navegación ni contenido de las páginas visitadas es vendido, transferido o cedido a terceros.

---

### 2. Uso del Almacenamiento Local (`chrome.storage.local`)
La extensión utiliza exclusivamente el almacenamiento local aislado de su navegador (`chrome.storage.local`) para guardar preferencias de configuración del usuario:
- Modo de extracción predeterminado (`article`, `full`, `selection`).
- Estado de los interruptores de formato (enlaces, imágenes como texto alternativo, metadatos, copia al abrir).
- Límite de tokens seleccionado (`8192`, `32768`, `131072`, `204800`).
- Idioma de la interfaz (`es` o `en`).

Estos valores permanecen en su dispositivo y pueden eliminarse en cualquier momento desinstalando la extensión o limpiando los datos de la misma.

---

### 3. Procesamiento del Contenido de las Páginas
Cuando usted activa la extensión mediante su icono o el atajo de teclado:
- El script de extracción lee el contenido HTML de la pestaña activa en memoria local.
- Transforma dicho contenido a formato Markdown utilizando algoritmos locales en JavaScript.
- Calcula una estimación matemática aproximada de tokens mediante expresiones regulares locales en 0 ms.
- Todo el texto reside únicamente en la memoria volátil del popup mientras este permanezca abierto.

---

### 4. Contacto
Si tiene preguntas o dudas sobre esta política de privacidad, puede contactar al autor:
- **Autor:** Nicolas Valenzuela
- **Sitio Web:** [https://nival.is-a.dev](https://nival.is-a.dev)
- **Repositorio:** [https://github.com/Beto18v/browser-extensions-suite](https://github.com/Beto18v/browser-extensions-suite)
