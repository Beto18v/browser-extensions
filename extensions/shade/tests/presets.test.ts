import { describe, expect, it } from 'vitest';
import {
  applyPresetToProfile,
  clampBrightness,
  clampContrast,
  clampWarmth,
  createDefaultProfile,
  MAX_BRIGHTNESS,
  MAX_CONTRAST,
  MAX_WARMTH,
  MIN_BRIGHTNESS,
  MIN_CONTRAST,
  MIN_WARMTH,
  PRESETS,
} from '../src/lib/presets';

describe('presets and clamping', () => {
  it('defines exact calibrations for all 4 presets', () => {
    expect(PRESETS.carbon).toEqual({
      id: 'carbon',
      inverted: true,
      brightness: 92,
      contrast: 96,
      warmth: 0,
    });
    expect(PRESETS.warm_paper).toEqual({
      id: 'warm_paper',
      inverted: false,
      brightness: 94,
      contrast: 98,
      warmth: 28,
    });
    expect(PRESETS.night_shift).toEqual({
      id: 'night_shift',
      inverted: true,
      brightness: 84,
      contrast: 92,
      warmth: 35,
    });
    expect(PRESETS.crisp_dark).toEqual({
      id: 'crisp_dark',
      inverted: true,
      brightness: 98,
      contrast: 114,
      warmth: 0,
    });
  });

  it('clamps brightness, contrast, and warmth within bounds', () => {
    expect(clampBrightness(10)).toBe(MIN_BRIGHTNESS);
    expect(clampBrightness(300)).toBe(MAX_BRIGHTNESS);
    expect(clampBrightness(102.6)).toBe(103);

    expect(clampContrast(0)).toBe(MIN_CONTRAST);
    expect(clampContrast(200)).toBe(MAX_CONTRAST);
    expect(clampContrast(114)).toBe(114);

    expect(clampWarmth(-10)).toBe(MIN_WARMTH);
    expect(clampWarmth(150)).toBe(MAX_WARMTH);
    expect(clampWarmth(35.2)).toBe(35);
  });

  it('creates default profile opted-out (enabled: false)', () => {
    const profile = createDefaultProfile();
    expect(profile.enabled).toBe(false);
    expect(profile.preset).toBe('carbon');
    expect(profile.brightness).toBe(92);
    expect(profile.contrast).toBe(96);
    expect(profile.warmth).toBe(0);
    expect(profile.darkenCanvas).toBe(true);
    expect(profile.rememberSite).toBe(true);
  });

  it('applies a preset to an existing profile', () => {
    const base = createDefaultProfile({ enabled: true });
    const updated = applyPresetToProfile(base, 'night_shift');
    expect(updated.enabled).toBe(true);
    expect(updated.preset).toBe('night_shift');
    expect(updated.brightness).toBe(84);
    expect(updated.contrast).toBe(92);
    expect(updated.warmth).toBe(35);
  });
});
