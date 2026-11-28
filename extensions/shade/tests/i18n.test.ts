import { describe, expect, it } from 'vitest';
import { getFlagSvg } from '../src/lib/flags';
import {
  detectBrowserLocale,
  DICTIONARY,
  SUPPORTED_LOCALES,
  t,
} from '../src/lib/i18n';

describe('i18n and SVG flags', () => {
  it('maintains 100% key symmetry and non-empty strings across all 6 locales', () => {
    const baseKeys = Object.keys(DICTIONARY.en).sort();
    expect(SUPPORTED_LOCALES).toEqual(['en', 'es', 'pt_BR', 'fr', 'de', 'ja']);

    for (const locale of SUPPORTED_LOCALES) {
      const localeKeys = Object.keys(DICTIONARY[locale]).sort();
      expect(localeKeys).toEqual(baseKeys);
      for (const key of localeKeys) {
        const value = DICTIONARY[locale][key as keyof typeof DICTIONARY.en];
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      }
      expect(t(locale, 'appTitle')).toBe('Shade');
    }
  });

  it('detects browser locales with fallback to en', () => {
    expect(detectBrowserLocale('es-CO')).toBe('es');
    expect(detectBrowserLocale('pt-BR')).toBe('pt_BR');
    expect(detectBrowserLocale('fr-FR')).toBe('fr');
    expect(detectBrowserLocale('de-DE')).toBe('de');
    expect(detectBrowserLocale('ja-JP')).toBe('ja');
    expect(detectBrowserLocale('ko-KR')).toBe('en');
  });

  it('provides valid inline vector SVG flags for all 6 locales', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const svg = getFlagSvg(locale);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('viewBox="0 0 60 40"');
    }
  });
});
