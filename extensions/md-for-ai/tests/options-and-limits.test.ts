import { describe, it, expect } from 'vitest';
import {
  DEFAULT_OPTIONS,
  LIMITS,
  isRestrictedUrl,
  STORAGE_OPTIONS_KEY,
} from '../src/lib/options';

describe('Popup Options and Security Constraints', () => {
  it('defines valid and safe default options', () => {
    expect(DEFAULT_OPTIONS.mode).toBe('article');
    expect(DEFAULT_OPTIONS.includeLinks).toBe(true);
    expect(DEFAULT_OPTIONS.imagesAsAlt).toBe(true);
    expect(DEFAULT_OPTIONS.includeMeta).toBe(true);
    expect(DEFAULT_OPTIONS.copyOnOpen).toBe(false);
    expect(DEFAULT_OPTIONS.selectedLimit).toBe(8192);
  });

  it('uses a versioned storage key', () => {
    expect(STORAGE_OPTIONS_KEY).toBe('mdai_options_v1');
  });

  it('provides standard LLM token limits (8k, 32k, 128k, 200k)', () => {
    expect(LIMITS).toEqual([8192, 32768, 131072, 204800]);
  });

  it('correctly identifies non-injectable and restricted URLs', () => {
    // Chrome internal pages
    expect(isRestrictedUrl('chrome://settings')).toBe(true);
    expect(isRestrictedUrl('chrome://extensions')).toBe(true);
    expect(isRestrictedUrl('chrome://newtab')).toBe(true);

    // Edge internal pages
    expect(isRestrictedUrl('edge://settings')).toBe(true);

    // About pages
    expect(isRestrictedUrl('about:blank')).toBe(true);
    expect(isRestrictedUrl('about:srcdoc')).toBe(true);

    // Chrome extension internal schemes
    expect(isRestrictedUrl('chrome-extension://abcdef12345/popup.html')).toBe(true);

    // Chrome Web Store (prohibited by Chrome security model)
    expect(isRestrictedUrl('https://chrome.google.com/webstore/detail/something')).toBe(true);
    expect(isRestrictedUrl('https://chromewebstore.google.com/detail/something')).toBe(true);

    // PDF documents and view-source
    expect(isRestrictedUrl('https://example.com/paper.pdf')).toBe(true);
    expect(isRestrictedUrl('view-source:https://example.com')).toBe(true);

    // Empty or whitespace url
    expect(isRestrictedUrl('')).toBe(true);
    expect(isRestrictedUrl('   ')).toBe(true);

    // Valid websites
    expect(isRestrictedUrl('https://en.wikipedia.org/wiki/Markdown')).toBe(false);
    expect(isRestrictedUrl('https://developer.mozilla.org/es/docs/Web')).toBe(false);
    expect(isRestrictedUrl('http://localhost:3000')).toBe(false);
  });
});
