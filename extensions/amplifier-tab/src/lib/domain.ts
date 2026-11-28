/**
 * Extrae y normaliza el dominio a partir de una URL dada.
 * Remueve prefijo 'www.' y puertos. Retorna null si la URL es inválida,
 * vacía o pertenece a un esquema no admitido (chrome://, edge://, about:, file://, etc.).
 */
export function extractDomain(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    return hostname || null;
  } catch {
    return null;
  }
}

/**
 * Determina si una URL puede ser capturada mediante tabCapture.
 * Excluye páginas del sistema, extensiones y Chrome Web Store.
 */
export function isCapturableUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith('chrome://') ||
    trimmed.startsWith('edge://') ||
    trimmed.startsWith('brave://') ||
    trimmed.startsWith('about:') ||
    trimmed.startsWith('chrome-extension://') ||
    trimmed.startsWith('view-source:') ||
    trimmed.startsWith('chrome-search://')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // Chrome Web Store bloquea inyecciones y tabCapture directo
    if (parsed.hostname.includes('chromewebstore.google.com') || parsed.hostname.includes('chrome.google.com')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
