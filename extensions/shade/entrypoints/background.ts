import { detectSiteAdapter, extractDomain, isSupportedUrl } from '../src/lib/domain';
import { getDomainProfile } from '../src/lib/storage';
import type { RuntimeMessage } from '../src/lib/types';

async function setTabBadge(tabId: number, enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await chrome.action.setBadgeText({ tabId, text: 'ON' });
      await chrome.action.setBadgeBackgroundColor({ tabId, color: '#E11D48' });
      if (chrome.action.setBadgeTextColor) {
        await chrome.action.setBadgeTextColor({ tabId, color: '#FFFFFF' });
      }
    } else {
      await chrome.action.setBadgeText({ tabId, text: '' });
    }
  } catch {
    // Tab may have been closed
  }
}

async function syncTabBadge(tabId: number, url?: string): Promise<void> {
  if (!url || !isSupportedUrl(url)) {
    await setTabBadge(tabId, false);
    return;
  }
  const domain = extractDomain(url);
  if (!domain) {
    await setTabBadge(tabId, false);
    return;
  }
  const profile = await getDomainProfile(domain);
  const enabled = Boolean(profile?.enabled);
  await setTabBadge(tabId, enabled);

  if (enabled && profile) {
    const adapter = detectSiteAdapter(url);
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'APPLY_PROFILE',
        profile,
        adapter,
      });
    } catch {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content-scripts/content.js'],
        });
      } catch {
        // Tab may be restricted or closed
      }
    }
  }
}

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
    if (message?.type === 'UPDATE_BADGE' && typeof message.tabId === 'number') {
      void setTabBadge(message.tabId, message.enabled);
    }
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' || changeInfo.url) {
      void syncTabBadge(tabId, changeInfo.url ?? tab.url);
    }
  });

  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    try {
      const tab = await chrome.tabs.get(tabId);
      await syncTabBadge(tabId, tab.url);
    } catch {
      // Ignore closed tab errors
    }
  });
});
