import { describe, expect, it } from 'vitest';
import {
  detectSiteAdapter,
  extractDomain,
  isGoogleWorkspaceAdapter,
  isSupportedUrl,
} from '../src/lib/domain';

describe('domain utilities', () => {
  it('extracts and normalizes domains, stripping www. and ports', () => {
    expect(extractDomain('https://www.wikipedia.org/wiki/Dark_mode')).toBe('wikipedia.org');
    expect(extractDomain('https://DOCS.GOOGLE.COM/document/d/123')).toBe('docs.google.com');
    expect(extractDomain('http://localhost:3000/dashboard')).toBe('localhost');
    expect(extractDomain('chrome://settings')).toBeNull();
    expect(extractDomain('about:blank')).toBeNull();
    expect(extractDomain('')).toBeNull();
    expect(extractDomain(null)).toBeNull();
  });

  it('detects restricted and unsupported URLs', () => {
    expect(isSupportedUrl('https://github.com/Beto18v')).toBe(true);
    expect(isSupportedUrl('http://localhost:5173')).toBe(true);
    expect(isSupportedUrl('chrome://extensions')).toBe(false);
    expect(isSupportedUrl('edge://settings')).toBe(false);
    expect(isSupportedUrl('brave://settings')).toBe(false);
    expect(isSupportedUrl('about:blank')).toBe(false);
    expect(isSupportedUrl('chrome-extension://abcdef/popup.html')).toBe(false);
    expect(isSupportedUrl('https://chromewebstore.google.com/detail/xyz')).toBe(false);
    expect(isSupportedUrl('https://chrome.google.com/webstore/category/extensions')).toBe(false);
  });

  it('detects Google Workspace adapters accurately', () => {
    expect(detectSiteAdapter('https://docs.google.com/document/d/abc/edit')).toBe('google-docs');
    expect(detectSiteAdapter('https://docs.google.com/spreadsheets/d/abc/edit')).toBe('google-sheets');
    expect(detectSiteAdapter('https://docs.google.com/presentation/d/abc/edit')).toBe('google-slides');
    expect(detectSiteAdapter('https://docs.google.com/forms/d/abc/edit')).toBe('generic');
    expect(detectSiteAdapter('https://example.com')).toBe('generic');

    expect(isGoogleWorkspaceAdapter('google-docs')).toBe(true);
    expect(isGoogleWorkspaceAdapter('google-sheets')).toBe(true);
    expect(isGoogleWorkspaceAdapter('google-slides')).toBe(true);
    expect(isGoogleWorkspaceAdapter('generic')).toBe(false);
  });
});
