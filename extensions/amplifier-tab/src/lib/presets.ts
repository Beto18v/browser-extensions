import type { MeterZone, TonePresetId } from './types';

export const MIN_VOLUME = 0;
export const MAX_VOLUME = 600;
export const DEFAULT_VOLUME = 100;
export const DEFAULT_PRESET: TonePresetId = 'normal';

export interface EqFilterConfig {
  lowShelf: { freq: number; gain: number };
  peaking: { freq: number; gain: number; q: number };
  highShelf: { freq: number; gain: number };
}

export interface CompressorConfig {
  threshold: number; // dB
  knee: number;      // dB
  ratio: number;     // ratio
  attack: number;    // seconds
  release: number;   // seconds
}

export interface TonePresetDefinition {
  id: TonePresetId;
  labelKey: string;
  descriptionKey: string;
  eq: EqFilterConfig;
  compressor?: Partial<CompressorConfig>;
}

export const TONE_PRESETS: Record<TonePresetId, TonePresetDefinition> = {
  normal: {
    id: 'normal',
    labelKey: 'presetNormal',
    descriptionKey: 'presetNormalDesc',
    eq: {
      lowShelf: { freq: 120, gain: 0 },
      peaking: { freq: 1800, gain: 0, q: 1.0 },
      highShelf: { freq: 8000, gain: 0 },
    },
  },
  voice: {
    id: 'voice',
    labelKey: 'presetVoice',
    descriptionKey: 'presetVoiceDesc',
    eq: {
      lowShelf: { freq: 180, gain: -10 },
      peaking: { freq: 2400, gain: 9, q: 1.4 },
      highShelf: { freq: 6500, gain: 4 },
    },
  },
  bass: {
    id: 'bass',
    labelKey: 'presetBass',
    descriptionKey: 'presetBassDesc',
    eq: {
      lowShelf: { freq: 110, gain: 11 },
      peaking: { freq: 800, gain: -3, q: 0.9 },
      highShelf: { freq: 7000, gain: -2 },
    },
  },
  night: {
    id: 'night',
    labelKey: 'presetNight',
    descriptionKey: 'presetNightDesc',
    eq: {
      lowShelf: { freq: 120, gain: -6 },
      peaking: { freq: 1800, gain: 3, q: 1.0 },
      highShelf: { freq: 5000, gain: -6 },
    },
    compressor: {
      threshold: -28,
      ratio: 10,
      knee: 12,
      attack: 0.003,
      release: 0.08,
    },
  },
};

export const DEFAULT_COMPRESSOR: CompressorConfig = {
  threshold: -6,
  knee: 12,
  ratio: 12,
  attack: 0.003,
  release: 0.15,
};

/**
 * Restringe el volumen a valores enteros dentro de [MIN_VOLUME, MAX_VOLUME]
 */
export function clampVolume(volume: number): number {
  if (typeof volume !== 'number' || isNaN(volume)) return DEFAULT_VOLUME;
  const rounded = Math.round(volume);
  return Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, rounded));
}

/**
 * Convierte un porcentaje de volumen (0-600) a ganancia lineal para GainNode.
 * 100% = 1.0, 0% = 0.0, 600% = 6.0
 */
export function volumeToGain(volume: number): number {
  const clamped = clampVolume(volume);
  return clamped / 100;
}

/**
 * Retorna la zona del vúmetro según el volumen actual
 */
export function getMeterZone(volume: number): MeterZone {
  const clamped = clampVolume(volume);
  if (clamped === 0) return 'muted';
  if (clamped <= 100) return 'safe';
  if (clamped <= 300) return 'boost';
  return 'overdrive';
}

/**
 * Retorna la cantidad de bloques iluminados para una escala de N bloques (ej. 12)
 */
export function getMeterBlocksCount(volume: number, totalBlocks = 12): number {
  const clamped = clampVolume(volume);
  if (clamped <= 0) return 0;
  return Math.min(totalBlocks, Math.max(1, Math.round((clamped / MAX_VOLUME) * totalBlocks)));
}
