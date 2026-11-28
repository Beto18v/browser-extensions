import { describe, expect, it } from 'vitest';
import {
  clampVolume,
  DEFAULT_COMPRESSOR,
  getMeterBlocksCount,
  getMeterZone,
  TONE_PRESETS,
  volumeToGain,
} from '../src/lib/presets';

describe('presets & volume helpers', () => {
  it('clampVolume mantiene el rango 0 a 600 y redondea enteros', () => {
    expect(clampVolume(100)).toBe(100);
    expect(clampVolume(-10)).toBe(0);
    expect(clampVolume(750)).toBe(600);
    expect(clampVolume(124.6)).toBe(125);
    expect(clampVolume(NaN)).toBe(100);
  });

  it('volumeToGain convierte porcentajes a ganancia lineal precisa', () => {
    expect(volumeToGain(0)).toBe(0);
    expect(volumeToGain(100)).toBe(1);
    expect(volumeToGain(200)).toBe(2);
    expect(volumeToGain(600)).toBe(6);
    expect(volumeToGain(150)).toBe(1.5);
  });

  it('getMeterZone clasifica correctamente las 4 zonas', () => {
    expect(getMeterZone(0)).toBe('muted');
    expect(getMeterZone(50)).toBe('safe');
    expect(getMeterZone(100)).toBe('safe');
    expect(getMeterZone(101)).toBe('boost');
    expect(getMeterZone(300)).toBe('boost');
    expect(getMeterZone(305)).toBe('overdrive');
    expect(getMeterZone(600)).toBe('overdrive');
  });

  it('getMeterBlocksCount escala de 0 a 12 bloques', () => {
    expect(getMeterBlocksCount(0, 12)).toBe(0);
    expect(getMeterBlocksCount(50, 12)).toBe(1);
    expect(getMeterBlocksCount(100, 12)).toBe(2);
    expect(getMeterBlocksCount(300, 12)).toBe(6);
    expect(getMeterBlocksCount(600, 12)).toBe(12);
  });

  it('define los 4 presets de tono con frecuencias válidas', () => {
    const keys = Object.keys(TONE_PRESETS);
    expect(keys).toEqual(['normal', 'voice', 'bass', 'night']);

    for (const key of keys) {
      const preset = TONE_PRESETS[key as keyof typeof TONE_PRESETS];
      expect(preset.eq.lowShelf.freq).toBeGreaterThan(0);
      expect(preset.eq.peaking.freq).toBeGreaterThan(0);
      expect(preset.eq.highShelf.freq).toBeGreaterThan(0);
    }

    expect(DEFAULT_COMPRESSOR.ratio).toBe(12);
    expect(DEFAULT_COMPRESSOR.threshold).toBe(-6);
  });
});
