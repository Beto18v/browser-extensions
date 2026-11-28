import {
  clampBrightness,
  clampContrast,
  clampWarmth,
  PRESETS,
} from './presets';
import type { DomainProfile, SiteAdapter } from './types';

export const SHADE_STYLE_ELEMENT_ID = 'shade-engine';

/**
 * Generates the CSS string for a given domain profile and site adapter.
 * Returns an empty string when the profile is disabled.
 */
export function buildThemeCss(
  profile: DomainProfile,
  adapter: SiteAdapter = 'generic'
): string {
  if (!profile.enabled) {
    return '';
  }

  const preset = PRESETS[profile.preset] ?? PRESETS.carbon;
  const brightness = clampBrightness(profile.brightness);
  const contrast = clampContrast(profile.contrast);
  const warmth = clampWarmth(profile.warmth);

  if (!preset.inverted) {
    return [
      'html {',
      `  filter: brightness(${brightness}%) contrast(${contrast}%) sepia(${warmth}%) !important;`,
      '}',
    ].join('\n');
  }

  const rules: string[] = [
    'html {',
    `  filter: invert(1) hue-rotate(180deg) brightness(${brightness}%) contrast(${contrast}%) sepia(${warmth}%) !important;`,
    '  background-color: #FFFFFF !important;',
    '}',
    '',
    'img, video, picture, [style*="background-image"], iframe {',
    '  filter: invert(1) hue-rotate(180deg) !important;',
    '}',
  ];

  if (!profile.darkenCanvas) {
    if (adapter === 'google-docs') {
      rules.push(
        '',
        'canvas.kix-canvas-tile-content {',
        '  filter: invert(1) hue-rotate(180deg) !important;',
        '  background-color: #FFFFFF !important;',
        '}'
      );
    } else if (adapter === 'google-sheets') {
      rules.push(
        '',
        '.grid-container canvas {',
        '  filter: invert(1) hue-rotate(180deg) !important;',
        '}'
      );
    } else if (adapter === 'google-slides') {
      rules.push(
        '',
        '#pages > svg, .punch-viewer-content .punch-viewer-svgpage, .punch-viewer-content canvas, .sketchy-viewer-content canvas {',
        '  filter: invert(1) hue-rotate(180deg) !important;',
        '}',
        '',
        '#pages > svg img,',
        '#pages > svg video,',
        '#pages > svg picture,',
        '#pages > svg [style*="background-image"],',
        '#pages > svg iframe,',
        '.punch-viewer-content img,',
        '.punch-viewer-content video,',
        '.punch-viewer-content picture,',
        '.punch-viewer-content [style*="background-image"],',
        '.punch-viewer-content iframe {',
        '  filter: none !important;',
        '}'
      );
    } else {
      rules.push(
        '',
        'canvas {',
        '  filter: invert(1) hue-rotate(180deg) !important;',
        '}'
      );
    }
  }

  return rules.join('\n');
}
