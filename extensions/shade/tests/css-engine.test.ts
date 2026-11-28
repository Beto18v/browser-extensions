import { describe, expect, it } from 'vitest';
import { buildThemeCss } from '../src/lib/css-engine';
import { createDefaultProfile } from '../src/lib/presets';

describe('css-engine', () => {
  it('returns an empty string when profile is disabled', () => {
    const profile = createDefaultProfile({ enabled: false });
    expect(buildThemeCss(profile, 'generic')).toBe('');
    expect(buildThemeCss(profile, 'google-docs')).toBe('');
  });

  it('applies non-inverted filter for warm_paper', () => {
    const profile = createDefaultProfile({
      enabled: true,
      preset: 'warm_paper',
      brightness: 94,
      contrast: 98,
      warmth: 28,
    });
    const css = buildThemeCss(profile, 'generic');
    expect(css).not.toContain('invert(1)');
    expect(css).toContain('brightness(94%) contrast(98%) sepia(28%)');
  });

  it('applies invert(1) hue-rotate(180deg) and media preservation for dark presets', () => {
    for (const preset of ['carbon', 'night_shift', 'crisp_dark'] as const) {
      const profile = createDefaultProfile({ enabled: true, preset });
      const css = buildThemeCss(profile, 'generic');
      expect(css).toContain('invert(1) hue-rotate(180deg)');
      expect(css).toContain('img, video, picture');
      expect(css).toContain('background-color: #FFFFFF !important;');
    }
  });

  it('handles Google Workspace canvas darkening toggle', () => {
    const darkCanvas = createDefaultProfile({
      enabled: true,
      preset: 'carbon',
      darkenCanvas: true,
    });
    const cssDark = buildThemeCss(darkCanvas, 'google-docs');
    expect(cssDark).not.toContain('canvas.kix-canvas-tile-content');

    const lightDocs = createDefaultProfile({
      enabled: true,
      preset: 'carbon',
      darkenCanvas: false,
    });
    const cssDocs = buildThemeCss(lightDocs, 'google-docs');
    expect(cssDocs).toContain('canvas.kix-canvas-tile-content');
    expect(cssDocs).toContain('background-color: #FFFFFF !important;');
    expect(cssDocs).not.toContain('#docs-editor canvas');

    const cssSheets = buildThemeCss(lightDocs, 'google-sheets');
    expect(cssSheets).toContain('.grid-container canvas');

    const cssSlides = buildThemeCss(lightDocs, 'google-slides');
    expect(cssSlides).toContain('#pages > svg');
    expect(cssSlides).toContain('.punch-viewer-content canvas');
    expect(cssSlides).not.toContain('#canvas,');
  });
});
