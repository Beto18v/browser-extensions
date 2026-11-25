export type SupportedLocale = 'es' | 'en';

export const STORAGE_LOCALE_KEY = 'suite_language_v1';

export const TRANSLATIONS = {
  es: {
    author_by: 'Nicolas Valenzuela (Beto18v)',
    pv_app_name: 'Prompt Drawer',
    pv_search_placeholder: 'Buscar prompts...',
    pv_btn_new: 'Nuevo',
    pv_btn_create_first: 'Crear primer prompt',
    pv_no_results: 'Sin resultados para "{query}"',
    pv_editor_new_title: 'Nuevo prompt',
    pv_editor_edit_title: 'Editar prompt',
    pv_label_title: 'Título',
    pv_label_body: 'Prompt',
    pv_label_tags: 'Etiquetas (separadas por comas)',
    pv_placeholder_body:
      'Escribe tu plantilla. Usa {{variable}} para datos que cambian cada vez (ej. {{tema}}, {{tono}}).',
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
    pv_empty_desc:
      'Guarda instrucciones que repites a diario (correos, resúmenes, estudio o trabajo) y cópialas en segundos.',
    pv_help_title: 'Cómo funciona Prompt Drawer',
    pv_help_what:
      'Guarda tus prompts frecuentes 100% en tu navegador y encuéntralos al instante sin abrir notas externas.',
    pv_help_vars_title: '¿Para qué sirven las {{variables}}?',
    pv_help_vars_desc:
      'Si escribes palabras entre llaves dobles, como {{tema}} o {{tono}}, al copiar el prompt se abrirá una ventana rápida para rellenar esos datos antes de pegar.',
    pv_help_example_label: 'Ejemplo:',
    pv_help_example_code: 'Redacta un correo {{tono}} para {{persona}} sobre {{asunto}}.',
    pv_help_uses_title: 'Casos de uso:',
    pv_help_uses_desc:
      'Correos y respuestas, resúmenes de lectura, estudio y explicaciones, agendas de reunión, traducción o revisión de textos y código.',
    pv_help_categories_title: 'Categorías con color:',
    pv_help_categories_desc:
      'Crea tus propias categorías con nombre y color al crear o editar un prompt. Al tener al menos una, aparecerán arriba para filtrar la lista.',
    pv_help_keys_title: 'Atajos rápidos:',
    pv_help_keys_desc: 'Alt+Shift+V abre la ventana · ↑ / ↓ navega · Enter copia · Esc cierra.',
    pv_help_close: 'Entendido',
    pv_theme_toggle: 'Cambiar tema',
    pv_theme_light: 'Cambiar a tema claro',
    pv_theme_dark: 'Cambiar a tema oscuro',
    pv_filter_all: 'Todos',
    pv_category_label: 'Categoría',
    pv_category_new: 'Nueva categoría',
    pv_category_name_placeholder: 'Nombre de categoría',
    pv_category_add: 'Añadir',
    pv_category_empty_hint: 'Sin categorías aún. Crea una para organizarlos por color.',
    pv_category_delete: 'Eliminar categoría',
  },
  en: {
    author_by: 'Nicolas Valenzuela (Beto18v)',
    pv_app_name: 'Prompt Drawer',
    pv_search_placeholder: 'Search prompts...',
    pv_btn_new: 'New',
    pv_btn_create_first: 'Create first prompt',
    pv_no_results: 'No results for "{query}"',
    pv_editor_new_title: 'New prompt',
    pv_editor_edit_title: 'Edit prompt',
    pv_label_title: 'Title',
    pv_label_body: 'Prompt',
    pv_label_tags: 'Tags (comma-separated)',
    pv_placeholder_body:
      'Write your template. Use {{variable}} for values that change each time (e.g. {{topic}}, {{tone}}).',
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
    pv_empty_desc:
      'Save instructions you repeat daily (emails, summaries, study, or work) and copy them in seconds.',
    pv_help_title: 'How Prompt Drawer works',
    pv_help_what:
      'Store your frequent prompts 100% locally in your browser and find them instantly without external notes.',
    pv_help_vars_title: 'What are {{variables}} for?',
    pv_help_vars_desc:
      'When you wrap words in double braces like {{topic}} or {{tone}}, copying the prompt opens a quick form to fill those values before pasting.',
    pv_help_example_label: 'Example:',
    pv_help_example_code: 'Write a {{tone}} email to {{person}} about {{subject}}.',
    pv_help_uses_title: 'Use cases:',
    pv_help_uses_desc:
      'Emails & replies, reading summaries, study & explanations, meeting agendas, translation, writing or code review.',
    pv_help_categories_title: 'Color categories:',
    pv_help_categories_desc:
      'Create your own categories with a custom name and color when creating or editing a prompt. Once you add one, filter chips appear at the top.',
    pv_help_keys_title: 'Quick shortcuts:',
    pv_help_keys_desc: 'Alt+Shift+V opens popup · ↑ / ↓ navigate · Enter copies · Esc closes.',
    pv_help_close: 'Got it',
    pv_theme_toggle: 'Toggle theme',
    pv_theme_light: 'Switch to light theme',
    pv_theme_dark: 'Switch to dark theme',
    pv_filter_all: 'All',
    pv_category_label: 'Category',
    pv_category_new: 'New category',
    pv_category_name_placeholder: 'Category name',
    pv_category_add: 'Add',
    pv_category_empty_hint: 'No categories yet. Create one to color-code prompts.',
    pv_category_delete: 'Delete category',
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
