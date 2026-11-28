import { describe, expect, it } from 'vitest';
import {
  detectBrowserLocale,
  SUPPORTED_LOCALES,
  t,
  TRANSLATIONS,
} from '../src/lib/i18n';

describe('i18n module', () => {
  it('soporta 6 idiomas con simetría exacta de claves', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'es', 'pt_BR', 'fr', 'de', 'ja']);

    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    expect(enKeys.length).toBeGreaterThan(15);

    for (const locale of SUPPORTED_LOCALES) {
      const keys = Object.keys(TRANSLATIONS[locale]).sort();
      expect(keys).toEqual(enKeys);

      // Ninguna traducción debe estar vacía
      for (const k of keys) {
        const val = TRANSLATIONS[locale][k];
        expect(val).toBeDefined();
        expect(val!.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('t retorna la traducción adecuada con fallback seguro a inglés', () => {
    expect(t('en', 'appTitle')).toBe('Amplifier');
    expect(t('es', 'appTitle')).toBe('Amplificador');
    expect(t('ja', 'appTitle')).toBe('アンプ');
    expect(t('fr', 'nonExistentKey')).toBe('nonExistentKey');
  });

  it('detectBrowserLocale mapea variantes al locale soportado', () => {
    const originalNavigator = globalThis.navigator;

    const mockLang = (lang: string) => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { language: lang },
        configurable: true,
      });
    };

    mockLang('es-ES');
    expect(detectBrowserLocale()).toBe('es');

    mockLang('pt-BR');
    expect(detectBrowserLocale()).toBe('pt_BR');

    mockLang('pt-PT');
    expect(detectBrowserLocale()).toBe('pt_BR');

    mockLang('fr-CA');
    expect(detectBrowserLocale()).toBe('fr');

    mockLang('de-DE');
    expect(detectBrowserLocale()).toBe('de');

    mockLang('ja-JP');
    expect(detectBrowserLocale()).toBe('ja');

    mockLang('it-IT');
    expect(detectBrowserLocale()).toBe('en');

    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
  });
});
