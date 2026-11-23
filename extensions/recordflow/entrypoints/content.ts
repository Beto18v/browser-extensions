import { saveRecording } from '@/utils/db';
import { getCurrentLang, t, formatDate, formatDuration, Language } from '@/utils/i18n';
import {
  ICON_PAUSE,
  ICON_PLAY,
  ICON_MIC,
  ICON_MIC_OFF,
  ICON_EYE,
  ICON_EYE_OFF,
  ICON_TRASH,
  ICON_VIDEO,
  ICON_CAMERA,
  ICON_MONITOR,
  ICON_MONITOR_CAMERA,
  ICON_STOP,
  ICON_X,
  ICON_RECORD,
} from '@shared/icons';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    let mediaRecorder: MediaRecorder | null = null;
    let recordedChunks: Blob[] = [];
    let overlayHost: HTMLElement | null = null;
    let shadowRoot: ShadowRoot | null = null;
    let timerInterval: number | null = null;
    let isStopping = false;
    let isPaused = false;

    // Timing tracking across pauses
    let recordingStartTime = 0;
    let accumulatedElapsedMs = 0;
    let lastResumeTime = 0;
    let totalDurationSeconds = 0;

    // Active recording streams to clean up
    let cameraStream: MediaStream | null = null;
    let screenStream: MediaStream | null = null;
    let micStream: MediaStream | null = null;
    let combinedStream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;

    // Camera bubble states
    let currentBubbleSize: 's' | 'm' | 'l' = 'm';
    let isCameraHidden = false;
    let isMicMuted = false;
    let savedBubbleX = 100;
    let savedBubbleY = typeof window !== 'undefined' ? Math.max(80, window.innerHeight - 230) : 400;

    // Floating Studio Hub & Launcher states
    let launcherHost: HTMLElement | null = null;
    let hubHost: HTMLElement | null = null;
    let preBubbleHost: HTMLElement | null = null;
    let hubCamStream: MediaStream | null = null;
    let hubMicStream: MediaStream | null = null;
    let hubAudioCtx: AudioContext | null = null;
    let hubAnalyser: AnalyserNode | null = null;
    let hubAnimId: number | null = null;

    let hubSelectedMode: 'screen-camera' | 'screen' | 'camera' = 'screen-camera';
    let hubIsMicActive = true;
    let hubIsCamActive = true;

    // Determine supported WebM mime type
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

    // Stop all recording tracks and release camera / mic hardware immediately
    function releaseAllHardware() {
      const streams = [cameraStream, screenStream, micStream, combinedStream];
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
      cameraStream = null;
      screenStream = null;
      micStream = null;
      combinedStream = null;

      if (audioContext && audioContext.state !== 'closed') {
        try {
          audioContext.close();
        } catch {
          // ignore
        }
        audioContext = null;
      }
    }

    // Remove recording floating overlay from DOM
    function removeRecordingOverlay() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      if (overlayHost && overlayHost.parentNode) {
        overlayHost.parentNode.removeChild(overlayHost);
      }
      overlayHost = null;
      shadowRoot = null;
    }

    // Stop Hub hardware streams (preview camera & audio meter)
    function stopHubHardware() {
      if (hubAnimId) {
        cancelAnimationFrame(hubAnimId);
        hubAnimId = null;
      }
      if (hubCamStream) {
        hubCamStream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
        hubCamStream = null;
      }
      if (hubMicStream) {
        hubMicStream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
        hubMicStream = null;
      }
      if (hubAudioCtx && hubAudioCtx.state !== 'closed') {
        try {
          hubAudioCtx.close();
        } catch {}
        hubAudioCtx = null;
      }
      hubAnalyser = null;
    }

    function removePreBubble() {
      if (preBubbleHost && preBubbleHost.parentNode) {
        preBubbleHost.parentNode.removeChild(preBubbleHost);
      }
      preBubbleHost = null;
    }

    function removeFloatingHubCardOnly() {
      if (hubHost && hubHost.parentNode) {
        hubHost.parentNode.removeChild(hubHost);
      }
      hubHost = null;
    }

    function removeFloatingHub() {
      removePreBubble();
      stopHubHardware();
      removeFloatingHubCardOnly();
    }

    // Loom-Style Live Draggable Preview Bubble (Pre-recording)
    function injectPreviewBubble(camStream: MediaStream) {
      removePreBubble();

      preBubbleHost = document.createElement('div');
      preBubbleHost.id = 'recordflow-prebubble-host';
      preBubbleHost.style.position = 'fixed';
      preBubbleHost.style.zIndex = '2147483647';
      preBubbleHost.style.top = '0';
      preBubbleHost.style.left = '0';
      preBubbleHost.style.width = '100vw';
      preBubbleHost.style.height = '100vh';
      preBubbleHost.style.pointerEvents = 'none';

      const shadow = preBubbleHost.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          user-select: none;
        }

        .camera-bubble-wrapper {
          position: fixed;
          pointer-events: auto;
          cursor: grab;
          z-index: 2147483647 !important;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .camera-bubble-wrapper:active {
          cursor: grabbing;
        }

        .camera-bubble {
          width: 175px;
          height: 175px;
          border-radius: 50%;
          overflow: hidden;
          background: #0f172a;
          border: 3.5px solid #6366f1;
          box-shadow: 
            0 0 25px rgba(99, 102, 241, 0.55),
            0 12px 36px rgba(0, 0, 0, 0.45);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .camera-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .btn-bubble-pip {
          position: absolute;
          top: 10px;
          right: 14px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s ease, transform 0.15s ease;
          z-index: 10;
        }

        .camera-bubble-wrapper:hover .btn-bubble-pip {
          opacity: 1;
        }

        .btn-bubble-pip:hover {
          transform: scale(1.1);
          background: #6366f1;
        }

        .prebubble-badge {
          position: absolute;
          bottom: 8px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 9999px;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 700;
          color: #a5b4fc;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          pointer-events: none;
        }
      `;

      shadow.appendChild(style);

      const bubbleWrap = document.createElement('div');
      bubbleWrap.className = 'camera-bubble-wrapper';

      const bubbleInner = document.createElement('div');
      bubbleInner.className = 'camera-bubble';

      const video = document.createElement('video');
      video.className = 'camera-video';
      video.autoplay = true;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('autoplay', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');

      const badge = document.createElement('span');
      badge.className = 'prebubble-badge';
      badge.textContent = 'RecordFlow';

      bubbleInner.appendChild(video);
      bubbleInner.appendChild(badge);
      bubbleWrap.appendChild(bubbleInner);

      bubbleWrap.style.left = `${savedBubbleX}px`;
      bubbleWrap.style.top = `${savedBubbleY}px`;

      shadow.appendChild(bubbleWrap);
      document.body.appendChild(preBubbleHost);

      // Conectar stream una vez en el DOM para evitar buffering infinito en Chrome
      video.srcObject = camStream;
      video.onloadedmetadata = () => {
        video.play().catch(() => {});
      };
      video.play().catch(() => {});

      let isDragging = false;
      let startX = 0;
      let startY = 0;

      bubbleWrap.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX - savedBubbleX;
        startY = e.clientY - savedBubbleY;
        bubbleWrap.setPointerCapture(e.pointerId);
      });

      bubbleWrap.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const newX = e.clientX - startX;
        const newY = e.clientY - startY;
        const rect = bubbleWrap.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - 8;
        const maxY = window.innerHeight - rect.height - 8;

        savedBubbleX = Math.max(8, Math.min(newX, maxX));
        savedBubbleY = Math.max(8, Math.min(newY, maxY));

        bubbleWrap.style.left = `${savedBubbleX}px`;
        bubbleWrap.style.top = `${savedBubbleY}px`;
      });

      const stopDrag = (e: PointerEvent) => {
        if (!isDragging) return;
        isDragging = false;
        try {
          bubbleWrap.releasePointerCapture(e.pointerId);
        } catch {}
      };

      bubbleWrap.addEventListener('pointerup', stopDrag);
      bubbleWrap.addEventListener('pointercancel', stopDrag);
    }

    // Play subtle audio tone for countdown
    function playCountdownTone(freq: number) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } catch {
        // ignore audio errors
      }
    }

    // Stop recording, persist blob to IndexedDB, and open preview
    async function stopRecording(mode: string) {
      if (isStopping) return;
      isStopping = true;

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      const currentElapsed = isPaused
        ? accumulatedElapsedMs
        : accumulatedElapsedMs + (Date.now() - lastResumeTime);
      totalDurationSeconds = Math.max(1, Math.round(currentElapsed / 1000));

      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      } else {
        await finishAndSave(mode);
      }
    }

    async function finishAndSave(mode: string) {
      releaseAllHardware();
      removeRecordingOverlay();

      const mimeType = getSupportedMimeType();
      const finalBlob = new Blob(recordedChunks, { type: mimeType });
      const recId = `rf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const lang = await getCurrentLang();
      const title = `${t('app_name', lang)} — ${formatDate(Date.now(), lang)}`;

      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          chrome.runtime.sendMessage({
            type: 'RECORDING_FINISHED',
            id: recId,
            title,
            duration: totalDurationSeconds,
            size: finalBlob.size,
            mode,
            mimeType,
            dataUrl,
          });
        };
        reader.readAsDataURL(finalBlob);
      } catch (err) {
        console.error('[RecordFlow] Failed to save recording:', err);
      } finally {
        recordedChunks = [];
        mediaRecorder = null;
        isStopping = false;
        isPaused = false;
      }
    }

    // Cancel and discard recording immediately
    function discardRecording() {
      releaseAllHardware();
      removeRecordingOverlay();
      recordedChunks = [];
      mediaRecorder = null;
      isStopping = false;
      isPaused = false;
      chrome.runtime.sendMessage({ type: 'RECORDING_CANCELLED' });
    }

    // Animated 3... 2... 1... Countdown
    function runCountdown(onComplete: () => void) {
      removeRecordingOverlay();

      overlayHost = document.createElement('div');
      overlayHost.id = 'recordflow-overlay-root';
      overlayHost.style.position = 'fixed';
      overlayHost.style.zIndex = '2147483640';
      overlayHost.style.top = '0';
      overlayHost.style.left = '0';
      overlayHost.style.width = '100vw';
      overlayHost.style.height = '100vh';
      overlayHost.style.pointerEvents = 'none';

      shadowRoot = overlayHost.attachShadow({ mode: 'open' });

      const styleEl = document.createElement('style');
      styleEl.textContent = `
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          user-select: none;
        }

        .countdown-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          pointer-events: auto;
          transition: opacity 0.25s ease-out;
        }

        .countdown-card {
          width: 160px;
          height: 160px;
          border-radius: 40px;
          background: rgba(15, 23, 42, 0.9);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          box-shadow: 
            0 20px 50px rgba(0, 0, 0, 0.6),
            0 0 35px rgba(99, 102, 241, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .countdown-number {
          font-size: 72px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          animation: pop-digit 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          text-shadow: 0 0 20px rgba(99, 102, 241, 0.8);
        }

        .countdown-label {
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #a5b4fc;
        }

        @keyframes pop-digit {
          0% {
            opacity: 0;
            transform: scale(1.6);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
          85% {
            opacity: 1;
            transform: scale(0.96);
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }
      `;

      shadowRoot.appendChild(styleEl);

      const backdrop = document.createElement('div');
      backdrop.className = 'countdown-backdrop';

      const card = document.createElement('div');
      card.className = 'countdown-card';

      const numEl = document.createElement('span');
      numEl.className = 'countdown-number';
      numEl.textContent = '3';

      const labelEl = document.createElement('span');
      labelEl.className = 'countdown-label';
      labelEl.textContent = 'RecordFlow';

      card.appendChild(numEl);
      card.appendChild(labelEl);
      backdrop.appendChild(card);
      shadowRoot.appendChild(backdrop);
      document.body.appendChild(overlayHost);

      let step = 3;
      playCountdownTone(520);

      const interval = window.setInterval(() => {
        step--;
        if (step > 0) {
          playCountdownTone(520);
          numEl.style.animation = 'none';
          void numEl.offsetWidth;
          numEl.style.animation = 'pop-digit 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards';
          numEl.textContent = step.toString();
        } else {
          clearInterval(interval);
          playCountdownTone(880);
          backdrop.style.opacity = '0';
          setTimeout(() => {
            onComplete();
          }, 200);
        }
      }, 1000);
    }

    // Create and inject the Loom-style Vertical Control Dock & Circular Webcam Bubble
    function injectFloatingRecordingUI(camStream: MediaStream | null, mode: string, lang: 'es' | 'en') {
      removeRecordingOverlay();

      overlayHost = document.createElement('div');
      overlayHost.id = 'recordflow-overlay-root';
      overlayHost.style.position = 'fixed';
      overlayHost.style.zIndex = '2147483647';
      overlayHost.style.pointerEvents = 'none';
      overlayHost.style.top = '0';
      overlayHost.style.left = '0';
      overlayHost.style.width = '100vw';
      overlayHost.style.height = '100vh';

      shadowRoot = overlayHost.attachShadow({ mode: 'open' });

      const styleEl = document.createElement('style');
      styleEl.textContent = `
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          user-select: none;
        }

        /* Circular Webcam Bubble */
        .camera-bubble-wrapper {
          position: fixed;
          bottom: 36px;
          left: 100px;
          pointer-events: auto;
          cursor: grab;
          z-index: 2147483647 !important;
          transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .camera-bubble-wrapper:active {
          cursor: grabbing;
        }

        .camera-bubble-wrapper.hidden-bubble {
          opacity: 0;
          pointer-events: none;
          transform: scale(0.7);
        }

        .btn-bubble-pip {
          position: absolute;
          top: 10px;
          right: 14px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s ease, transform 0.15s ease;
          z-index: 10;
        }

        .camera-bubble-wrapper:hover .btn-bubble-pip {
          opacity: 1;
        }

        .btn-bubble-pip:hover {
          transform: scale(1.1);
          background: #6366f1;
        }

        .camera-bubble {
          border-radius: 50%;
          overflow: hidden;
          background: #0f172a;
          border: 3.5px solid #6366f1;
          box-shadow: 
            0 0 25px rgba(99, 102, 241, 0.55),
            0 12px 36px rgba(0, 0, 0, 0.45);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateZ(0);
          transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .camera-bubble.size-s {
          width: 120px;
          height: 120px;
        }

        .camera-bubble.size-m {
          width: 175px;
          height: 175px;
        }

        .camera-bubble.size-l {
          width: 240px;
          height: 240px;
        }

        .camera-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        /* Loom-Style Vertical Liquid Glass Control Dock (Left Edge) */
        .loom-dock {
          position: fixed;
          left: 24px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1.5px solid rgba(255, 255, 255, 0.16);
          border-radius: 36px;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          box-shadow: 
            0 15px 40px rgba(0, 0, 0, 0.65),
            0 0 25px rgba(99, 102, 241, 0.3);
          color: #ffffff;
          pointer-events: auto;
          cursor: grab;
          z-index: 2147483647;
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .loom-dock:active {
          cursor: grabbing;
        }

        .loom-dock.is-paused {
          border-color: rgba(245, 158, 11, 0.6);
          box-shadow: 
            0 15px 40px rgba(0, 0, 0, 0.65),
            0 0 25px rgba(245, 158, 11, 0.3);
        }

        /* Big Red Stop Button */
        .btn-stop-dock {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.7);
          transition: all 0.15s ease;
        }

        .btn-stop-dock:hover {
          transform: scale(1.08);
          background: #dc2626;
          box-shadow: 0 0 22px rgba(239, 68, 68, 0.9);
        }

        .btn-stop-dock:active {
          transform: scale(0.95);
        }

        .btn-stop-dock svg {
          width: 18px;
          height: 18px;
          fill: currentColor;
          stroke: none;
        }

        /* Live Timer Badge */
        .dock-timer-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 2px 4px;
        }

        .rec-dot {
          width: 7px;
          height: 7px;
          background-color: #ef4444;
          border-radius: 50%;
          animation: pulse-dot 1.2s infinite ease-in-out;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.9);
        }

        .is-paused .rec-dot {
          background-color: #f59e0b;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.9);
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }

        .timer-display {
          font-size: 11.5px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: #f8fafc;
          letter-spacing: 0.02em;
        }

        .dock-divider-h {
          width: 24px;
          height: 1px;
          background: rgba(255, 255, 255, 0.14);
          margin: 2px 0;
        }

        /* Action Buttons inside Dock */
        .btn-dock-action {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #f1f5f9;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }

        .btn-dock-action:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.35);
          transform: scale(1.08);
        }

        .btn-dock-action:active {
          transform: scale(0.92);
        }

        .btn-dock-action svg {
          width: 17px;
          height: 17px;
          stroke: currentColor;
        }

        .btn-dock-action.active {
          background: rgba(99, 102, 241, 0.3);
          border-color: #6366f1;
          color: #a5b4fc;
        }

        .btn-dock-action.muted {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
          color: #fca5a5;
        }

        .btn-size-toggle {
          font-size: 11px;
          font-weight: 800;
          color: #c7d2fe;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
        }

        .btn-discard-dock:hover {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.5);
          color: #fca5a5;
        }
      `;

      shadowRoot.appendChild(styleEl);

      // Camera bubble setup
      let bubbleWrap: HTMLElement | null = null;
      let bubbleInner: HTMLElement | null = null;

      if (camStream && (mode === 'screen-camera' || mode === 'camera')) {
        bubbleWrap = document.createElement('div');
        bubbleWrap.className = 'camera-bubble-wrapper';

        bubbleInner = document.createElement('div');
        bubbleInner.className = `camera-bubble size-${currentBubbleSize}`;

        const video = document.createElement('video');
        video.className = 'camera-video';
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.srcObject = camStream;
        video.play().catch(() => {});

        bubbleInner.appendChild(video);
        bubbleWrap.appendChild(bubbleInner);

        // Dragging for bubble
        let isDraggingBubble = false;
        let bubbleStartX = 0;
        let bubbleStartY = 0;
        let bubbleElemX = savedBubbleX;
        let bubbleElemY = savedBubbleY;

        bubbleWrap.style.left = `${bubbleElemX}px`;
        bubbleWrap.style.top = `${bubbleElemY}px`;
        bubbleWrap.style.bottom = 'auto';

        bubbleWrap.addEventListener('pointerdown', (e) => {
          isDraggingBubble = true;
          bubbleStartX = e.clientX - bubbleElemX;
          bubbleStartY = e.clientY - bubbleElemY;
          bubbleWrap!.setPointerCapture(e.pointerId);
        });

        bubbleWrap.addEventListener('pointermove', (e) => {
          if (!isDraggingBubble) return;
          const newX = e.clientX - bubbleStartX;
          const newY = e.clientY - bubbleStartY;
          const rect = bubbleWrap!.getBoundingClientRect();
          const maxX = window.innerWidth - rect.width - 8;
          const maxY = window.innerHeight - rect.height - 8;

          bubbleElemX = Math.max(8, Math.min(newX, maxX));
          bubbleElemY = Math.max(8, Math.min(newY, maxY));
          savedBubbleX = bubbleElemX;
          savedBubbleY = bubbleElemY;

          bubbleWrap!.style.left = `${bubbleElemX}px`;
          bubbleWrap!.style.top = `${bubbleElemY}px`;
        });

        const stopBubbleDrag = (e: PointerEvent) => {
          if (!isDraggingBubble) return;
          isDraggingBubble = false;
          try {
            bubbleWrap!.releasePointerCapture(e.pointerId);
          } catch {}
        };

        bubbleWrap.addEventListener('pointerup', stopBubbleDrag);
        bubbleWrap.addEventListener('pointercancel', stopBubbleDrag);

        shadowRoot.appendChild(bubbleWrap);
      }

      // Vertical Loom-Style Dock
      const dock = document.createElement('div');
      dock.className = 'loom-dock';

      // 1. Red Stop Button
      const stopBtn = document.createElement('button');
      stopBtn.className = 'btn-stop-dock';
      stopBtn.title = t('btn_stop_recording', lang);
      stopBtn.innerHTML = ICON_STOP;
      stopBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stopRecording(mode);
      });
      dock.appendChild(stopBtn);

      // 2. Timer badge
      const timerBadge = document.createElement('div');
      timerBadge.className = 'dock-timer-badge';

      const recDot = document.createElement('span');
      recDot.className = 'rec-dot';

      const timerSpan = document.createElement('span');
      timerSpan.className = 'timer-display';
      timerSpan.textContent = '00:00';

      timerBadge.appendChild(recDot);
      timerBadge.appendChild(timerSpan);
      dock.appendChild(timerBadge);

      // Divider
      const div1 = document.createElement('div');
      div1.className = 'dock-divider-h';
      dock.appendChild(div1);

      // 3. Pause / Resume
      const pauseBtn = document.createElement('button');
      pauseBtn.className = 'btn-dock-action';
      pauseBtn.title = t('floating_pause', lang);
      pauseBtn.innerHTML = ICON_PAUSE;

      pauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!mediaRecorder) return;

        if (isPaused) {
          mediaRecorder.resume();
          isPaused = false;
          lastResumeTime = Date.now();
          dock.classList.remove('is-paused');
          pauseBtn.innerHTML = ICON_PAUSE;
          pauseBtn.title = t('floating_pause', lang);
        } else {
          mediaRecorder.pause();
          isPaused = true;
          accumulatedElapsedMs += Date.now() - lastResumeTime;
          dock.classList.add('is-paused');
          pauseBtn.innerHTML = ICON_PLAY;
          pauseBtn.title = t('floating_resume', lang);
        }
      });
      dock.appendChild(pauseBtn);

      // 4. Mute toggle
      const muteBtn = document.createElement('button');
      muteBtn.className = 'btn-dock-action';
      muteBtn.title = t('floating_mute', lang);
      muteBtn.innerHTML = ICON_MIC;

      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isMicMuted = !isMicMuted;
        if (micStream) {
          micStream.getAudioTracks().forEach((track) => {
            track.enabled = !isMicMuted;
          });
        }
        if (isMicMuted) {
          muteBtn.classList.add('muted');
          muteBtn.innerHTML = ICON_MIC_OFF;
          muteBtn.title = t('floating_unmute', lang);
        } else {
          muteBtn.classList.remove('muted');
          muteBtn.innerHTML = ICON_MIC;
          muteBtn.title = t('floating_mute', lang);
        }
      });
      dock.appendChild(muteBtn);

      // 5. Camera Hide/Show (if camera mode)
      if (bubbleWrap) {
        const camBtn = document.createElement('button');
        camBtn.className = 'btn-dock-action';
        camBtn.title = t('floating_cam_hide', lang);
        camBtn.innerHTML = ICON_EYE;

        camBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          isCameraHidden = !isCameraHidden;
          if (isCameraHidden) {
            bubbleWrap!.classList.add('hidden-bubble');
            camBtn.innerHTML = ICON_EYE_OFF;
            camBtn.title = t('floating_cam_show', lang);
          } else {
            bubbleWrap!.classList.remove('hidden-bubble');
            camBtn.innerHTML = ICON_EYE;
            camBtn.title = t('floating_cam_hide', lang);
          }
        });
        dock.appendChild(camBtn);

        // 6. Camera size switcher
        const sizeBtn = document.createElement('button');
        sizeBtn.className = 'btn-dock-action btn-size-toggle';
        sizeBtn.title = t('floating_size', lang);
        sizeBtn.textContent = 'M';

        sizeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (currentBubbleSize === 's') {
            currentBubbleSize = 'm';
            bubbleInner!.className = 'camera-bubble size-m';
            sizeBtn.textContent = 'M';
          } else if (currentBubbleSize === 'm') {
            currentBubbleSize = 'l';
            bubbleInner!.className = 'camera-bubble size-l';
            sizeBtn.textContent = 'L';
          } else {
            currentBubbleSize = 's';
            bubbleInner!.className = 'camera-bubble size-s';
            sizeBtn.textContent = 'S';
          }
        });
        dock.appendChild(sizeBtn);

        // 7. Picture-in-Picture Float Button in Dock
        const pipDockBtn = document.createElement('button');
        pipDockBtn.className = 'btn-dock-action';
        pipDockBtn.title = 'Flotar cámara sobre todas las pestañas (PiP)';
        pipDockBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 13h5v5h-5z"/></svg>`;
        pipDockBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const v = bubbleInner?.querySelector('video');
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(() => {});
          } else if (v) {
            v.requestPictureInPicture().catch(() => {});
          }
        });
        dock.appendChild(pipDockBtn);
      }

      // Divider 2
      const div2 = document.createElement('div');
      div2.className = 'dock-divider-h';
      dock.appendChild(div2);

      // 7. Discard button
      const discardBtn = document.createElement('button');
      discardBtn.className = 'btn-dock-action btn-discard-dock';
      discardBtn.title = t('floating_discard', lang);
      discardBtn.innerHTML = ICON_TRASH;

      discardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(t('confirm_discard', lang))) {
          discardRecording();
        }
      });
      dock.appendChild(discardBtn);

      // Dragging for Loom Dock
      let isDraggingDock = false;
      let dockStartX = 0;
      let dockStartY = 0;
      let dockElemX = 24;
      let dockElemY = Math.max(80, window.innerHeight / 2 - 160);

      dock.style.left = `${dockElemX}px`;
      dock.style.top = `${dockElemY}px`;
      dock.style.transform = 'none';

      dock.addEventListener('pointerdown', (e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        isDraggingDock = true;
        dockStartX = e.clientX - dockElemX;
        dockStartY = e.clientY - dockElemY;
        dock.setPointerCapture(e.pointerId);
      });

      dock.addEventListener('pointermove', (e) => {
        if (!isDraggingDock) return;
        const newX = e.clientX - dockStartX;
        const newY = e.clientY - dockStartY;
        const rect = dock.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - 12;
        const maxY = window.innerHeight - rect.height - 12;

        dockElemX = Math.max(12, Math.min(newX, maxX));
        dockElemY = Math.max(12, Math.min(newY, maxY));

        dock.style.left = `${dockElemX}px`;
        dock.style.top = `${dockElemY}px`;
      });

      const stopDockDrag = (e: PointerEvent) => {
        if (!isDraggingDock) return;
        isDraggingDock = false;
        try {
          dock.releasePointerCapture(e.pointerId);
        } catch {}
      };

      dock.addEventListener('pointerup', stopDockDrag);
      dock.addEventListener('pointercancel', stopDockDrag);

      shadowRoot.appendChild(dock);
      document.body.appendChild(overlayHost);

      // Live timer tracking
      recordingStartTime = Date.now();
      lastResumeTime = Date.now();
      accumulatedElapsedMs = 0;

      timerInterval = window.setInterval(() => {
        if (!isPaused) {
          const currentElapsedMs = accumulatedElapsedMs + (Date.now() - lastResumeTime);
          const elapsedSecs = Math.floor(currentElapsedMs / 1000);
          timerSpan.textContent = formatDuration(elapsedSecs);
        }
      }, 500);
    }

    // Follower Dock for tabs activated during recording
    function injectFollowerDock(startTime: number, _mode: string) {
      if (overlayHost) return;

      overlayHost = document.createElement('div');
      overlayHost.id = 'recordflow-overlay-root';
      overlayHost.style.position = 'fixed';
      overlayHost.style.zIndex = '2147483647';
      overlayHost.style.pointerEvents = 'none';
      overlayHost.style.top = '0';
      overlayHost.style.left = '0';
      overlayHost.style.width = '100vw';
      overlayHost.style.height = '100vh';

      shadowRoot = overlayHost.attachShadow({ mode: 'open' });

      const styleEl = document.createElement('style');
      styleEl.textContent = `
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          user-select: none;
        }

        .loom-dock {
          position: fixed;
          left: 24px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(15, 23, 42, 0.94);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1.5px solid rgba(255, 255, 255, 0.18);
          border-radius: 36px;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          box-shadow: 
            0 15px 40px rgba(0, 0, 0, 0.65),
            0 0 25px rgba(99, 102, 241, 0.3);
          color: #ffffff;
          pointer-events: auto;
          cursor: grab;
          z-index: 2147483647;
        }

        .loom-dock:active { cursor: grabbing; }

        .btn-stop-dock {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.7);
          transition: all 0.15s ease;
        }

        .btn-stop-dock:hover {
          transform: scale(1.08);
          background: #dc2626;
          box-shadow: 0 0 22px rgba(239, 68, 68, 0.9);
        }

        .btn-stop-dock svg {
          width: 18px;
          height: 18px;
          fill: currentColor;
          stroke: none;
        }

        .dock-timer-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 2px 4px;
        }

        .rec-dot {
          width: 7px;
          height: 7px;
          background-color: #ef4444;
          border-radius: 50%;
          animation: pulse-dot 1.2s infinite ease-in-out;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.9);
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }

        .timer-display {
          font-size: 11.5px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: #f8fafc;
          letter-spacing: 0.02em;
        }
      `;

      shadowRoot.appendChild(styleEl);

      const dock = document.createElement('div');
      dock.className = 'loom-dock';

      const stopBtn = document.createElement('button');
      stopBtn.className = 'btn-stop-dock';
      stopBtn.title = 'Detener Grabación';
      stopBtn.innerHTML = ICON_STOP;
      stopBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage({ type: 'STOP_RECORDING_REQUEST' });
        removeRecordingOverlay();
      });
      dock.appendChild(stopBtn);

      const timerBadge = document.createElement('div');
      timerBadge.className = 'dock-timer-badge';
      const recDot = document.createElement('span');
      recDot.className = 'rec-dot';
      const timerSpan = document.createElement('span');
      timerSpan.className = 'timer-display';
      timerSpan.textContent = '00:00';

      timerBadge.appendChild(recDot);
      timerBadge.appendChild(timerSpan);
      dock.appendChild(timerBadge);

      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let elemX = 24;
      let elemY = Math.max(80, window.innerHeight / 2 - 100);

      dock.style.left = `${elemX}px`;
      dock.style.top = `${elemY}px`;
      dock.style.transform = 'none';

      dock.addEventListener('pointerdown', (e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        isDragging = true;
        startX = e.clientX - elemX;
        startY = e.clientY - elemY;
        dock.setPointerCapture(e.pointerId);
      });

      dock.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        elemX = Math.max(12, Math.min(e.clientX - startX, window.innerWidth - 60));
        elemY = Math.max(12, Math.min(e.clientY - startY, window.innerHeight - 120));
        dock.style.left = `${elemX}px`;
        dock.style.top = `${elemY}px`;
      });

      const stopDrag = (e: PointerEvent) => {
        if (!isDragging) return;
        isDragging = false;
        try { dock.releasePointerCapture(e.pointerId); } catch {}
      };
      dock.addEventListener('pointerup', stopDrag);
      dock.addEventListener('pointercancel', stopDrag);

      shadowRoot.appendChild(dock);
      document.body.appendChild(overlayHost);

      timerInterval = window.setInterval(() => {
        const elapsedSecs = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        timerSpan.textContent = formatDuration(elapsedSecs);
      }, 500);
    }

    // Main start recording logic
    async function startRecording(mode: string, mic: boolean) {
      try {
        const lang = await getCurrentLang();
        recordedChunks = [];
        isStopping = false;
        isPaused = false;
        currentBubbleSize = 'm';
        isCameraHidden = false;
        isMicMuted = !mic;

        let finalCaptureStream: MediaStream;

        if (mode === 'camera') {
          // Camera Only Mode
          if (hubCamStream && hubCamStream.active && hubCamStream.getVideoTracks().some((t) => t.readyState === 'live')) {
            cameraStream = hubCamStream;
          } else {
            try {
              cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: mic ? { echoCancellation: true, noiseSuppression: true } : false,
              });
            } catch {
              cameraStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: mic ? { echoCancellation: true, noiseSuppression: true } : false,
              });
            }
          }

          finalCaptureStream = cameraStream;
          removeFloatingHubCardOnly();

          runCountdown(() => {
            removePreBubble();
            injectFloatingRecordingUI(cameraStream, mode, lang);
            beginMediaRecorder(finalCaptureStream, mode);
          });
          return { success: true };
        } else {
          // Screen or Screen+Camera Mode:
          // CRUCIAL: Inmediatamente invocar getDisplayMedia con la activación del clic del usuario
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true, // System audio
          });

          // Cerrar la tarjeta de configuración dejando la burbuja de cámara y los streams vivos
          removeFloatingHubCardOnly();

          screenStream.getVideoTracks()[0].onended = () => {
            stopRecording(mode);
          };

          // Reutilizar o activar cámara si el modo lo requiere
          if (mode === 'screen-camera') {
            if (hubCamStream && hubCamStream.active && hubCamStream.getVideoTracks().some((t) => t.readyState === 'live')) {
              cameraStream = hubCamStream;
            } else {
              try {
                cameraStream = await navigator.mediaDevices.getUserMedia({
                  video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                  audio: false,
                });
              } catch {
                try {
                  cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                } catch {
                  cameraStream = null;
                }
              }
            }
          }

          // Reutilizar o capturar micrófono
          if (mic) {
            if (hubMicStream && hubMicStream.active && hubMicStream.getAudioTracks().some((t) => t.readyState === 'live')) {
              micStream = hubMicStream;
            } else {
              try {
                micStream = await navigator.mediaDevices.getUserMedia({
                  audio: { echoCancellation: true, noiseSuppression: true },
                });
              } catch {
                micStream = null;
              }
            }

            if (micStream) {
              try {
                audioContext = new AudioContext();
                const destination = audioContext.createMediaStreamDestination();

                const screenAudioTracks = screenStream.getAudioTracks();
                if (screenAudioTracks.length > 0) {
                  const screenAudioSource = audioContext.createMediaStreamSource(
                    new MediaStream(screenAudioTracks)
                  );
                  screenAudioSource.connect(destination);
                }

                const micAudioSource = audioContext.createMediaStreamSource(micStream);
                micAudioSource.connect(destination);

                finalCaptureStream = new MediaStream([
                  ...screenStream.getVideoTracks(),
                  ...destination.stream.getAudioTracks(),
                ]);
              } catch {
                finalCaptureStream = screenStream;
              }
            } else {
              finalCaptureStream = screenStream;
            }
          } else {
            finalCaptureStream = screenStream;
          }

          combinedStream = finalCaptureStream;

          runCountdown(() => {
            removePreBubble();
            injectFloatingRecordingUI(cameraStream, mode, lang);
            beginMediaRecorder(finalCaptureStream, mode);
          });

          return { success: true };
        }
      } catch (err: any) {
        console.warn('[RecordFlow] Start recording cancelled or failed:', err);
        // Si el usuario canceló el selector de pantalla, mantenemos el hub abierto para que pueda volver a pulsar
        return { success: false, error: err?.message || 'USER_CANCELLED' };
      }
    }

    function beginMediaRecorder(streamToRecord: MediaStream, mode: string) {
      const mimeType = getSupportedMimeType();
      mediaRecorder = new MediaRecorder(streamToRecord, {
        mimeType,
        videoBitsPerSecond: 3_000_000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        finishAndSave(mode);
      };

      mediaRecorder.start(1000);
    }

    // ─────────────────────────────────────────────────────────────────
    // LOOM-STYLE IN-PAGE FLOATING STUDIO HUB (SETUP CARD ON TOP-RIGHT)
    // ─────────────────────────────────────────────────────────────────
    async function toggleFloatingHub(
      initialMode: 'screen-camera' | 'screen' | 'camera' = 'screen-camera',
      initialMic = true
    ) {
      if (hubHost) {
        removeFloatingHub();
        return;
      }

      hubSelectedMode = initialMode;
      hubIsMicActive = initialMic;
      hubIsCamActive = initialMode !== 'screen';

      const lang = await getCurrentLang();

      hubHost = document.createElement('div');
      hubHost.id = 'recordflow-hub-host';
      hubHost.style.position = 'fixed';
      hubHost.style.zIndex = '2147483645';

      let hubX = Math.max(10, window.innerWidth - 360);
      let hubY = 24;
      hubHost.style.left = `${hubX}px`;
      hubHost.style.top = `${hubY}px`;
      hubHost.style.right = 'auto';
      hubHost.style.pointerEvents = 'auto';

      const hubShadow = hubHost.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          user-select: none;
        }

        .hub-card {
          width: 330px;
          background: rgba(15, 23, 42, 0.94);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1.5px solid rgba(255, 255, 255, 0.16);
          border-radius: 24px;
          padding: 18px 20px;
          box-shadow: 
            0 24px 60px rgba(0, 0, 0, 0.7),
            0 0 35px rgba(99, 102, 241, 0.35);
          color: #f8fafc;
          animation: slide-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Header */
        .hub-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .hub-brand {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .hub-brand-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
        }

        .hub-brand-icon svg {
          width: 15px;
          height: 15px;
          stroke: currentColor;
        }

        .hub-brand-info {
          display: flex;
          flex-direction: column;
        }

        .hub-title {
          font-size: 14px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.01em;
        }

        .hub-badge {
          font-size: 10px;
          font-weight: 600;
          color: #a5b4fc;
        }

        .btn-hub-close {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: #94a3b8;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-hub-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .btn-hub-close svg {
          width: 14px;
          height: 14px;
          stroke: currentColor;
        }

        /* Mode Selection Row */
        .hub-modes {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          background: rgba(0, 0, 0, 0.35);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .hub-mode-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 7px 4px;
          border-radius: 8px;
          font-size: 10.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }

        .hub-mode-btn svg {
          width: 16px;
          height: 16px;
          stroke: currentColor;
        }

        .hub-mode-btn.active {
          background: rgba(99, 102, 241, 0.3);
          color: #ffffff;
          border: 1px solid rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
        }

        /* Audio & VU-meter Row */
        .hub-audio-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 8px 12px;
        }

        .hub-audio-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          font-weight: 600;
          color: #e2e8f0;
          cursor: pointer;
        }

        .hub-audio-left svg {
          width: 15px;
          height: 15px;
          color: #818cf8;
        }

        .hub-vu-track {
          width: 80px;
          height: 5px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          overflow: hidden;
        }

        .hub-vu-bar {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #10b981 0%, #6366f1 70%, #ef4444 100%);
          border-radius: 9999px;
          transition: width 0.06s ease-out;
        }

        /* Big Glowing Action Button (Image 2 style) */
        .btn-hub-record {
          width: 100%;
          padding: 13px 18px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #f97316 0%, #ef4444 60%, #6366f1 100%);
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 
            0 8px 24px rgba(239, 68, 68, 0.45),
            0 0 15px rgba(249, 115, 22, 0.3);
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-hub-record:hover {
          transform: translateY(-1.5px);
          box-shadow: 
            0 12px 28px rgba(239, 68, 68, 0.6),
            0 0 22px rgba(249, 115, 22, 0.45);
        }

        .btn-hub-record:active {
          transform: translateY(0);
        }

        .btn-hub-record svg {
          width: 18px;
          height: 18px;
          fill: currentColor;
          stroke: none;
        }
      `;

      hubShadow.appendChild(style);

      const card = document.createElement('div');
      card.className = 'hub-card';

      // Header (Draggable)
      const header = document.createElement('div');
      header.className = 'hub-header';
      header.style.cursor = 'grab';

      const brand = document.createElement('div');
      brand.className = 'hub-brand';
      brand.innerHTML = `
        <div class="hub-brand-icon">${ICON_VIDEO}</div>
        <div class="hub-brand-info">
          <span class="hub-title">RecordFlow Studio</span>
          <span class="hub-badge">${t('unlimited_badge', lang)}</span>
        </div>
      `;

      // Header Actions: Pin Launcher Toggle & Close
      const headerActions = document.createElement('div');
      headerActions.style.display = 'flex';
      headerActions.style.alignItems = 'center';
      headerActions.style.gap = '6px';

      const pinBtn = document.createElement('button');
      pinBtn.className = 'btn-hub-close';
      pinBtn.title = 'Fijar botón en la web';
      pinBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><line x1="12" x2="12" y1="17" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`;

      chrome.storage.local.get('recordflow_pin_launcher').then((data) => {
        if (data?.recordflow_pin_launcher === true) {
          pinBtn.style.color = '#818cf8';
          pinBtn.style.background = 'rgba(99, 102, 241, 0.25)';
          pinBtn.title = 'Desfijar botón de la web';
        }
      });

      pinBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const data = await chrome.storage.local.get('recordflow_pin_launcher');
        const nextState = !data?.recordflow_pin_launcher;
        await chrome.storage.local.set({ recordflow_pin_launcher: nextState });

        if (nextState) {
          pinBtn.style.color = '#818cf8';
          pinBtn.style.background = 'rgba(99, 102, 241, 0.25)';
          pinBtn.title = 'Desfijar botón de la web';
          injectFloatingLauncher();
        } else {
          pinBtn.style.color = '';
          pinBtn.style.background = '';
          pinBtn.title = 'Fijar botón en la web';
          if (launcherHost && launcherHost.parentNode) {
            launcherHost.parentNode.removeChild(launcherHost);
            launcherHost = null;
          }
        }
      });

      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn-hub-close';
      closeBtn.title = 'Cerrar';
      closeBtn.innerHTML = ICON_X;
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFloatingHub();
      });

      headerActions.appendChild(pinBtn);
      headerActions.appendChild(closeBtn);

      header.appendChild(brand);
      header.appendChild(headerActions);
      card.appendChild(header);

      // Dragging listeners for Hub Card
      let isDraggingHub = false;
      let startHubX = 0;
      let startHubY = 0;

      header.addEventListener('pointerdown', (e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        isDraggingHub = true;
        header.style.cursor = 'grabbing';
        startHubX = e.clientX - hubX;
        startHubY = e.clientY - hubY;
        header.setPointerCapture(e.pointerId);
      });

      header.addEventListener('pointermove', (e) => {
        if (!isDraggingHub) return;
        const newX = e.clientX - startHubX;
        const newY = e.clientY - startHubY;
        const maxX = window.innerWidth - 340;
        const maxY = window.innerHeight - 80;
        hubX = Math.max(10, Math.min(newX, maxX));
        hubY = Math.max(10, Math.min(newY, maxY));
        hubHost!.style.left = `${hubX}px`;
        hubHost!.style.top = `${hubY}px`;
      });

      const stopHubDrag = (e: PointerEvent) => {
        if (!isDraggingHub) return;
        isDraggingHub = false;
        header.style.cursor = 'grab';
        try {
          header.releasePointerCapture(e.pointerId);
        } catch {}
      };

      header.addEventListener('pointerup', stopHubDrag);
      header.addEventListener('pointercancel', stopHubDrag);

      // Modes
      const modesRow = document.createElement('div');
      modesRow.className = 'hub-modes';

      const modes = [
        { id: 'screen-camera', label: 'Pantalla + Cam', icon: ICON_MONITOR_CAMERA },
        { id: 'screen', label: 'Solo Pantalla', icon: ICON_MONITOR },
        { id: 'camera', label: 'Solo Cámara', icon: ICON_CAMERA },
      ];

      modes.forEach((m) => {
        const btn = document.createElement('button');
        btn.className = `hub-mode-btn ${hubSelectedMode === m.id ? 'active' : ''}`;
        btn.innerHTML = `${m.icon}<span>${m.label}</span>`;
        btn.addEventListener('click', () => {
          hubSelectedMode = m.id as any;
          modesRow.querySelectorAll('.hub-mode-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          updateHubPreview();
        });
        modesRow.appendChild(btn);
      });
      card.appendChild(modesRow);

      // Audio & VU-meter row
      const audioRow = document.createElement('div');
      audioRow.className = 'hub-audio-row';

      const audioLeft = document.createElement('div');
      audioLeft.className = 'hub-audio-left';
      audioLeft.innerHTML = `${ICON_MIC}<span>${t('audio_mic_label', lang)}</span>`;
      audioLeft.addEventListener('click', () => {
        hubIsMicActive = !hubIsMicActive;
        audioLeft.innerHTML = hubIsMicActive
          ? `${ICON_MIC}<span>${t('audio_mic_label', lang)} ON</span>`
          : `${ICON_MIC_OFF}<span>${t('audio_mic_label', lang)} OFF</span>`;
        if (!hubIsMicActive && vuBar) {
          vuBar.style.width = '0%';
        }
      });

      const vuTrack = document.createElement('div');
      vuTrack.className = 'hub-vu-track';
      const vuBar = document.createElement('div');
      vuBar.className = 'hub-vu-bar';
      vuTrack.appendChild(vuBar);

      audioRow.appendChild(audioLeft);
      audioRow.appendChild(vuTrack);
      card.appendChild(audioRow);

      // Start Recording Primary Button
      const recordBtn = document.createElement('button');
      recordBtn.className = 'btn-hub-record';
      recordBtn.innerHTML = `${ICON_STOP}<span>${t('btn_start_recording', lang)}</span>`;
      recordBtn.addEventListener('click', () => {
        const mode = !hubIsCamActive && hubSelectedMode === 'screen-camera' ? 'screen' : hubSelectedMode;
        startRecording(mode, hubIsMicActive);
      });
      card.appendChild(recordBtn);

      hubShadow.appendChild(card);
      document.body.appendChild(hubHost);

      // Start hardware streams for preview (camera live strictly in circular bubble)
      async function updateHubPreview() {
        if (hubSelectedMode === 'screen' || !hubIsCamActive) {
          removePreBubble();
          if (hubCamStream) {
            hubCamStream.getTracks().forEach((t) => t.stop());
            hubCamStream = null;
          }
          return;
        }

        if (!hubCamStream) {
          try {
            // Leer el deviceId configurado en permissions.html si existe
            const storageData = await chrome.storage.local.get('recordflow_camera_id');
            const savedCamId = typeof storageData?.recordflow_camera_id === 'string'
              ? storageData.recordflow_camera_id
              : undefined;

            const videoConstraints: MediaTrackConstraints = savedCamId
              ? { deviceId: { exact: savedCamId } }
              : { width: { ideal: 1280 }, height: { ideal: 720 } };

            try {
              hubCamStream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: false,
              });
            } catch {
              hubCamStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
            }
          } catch (camErr) {
            console.warn('[RecordFlow] Camera access error:', camErr);
            removePreBubble();
            return;
          }
        }

        if (hubCamStream) {
          injectPreviewBubble(hubCamStream);
        }
      }

      async function updateHubAudio() {
        if (!hubIsMicActive) {
          if (hubAnimId) {
            cancelAnimationFrame(hubAnimId);
            hubAnimId = null;
          }
          if (hubMicStream) {
            hubMicStream.getTracks().forEach((t) => t.stop());
            hubMicStream = null;
          }
          return;
        }

        try {
          hubMicStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
          });

          hubAudioCtx = new AudioContext();
          hubAnalyser = hubAudioCtx.createAnalyser();
          hubAnalyser.fftSize = 64;
          hubAnalyser.smoothingTimeConstant = 0.5;

          const source = hubAudioCtx.createMediaStreamSource(hubMicStream);
          source.connect(hubAnalyser);

          const dataArray = new Uint8Array(hubAnalyser.frequencyBinCount);

          const loopVU = () => {
            if (!hubAnalyser) return;
            hubAnalyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const pct = Math.min(100, Math.round((avg / 128) * 100));
            vuBar.style.width = `${pct}%`;
            hubAnimId = requestAnimationFrame(loopVU);
          };

          loopVU();
        } catch {
          // Handled gracefully
        }
      }

      updateHubPreview();
      updateHubAudio();
    }

    // ─────────────────────────────────────────────────────────────────
    // LOOM-STYLE FLOATING CORNER TRIGGER (LAUNCHER BADGE ON WEBPAGE)
    // ─────────────────────────────────────────────────────────────────
    function injectFloatingLauncher() {
      if (document.getElementById('recordflow-launcher-host')) return;

      launcherHost = document.createElement('div');
      launcherHost.id = 'recordflow-launcher-host';
      launcherHost.style.position = 'fixed';
      launcherHost.style.bottom = '24px';
      launcherHost.style.left = '24px';
      launcherHost.style.zIndex = '2147483640';
      launcherHost.style.pointerEvents = 'auto';

      const shadow = launcherHost.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          user-select: none;
        }

        .launcher-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(99, 102, 241, 0.5);
          border-radius: 9999px;
          padding: 7px 14px 7px 8px;
          cursor: pointer;
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(99, 102, 241, 0.35);
          color: #ffffff;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .launcher-pill:hover {
          transform: translateY(-2px) scale(1.04);
          border-color: #818cf8;
          box-shadow: 
            0 14px 35px rgba(0, 0, 0, 0.6),
            0 0 28px rgba(99, 102, 241, 0.5);
        }

        .launcher-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
        }

        .launcher-icon svg {
          width: 16px;
          height: 16px;
          stroke: #ffffff;
        }

        .launcher-text {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #f8fafc;
        }

        .launcher-dot {
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 6px #ef4444;
        }

        .btn-launcher-dismiss {
          display: none;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 2px;
          margin-left: 2px;
        }

        .btn-launcher-dismiss:hover {
          color: #ffffff;
        }

        .btn-launcher-dismiss svg {
          width: 12px;
          height: 12px;
        }

        .launcher-pill:hover .btn-launcher-dismiss {
          display: flex;
        }
      `;

      shadow.appendChild(style);

      const pill = document.createElement('div');
      pill.className = 'launcher-pill';
      pill.title = 'RecordFlow Studio • Grabar pantalla';

      pill.innerHTML = `
        <div class="launcher-icon">${ICON_VIDEO}</div>
        <span class="launcher-text">RecordFlow</span>
        <span class="launcher-dot"></span>
        <button class="btn-launcher-dismiss" title="Ocultar">${ICON_X}</button>
      `;

      pill.addEventListener('click', async (e) => {
        if ((e.target as HTMLElement).closest('.btn-launcher-dismiss')) {
          e.stopPropagation();
          await chrome.storage.local.set({ recordflow_pin_launcher: false });
          if (launcherHost && launcherHost.parentNode) {
            launcherHost.parentNode.removeChild(launcherHost);
            launcherHost = null;
          }
          return;
        }
        toggleFloatingHub();
      });

      shadow.appendChild(pill);
      document.body.appendChild(launcherHost);
    }

    // Initialize in-page floating launcher ONLY IF user has opted to pin it
    async function checkAndInjectFloatingLauncher() {
      try {
        const data = await chrome.storage.local.get('recordflow_pin_launcher');
        if (data?.recordflow_pin_launcher === true) {
          injectFloatingLauncher();
        }
      } catch {}
    }

    if (document.body) {
      checkAndInjectFloatingLauncher();
    } else {
      window.addEventListener('DOMContentLoaded', checkAndInjectFloatingLauncher);
    }

    // Listen for commands from background or popup
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'PING') {
        sendResponse({ pong: true });
        return true;
      }

      if (message.type === 'TOGGLE_FLOATING_HUB') {
        toggleFloatingHub(message.mode || 'screen-camera', message.mic !== false);
        sendResponse({ success: true });
        return true;
      }

      if (message.type === 'START_RECORDING_INTERNAL') {
        startRecording(message.mode || 'screen-camera', message.mic !== false)
          .then((res) => sendResponse(res))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;
      }

      if (message.type === 'STOP_RECORDING_INTERNAL') {
        stopRecording(message.mode || 'screen-camera');
        sendResponse({ success: true });
        return true;
      }

      if (message.type === 'SYNC_RECORDING_OVERLAY') {
        if (message.isFollower) {
          injectFollowerDock(message.startTime || Date.now(), message.mode || 'screen-camera');
        }
        sendResponse({ success: true });
        return true;
      }

      if (message.type === 'REMOVE_RECORDING_OVERLAY') {
        removeRecordingOverlay();
        sendResponse({ success: true });
        return true;
      }
    });
  },
});
