import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllDomainProfiles,
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

describe('storage', () => {
  let mockStore: Record<string, unknown>;

  beforeEach(() => {
    mockStore = {};
    (globalThis as unknown as { chrome: unknown }).chrome = {
      storage: {
        local: {
          get: async (key: string) => ({ [key]: mockStore[key] }),
          set: async (obj: Record<string, unknown>) => {
            Object.assign(mockStore, obj);
          },
          remove: async (key: string) => {
            delete mockStore[key];
          },
        },
      },
    };
  });

  it('reads and updates global settings under st_settings_v1', async () => {
    expect(await getStoredSettings()).toEqual(DEFAULT_SETTINGS);

    const updated = await saveStoredSettings({ locale: 'es', theme: 'light' });
    expect(updated).toEqual({ locale: 'es', theme: 'light' });
    expect(mockStore[STORAGE_SETTINGS_KEY]).toEqual({
      locale: 'es',
      theme: 'light',
    });
  });

  it('saves, reads, removes, and clears domain profiles under st_domains_v1', async () => {
    expect(await getDomainProfile('wikipedia.org')).toBeNull();

    const saved = await saveDomainProfile('wikipedia.org', {
      enabled: true,
      preset: 'night_shift',
      brightness: 84,
    });

    expect(saved.enabled).toBe(true);
    expect(saved.preset).toBe('night_shift');
    expect(saved.brightness).toBe(84);

    const fetched = await getDomainProfile('wikipedia.org');
    expect(fetched?.preset).toBe('night_shift');
    expect(Object.keys(mockStore[STORAGE_DOMAINS_KEY] as object)).toContain(
      'wikipedia.org'
    );

    await removeDomainProfile('wikipedia.org');
    expect(await getDomainProfile('wikipedia.org')).toBeNull();

    await saveDomainProfile('docs.google.com', { enabled: true });
    await clearAllDomainProfiles();
    expect(await getDomainProfiles()).toEqual({});
  });
});
