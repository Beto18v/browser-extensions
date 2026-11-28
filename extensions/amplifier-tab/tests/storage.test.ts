import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  getDomainProfile,
  getDomainProfiles,
  getStoredSettings,
  removeDomainProfile,
  saveDomainProfile,
  saveStoredSettings,
  STORAGE_DOMAINS_KEY,
  STORAGE_SETTINGS_KEY,
} from '../src/lib/storage';

describe('storage module', () => {
  let mockStorage: Record<string, any> = {};

  beforeEach(() => {
    mockStorage = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => {
            return { [key]: mockStorage[key] };
          }),
          set: vi.fn(async (items: Record<string, any>) => {
            Object.assign(mockStorage, items);
          }),
        },
      },
    };
  });

  it('retorna DEFAULT_SETTINGS cuando no hay nada guardado', async () => {
    const settings = await getStoredSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('guarda y recupera configuraciones personalizadas', async () => {
    await saveStoredSettings({ locale: 'es', theme: 'light', rememberByDomain: false });
    const settings = await getStoredSettings();
    expect(settings.locale).toBe('es');
    expect(settings.theme).toBe('light');
    expect(settings.rememberByDomain).toBe(false);
  });

  it('guarda, recupera y elimina perfiles por dominio', async () => {
    expect(await getDomainProfile('youtube.com')).toBeNull();

    await saveDomainProfile('youtube.com', {
      volume: 160,
      preset: 'voice',
      limiter: true,
    });

    const profile = await getDomainProfile('youtube.com');
    expect(profile).not.toBeNull();
    expect(profile?.volume).toBe(160);
    expect(profile?.preset).toBe('voice');
    expect(profile?.limiter).toBe(true);

    const all = await getDomainProfiles();
    expect(all['youtube.com']).toBeDefined();

    await removeDomainProfile('youtube.com');
    expect(await getDomainProfile('youtube.com')).toBeNull();
  });
});
