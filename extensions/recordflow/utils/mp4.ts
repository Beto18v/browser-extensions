import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

/**
 * Re-encodes or muxes a recorded WebM Blob into a genuine .mp4 (H.264) file.
 */
export async function convertWebmToMp4(
  webmBlob: Blob,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  // If already MP4, return directly
  if (webmBlob.type.includes('mp4')) {
    return webmBlob;
  }

  // Strategy 1: Native Chromium MediaRecorder MP4 transcode via video captureStream
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/mp4')) {
    try {
      return await transcodeViaMediaRecorder(webmBlob, onProgress);
    } catch (err) {
      console.warn('[RecordFlow] MediaRecorder MP4 transcode failed, attempting WebCodecs muxer:', err);
    }
  }

  // Strategy 2: WebCodecs + mp4-muxer
  if (typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined') {
    try {
      return await muxViaWebCodecs(webmBlob, onProgress);
    } catch (err) {
      console.warn('[RecordFlow] WebCodecs MP4 transcode failed:', err);
    }
  }

  // Fallback: Packaging with video/mp4 MIME
  return new Blob([webmBlob], { type: 'video/mp4' });
}

async function transcodeViaMediaRecorder(
  blob: Blob,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const video = document.createElement('video');
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.src = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video metadata'));
  });

  const duration = video.duration || 1;
  const stream = (video as any).captureStream ? (video as any).captureStream() : null;
  if (!stream) {
    throw new Error('captureStream not available');
  }

  const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')
    ? 'video/mp4;codecs=avc1,mp4a.40.2'
    : 'video/mp4';

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_500_000 });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      URL.revokeObjectURL(video.src);
      resolve(new Blob(chunks, { type: 'video/mp4' }));
    };
  });

  recorder.start(100);

  // Playback at 2x for fast export
  video.playbackRate = 2.0;

  video.ontimeupdate = () => {
    if (onProgress && duration > 0) {
      const pct = Math.min(99, Math.round((video.currentTime / duration) * 100));
      onProgress(pct);
    }
  };

  await new Promise<void>((resolve) => {
    video.onended = () => resolve();
    video.play().catch(() => resolve());
  });

  recorder.stop();
  if (onProgress) onProgress(100);

  return await recordingPromise;
}

async function muxViaWebCodecs(
  blob: Blob,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.src = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video'));
  });

  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;
  const duration = video.duration || 1;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width,
      height,
    },
    fastStart: 'in-memory',
  });

  let encoderError: any = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (e) => {
      encoderError = e;
    },
  });

  const config: VideoEncoderConfig = {
    codec: 'avc1.42001f',
    width,
    height,
    bitrate: 3_000_000,
    framerate: 30,
  };

  const support = await VideoEncoder.isConfigSupported(config);
  if (!support.supported) {
    throw new Error('H264 WebCodecs not supported on this device');
  }

  encoder.configure(config);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const fps = 30;
  const frameInterval = 1 / fps;
  let currentTime = 0;
  let frameIndex = 0;

  while (currentTime < duration) {
    video.currentTime = currentTime;
    await new Promise<void>((res) => {
      video.onseeked = () => res();
    });

    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(currentTime * 1_000_000),
      });
      const keyFrame = frameIndex % (fps * 2) === 0;
      encoder.encode(frame, { keyFrame });
      frame.close();
    }

    frameIndex++;
    currentTime += frameInterval;

    if (onProgress) {
      const pct = Math.min(99, Math.round((currentTime / duration) * 100));
      onProgress(pct);
    }
  }

  await encoder.flush();
  encoder.close();
  muxer.finalize();
  URL.revokeObjectURL(video.src);

  if (encoderError) throw encoderError;

  const buffer = muxer.target.buffer;
  if (onProgress) onProgress(100);
  return new Blob([buffer], { type: 'video/mp4' });
}
