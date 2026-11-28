import type { DomainProfile, PresetId } from './types';

export const MIN_BRIGHTNESS = 50;
export const MAX_BRIGHTNESS = 150;
export const MIN_CONTRAST = 50;
export const MAX_CONTRAST = 150;
export const MIN_WARMTH = 0;
export const MAX_WARMTH = 100;

export const DEFAULT_PRESET: PresetId = 'carbon';

export interface PresetDefinition {
  id: PresetId;
  inverted: boolean;
  brightness: number;
  contrast: number;
  warmth: number;
}

export const PRESETS: Record<PresetId, PresetDefinition> = {
  carbon: {
    id: 'carbon',
    inverted: true,
    brightness: 92,
    contrast: 96,
    warmth: 0,
  },
  warm_paper: {
    id: 'warm_paper',
    inverted: false,
    brightness: 94,
    contrast: 98,
    warmth: 28,
  },
  night_shift: {
    id: 'night_shift',
    inverted: true,
    brightness: 84,
    contrast: 92,
    warmth: 35,
  },
  crisp_dark: {
    id: 'crisp_dark',
    inverted: true,
    brightness: 98,
    contrast: 114,
    warmth: 0,
  },
};

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function clampBrightness(value: number): number {
  return clampInt(value, MIN_BRIGHTNESS, MAX_BRIGHTNESS);
}

export function clampContrast(value: number): number {
  return clampInt(value, MIN_CONTRAST, MAX_CONTRAST);
}

export function clampWarmth(value: number): number {
  return clampInt(value, MIN_WARMTH, MAX_WARMTH);
}

export function createDefaultProfile(
  overrides: Partial<DomainProfile> = {}
): DomainProfile {
  const presetId = overrides.preset ?? DEFAULT_PRESET;
  const preset = PRESETS[presetId] ?? PRESETS[DEFAULT_PRESET];

  return {
    enabled: overrides.enabled ?? false,
    preset: preset.id,
    brightness: clampBrightness(overrides.brightness ?? preset.brightness),
    contrast: clampContrast(overrides.contrast ?? preset.contrast),
    warmth: clampWarmth(overrides.warmth ?? preset.warmth),
    darkenCanvas: overrides.darkenCanvas ?? true,
    rememberSite: overrides.rememberSite ?? true,
    updatedAt: overrides.updatedAt ?? Date.now(),
  };
}

export function applyPresetToProfile(
  profile: DomainProfile,
  presetId: PresetId
): DomainProfile {
  const preset = PRESETS[presetId] ?? PRESETS[DEFAULT_PRESET];
  return {
    ...profile,
    preset: preset.id,
    brightness: preset.brightness,
    contrast: preset.contrast,
    warmth: preset.warmth,
    updatedAt: Date.now(),
  };
}
