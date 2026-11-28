import { createDefaultProfile } from './presets';
import type { DomainProfile, Settings } from './types';

export const STORAGE_DOMAINS_KEY = 'st_domains_v1';
export const STORAGE_SETTINGS_KEY = 'st_settings_v1';

export const DEFAULT_SETTINGS: Settings = {
  locale: 'en',
  theme: 'dark',
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
      theme: data.theme === 'light' || data.theme === 'dark' ? data.theme : DEFAULT_SETTINGS.theme,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveStoredSettings(
  patch: Partial<Settings>
): Promise<Settings> {
  const current = await getStoredSettings();
  const updated: Settings = { ...current, ...patch };
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_SETTINGS_KEY]: updated });
    }
  } catch {
    // Ignore storage errors outside extension context
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

export async function getDomainProfile(
  domain: string
): Promise<DomainProfile | null> {
  if (!domain) return null;
  const profiles = await getDomainProfiles();
  return profiles[domain] ?? null;
}

export async function saveDomainProfile(
  domain: string,
  profile: Partial<DomainProfile>
): Promise<DomainProfile> {
  const currentProfiles = await getDomainProfiles();
  const existing = currentProfiles[domain] ?? createDefaultProfile();

  const updated = createDefaultProfile({
    ...existing,
    ...profile,
    updatedAt: Date.now(),
  });

  currentProfiles[domain] = updated;

  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_DOMAINS_KEY]: currentProfiles });
    }
  } catch {
    // Ignore storage errors outside extension context
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
      // Ignore storage errors outside extension context
    }
  }
}

export async function clearAllDomainProfiles(): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.remove(STORAGE_DOMAINS_KEY);
    }
  } catch {
    // Ignore storage errors outside extension context
  }
}
