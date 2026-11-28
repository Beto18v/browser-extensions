import type { SiteAdapter } from './types';

/**
 * Extracts and normalizes the domain from a given URL.
 * Strips the 'www.' prefix and port. Returns null if the URL is invalid,
 * empty, or uses an unsupported scheme.
 */
export function extractDomain(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    return hostname || null;
  } catch {
    return null;
  }
}

/**
 * Determines whether a URL can be styled by Shade.
 * Excludes browser internal pages, extensions, and the Chrome Web Store.
 */
export function isSupportedUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith('chrome://') ||
    trimmed.startsWith('edge://') ||
    trimmed.startsWith('brave://') ||
    trimmed.startsWith('about:') ||
    trimmed.startsWith('chrome-extension://') ||
    trimmed.startsWith('view-source:') ||
    trimmed.startsWith('chrome-search://')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    if (
      host === 'chromewebstore.google.com' ||
      (host === 'chrome.google.com' && parsed.pathname.startsWith('/webstore'))
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Detects the specialized site adapter for a given URL.
 */
export function detectSiteAdapter(url?: string | null): SiteAdapter {
  if (!url || typeof url !== 'string') return 'generic';

  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (host === 'docs.google.com') {
      if (path.startsWith('/document')) return 'google-docs';
      if (path.startsWith('/spreadsheets')) return 'google-sheets';
      if (path.startsWith('/presentation')) return 'google-slides';
    }

    return 'generic';
  } catch {
    return 'generic';
  }
}

export function isGoogleWorkspaceAdapter(adapter: SiteAdapter): boolean {
  return (
    adapter === 'google-docs' ||
    adapter === 'google-sheets' ||
    adapter === 'google-slides'
  );
}
