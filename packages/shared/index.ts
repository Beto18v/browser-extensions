/**
 * @browser-extensions/shared
 * Shared utilities, types, and constants across the extension suite.
 */

export const SUITE_AUTHOR = {
  name: 'Nicolas Valenzuela (Beto18v)',
  portfolio: 'https://nival.is-a.dev',
  github: 'https://github.com/Beto18v',
} as const;

export {
  type SupportedLocale,
  type TranslationKey,
  STORAGE_LOCALE_KEY,
  TRANSLATIONS,
  detectBrowserLocale,
  getLocale,
  setLocale,
  t,
} from './src/i18n';
