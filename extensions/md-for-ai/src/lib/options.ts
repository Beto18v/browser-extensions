export const STORAGE_OPTIONS_KEY = 'mdai_options_v1';

export const LIMITS = [8192, 32768, 131072, 204800] as const;

export type TokenLimit = (typeof LIMITS)[number];

export interface StoredOptions {
  mode: 'article' | 'full' | 'selection';
  includeLinks: boolean;
  imagesAsAlt: boolean;
  includeMeta: boolean;
  copyOnOpen: boolean;
  selectedLimit: number;
}

export const DEFAULT_OPTIONS: StoredOptions = {
  mode: 'article',
  includeLinks: true,
  imagesAsAlt: true,
  includeMeta: true,
  copyOnOpen: false,
  selectedLimit: 8192,
};

/**
 * Checks if a URL cannot be injected with content scripts due to browser security policies.
 */
export function isRestrictedUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  return (
    trimmed.length === 0 ||
    trimmed.startsWith('chrome://') ||
    trimmed.startsWith('edge://') ||
    trimmed.startsWith('about:') ||
    trimmed.startsWith('chrome-extension://') ||
    trimmed.includes('chrome.google.com/webstore') ||
    trimmed.includes('chromewebstore.google.com') ||
    trimmed.endsWith('.pdf') ||
    trimmed.startsWith('view-source:')
  );
}
