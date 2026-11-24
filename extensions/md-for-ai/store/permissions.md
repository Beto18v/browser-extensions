# Justificación de Permisos — MD for AI

Conforme a las políticas de Privacidad y Mínimo Privilegio de la Chrome Web Store, a continuación se detalla la justificación técnica de cada uno de los permisos requeridos por la extensión:

| Permiso | Justificación en una sola frase |
| :--- | :--- |
| `activeTab` | Acceder temporalmente al documento de la pestaña activa únicamente tras la invocación del usuario para extraer el texto de la página actual. |
| `scripting` | Inyectar en tiempo de ejecución el script autónomo de extracción dentro de la página activa sin requerir permisos de host amplios ni permanentes. |
| `storage` | Guardar de forma 100% local en el navegador las preferencias del usuario (modo de extracción, interruptores de formato, límite de tokens e idioma). |
| `clipboardWrite` | Copiar el contenido Markdown resultante al portapapeles del sistema cuando el usuario hace clic en el botón de copia o tiene activada la copia automática. |

---

### Permisos Prohibidos y Rechazados Explícitamente:
- **Sin `tabs`:** La extensión no monitorea el historial de navegación ni inspecciona pestañas en segundo plano.
- **Sin `host_permissions`:** Cero acceso a dominios web indiscriminados; la interacción ocurre exclusivamente bajo la autoridad acotada de `activeTab`.
- **Cero permisos de red:** La extensión no realiza ninguna llamada `fetch`, `XMLHttpRequest` ni telemetría remota.
