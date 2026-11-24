export type SupportedLocale = 'es' | 'en';

export const STORAGE_LOCALE_KEY = 'suite_language_v1';

export const TRANSLATIONS = {
  es: {
    app_name: 'MD for AI',
    app_tagline: 'Conversor Web a Markdown',
    app_description: 'Convierte esta página en Markdown limpio para pegarla en tu asistente de IA',
    onboarding_steps: '1) Elige qué extraer · 2) Revisa el resultado · 3) Copia',
    onboarding_dismiss: 'Entendido',
    page_context_label: 'Página actual',
    mode_label: 'Modo de extracción',
    mode_article: 'Artículo',
    mode_full: 'Página completa',
    mode_selection: 'Selección',
    toggle_links: 'Incluir enlaces',
    toggle_images_alt: 'Imágenes como texto alt',
    toggle_meta: 'Encabezado con título/URL/fecha',
    toggle_copy_on_open: 'Copiar al abrir',
    preview_label: 'Vista previa Markdown',
    preview_placeholder: 'El Markdown extraído aparecerá aquí...',
    status_loading: 'Extrayendo contenido de la página...',
    status_calculating: 'Calculando...',
    tokens_approx: '≈ {count} tokens',
    chip_fits: 'Cabe',
    chip_exceeds: 'Excede',
    btn_trim: 'Recortar para que quepa',
    btn_copy: 'Copiar',
    btn_copied: '¡Copiado!',
    btn_retry: 'Reintentar',
    trimmed_notice: 'Recortado a {limit} tokens',
    empty_state_title: 'Sin contenido legible',
    empty_state_desc: 'No se detectó contenido para extraer en la página o selección activa.',
    notice_fallback_full: 'Esta página no parece un artículo; se usó la página completa.',
    error_restricted: 'Página no inyectable. Las páginas del sistema (chrome://), Chrome Web Store y visores de PDF no permiten ejecutar extensiones.',
    error_no_tab: 'No se encontró una pestaña activa para extraer.',
    error_no_selection: 'Selecciona texto en la página y vuelve a abrir esta ventana (Alt+Shift+M)',
    error_extract_failed: 'No se pudo extraer el contenido de la página.',
    error_timeout: 'La extracción tardó demasiado tiempo en responder (tiempo límite agotado).',
    error_copy_failed: 'No se pudo copiar al portapapeles automáticamente.',
    shortcut_hint: 'Atajo: Alt+Shift+M',
    shortcut_hint_mac: 'Atajo: ⌥⇧M',
    author_by: 'Nicolas Valenzuela (Beto18v)',
    pv_app_name: 'Prompt Vault',
    pv_search_placeholder: 'Buscar prompts...',
    pv_btn_new: 'Nuevo',
    pv_btn_create_first: 'Crear primer prompt',
    pv_no_results: 'Sin resultados para "{query}"',
    pv_editor_new_title: 'Nuevo prompt',
    pv_editor_edit_title: 'Editar prompt',
    pv_label_title: 'Título',
    pv_label_body: 'Prompt',
    pv_label_tags: 'Etiquetas (separadas por comas)',
    pv_placeholder_body: 'Escribe tu plantilla. Usa {{variable}} para datos que cambian cada vez (ej. {{tema}}, {{tono}}).',
    pv_placeholder_tags: 'correo, resumen, estudio',
    pv_variables_hint: 'Variables detectadas: {vars}',
    pv_btn_save: 'Guardar',
    pv_btn_cancel: 'Cancelar',
    pv_btn_copy: 'Copiar',
    pv_btn_copied: 'Copiado',
    pv_btn_edit: 'Editar',
    pv_btn_delete: 'Eliminar',
    pv_btn_delete_confirm: '¿Seguro?',
    pv_btn_pin: 'Fijar',
    pv_btn_unpin: 'Desfijar',
    pv_variables_modal_title: 'Completar variables',
    pv_btn_confirm_vars: 'Copiar',
    pv_shortcut_hint: 'Atajo: Alt+Shift+V',
    pv_shortcut_hint_mac: 'Atajo: ⌥⇧V',
    pv_btn_help: 'Cómo funciona',
    pv_btn_load_examples: 'Cargar plantillas de ejemplo',
    pv_examples_loaded: 'Plantillas de ejemplo añadidas',
    pv_empty_title: 'Tu biblioteca local de prompts',
    pv_empty_desc: 'Guarda instrucciones que repites a diario (correos, resúmenes, estudio o trabajo) y cópialas en segundos.',
    pv_help_title: 'Cómo funciona Prompt Vault',
    pv_help_what: 'Guarda tus prompts frecuentes 100% en tu navegador y encuéntralos al instante sin abrir notas externas.',
    pv_help_vars_title: '¿Para qué sirven las {{variables}}?',
    pv_help_vars_desc: 'Si escribes palabras entre llaves dobles, como {{tema}} o {{tono}}, al copiar el prompt se abrirá una ventana rápida para rellenar esos datos antes de pegar.',
    pv_help_example_label: 'Ejemplo:',
    pv_help_example_code: 'Redacta un correo {{tono}} para {{persona}} sobre {{asunto}}.',
    pv_help_uses_title: 'Casos de uso:',
    pv_help_uses_desc: 'Correos y respuestas, resúmenes de lectura, estudio y explicaciones, agendas de reunión, traducción o revisión de textos y código.',
    pv_help_keys_title: 'Atajos rápidos:',
    pv_help_keys_desc: 'Alt+Shift+V abre la ventana · ↑ / ↓ navega · Enter copia · Esc cierra.',
    pv_help_close: 'Entendido',
  },
  en: {
    app_name: 'MD for AI',
    app_tagline: 'Web to Markdown Converter',
    app_description: 'Convert this page to clean Markdown to paste into your AI assistant',
    onboarding_steps: '1) Choose what to extract · 2) Review result · 3) Copy',
    onboarding_dismiss: 'Got it',
    page_context_label: 'Current page',
    mode_label: 'Extraction Mode',
    mode_article: 'Article',
    mode_full: 'Full Page',
    mode_selection: 'Selection',
    toggle_links: 'Include links',
    toggle_images_alt: 'Images as alt text',
    toggle_meta: 'Header with title/URL/date',
    toggle_copy_on_open: 'Copy on open',
    preview_label: 'Markdown Preview',
    preview_placeholder: 'Extracted Markdown will appear here...',
    status_loading: 'Extracting page content...',
    status_calculating: 'Calculating...',
    tokens_approx: '≈ {count} tokens',
    chip_fits: 'Fits',
    chip_exceeds: 'Exceeds',
    btn_trim: 'Trim to fit',
    btn_copy: 'Copy',
    btn_copied: 'Copied!',
    btn_retry: 'Retry',
    trimmed_notice: 'Trimmed to {limit} tokens',
    empty_state_title: 'No readable content',
    empty_state_desc: 'No extractable text was detected on the active page or selection.',
    notice_fallback_full: 'This page does not appear to be an article; full page was used.',
    error_restricted: 'Cannot inject script on this page. System pages (chrome://), Chrome Web Store, and PDF viewers do not allow extensions.',
    error_no_tab: 'No active tab found to extract.',
    error_no_selection: 'Select text on the page and reopen this window (Alt+Shift+M)',
    error_extract_failed: 'Failed to extract content from this page.',
    error_timeout: 'Extraction took too long to respond (timeout expired).',
    error_copy_failed: 'Failed to automatically copy to clipboard.',
    shortcut_hint: 'Shortcut: Alt+Shift+M',
    shortcut_hint_mac: 'Shortcut: ⌥⇧M',
    author_by: 'Nicolas Valenzuela (Beto18v)',
    pv_app_name: 'Prompt Vault',
    pv_search_placeholder: 'Search prompts...',
    pv_btn_new: 'New',
    pv_btn_create_first: 'Create first prompt',
    pv_no_results: 'No results for "{query}"',
    pv_editor_new_title: 'New prompt',
    pv_editor_edit_title: 'Edit prompt',
    pv_label_title: 'Title',
    pv_label_body: 'Prompt',
    pv_label_tags: 'Tags (comma-separated)',
    pv_placeholder_body: 'Write your template. Use {{variable}} for values that change each time (e.g. {{topic}}, {{tone}}).',
    pv_placeholder_tags: 'email, summary, study',
    pv_variables_hint: 'Detected variables: {vars}',
    pv_btn_save: 'Save',
    pv_btn_cancel: 'Cancel',
    pv_btn_copy: 'Copy',
    pv_btn_copied: 'Copied',
    pv_btn_edit: 'Edit',
    pv_btn_delete: 'Delete',
    pv_btn_delete_confirm: 'Sure?',
    pv_btn_pin: 'Pin',
    pv_btn_unpin: 'Unpin',
    pv_variables_modal_title: 'Fill in variables',
    pv_btn_confirm_vars: 'Copy',
    pv_shortcut_hint: 'Shortcut: Alt+Shift+V',
    pv_shortcut_hint_mac: 'Shortcut: ⌥⇧V',
    pv_btn_help: 'How it works',
    pv_btn_load_examples: 'Load example templates',
    pv_examples_loaded: 'Example templates added',
    pv_empty_title: 'Your local prompt library',
    pv_empty_desc: 'Save instructions you repeat daily (emails, summaries, study, or work) and copy them in seconds.',
    pv_help_title: 'How Prompt Vault works',
    pv_help_what: 'Store your frequent prompts 100% locally in your browser and find them instantly without external notes.',
    pv_help_vars_title: 'What are {{variables}} for?',
    pv_help_vars_desc: 'When you wrap words in double braces like {{topic}} or {{tone}}, copying the prompt opens a quick form to fill those values before pasting.',
    pv_help_example_label: 'Example:',
    pv_help_example_code: 'Write a {{tone}} email to {{person}} about {{subject}}.',
    pv_help_uses_title: 'Use cases:',
    pv_help_uses_desc: 'Emails & replies, reading summaries, study & explanations, meeting agendas, translation, writing or code review.',
    pv_help_keys_title: 'Quick shortcuts:',
    pv_help_keys_desc: 'Alt+Shift+V opens popup · ↑ / ↓ navigate · Enter copies · Esc closes.',
    pv_help_close: 'Got it',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.es;

let currentLocale: SupportedLocale = 'es';

/**
 * Detects preferred locale based on browser settings.
 */
export function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
  }
  return 'es';
}

/**
 * Gets the active locale in memory.
 */
export function getLocale(): SupportedLocale {
  return currentLocale;
}

/**
 * Sets the active locale in memory.
 */
export function setLocale(locale: SupportedLocale): void {
  currentLocale = locale;
}

/**
 * Translates a key for the given or current locale with optional parameter interpolation.
 */
export function t(
  key: TranslationKey,
  params?: Record<string, string | number>,
  locale?: SupportedLocale
): string {
  const active = locale || currentLocale;
  const dict = TRANSLATIONS[active] || TRANSLATIONS.es;
  let text: string = dict[key] || TRANSLATIONS.es[key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return text;
}
