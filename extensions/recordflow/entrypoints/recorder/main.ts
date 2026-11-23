import { saveRecording } from '@/utils/db';
import '@shared/components/nival-footer';
import '@shared/components/nival-lang-switch';
import {
  ICON_CAMERA,
  ICON_MONITOR,
  ICON_MONITOR_CAMERA,
  ICON_PAUSE,
  ICON_PLAY,
  ICON_TRASH,
} from '@shared/icons';
import {
  getCurrentLang,
  setLang,
  t,
  formatDuration,
  formatDate,
  type Language,
} from '@/utils/i18n';

document.addEventListener('DOMContentLoaded', async () => {
  let currentLang: Language = await getCurrentLang();

  // Parse URL search parameters
  const urlParams = new URLSearchParams(window.location.search);
  const modeParam = urlParams.get('mode') || 'screen-camera';
  const mode: 'screen-camera' | 'screen' | 'camera' =
    modeParam === 'screen' || modeParam === 'camera' ? modeParam : 'screen-camera';
  const micParam = urlParams.get('mic');
  const isMic = micParam !== 'false';

  // DOM Elements
  const langBtn = document.getElementById('lang-btn') as HTMLButtonElement | null;
  const langLabel = document.getElementById('lang-label') as HTMLElement | null;
  const activeModeBadge = document.getElementById('active-mode-badge') as HTMLElement;
  const statusBadgeText = document.getElementById('status-badge-text') as HTMLElement;
  const liveTimerText = document.getElementById('live-timer-text') as HTMLElement;
  const jumboTimer = document.getElementById('jumbo-timer') as HTMLElement;
  const centerModeIcon = document.getElementById('center-mode-icon') as HTMLElement;
  const btnStop = document.getElementById('btn-stop-recording') as HTMLButtonElement;

  const btnPause = document.getElementById('btn-pause-recording') as HTMLButtonElement;
  const btnPauseLabel = document.getElementById('btn-pause-label') as HTMLElement;
  const pauseIcon = document.getElementById('pause-icon') as HTMLElement;
  const btnDiscard = document.getElementById('btn-discard-recording') as HTMLButtonElement;
  const studioVuBar = document.getElementById('studio-vu-bar') as HTMLElement;

  const countdownOverlay = document.getElementById('countdown-overlay') as HTMLElement;
  const countdownNumber = document.getElementById('countdown-number') as HTMLElement;

  const recordingActiveView = document.getElementById('recording-active-view') as HTMLElement;
  const recordingStandbyView = document.getElementById('recording-standby-view') as HTMLElement;
  const standbyTitle = document.getElementById('standby-title') as HTMLElement;
  const standbyDesc = document.getElementById('standby-desc') as HTMLElement;
  const btnStartShare = document.getElementById('btn-start-share') as HTMLButtonElement;

  // Recording internals
  let mediaRecorder: MediaRecorder | null = null;
  let recordedChunks: Blob[] = [];
  let screenStream: MediaStream | null = null;
  let cameraStream: MediaStream | null = null;
  let micStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let vuAnalyser: AnalyserNode | null = null;
  let vuAnimId: number | null = null;
  let canvasStream: MediaStream | null = null;
  let animFrameId: number | null = null;

  let isRecording = false;
  let isStopping = false;
  let isPaused = false;
  let recordingStartTime = 0;
  let accumulatedElapsedMs = 0;
  let lastResumeTime = 0;
  let timerInterval: number | null = null;

  function updateI18nLabels() {
    if (langLabel) langLabel.textContent = currentLang.toUpperCase();
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = t(key, currentLang);
      }
    });

    // Update dynamic mode badge
    if (mode === 'screen-camera') {
      activeModeBadge.innerHTML = `${ICON_MONITOR_CAMERA} <span>${t('mode_screen_camera', currentLang)}</span>`;
      centerModeIcon.innerHTML = ICON_MONITOR_CAMERA;
    } else if (mode === 'screen') {
      activeModeBadge.innerHTML = `${ICON_MONITOR} <span>${t('mode_screen_only', currentLang)}</span>`;
      centerModeIcon.innerHTML = ICON_MONITOR;
    } else {
      activeModeBadge.innerHTML = `${ICON_CAMERA} <span>${t('mode_camera_only', currentLang)}</span>`;
      centerModeIcon.innerHTML = ICON_CAMERA;
    }

    if (isPaused) {
      statusBadgeText.textContent = t('floating_paused', currentLang);
      btnPauseLabel.textContent = t('floating_resume', currentLang);
    } else if (isRecording) {
      statusBadgeText.textContent = t('universal_status_recording', currentLang);
      btnPauseLabel.textContent = t('floating_pause', currentLang);
    }
  }

  // Language switcher
  if (langBtn) {
    langBtn.addEventListener('click', async () => {
      currentLang = currentLang === 'es' ? 'en' : 'es';
      await setLang(currentLang);
      updateI18nLabels();
    });
  }

  window.addEventListener('langchange', async (e: Event) => {
    const ce = e as CustomEvent<{ lang?: Language }>;
    if (ce.detail?.lang && (ce.detail.lang === 'es' || ce.detail.lang === 'en')) {
      currentLang = ce.detail.lang;
      await setLang(currentLang);
      updateI18nLabels();
    }
  });

  function playTone(freq: number) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // ignore
    }
  }

  function getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'video/webm';
  }

  function releaseHardware() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (vuAnimId) {
      cancelAnimationFrame(vuAnimId);
      vuAnimId = null;
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    const streams = [screenStream, cameraStream, micStream, canvasStream];
    for (const st of streams) {
      if (st) {
        st.getTracks().forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
          } catch {
            // ignore
          }
        });
      }
    }
    screenStream = null;
    cameraStream = null;
    micStream = null;
    canvasStream = null;
    vuAnalyser = null;

    if (studioVuBar) {
      studioVuBar.style.width = '0%';
    }

    if (audioContext && audioContext.state !== 'closed') {
      try {
        audioContext.close();
      } catch {
        // ignore
      }
      audioContext = null;
    }
  }

  function showStandbyUI(isCancelled = false) {
    recordingActiveView.classList.add('hidden');
    recordingStandbyView.classList.remove('hidden');

    if (isCancelled) {
      standbyTitle.textContent = t('universal_cancelled_title', currentLang);
      standbyDesc.textContent = t('universal_cancelled_desc', currentLang);
      btnStartShare.textContent = t('universal_btn_retry', currentLang);
    } else {
      standbyTitle.textContent = t('universal_prompt_title', currentLang);
      standbyDesc.textContent = t('universal_prompt_desc', currentLang);
      btnStartShare.textContent = t('universal_btn_start_share', currentLang);
    }
  }

  function showActiveUI() {
    recordingStandbyView.classList.add('hidden');
    recordingActiveView.classList.remove('hidden');
  }

  // 3.. 2.. 1.. Animated Countdown Overlay
  function runStudioCountdown(onComplete: () => void) {
    if (!countdownOverlay || !countdownNumber) {
      onComplete();
      return;
    }

    countdownOverlay.classList.remove('hidden');
    countdownNumber.textContent = '3';
    playTone(520);

    let step = 3;
    const interval = window.setInterval(() => {
      step--;
      if (step > 0) {
        playTone(520);
        countdownNumber.style.animation = 'none';
        void countdownNumber.offsetWidth; // trigger reflow
        countdownNumber.style.animation = 'pop-digit-studio 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        countdownNumber.textContent = step.toString();
      } else {
        clearInterval(interval);
        playTone(880);
        countdownOverlay.classList.add('hidden');
        onComplete();
      }
    }, 1000);
  }

  async function startRecording() {
    try {
      recordedChunks = [];
      isStopping = false;
      isPaused = false;
      accumulatedElapsedMs = 0;

      let finalStreamToRecord: MediaStream;

      if (mode === 'camera') {
        // Camera Only Mode
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'user',
          },
          audio: isMic ? { echoCancellation: true, noiseSuppression: true } : false,
        });

        finalStreamToRecord = cameraStream;
      } else {
        // Screen or Screen+Camera Mode
        if (mode === 'screen-camera') {
          try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 640 },
                height: { ideal: 640 },
                facingMode: 'user',
              },
              audio: false,
            });
          } catch (camErr) {
            console.warn('[RecordFlow Studio] Camera access failed for bubble compositor:', camErr);
            cameraStream = null;
          }
        }

        // Prompt screen capture
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: { ideal: 60, max: 60 },
          },
          audio: true, // System audio
        });

        // Listen to native Chrome screen sharing stop button
        screenStream.getVideoTracks()[0].onended = () => {
          stopAndSaveRecording();
        };

        // Microphone audio capture if requested
        if (isMic) {
          try {
            micStream = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true },
            });
          } catch (micErr) {
            console.warn('[RecordFlow Studio] Mic access failed:', micErr);
            micStream = null;
          }
        }

        // Handle audio mixing & VU-meter via AudioContext
        const screenAudioTracks = screenStream.getAudioTracks();
        const micAudioTracks = micStream?.getAudioTracks() || [];
        let mixedAudioStream: MediaStream | null = null;

        if (screenAudioTracks.length > 0 || micAudioTracks.length > 0) {
          try {
            audioContext = new AudioContext();
            const destination = audioContext.createMediaStreamDestination();

            // Set up real-time VU-meter Analyser
            vuAnalyser = audioContext.createAnalyser();
            vuAnalyser.fftSize = 64;
            vuAnalyser.smoothingTimeConstant = 0.5;

            if (screenAudioTracks.length > 0) {
              const screenSource = audioContext.createMediaStreamSource(new MediaStream(screenAudioTracks));
              screenSource.connect(destination);
              screenSource.connect(vuAnalyser);
            }

            if (micAudioTracks.length > 0 && micStream) {
              const micSource = audioContext.createMediaStreamSource(micStream);
              micSource.connect(destination);
              micSource.connect(vuAnalyser);
            }

            mixedAudioStream = destination.stream;

            // Start VU-meter animation loop
            const dataArray = new Uint8Array(vuAnalyser.frequencyBinCount);
            const loopVU = () => {
              if (vuAnalyser && studioVuBar) {
                vuAnalyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const avg = sum / dataArray.length;
                const pct = isPaused ? 0 : Math.min(100, Math.round((avg / 85) * 100));
                studioVuBar.style.width = `${pct}%`;
              }
              vuAnimId = requestAnimationFrame(loopVU);
            };
            loopVU();
          } catch (audioErr) {
            console.warn('[RecordFlow Studio] Audio mixing error:', audioErr);
          }
        }

        if (mode === 'screen-camera') {
          // 60 FPS Canvas Compositor with circular webcam bubble
          const screenVideo = document.createElement('video');
          screenVideo.srcObject = screenStream;
          screenVideo.muted = true;
          screenVideo.playsInline = true;
          await screenVideo.play();

          let camVideo: HTMLVideoElement | null = null;
          if (cameraStream) {
            camVideo = document.createElement('video');
            camVideo.srcObject = cameraStream;
            camVideo.muted = true;
            camVideo.playsInline = true;
            await camVideo.play();
          }

          const canvas = document.createElement('canvas');
          canvas.width = screenVideo.videoWidth || 1920;
          canvas.height = screenVideo.videoHeight || 1080;
          const rawCtx = canvas.getContext('2d', { alpha: false });

          if (!rawCtx) {
            throw new Error('Failed to create 2D canvas context');
          }
          const ctx: CanvasRenderingContext2D = rawCtx;

          function renderFrame() {
            if (isStopping) return;

            if (screenVideo.videoWidth && canvas.width !== screenVideo.videoWidth) {
              canvas.width = screenVideo.videoWidth;
              canvas.height = screenVideo.videoHeight;
            }

            const width = canvas.width;
            const height = canvas.height;

            // 1. Draw screen
            ctx.drawImage(screenVideo, 0, 0, width, height);

            // 2. Draw circular webcam bubble (with indigo glow border) in bottom-left corner
            if (camVideo && camVideo.readyState >= 2) {
              const bubbleDiameter = Math.min(width, height) * 0.22;
              const margin = Math.round(width * 0.025) + 12;
              const radius = bubbleDiameter / 2;
              const centerX = margin + radius;
              const centerY = height - margin - radius;

              ctx.save();

              // Indigo glow shadow
              ctx.shadowColor = 'rgba(99, 102, 241, 0.8)';
              ctx.shadowBlur = 24;
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
              ctx.fillStyle = '#6366f1';
              ctx.fill();

              // Clip circular webcam view
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();

              // Mirror camera for natural feel
              ctx.save();
              ctx.translate(centerX, centerY);
              ctx.scale(-1, 1);
              const camW = camVideo.videoWidth || 640;
              const camH = camVideo.videoHeight || 640;
              const minSide = Math.min(camW, camH);
              const sx = (camW - minSide) / 2;
              const sy = (camH - minSide) / 2;
              ctx.drawImage(camVideo, sx, sy, minSide, minSide, -radius, -radius, bubbleDiameter, bubbleDiameter);
              ctx.restore();

              // Outer indigo border
              ctx.restore();
              ctx.save();
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              ctx.lineWidth = 4;
              ctx.strokeStyle = '#6366f1';
              ctx.stroke();
              ctx.restore();
            }

            animFrameId = requestAnimationFrame(renderFrame);
          }

          renderFrame();

          canvasStream = canvas.captureStream(60);

          // Add audio tracks if any
          const audioTracks = mixedAudioStream ? mixedAudioStream.getAudioTracks() : screenStream.getAudioTracks();
          audioTracks.forEach((t) => canvasStream!.addTrack(t));

          finalStreamToRecord = canvasStream;
        } else {
          // Screen Only Mode
          const tracks: MediaStreamTrack[] = [...screenStream.getVideoTracks()];
          const audioTracks = mixedAudioStream ? mixedAudioStream.getAudioTracks() : screenStream.getAudioTracks();
          audioTracks.forEach((t) => tracks.push(t));

          finalStreamToRecord = new MediaStream(tracks);
        }
      }

      // Run 3.. 2.. 1.. Animated Countdown before capturing starts
      runStudioCountdown(() => {
        // Initialize MediaRecorder
        const mimeType = getSupportedMimeType();
        mediaRecorder = new MediaRecorder(finalStreamToRecord, {
          mimeType,
          videoBitsPerSecond: 4_000_000,
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          finalizeAndSave();
        };

        mediaRecorder.start(1000); // 1s chunks
        isRecording = true;
        showActiveUI();

        // Start live timer
        recordingStartTime = Date.now();
        lastResumeTime = Date.now();
        accumulatedElapsedMs = 0;
        liveTimerText.textContent = '00:00';
        jumboTimer.textContent = '00:00';

        if (timerInterval) clearInterval(timerInterval);
        timerInterval = window.setInterval(() => {
          if (!isPaused) {
            const currentMs = accumulatedElapsedMs + (Date.now() - lastResumeTime);
            const secs = Math.floor(currentMs / 1000);
            const formatted = formatDuration(secs);
            liveTimerText.textContent = formatted;
            jumboTimer.textContent = formatted;
          }
        }, 500);

        // Notify background about active recording
        chrome.tabs.getCurrent(async (tab) => {
          await chrome.storage.local.set({
            recordflow_state: {
              isRecording: true,
              tabId: tab?.id,
              mode,
              mic: isMic,
              startTime: recordingStartTime,
            },
          });
        });
      });
    } catch (err: any) {
      console.warn('[RecordFlow Studio] Failed to start screen sharing:', err);
      releaseHardware();
      showStandbyUI(true);
    }
  }

  // Pause / Resume handler
  btnPause.addEventListener('click', () => {
    if (!mediaRecorder) return;

    if (mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      isPaused = true;
      accumulatedElapsedMs += Date.now() - lastResumeTime;
      btnPause.classList.add('is-paused');
      btnPauseLabel.textContent = t('floating_resume', currentLang);
      pauseIcon.innerHTML = ICON_PLAY;
      statusBadgeText.textContent = t('floating_paused', currentLang);
    } else if (mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      isPaused = false;
      lastResumeTime = Date.now();
      btnPause.classList.remove('is-paused');
      btnPauseLabel.textContent = t('floating_pause', currentLang);
      pauseIcon.innerHTML = ICON_PAUSE;
      statusBadgeText.textContent = t('universal_status_recording', currentLang);
    }
  });

  // Discard handler
  btnDiscard.addEventListener('click', async () => {
    if (confirm(t('confirm_discard', currentLang))) {
      releaseHardware();
      recordedChunks = [];
      mediaRecorder = null;
      isRecording = false;
      isStopping = false;
      isPaused = false;
      await chrome.storage.local.set({
        recordflow_state: { isRecording: false },
      });
      showStandbyUI(true);
    }
  });

  async function stopAndSaveRecording() {
    if (isStopping) return;
    isStopping = true;

    btnStop.disabled = true;
    btnStop.textContent = 'Guardando...';

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    } else {
      await finalizeAndSave();
    }
  }

  async function finalizeAndSave() {
    const currentMs = isPaused
      ? accumulatedElapsedMs
      : accumulatedElapsedMs + (Date.now() - lastResumeTime);
    const elapsedSeconds = Math.max(1, Math.round(currentMs / 1000));
    releaseHardware();

    const mimeType = getSupportedMimeType();
    const finalBlob = new Blob(recordedChunks, { type: mimeType });
    const recId = `rf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const title = `${t('app_name', currentLang)} — ${formatDate(Date.now(), currentLang)}`;

    try {
      await saveRecording({
        id: recId,
        title,
        timestamp: Date.now(),
        duration: elapsedSeconds,
        size: finalBlob.size,
        mode,
        mimeType,
        blob: finalBlob,
      });

      await chrome.storage.local.set({
        recordflow_state: { isRecording: false },
      });

      // Automatically navigate to preview.html?id=${id}
      window.location.href = chrome.runtime.getURL(`preview.html?id=${recId}`);
    } catch (dbErr) {
      console.error('[RecordFlow Studio] Error saving recording to IndexedDB:', dbErr);
      btnStop.disabled = false;
      btnStop.textContent = 'Error al guardar';
    } finally {
      recordedChunks = [];
      mediaRecorder = null;
      isRecording = false;
      isStopping = false;
      isPaused = false;
    }
  }

  // Finish button click
  btnStop.addEventListener('click', () => {
    stopAndSaveRecording();
  });

  // Standby start button click
  btnStartShare.addEventListener('click', () => {
    startRecording();
  });

  // Listen for background stop message
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'STOP_RECORDING_INTERNAL') {
      stopAndSaveRecording();
      sendResponse({ success: true });
      return true;
    }
  });

  // Clean up on tab close
  window.addEventListener('beforeunload', () => {
    releaseHardware();
    chrome.storage.local.set({
      recordflow_state: { isRecording: false },
    });
  });

  // Initialization: update labels and prompt recording immediately
  updateI18nLabels();
  await startRecording();
});
