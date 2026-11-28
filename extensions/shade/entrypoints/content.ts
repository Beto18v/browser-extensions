import { buildThemeCss, SHADE_STYLE_ELEMENT_ID } from '../src/lib/css-engine';
import {
  detectSiteAdapter,
  extractDomain,
  isSupportedUrl,
} from '../src/lib/domain';
import { getDomainProfile, STORAGE_DOMAINS_KEY } from '../src/lib/storage';
import type { DomainProfile, RuntimeMessage, SiteAdapter } from '../src/lib/types';

function applyCssToDocument(css: string): void {
  const existing = document.getElementById(SHADE_STYLE_ELEMENT_ID);

  if (!css) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  if (existing && existing instanceof HTMLStyleElement) {
    if (existing.textContent !== css) {
      existing.textContent = css;
    }
    return;
  }

  const style = document.createElement('style');
  style.id = SHADE_STYLE_ELEMENT_ID;
  style.textContent = css;

  const target = document.head || document.documentElement;
  if (target) {
    target.appendChild(style);
  }
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  async main() {
    const win = window as unknown as { __shadeInitialized?: boolean };
    if (win.__shadeInitialized) {
      return;
    }
    win.__shadeInitialized = true;

    const url = window.location.href;
    if (!isSupportedUrl(url)) {
      return;
    }

    const domain = extractDomain(url);
    if (!domain) {
      return;
    }

    const adapter: SiteAdapter = detectSiteAdapter(url);

    // Apply stored profile immediately at document_start to prevent white flash
    const storedProfile = await getDomainProfile(domain);
    if (storedProfile && storedProfile.enabled) {
      applyCssToDocument(buildThemeCss(storedProfile, adapter));
    }

    // Listen for live updates from the popup
    chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
      if (message?.type === 'APPLY_PROFILE') {
        const css = buildThemeCss(
          message.profile,
          message.adapter ?? adapter
        );
        applyCssToDocument(css);
      }
    });

    // Sync if another tab modifies the same domain profile in storage
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local' || !changes[STORAGE_DOMAINS_KEY]) {
        return;
      }
      const nextMap = changes[STORAGE_DOMAINS_KEY].newValue as
        | Record<string, DomainProfile>
        | undefined;
      const nextProfile = nextMap?.[domain];
      if (!nextProfile || !nextProfile.enabled) {
        applyCssToDocument('');
      } else {
        applyCssToDocument(buildThemeCss(nextProfile, adapter));
      }
    });
  },
});
