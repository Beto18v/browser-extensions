import { saveRecording } from '@/utils/db';

interface RecordingState {
  isRecording: boolean;
  tabId?: number;
  mode?: string;
  mic?: boolean;
  startTime?: number;
}

const RESTRICTED_PROTOCOLS = [
  'chrome:',
  'chrome-extension:',
  'edge:',
  'about:',
  'view-source:',
  'chrome-search:',
];

async function ensureContentScriptInjected(tabId: number): Promise<boolean> {
  try {
    const ping = await chrome.tabs.sendMessage(tabId, { type: 'PING' }).catch(() => null);
    if (ping?.pong) return true;

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-scripts/content.js'],
    });
    await new Promise((r) => setTimeout(r, 120));
    return true;
  } catch {
    return false;
  }
}

async function resolveEligibleTabForFloatingStudio(): Promise<{ tabId: number; error?: string }> {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const isRestricted =
      !activeTab?.id ||
      !activeTab.url ||
      RESTRICTED_PROTOCOLS.some((p) => activeTab.url?.startsWith(p));

    if (!isRestricted && activeTab?.id) {
      await ensureContentScriptInjected(activeTab.id);
      return { tabId: activeTab.id };
    }

    // Current tab is restricted (e.g. chrome://extensions).
    // Find an open regular tab in the current window!
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const regularTab = tabs.find(
      (t) => t.id && t.url && !RESTRICTED_PROTOCOLS.some((p) => t.url!.startsWith(p))
    );

    if (regularTab?.id) {
      await chrome.tabs.update(regularTab.id, { active: true });
      await ensureContentScriptInjected(regularTab.id);
      return { tabId: regularTab.id };
    }

    // No regular tab exists in the window. Open a clean web tab!
    const newTab = await chrome.tabs.create({ url: 'https://www.google.com', active: true });
    if (!newTab?.id) return { tabId: 0, error: 'FAILED_TO_CREATE_TAB' };

    await new Promise((resolve) => setTimeout(resolve, 800));
    await ensureContentScriptInjected(newTab.id);
    return { tabId: newTab.id };
  } catch (err: any) {
    return { tabId: 0, error: err?.message || 'UNKNOWN_ERROR' };
  }
}

async function broadcastToAllTabs(message: any) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      if (t.id && t.url && !RESTRICTED_PROTOCOLS.some((p) => t.url!.startsWith(p))) {
        chrome.tabs.sendMessage(t.id, message).catch(() => {});
      }
    }
  } catch {}
}

function base64ToBlob(base64: string, mimeType = 'video/webm'): Blob {
  const commaIndex = base64.lastIndexOf(',');
  const clean = commaIndex !== -1 ? base64.substring(commaIndex + 1) : base64;
  const byteCharacters = atob(clean);
  const sliceSize = 1024 * 1024;
  const byteArrays: Uint8Array[] = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Uint8Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(byteNumbers);
  }
  return new Blob(byteArrays as any[], { type: mimeType });
}

