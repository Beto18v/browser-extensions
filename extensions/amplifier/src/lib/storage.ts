import type { DomainProfile, Settings } from './types';
import { DEFAULT_PRESET, DEFAULT_VOLUME } from './presets';

export const STORAGE_DOMAINS_KEY = 'at_domains_v1';
export const STORAGE_SETTINGS_KEY = 'at_settings_v1';

export const DEFAULT_SETTINGS: Settings = {
  locale: 'en',
  theme: 'dark',
  rememberByDomain: true,
};

export async function getStoredSettings(): Promise<Settings> {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return { ...DEFAULT_SETTINGS };
    }
    const result = await chrome.storage.local.get(STORAGE_SETTINGS_KEY);
    const data = result[STORAGE_SETTINGS_KEY];
    if (!data || typeof data !== 'object') {
      return { ...DEFAULT_SETTINGS };
    }
    return {
      locale: data.locale || DEFAULT_SETTINGS.locale,
      theme: data.theme || DEFAULT_SETTINGS.theme,
      rememberByDomain: typeof data.rememberByDomain === 'boolean' ? data.rememberByDomain : true,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveStoredSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getStoredSettings();
  const updated: Settings = { ...current, ...patch };
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_SETTINGS_KEY]: updated });
    }
  } catch {
    // Ignore storage errors in non-extension env
  }
  return updated;
}

export async function getDomainProfiles(): Promise<Record<string, DomainProfile>> {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return {};
    }
    const result = await chrome.storage.local.get(STORAGE_DOMAINS_KEY);
    const map = result[STORAGE_DOMAINS_KEY];
    if (!map || typeof map !== 'object') {
      return {};
    }
    return map as Record<string, DomainProfile>;
  } catch {
    return {};
  }
}

export async function getDomainProfile(domain: string): Promise<DomainProfile | null> {
  if (!domain) return null;
  const profiles = await getDomainProfiles();
  return profiles[domain] || null;
}

export async function saveDomainProfile(
  domain: string,
  profile: Partial<DomainProfile>
): Promise<DomainProfile> {
  const currentProfiles = await getDomainProfiles();
  const existing = currentProfiles[domain] || {
    volume: DEFAULT_VOLUME,
    preset: DEFAULT_PRESET,
    limiter: true,
    updatedAt: Date.now(),
  };

  const updated: DomainProfile = {
    volume: typeof profile.volume === 'number' ? profile.volume : existing.volume,
    preset: profile.preset || existing.preset,
    limiter: typeof profile.limiter === 'boolean' ? profile.limiter : existing.limiter,
    updatedAt: Date.now(),
  };

  currentProfiles[domain] = updated;

  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_DOMAINS_KEY]: currentProfiles });
    }
  } catch {
    // Fallback
  }

  return updated;
}

export async function removeDomainProfile(domain: string): Promise<void> {
  if (!domain) return;
  const currentProfiles = await getDomainProfiles();
  if (domain in currentProfiles) {
    delete currentProfiles[domain];
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ [STORAGE_DOMAINS_KEY]: currentProfiles });
      }
    } catch {
      // Fallback
    }
  }
}
