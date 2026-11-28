import { clampVolume, DEFAULT_PRESET, DEFAULT_VOLUME } from '../src/lib/presets';
import type { TabAudioState } from '../src/lib/types';

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

// Estado en memoria de pestañas administradas por el Service Worker
const tabStates = new Map<number, TabAudioState>();

let creatingOffscreenPromise: Promise<void> | null = null;

// Asegura que el documento offscreen esté creado (manejando llamadas concurrentes)
async function ensureOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (creatingOffscreenPromise) {
    await creatingOffscreenPromise;
    return;
  }

  creatingOffscreenPromise = chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification: 'Process tab audio with Web Audio API for amplification and equalization',
  });

  try {
    await creatingOffscreenPromise;
  } catch (err: any) {
    // Si ya fue creado concurrentemente ignoramos el error
    if (!err?.message?.includes('Only a single offscreen document')) {
      throw err;
    }
  } finally {
    creatingOffscreenPromise = null;
  }
}

// Cierra el documento offscreen si no quedan pestañas activas
async function cleanupOffscreenIfEmpty(): Promise<void> {
  let anyActive = false;
  for (const state of tabStates.values()) {
    if (state.active) {
      anyActive = true;
      break;
    }
  }

  if (!anyActive) {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    });
    if (existingContexts.length > 0) {
      await chrome.offscreen.closeDocument();
    }
  }
}

// Actualiza el badge en la pestaña
function updateBadge(tabId: number, volume: number, muted: boolean, active: boolean) {
  if (!active || (volume === 100 && !muted)) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  if (muted || volume === 0) {
    chrome.action.setBadgeText({ tabId, text: 'MUTE' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#66635A' });
    return;
  }

  chrome.action.setBadgeText({ tabId, text: `${volume}%` });
  if (volume > 300) {
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#DC2626' }); // Overdrive
  } else if (volume > 100) {
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#D97706' }); // Boost
  } else {
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#15803D' }); // Safe
  }
}

export default defineBackground(() => {
  // Manejo de mensajes
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_TAB_STATE') {
      const state = tabStates.get(message.tabId) || null;
      sendResponse({ state });
      return false;
    }

    if (message.type === 'GET_AUDIBLE_TABS') {
      chrome.tabs.query({ audible: true }).then((tabs) => {
        const audibleInfo = tabs.map((t) => ({
          id: t.id!,
          title: t.title || 'Untitled',
          url: t.url || '',
          favIconUrl: t.favIconUrl,
          audible: t.audible ?? false,
          mutedInfo: t.mutedInfo,
        }));
        sendResponse({ tabs: audibleInfo });
      });
      return true;
    }

    if (message.type === 'SET_TAB_AUDIO') {
      const { tabId, volume, preset, limiter, muted } = message;
      (async () => {
        const clampedVol = clampVolume(volume);
        const existing = tabStates.get(tabId) || {
          tabId,
          volume: DEFAULT_VOLUME,
          preset: DEFAULT_PRESET,
          limiter: true,
          muted: false,
          previousVolume: DEFAULT_VOLUME,
          active: false,
        };

        const isMuted = typeof muted === 'boolean' ? muted : existing.muted;
        const finalVol = isMuted ? 0 : clampedVol;
        const finalPreset = preset || existing.preset;
        const finalLimiter = typeof limiter === 'boolean' ? limiter : existing.limiter;
        const prevVol = isMuted ? (existing.volume > 0 ? existing.volume : existing.previousVolume) : clampedVol;

        // Si ya estaba marcado como activo en offscreen, intentamos actualizar parámetros
        if (existing.active) {
          existing.volume = finalVol;
          existing.preset = finalPreset;
          existing.limiter = finalLimiter;
          existing.muted = isMuted;
          existing.previousVolume = prevVol;
          tabStates.set(tabId, existing);

          updateBadge(tabId, finalVol, isMuted, true);

          try {
            const updateRes = await chrome.runtime.sendMessage({
              type: 'UPDATE_OFFSCREEN_AUDIO',
              tabId,
              volume: finalVol,
              preset: finalPreset,
              limiter: finalLimiter,
            });

            // Si el offscreen responde que no encontró el pipeline activo (se desconectó), procedemos a re-capturar
            if (updateRes && !updateRes.notFound) {
              sendResponse({ success: true, state: existing });
              return;
            }
          } catch {
            // El offscreen document no estaba listo o se cerró, procedemos a re-capturar
          }
        }

        // Si el volumen es 100% y preset normal y no mute, no hace falta capturar
        if (finalVol === 100 && finalPreset === 'normal' && !isMuted) {
          tabStates.delete(tabId);
          updateBadge(tabId, 100, false, false);
          sendResponse({ success: true, state: null });
          return;
        }

        // Iniciar o reiniciar captura
        try {
          await ensureOffscreenDocument();

          const streamId = await new Promise<string>((resolve, reject) => {
            chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (id) => {
              const err = chrome.runtime.lastError;
              if (err) {
                reject(new Error(err.message || 'tabCapture failed'));
              } else if (!id) {
                reject(new Error('Failed to obtain stream ID'));
              } else {
                resolve(id);
              }
            });
          });

          const newState: TabAudioState = {
            tabId,
            volume: finalVol,
            preset: finalPreset,
            limiter: finalLimiter,
            muted: isMuted,
            previousVolume: prevVol,
            active: true,
          };
          tabStates.set(tabId, newState);

          updateBadge(tabId, finalVol, isMuted, true);

          await chrome.runtime.sendMessage({
            type: 'INIT_OFFSCREEN_STREAM',
            tabId,
            streamId,
            volume: finalVol,
            preset: finalPreset,
            limiter: finalLimiter,
          });

          sendResponse({ success: true, state: newState });
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          console.error(`[Amplifier Tab Background] Failed to capture tab ${tabId}: ${errMsg}`);
          sendResponse({ success: false, error: errMsg });
        }
      })();
      return true;
    }

    if (message.type === 'RESET_TAB_AUDIO') {
      const { tabId } = message;
      (async () => {
        const existing = tabStates.get(tabId);
        if (existing && existing.active) {
          try {
            await chrome.runtime.sendMessage({
              type: 'STOP_OFFSCREEN_AUDIO',
              tabId,
            });
          } catch {
            // Documento offscreen cerrado
          }
        }
        tabStates.delete(tabId);
        updateBadge(tabId, 100, false, false);
        await cleanupOffscreenIfEmpty();
        sendResponse({ success: true });
      })();
      return true;
    }

    return false;
  });

  // Limpiar recursos al cerrar pestaña
  chrome.tabs.onRemoved.addListener(async (tabId) => {
    if (tabStates.has(tabId)) {
      tabStates.delete(tabId);
      try {
        await chrome.runtime.sendMessage({
          type: 'STOP_OFFSCREEN_AUDIO',
          tabId,
        });
      } catch {
        // Documento offscreen cerrado
      }
      await cleanupOffscreenIfEmpty();
    }
  });
});
