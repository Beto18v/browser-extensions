export type SupportedLocale = 'es' | 'en';

export const STORAGE_LOCALE_KEY = 'suite_language_v1';

export const TRANSLATIONS = {
  es: {
    app_name: 'MD for AI',
    mode_label: 'Modo de extracción',
    mode_article: 'Artículo',
    mode_full: 'Página completa',
    mode_selection: 'Selección',
    toggle_links: 'Incluir enlaces',
    toggle_images_alt: 'Imágenes como texto alt',
    toggle_meta: 'Encabezado con título/URL/fecha',
    preview_label: 'Vista previa Markdown',
    preview_placeholder: 'Extrayendo contenido de la página...',
    tokens_approx: '≈ {count} tokens',
    chip_fits: 'Cabe',
    chip_exceeds: 'Excede',
    btn_trim: 'Recortar para que quepa',
    btn_copy: 'Copiar',
    btn_copied: '¡Copiado!',
    trimmed_notice: 'Recortado a {limit} tokens',
    error_restricted: 'Página no inyectable. Las páginas del sistema (chrome://), Chrome Web Store y visores de PDF no permiten ejecutar extensiones.',
    error_no_tab: 'No se encontró una pestaña activa para extraer.',
    error_no_selection: 'No hay texto seleccionado en la página. Selecciona texto en la página o cambia a otro modo.',
    error_extract_failed: 'No se pudo extraer el contenido de la página.',
    author_by: 'Nicolas Valenzuela (Beto18v)',
  },
  en: {
    app_name: 'MD for AI',
    mode_label: 'Extraction Mode',
    mode_article: 'Article',
    mode_full: 'Full Page',
    mode_selection: 'Selection',
    toggle_links: 'Include links',
    toggle_images_alt: 'Images as alt text',
    toggle_meta: 'Header with title/URL/date',
    preview_label: 'Markdown Preview',
    preview_placeholder: 'Extracting page content...',
    tokens_approx: '≈ {count} tokens',
    chip_fits: 'Fits',
    chip_exceeds: 'Exceeds',
    btn_trim: 'Trim to fit',
    btn_copy: 'Copy',
    btn_copied: 'Copied!',
    trimmed_notice: 'Trimmed to {limit} tokens',
    error_restricted: 'Cannot inject script on this page. System pages (chrome://), Chrome Web Store, and PDF viewers do not allow extensions.',
    error_no_tab: 'No active tab found to extract.',
    error_no_selection: 'No text selected on page. Select text on the page or switch to another mode.',
    error_extract_failed: 'Failed to extract content from this page.',
    author_by: 'Nicolas Valenzuela (Beto18v)',
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
