/**
 * Protocol handling for popup <-> content-script communication.
 * Includes readiness ping with retries, 8-second request timeouts, and error handling.
 */

export interface ExtractRequestOptions {
  mode: 'article' | 'full' | 'selection';
  includeLinks: boolean;
  imagesAsAlt: boolean;
  includeMeta: boolean;
}

export interface ExtractResponse {
  markdown: string;
  title: string;
  url: string;
  tokens: number;
  mode: string;
  isFallback?: boolean;
  error?: string;
}

export interface MessageSender {
  (message: unknown): Promise<unknown>;
}

/**
 * Pings content script with retry intervals until it responds { status: 'ready' } or attempts exhaust.
 */
export async function pingWithRetries(
  sendMessage: MessageSender,
  maxRetries = 6,
  intervalMs = 120
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = (await sendMessage({ type: 'mdai:ping' })) as { status?: string } | undefined;
      if (res && res.status === 'ready') {
        return true;
      }
    } catch {
      // Receiver might not be registered yet, wait for next attempt
    }
    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  return false;
}

/**
 * Wraps a promise with an enforced timeout.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 8000,
  timeoutMessage = 'TIMEOUT'
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Executes full extraction protocol:
 * 1. Pings for readiness
 * 2. Sends extraction request within timeout
 */
export async function executeExtractProtocol(
  sendMessage: MessageSender,
  options: ExtractRequestOptions,
  timeoutMs = 8000
): Promise<ExtractResponse> {
  const isReady = await pingWithRetries(sendMessage);
  if (!isReady) {
    throw new Error('CONTENT_SCRIPT_NOT_READY');
  }

  const response = await withTimeout<ExtractResponse>(
    sendMessage({
      type: 'mdai:extract',
      options,
    }) as Promise<ExtractResponse>,
    timeoutMs,
    'TIMEOUT'
  );

  if (!response || typeof response !== 'object') {
    throw new Error('EMPTY_RESPONSE');
  }

  if (response.error) {
    throw new Error(response.error);
  }

  return response;
}