export default defineBackground(() => {
  // Listen for tab switching to synchronize floating controls across tabs during recording
  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    try {
      const data = (await chrome.storage.local.get('recordflow_state')) as {
        recordflow_state?: RecordingState;
      };
      if (data.recordflow_state?.isRecording) {
        const tab = await chrome.tabs.get(tabId);
        if (tab?.url && !RESTRICTED_PROTOCOLS.some((p) => tab.url?.startsWith(p))) {
          await ensureContentScriptInjected(tabId);
          chrome.tabs.sendMessage(tabId, {
            type: 'SYNC_RECORDING_OVERLAY',
            isFollower: tabId !== data.recordflow_state.tabId,
            originTabId: data.recordflow_state.tabId,
            mode: data.recordflow_state.mode,
            mic: data.recordflow_state.mic,
            startTime: data.recordflow_state.startTime,
          }).catch(() => {});
        }
      }
    } catch {}
  });
  // Listen for messages across popup, content script, and preview
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'OPEN_FLOATING_HUB') {
      (async () => {
        try {
          const { tabId, error } = await resolveEligibleTabForFloatingStudio();
          if (!tabId || error) {
            sendResponse({ success: false, error });
            return;
          }

          chrome.tabs.sendMessage(
            tabId,
            {
              type: 'TOGGLE_FLOATING_HUB',
              mode: message.mode || 'screen-camera',
              mic: message.mic !== false,
            },
            (res) => {
              sendResponse({ success: !chrome.runtime.lastError && res?.success !== false });
            }
          );
        } catch (e: any) {
          sendResponse({ success: false, error: e?.message });
        }
      })();
      return true;
    }

    if (message.type === 'START_RECORDING_REQUEST') {
      (async () => {
        const mode = message.mode || 'screen-camera';
        const mic = message.mic !== false;

        try {
          const { tabId, error } = await resolveEligibleTabForFloatingStudio();
          if (!tabId || error) {
            sendResponse({ success: false, error });
            return;
          }

          const state: RecordingState = {
            isRecording: true,
            tabId,
            mode,
            mic,
            startTime: Date.now(),
          };
          await chrome.storage.local.set({ recordflow_state: state });

          chrome.tabs.sendMessage(
            tabId,
            {
              type: 'START_RECORDING_INTERNAL',
              mode,
              mic,
            },
            (response: any) => {
              if (chrome.runtime.lastError || !response?.success) {
                chrome.storage.local.set({
                  recordflow_state: { isRecording: false } as RecordingState,
                });
                sendResponse({
                  success: false,
                  error: response?.error || 'START_FAILED',
                });
              } else {
                sendResponse({ success: true, tabId });
              }
            }
          );
        } catch (err: any) {
          await chrome.storage.local.set({
            recordflow_state: { isRecording: false } as RecordingState,
          });
          sendResponse({ success: false, error: err?.message || 'UNKNOWN_ERROR' });
        }
      })();
      return true;
    }

    if (message.type === 'STOP_RECORDING_REQUEST') {
      (async () => {
        try {
          const data = (await chrome.storage.local.get('recordflow_state')) as {
            recordflow_state?: RecordingState;
          };
          const tabId = data.recordflow_state?.tabId;
          if (tabId) {
            chrome.tabs.sendMessage(tabId, { type: 'STOP_RECORDING_INTERNAL' }).catch(() => {});
          }

          await chrome.storage.local.set({
            recordflow_state: { isRecording: false } as RecordingState,
          });
          await broadcastToAllTabs({ type: 'REMOVE_RECORDING_OVERLAY' });
          sendResponse({ success: true });
        } catch (err: any) {
          sendResponse({ success: false, error: err?.message });
        }
      })();
      return true;
    }

    if (message.type === 'RECORDING_FINISHED') {
      (async () => {
        try {
          let blob: Blob | null = null;
          if (message.dataUrl) {
            blob = base64ToBlob(message.dataUrl, 'video/webm');
          } else if (message.buffer) {
            if (message.buffer instanceof ArrayBuffer || message.buffer instanceof Uint8Array) {
              blob = new Blob([message.buffer], { type: 'video/webm' });
            } else if (Array.isArray(message.buffer)) {
              blob = new Blob([new Uint8Array(message.buffer)], { type: 'video/webm' });
            } else if (typeof message.buffer === 'object') {
              const values = Object.values(message.buffer) as number[];
              blob = new Blob([new Uint8Array(values)], { type: 'video/webm' });
            }
          }

          if (blob && blob.size > 0) {
            await saveRecording({
              id: message.id,
              title: message.title,
              timestamp: Date.now(),
              duration: message.duration,
              size: blob.size,
              mode: message.mode,
              mimeType: 'video/webm',
              blob,
            });
          }
        } catch (dbErr) {
          console.error('[RecordFlow] Failed to save in extension IndexedDB:', dbErr);
        }

        await chrome.storage.local.set({
          recordflow_state: { isRecording: false } as RecordingState,
        });

        await broadcastToAllTabs({ type: 'REMOVE_RECORDING_OVERLAY' });

        // Open preview page with recorded video ID
        const previewUrl = chrome.runtime.getURL(`preview.html?id=${message.id}`);
        chrome.tabs.create({ url: previewUrl });
        sendResponse({ success: true });
      })();
      return true;
    }

    if (message.type === 'RECORDING_CANCELLED') {
      chrome.storage.local.set({
        recordflow_state: { isRecording: false } as RecordingState,
      });
      broadcastToAllTabs({ type: 'REMOVE_RECORDING_OVERLAY' });
      sendResponse({ success: true });
      return true;
    }

    if (message.type === 'GET_RECORDING_STATE') {
      chrome.storage.local.get('recordflow_state', (data: { recordflow_state?: RecordingState }) => {
        sendResponse(data.recordflow_state || { isRecording: false });
      });
      return true;
    }
  });

  // When a recording tab is closed, clean up state
  chrome.tabs.onRemoved.addListener(async (tabId) => {
    const data = (await chrome.storage.local.get('recordflow_state')) as {
      recordflow_state?: RecordingState;
    };
    if (data.recordflow_state?.tabId === tabId) {
      await chrome.storage.local.set({
        recordflow_state: { isRecording: false } as RecordingState,
      });
    }
  });
});
