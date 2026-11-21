import { getAllRecordingsMeta, deleteRecording, getRecording } from '@/utils/db';
import '@shared/components/nival-footer';
import '@shared/components/nival-lang-switch';
import {
  getCurrentLang,
  setLang,
  t,
  formatDuration,
  formatBytes,
  formatDate,
  type Language,
} from '@/utils/i18n';

document.addEventListener('DOMContentLoaded', async () => {
  let currentLang: Language = await getCurrentLang();
  let selectedMode: 'screen-camera' | 'screen' | 'camera' = 'screen-camera';
  let isMicActive = true;
  let isRecordingActive = false;
  let liveTimerInterval: number | null = null;
  let recordingStartTime = 0;

  // DOM Elements
  const langBtn = document.getElementById('lang-btn') as HTMLButtonElement | null;
  const langLabel = document.getElementById('lang-label') as HTMLElement | null;
  const tabRecordBtn = document.getElementById('tab-record-btn') as HTMLButtonElement;
  const tabRecentBtn = document.getElementById('tab-recent-btn') as HTMLButtonElement;
  const viewRecord = document.getElementById('view-record') as HTMLElement;
  const viewRecent = document.getElementById('view-recent') as HTMLElement;
  const countBadge = document.getElementById('recordings-count-badge') as HTMLElement;

  const statusBar = document.getElementById('status-bar') as HTMLElement;
  const statusText = document.getElementById('status-text') as HTMLElement;
  const liveTimerBadge = document.getElementById('live-timer-badge') as HTMLElement;
  const liveTimerText = document.getElementById('live-timer-text') as HTMLElement;

  const modeButtons = document.querySelectorAll('.mode-card') as NodeListOf<HTMLButtonElement>;
  const modeDescription = document.getElementById('mode-description') as HTMLElement;

  const micToggle = document.getElementById('mic-toggle') as HTMLInputElement;
  const micStatusLabel = document.getElementById('mic-status-label') as HTMLElement;

  const recordCtaBtn = document.getElementById('record-cta-btn') as HTMLButtonElement;
  const ctaLabel = document.getElementById('cta-label') as HTMLElement;
  const btnOpenUniversal = document.getElementById('btn-open-universal-studio') as HTMLButtonElement | null;

  const errorBanner = document.getElementById('error-banner') as HTMLElement;
  const errorMessage = document.getElementById('error-message') as HTMLElement;

  const recentListContainer = document.getElementById('recent-list-container') as HTMLElement;
  const recentEmpty = document.getElementById('recent-empty') as HTMLElement;

  // Update i18n text in the UI
  function updateI18nLabels() {
    if (langLabel) langLabel.textContent = currentLang.toUpperCase();
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = t(key, currentLang);
      }
    });

    updateModeDescription();
    micStatusLabel.textContent = isMicActive
      ? t('audio_mic_active', currentLang)
      : t('audio_mic_muted', currentLang);

    if (isRecordingActive) {
      statusText.textContent = t('status_recording', currentLang);
      ctaLabel.textContent = t('btn_stop_recording', currentLang);
    } else {
      statusText.textContent = t('status_ready', currentLang);
      ctaLabel.textContent = t('btn_start_recording', currentLang);
    }
  }

  function updateModeDescription() {
    if (selectedMode === 'screen-camera') {
      modeDescription.textContent = t('mode_screen_camera_desc', currentLang);
    } else if (selectedMode === 'screen') {
      modeDescription.textContent = t('mode_screen_only_desc', currentLang);
    } else {
      modeDescription.textContent = t('mode_camera_only_desc', currentLang);
    }
  }

  function showError(msg: string) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
    setTimeout(() => {
      errorBanner.classList.add('hidden');
    }, 5000);
  }

  // Language Toggle
  if (langBtn) {
    langBtn.addEventListener('click', async () => {
      currentLang = currentLang === 'es' ? 'en' : 'es';
      await setLang(currentLang);
      updateI18nLabels();
      renderRecentRecordings();
    });
  }

  window.addEventListener('langchange', async (e: Event) => {
    const ce = e as CustomEvent<{ lang?: Language }>;
    if (ce.detail?.lang && (ce.detail.lang === 'es' || ce.detail.lang === 'en')) {
      currentLang = ce.detail.lang;
      await setLang(currentLang);
      updateI18nLabels();
      renderRecentRecordings();
    }
  });

  // Tab switching
  tabRecordBtn.addEventListener('click', () => {
    tabRecordBtn.classList.add('active');
    tabRecentBtn.classList.remove('active');
    viewRecord.classList.remove('hidden');
    viewRecent.classList.add('hidden');
  });

  tabRecentBtn.addEventListener('click', () => {
    tabRecentBtn.classList.add('active');
    tabRecordBtn.classList.remove('active');
    viewRecent.classList.remove('hidden');
    viewRecord.classList.add('hidden');
    renderRecentRecordings();
  });

  // Mode selection
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (isRecordingActive) return; // Cannot change mode while recording
      modeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMode = btn.getAttribute('data-mode') as any;
      updateModeDescription();
    });
  });

  // Mic toggle
  micToggle.addEventListener('change', () => {
    isMicActive = micToggle.checked;
    micStatusLabel.textContent = isMicActive
      ? t('audio_mic_active', currentLang)
      : t('audio_mic_muted', currentLang);
  });

  // Check current recording state
  async function syncRecordingState() {
    chrome.runtime.sendMessage({ type: 'GET_RECORDING_STATE' }, (state) => {
      if (state && state.isRecording) {
        setRecordingUI(true, state.startTime || Date.now());
      } else {
        setRecordingUI(false);
      }
    });
  }

  function setRecordingUI(recording: boolean, startTime = Date.now()) {
    isRecordingActive = recording;

    if (recording) {
      statusBar.classList.add('recording');
      statusText.textContent = t('status_recording', currentLang);
      liveTimerBadge.classList.remove('hidden');

      recordCtaBtn.classList.remove('btn-start');
      recordCtaBtn.classList.add('btn-stop');
      ctaLabel.textContent = t('btn_stop_recording', currentLang);

      recordingStartTime = startTime;
      if (liveTimerInterval) clearInterval(liveTimerInterval);
      liveTimerInterval = window.setInterval(() => {
        const secs = Math.floor((Date.now() - recordingStartTime) / 1000);
        liveTimerText.textContent = formatDuration(secs);
      }, 1000);
    } else {
      statusBar.classList.remove('recording');
      statusText.textContent = t('status_ready', currentLang);
      liveTimerBadge.classList.add('hidden');

      recordCtaBtn.classList.remove('btn-stop');
      recordCtaBtn.classList.add('btn-start');
      ctaLabel.textContent = t('btn_start_recording', currentLang);

      if (liveTimerInterval) {
        clearInterval(liveTimerInterval);
        liveTimerInterval = null;
      }
    }
  }

  // CTA Record Click
  recordCtaBtn.addEventListener('click', async () => {
    if (isRecordingActive) {
      // Trigger stop
      chrome.runtime.sendMessage({ type: 'STOP_RECORDING_REQUEST' }, () => {
        setRecordingUI(false);
        window.close();
      });
    } else {
      // Trigger start
      recordCtaBtn.disabled = true;
      ctaLabel.textContent = '...';

      chrome.runtime.sendMessage(
        {
          type: 'START_RECORDING_REQUEST',
          mode: selectedMode,
          mic: isMicActive,
        },
        (res) => {
          recordCtaBtn.disabled = false;
          if (res?.success) {
            setRecordingUI(true);
            // Close popup so user interacts with page & screen picker freely
            setTimeout(() => {
              window.close();
            }, 300);
          } else {
            setRecordingUI(false);
            showError(t('err_recording_failed', currentLang));
          }
        }
      );
    }
  });

  // Direct Universal Studio Recorder button
  if (btnOpenUniversal) {
    btnOpenUniversal.addEventListener('click', () => {
      const url = chrome.runtime.getURL(
        `recorder.html?mode=${encodeURIComponent(selectedMode)}&mic=${encodeURIComponent(String(isMicActive))}`
      );
      chrome.tabs.create({ url });
      window.close();
    });
  }

  // Recent recordings rendering
  async function renderRecentRecordings() {
    try {
      const records = await getAllRecordingsMeta();
      countBadge.textContent = records.length.toString();

      if (records.length === 0) {
        recentListContainer.innerHTML = '';
        recentEmpty.classList.remove('hidden');
        return;
      }

      recentEmpty.classList.add('hidden');
      recentListContainer.innerHTML = '';

      for (const rec of records) {
        const card = document.createElement('div');
        card.className = 'rec-card';

        const info = document.createElement('div');
        info.className = 'rec-info';

        const title = document.createElement('span');
        title.className = 'rec-title';
        title.textContent = rec.title;

        const meta = document.createElement('div');
        meta.className = 'rec-meta';

        const durBadge = document.createElement('span');
        durBadge.className = 'rec-badge';
        durBadge.textContent = `⏱️ ${formatDuration(rec.duration)}`;

        const sizeBadge = document.createElement('span');
        sizeBadge.className = 'rec-badge';
        sizeBadge.textContent = `💾 ${formatBytes(rec.size)}`;

        const dateBadge = document.createElement('span');
        dateBadge.textContent = formatDate(rec.timestamp, currentLang);

        meta.appendChild(durBadge);
        meta.appendChild(sizeBadge);
        meta.appendChild(dateBadge);

        info.appendChild(title);
        info.appendChild(meta);

        // Actions: Preview, Download, Delete
        const actions = document.createElement('div');
        actions.className = 'rec-actions';

        const previewBtn = document.createElement('button');
        previewBtn.className = 'btn-icon';
        previewBtn.title = t('watch', currentLang);
        previewBtn.textContent = '▶️';
        previewBtn.addEventListener('click', () => {
          chrome.tabs.create({ url: chrome.runtime.getURL(`preview.html?id=${rec.id}`) });
        });

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn-icon';
        downloadBtn.title = t('download', currentLang);
        downloadBtn.textContent = '⬇️';
        downloadBtn.addEventListener('click', async () => {
          const fullRec = await getRecording(rec.id);
          if (fullRec && fullRec.blob) {
            const url = URL.createObjectURL(fullRec.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recordflow-${rec.id}.webm`;
            a.click();
            URL.revokeObjectURL(url);
          }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon delete';
        deleteBtn.title = t('btn_delete', currentLang);
        deleteBtn.textContent = '🗑️';
        deleteBtn.addEventListener('click', async () => {
          if (confirm(t('confirm_delete', currentLang))) {
            await deleteRecording(rec.id);
            renderRecentRecordings();
          }
        });

        actions.appendChild(previewBtn);
        actions.appendChild(downloadBtn);
        actions.appendChild(deleteBtn);

        card.appendChild(info);
        card.appendChild(actions);
        recentListContainer.appendChild(card);
      }
    } catch (e) {
      console.error('Failed to load recent recordings:', e);
    }
  }

  // Initial setup
  updateI18nLabels();
  await syncRecordingState();
  await renderRecentRecordings();
});
