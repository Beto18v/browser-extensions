import { DEFAULT_COMPRESSOR, TONE_PRESETS, volumeToGain } from '../../src/lib/presets';
import type { ExtensionMessage, TonePresetId } from '../../src/lib/types';

interface TabAudioPipeline {
  context: AudioContext;
  source: MediaStreamAudioSourceNode;
  stream: MediaStream;
  lowShelf: BiquadFilterNode;
  peaking: BiquadFilterNode;
  highShelf: BiquadFilterNode;
  gain: GainNode;
  compressor: DynamicsCompressorNode;
}

const activePipelines = new Map<number, TabAudioPipeline>();

async function initTabAudio(
  tabId: number,
  streamId: string,
  volume: number,
  presetId: TonePresetId,
  limiter: boolean
) {
  // Limpiar pipeline previo si existiera
  stopTabAudio(tabId);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // @ts-expect-error chromeMediaSource is a Chrome-specific constraint
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      },
      video: false,
    });

    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);

    // Biquad filters para EQ de 3 bandas
    const lowShelf = context.createBiquadFilter();
    lowShelf.type = 'lowshelf';

    const peaking = context.createBiquadFilter();
    peaking.type = 'peaking';

    const highShelf = context.createBiquadFilter();
    highShelf.type = 'highshelf';

    // Gain node (0 - 6.0)
    const gain = context.createGain();

    // Dynamics compressor (soft limiter anti-distorsión)
    const compressor = context.createDynamicsCompressor();

    // Configurar valores iniciales
    applyPresetConfig(lowShelf, peaking, highShelf, compressor, presetId, limiter);
    gain.gain.value = volumeToGain(volume);

    // Grafo de audio:
    // source -> lowShelf -> peaking -> highShelf -> gain -> compressor (o bypass) -> destination
    source.connect(lowShelf);
    lowShelf.connect(peaking);
    peaking.connect(highShelf);
    highShelf.connect(gain);

    if (limiter) {
      gain.connect(compressor);
      compressor.connect(context.destination);
    } else {
      gain.connect(context.destination);
    }

    if (context.state === 'suspended') {
      await context.resume();
    }

    activePipelines.set(tabId, {
      context,
      source,
      stream,
      lowShelf,
      peaking,
      highShelf,
      gain,
      compressor,
    });

    // Detectar si el usuario o la pestaña detiene el stream (por ejemplo al cambiar de pestaña o detener media)
    stream.getAudioTracks().forEach((track) => {
      track.onended = () => {
        stopTabAudio(tabId);
      };
    });
  } catch (err) {
    console.error(`[Amplifier Tab Offscreen] Failed to initialize audio for tab ${tabId}:`, err);
  }
}

function applyPresetConfig(
  lowShelf: BiquadFilterNode,
  peaking: BiquadFilterNode,
  highShelf: BiquadFilterNode,
  compressor: DynamicsCompressorNode,
  presetId: TonePresetId,
  limiter: boolean
) {
  const preset = TONE_PRESETS[presetId] || TONE_PRESETS.normal;
  lowShelf.frequency.value = preset.eq.lowShelf.freq;
  lowShelf.gain.value = preset.eq.lowShelf.gain;

  peaking.frequency.value = preset.eq.peaking.freq;
  peaking.gain.value = preset.eq.peaking.gain;
  peaking.Q.value = preset.eq.peaking.q;

  highShelf.frequency.value = preset.eq.highShelf.freq;
  highShelf.gain.value = preset.eq.highShelf.gain;

  if (limiter) {
    const compSettings = {
      ...DEFAULT_COMPRESSOR,
      ...(preset.compressor || {}),
    };
    compressor.threshold.value = compSettings.threshold;
    compressor.knee.value = compSettings.knee;
    compressor.ratio.value = compSettings.ratio;
    compressor.attack.value = compSettings.attack;
    compressor.release.value = compSettings.release;
  }
}

function updateTabAudio(
  tabId: number,
  volume: number,
  presetId: TonePresetId,
  limiter: boolean
) {
  const pipeline = activePipelines.get(tabId);
  if (!pipeline) return;

  const { context, gain, lowShelf, peaking, highShelf, compressor } = pipeline;

  // Actualizar Gain de forma suave para evitar chasquidos (clicks)
  const targetGain = volumeToGain(volume);
  gain.gain.cancelScheduledValues(context.currentTime);
  gain.gain.setTargetAtTime(targetGain, context.currentTime, 0.02);

  // Actualizar filtros EQ y compresor
  applyPresetConfig(lowShelf, peaking, highShelf, compressor, presetId, limiter);

  // Reconectar salida según limiter
  try {
    gain.disconnect();
    compressor.disconnect();
    if (limiter) {
      gain.connect(compressor);
      compressor.connect(context.destination);
    } else {
      gain.connect(context.destination);
    }
  } catch {
    // Si ya estaba desconectado
  }
}

function stopTabAudio(tabId: number) {
  const pipeline = activePipelines.get(tabId);
  if (!pipeline) return;

  try {
    pipeline.gain.disconnect();
    pipeline.compressor.disconnect();
    pipeline.lowShelf.disconnect();
    pipeline.peaking.disconnect();
    pipeline.highShelf.disconnect();
    pipeline.source.disconnect();

    // Detener tracks del stream para liberar la captura de la pestaña
    pipeline.stream.getTracks().forEach((track) => track.stop());

    if (pipeline.context.state !== 'closed') {
      pipeline.context.close();
    }
  } catch (err) {
    console.error(`[Amplifier Tab Offscreen] Error stopping tab ${tabId}:`, err);
  } finally {
    activePipelines.delete(tabId);
  }
}

// Receptor de mensajes desde Background Service Worker
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'INIT_OFFSCREEN_STREAM') {
    initTabAudio(
      message.tabId,
      message.streamId,
      message.volume,
      message.preset,
      message.limiter
    ).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'UPDATE_OFFSCREEN_AUDIO') {
    const pipeline = activePipelines.get(message.tabId);
    if (!pipeline) {
      // Si el pipeline no existe (por ejemplo, AudioContext cerrado o reconexión), avisamos para re-capturar
      sendResponse({ success: false, notFound: true });
      return false;
    }
    updateTabAudio(
      message.tabId,
      message.volume,
      message.preset,
      message.limiter
    );
    sendResponse({ success: true });
    return false;
  }

  if (message.type === 'STOP_OFFSCREEN_AUDIO') {
    stopTabAudio(message.tabId);
    sendResponse({ success: true });
    return false;
  }

  return false;
});
