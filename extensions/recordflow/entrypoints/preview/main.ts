import {
  getRecording,
  getAllRecordingsMeta,
  updateRecordingTitle,
  deleteRecording,
  type Recording,
} from '@/utils/db';
import { convertWebmToMp4 } from '@/utils/mp4';
import '@shared/components/nival-footer';
import '@shared/components/nival-lang-switch';
import {
  ICON_CLOCK,
  ICON_HARD_DRIVE,
  ICON_CALENDAR,
  ICON_CAMERA,
  ICON_MONITOR,
  ICON_MONITOR_CAMERA,
} from '@shared/icons';
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
  let currentRecording: Recording | null = null;
  let currentBlobUrl: string | null = null;

  // Query parameter recording ID
  const urlParams = new URLSearchParams(window.location.search);
  let targetId = urlParams.get('id');

  // DOM Elements
  const langBtn = document.getElementById('lang-btn') as HTMLButtonElement | null;
  const langLabel = document.getElementById('lang-label') as HTMLElement | null;

  const videoPlayer = document.getElementById('video-player') as HTMLVideoElement;
  const videoLoader = document.getElementById('video-loader') as HTMLElement;

  const titleInput = document.getElementById('recording-title-input') as HTMLInputElement;
  const metricDuration = document.getElementById('metric-duration') as HTMLElement;
  const metricSize = document.getElementById('metric-size') as HTMLElement;
  const metricMode = document.getElementById('metric-mode') as HTMLElement;
  const metricDate = document.getElementById('metric-date') as HTMLElement;

  const btnDownloadMp4 = document.getElementById('btn-download-mp4') as HTMLButtonElement | null;
  const labelDownloadMp4 = document.getElementById('label-download-mp4') as HTMLElement | null;
  const btnDownloadWebm = document.getElementById('btn-download-webm') as HTMLButtonElement | null;
  const labelDownloadWebm = document.getElementById('label-download-webm') as HTMLElement | null;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement;
  const copyLabel = document.getElementById('copy-label') as HTMLElement;
  const btnRecordNew = document.getElementById('btn-record-new') as HTMLButtonElement;
  const btnDelete = document.getElementById('btn-delete') as HTMLButtonElement;

  const libraryGrid = document.getElementById('library-grid') as HTMLElement;
  const libraryCount = document.getElementById('library-count') as HTMLElement;
  const speedButtons = document.querySelectorAll('.btn-speed') as NodeListOf<HTMLButtonElement>;

  // Playback speed controls
  speedButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.getAttribute('data-speed') || '1');
      videoPlayer.playbackRate = speed;
      speedButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  function updateI18nLabels() {
    if (langLabel) langLabel.textContent = currentLang.toUpperCase();
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = t(key, currentLang);
      }
    });

    if (currentRecording) {
      updateMetrics(currentRecording);
    }
  }

  function updateMetrics(rec: Recording) {
    metricDuration.innerHTML = `${ICON_CLOCK} <span>${formatDuration(rec.duration)}</span>`;
    metricSize.innerHTML = `${ICON_HARD_DRIVE} <span>${formatBytes(rec.size)}</span>`;
    metricDate.innerHTML = `${ICON_CALENDAR} <span>${formatDate(rec.timestamp, currentLang)}</span>`;

    const modeLabels: Record<string, string> = {
      'screen-camera': t('mode_screen_camera', currentLang),
      screen: t('mode_screen_only', currentLang),
      camera: t('mode_camera_only', currentLang),
    };
    const modeIcon =
      rec.mode === 'screen-camera'
        ? ICON_MONITOR_CAMERA
        : rec.mode === 'screen'
        ? ICON_MONITOR
        : ICON_CAMERA;
    metricMode.innerHTML = `${modeIcon} <span>${modeLabels[rec.mode] || rec.mode}</span>`;
  }

  // Load target recording
  async function loadRecording(id: string | null) {
    videoLoader.classList.remove('hidden');

    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }

    if (!id) {
      // If no ID provided, pick the most recent recording
      const all = await getAllRecordingsMeta();
      if (all.length > 0) {
        id = all[0].id;
      }
    }

    if (!id) {
      videoLoader.textContent = t('no_recordings_title', currentLang);
      return;
    }

    targetId = id;
    currentRecording = await getRecording(id);

    // Si aún no está listo el registro en IndexedDB (carrera de guardado), reintentar hasta 5 veces
    if (!currentRecording) {
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        currentRecording = await getRecording(id);
        if (currentRecording) break;
      }
    }

    if (!currentRecording || !currentRecording.blob) {
      videoLoader.textContent = 'Recording not found in local database.';
      return;
    }

    // Set video src and load directly without destructive seeking
    currentBlobUrl = URL.createObjectURL(currentRecording.blob);
    videoPlayer.src = currentBlobUrl;
    videoPlayer.load();

    const hideLoader = () => {
      videoLoader.classList.add('hidden');
    };
    videoPlayer.onloadeddata = hideLoader;
    videoPlayer.oncanplay = hideLoader;
    videoPlayer.onerror = (e) => {
      console.warn('Video load error:', e);
      videoLoader.textContent = 'Error al reproducir el video.';
    };

    // Set title and metrics
    titleInput.value = currentRecording.title;
    updateMetrics(currentRecording);

    // Render library grid
    renderLibrary();
  }

  // Language switch
  if (langBtn) {
    langBtn.addEventListener('click', async () => {
      currentLang = currentLang === 'es' ? 'en' : 'es';
      await setLang(currentLang);
      updateI18nLabels();
      renderLibrary();
    });
  }

  window.addEventListener('langchange', async (e: Event) => {
    const ce = e as CustomEvent<{ lang?: Language }>;
    if (ce.detail?.lang && (ce.detail.lang === 'es' || ce.detail.lang === 'en')) {
      currentLang = ce.detail.lang;
      await setLang(currentLang);
      updateI18nLabels();
      renderLibrary();
    }
  });

  // Rename title
  titleInput.addEventListener('change', async () => {
    if (currentRecording && titleInput.value.trim()) {
      currentRecording.title = titleInput.value.trim();
      await updateRecordingTitle(currentRecording.id, currentRecording.title);
      renderLibrary();
    }
  });

  // Download Video as MP4 (Universal)
  if (btnDownloadMp4) {
    btnDownloadMp4.addEventListener('click', async () => {
      if (!currentRecording || !currentRecording.blob) return;

      const originalText = labelDownloadMp4?.textContent || t('btn_download_mp4', currentLang);
      btnDownloadMp4.disabled = true;

      try {
        if (labelDownloadMp4) {
          labelDownloadMp4.textContent = currentLang === 'es' ? 'Convirtiendo a MP4...' : 'Converting to MP4...';
        }

        const mp4Blob = await convertWebmToMp4(currentRecording.blob, (pct) => {
          if (labelDownloadMp4) {
            labelDownloadMp4.textContent = currentLang === 'es' ? `Exportando MP4 (${pct}%)...` : `Exporting MP4 (${pct}%)...`;
          }
        });

        if (labelDownloadMp4) {
          labelDownloadMp4.textContent = currentLang === 'es' ? 'Descargando...' : 'Downloading...';
        }

        const url = URL.createObjectURL(mp4Blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanTitle = currentRecording.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-');
        a.download = `${cleanTitle || 'recordflow'}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      } catch (err: any) {
        console.error('MP4 export error:', err);
        alert(currentLang === 'es' ? 'No se pudo procesar a MP4. Descargando archivo WebM original...' : 'Could not export to MP4. Downloading original WebM...');
        if (btnDownloadWebm) btnDownloadWebm.click();
      } finally {
        btnDownloadMp4.disabled = false;
        if (labelDownloadMp4) labelDownloadMp4.textContent = originalText;
      }
    });
  }

  // Download Video as WebM (Instant)
  if (btnDownloadWebm) {
    btnDownloadWebm.addEventListener('click', () => {
      if (!currentRecording || !currentBlobUrl) return;

      const a = document.createElement('a');
      a.href = currentBlobUrl;
      const cleanTitle = currentRecording.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
      a.download = `${cleanTitle || 'recordflow'}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  // Copy local blob link
  btnCopy.addEventListener('click', async () => {
    if (!currentBlobUrl) return;
    try {
      await navigator.clipboard.writeText(currentBlobUrl);
      copyLabel.textContent = t('btn_link_copied', currentLang);
      btnCopy.style.borderColor = '#10b981';
      setTimeout(() => {
        copyLabel.textContent = t('btn_copy_link', currentLang);
        btnCopy.style.borderColor = '';
      }, 2000);
    } catch {
      copyLabel.textContent = 'Error copying';
    }
  });

  // Record New Video
  btnRecordNew.addEventListener('click', () => {
    alert(
      currentLang === 'es'
        ? 'Para iniciar una nueva grabación, haz clic en el icono de RecordFlow en la barra de extensiones.'
        : 'To start a new recording, click the RecordFlow icon in your browser extensions bar.'
    );
  });

  // Delete recording
  btnDelete.addEventListener('click', async () => {
    if (!currentRecording) return;
    if (confirm(t('confirm_delete', currentLang))) {
      await deleteRecording(currentRecording.id);
      // Reload library or newest
      const remaining = await getAllRecordingsMeta();
      if (remaining.length > 0) {
        window.location.search = `?id=${remaining[0].id}`;
      } else {
        window.location.search = '';
      }
    }
  });

  // Render Saved Recordings Library
  async function renderLibrary() {
    const records = await getAllRecordingsMeta();
    libraryCount.textContent = `${records.length} videos`;
    libraryGrid.innerHTML = '';

    for (const rec of records) {
      const card = document.createElement('div');
      card.className = 'lib-card';
      if (rec.id === targetId) {
        card.classList.add('current');
      }

      const title = document.createElement('span');
      title.className = 'lib-title';
      title.textContent = rec.title;

      const meta = document.createElement('div');
      meta.className = 'lib-meta';

      const durSpan = document.createElement('span');
      durSpan.className = 'lib-metric';
      durSpan.innerHTML = `${ICON_CLOCK} <span>${formatDuration(rec.duration)}</span>`;

      const sizeSpan = document.createElement('span');
      sizeSpan.className = 'lib-metric';
      sizeSpan.innerHTML = `${ICON_HARD_DRIVE} <span>${formatBytes(rec.size)}</span>`;

      meta.appendChild(durSpan);
      meta.appendChild(sizeSpan);

      card.appendChild(title);
      card.appendChild(meta);

      card.addEventListener('click', () => {
        if (rec.id !== targetId) {
          window.location.search = `?id=${rec.id}`;
        }
      });

      libraryGrid.appendChild(card);
    }
  }

  // Initial load
  updateI18nLabels();
  await loadRecording(targetId);
});
