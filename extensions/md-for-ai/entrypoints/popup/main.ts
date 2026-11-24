import './style.css';
import {
  type SupportedLocale,
  type TranslationKey,
  STORAGE_LOCALE_KEY,
  detectBrowserLocale,
  getLocale,
  setLocale,
  t,
} from '@browser-extensions/shared';
import { trimToTokens } from '../../src/lib/trim-to-tokens';
import { estimateTokens } from '../../src/lib/token-estimator';
import {
  STORAGE_OPTIONS_KEY,
  LIMITS,
  type StoredOptions,
  DEFAULT_OPTIONS,
  isRestrictedUrl,
} from '../../src/lib/options';
import { applyUIState, type UIState, type UIStateElements } from '../../src/lib/ui-state';
import { executeExtractProtocol } from '../../src/lib/protocol';

const STORAGE_ONBOARDING_KEY = 'mdai_onboarding_dismissed';

// Application state
let currentOptions: StoredOptions = { ...DEFAULT_OPTIONS };
let fullExtractedMarkdown = '';
let activeTabId: number | null = null;
let activeTabUrl = '';
let activeTabTitle = '';

/**
 * Checks if current user platform is macOS.
 */
function isMacOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || navigator.userAgent || '';
  return /Mac/i.test(platform);
}

/**
 * Gathers references to state-controlled DOM elements.
 */
function getUIElements(): UIStateElements {
  return {
    loadingIndicator: document.getElementById('loading-indicator'),
    emptyState: document.getElementById('empty-state'),
    errorBanner: document.getElementById('error-banner'),
    errorMessage: document.getElementById('error-message'),
    btnCopy: document.getElementById('btn-copy') as HTMLButtonElement | null,
    btnTrim: document.getElementById('btn-trim') as HTMLButtonElement | null,
    btnRetry: document.getElementById('btn-retry') as HTMLButtonElement | null,
    fallbackBanner: document.getElementById('fallback-banner'),
    previewTextarea: document.getElementById('markdown-preview') as HTMLTextAreaElement | null,
  };
}

/**
 * Updates all UI text labels according to active locale.
 */
function updateLanguageUI(): void {
  const loc = getLocale();
  const langCurrent = document.getElementById('lang-current');
  if (langCurrent) langCurrent.textContent = loc.toUpperCase();

  const setElText = (id: string, key: TranslationKey) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };

  setElText('text-app-title', 'app_name');
  setElText('text-app-tagline', 'app_tagline');
  setElText('text-app-description', 'app_description');
  setElText('text-onboarding-steps', 'onboarding_steps');
  setElText('text-onboarding-dismiss', 'onboarding_dismiss');
  setElText('text-mode-legend', 'mode_label');
  setElText('text-mode-article', 'mode_article');
  setElText('text-mode-full', 'mode_full');
  setElText('text-mode-selection', 'mode_selection');
  setElText('text-toggle-links', 'toggle_links');
  setElText('text-toggle-images-alt', 'toggle_images_alt');
  setElText('text-toggle-meta', 'toggle_meta');
  setElText('text-toggle-copy-on-open', 'toggle_copy_on_open');
  setElText('text-preview-label', 'preview_label');
  setElText('text-loading-status', 'status_loading');
  setElText('text-empty-title', 'empty_state_title');
  setElText('text-empty-desc', 'empty_state_desc');
  setElText('text-btn-trim', 'btn_trim');
  setElText('text-btn-copy', 'btn_copy');
  setElText('text-btn-retry', 'btn_retry');
  setElText('text-fallback-notice', 'notice_fallback_full');

  // Shortcut localized hint (Mac vs PC)
  const shortcutHint = document.getElementById('text-shortcut-hint');
  if (shortcutHint) {
    shortcutHint.textContent = isMacOS() ? t('shortcut_hint_mac') : t('shortcut_hint');
  }

  const previewTextarea = document.getElementById('markdown-preview') as HTMLTextAreaElement | null;
  if (previewTextarea) {
    previewTextarea.placeholder = t('preview_placeholder');
  }

  updateChipsStatus();
}

/**
 * Renders the context header with domain and page title.
 */
function renderPageContext(url: string, title: string): void {
  const contextEl = document.getElementById('page-context');
  const domainEl = document.getElementById('page-domain');
  const titleEl = document.getElementById('page-title');

  if (!contextEl || !url) return;

  try {
    const parsed = new URL(url);
    if (domainEl) domainEl.textContent = parsed.hostname;
    if (titleEl) titleEl.textContent = title || url;
    contextEl.hidden = false;
  } catch {
    contextEl.hidden = true;
  }
}

/**
 * Updates limit chip status badges ("Cabe" / "Excede") and active selection.
 * Guaranteed to compute tokens from the exact final markdown string.
 */
function updateChipsStatus(explicitMarkdown?: string): void {
  const previewTextarea = document.getElementById('markdown-preview') as HTMLTextAreaElement | null;
  const tokenCounter = document.getElementById('token-counter') as HTMLSpanElement | null;
  const btnTrim = document.getElementById('btn-trim') as HTMLButtonElement | null;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;
  const chips = document.querySelectorAll<HTMLButtonElement>('.chip');

  const textToEstimate = explicitMarkdown !== undefined ? explicitMarkdown : (previewTextarea ? previewTextarea.value : '');
  const currentTokens = textToEstimate ? estimateTokens(textToEstimate) : 0;

  if (tokenCounter) {
    tokenCounter.textContent = t('tokens_approx', { count: currentTokens });
  }

  chips.forEach((chip) => {
    const limit = Number(chip.getAttribute('data-limit'));
    const fits = currentTokens <= limit;
    chip.setAttribute('data-fits', String(fits));

    const statusEl = document.getElementById(`chip-status-${limit}`);
    if (statusEl) {
      statusEl.textContent = fits ? t('chip_fits') : t('chip_exceeds');
    }

    const isActive = limit === currentOptions.selectedLimit;
    chip.classList.toggle('active', isActive);
    chip.setAttribute('aria-pressed', String(isActive));
  });

  const hasContent = Boolean(textToEstimate.trim());
  if (btnTrim) {
    btnTrim.disabled = !hasContent || currentTokens <= currentOptions.selectedLimit;
  }
  if (btnCopy) {
    btnCopy.disabled = !hasContent;
  }
}

/**
 * Injects extract content script and requests page markdown using the robust protocol.
 */
async function performExtraction(): Promise<void> {
  const elements = getUIElements();

  if (!activeTabId) {
    applyUIState('error', elements, {
      errorMessage: t('error_no_tab'),
      allowRetry: false,
    });
    return;
  }

  if (isRestrictedUrl(activeTabUrl)) {
    applyUIState('error', elements, {
      errorMessage: t('error_restricted'),
      allowRetry: false,
    });
    return;
  }

  // Set explicit loading state
  applyUIState('loading', elements);

  try {
    // 1. Inject runtime content script in active tab
    try {
      await browser.scripting.executeScript({
        target: { tabId: activeTabId },
        files: ['/content-scripts/extract.js'],
      });
    } catch (_err) {
      applyUIState('error', elements, {
        errorMessage: t('error_restricted'),
        allowRetry: false,
      });
      return;
    }

    // 2. Execute extraction protocol (ping with retries + 8s request timeout)
    const sender = (msg: unknown) => browser.tabs.sendMessage(activeTabId!, msg);
    const response = await executeExtractProtocol(
      sender,
      {
        mode: currentOptions.mode,
        includeLinks: currentOptions.includeLinks,
        imagesAsAlt: currentOptions.imagesAsAlt,
        includeMeta: currentOptions.includeMeta,
      },
      8000
    );

    fullExtractedMarkdown = response.markdown || '';

    // Handle Selection mode when no text was selected
    if (currentOptions.mode === 'selection' && !fullExtractedMarkdown.trim()) {
      applyUIState('error', elements, {
        errorMessage: t('error_no_selection'),
        allowRetry: true,
      });
      if (elements.previewTextarea) elements.previewTextarea.value = '';
      updateChipsStatus('');
      return;
    }

    if (!fullExtractedMarkdown.trim()) {
      applyUIState('empty', elements);
      updateChipsStatus('');
      return;
    }

    // Ready with extracted content
    if (elements.previewTextarea) {
      elements.previewTextarea.value = fullExtractedMarkdown;
    }

    const tokenCount = estimateTokens(fullExtractedMarkdown);
    const canTrim = tokenCount > currentOptions.selectedLimit;

    applyUIState('ready', elements, {
      hasContent: true,
      canTrim,
      isFallback: Boolean(response.isFallback && currentOptions.mode === 'article'),
    });

    updateChipsStatus(fullExtractedMarkdown);

    // Auto-copy on open if option enabled
    if (currentOptions.copyOnOpen) {
      triggerCopy();
    }
  } catch (err) {
    const errorMsg = err instanceof Error && err.message === 'TIMEOUT'
      ? t('error_timeout')
      : t('error_extract_failed');

    applyUIState('error', elements, {
      errorMessage: errorMsg,
      allowRetry: true,
    });
  } finally {
    // Safety guard: loading indicator is strictly disabled
    if (elements.loadingIndicator) {
      elements.loadingIndicator.hidden = true;
    }
  }
}

/**
 * Triggers clipboard copy with visible confirmation.
 */
async function triggerCopy(): Promise<void> {
  const previewTextarea = document.getElementById('markdown-preview') as HTMLTextAreaElement | null;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;
  const text = previewTextarea?.value;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    const textCopySpan = document.getElementById('text-btn-copy');
    if (textCopySpan) textCopySpan.textContent = t('btn_copied');
    if (btnCopy) btnCopy.classList.add('copied');

    setTimeout(() => {
      if (textCopySpan) textCopySpan.textContent = t('btn_copy');
      if (btnCopy) btnCopy.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.warn('Clipboard write failed:', err);
  }
}

/**
 * Saves current options to browser storage asynchronously (non-blocking).
 */
async function saveOptions(): Promise<void> {
  try {
    await browser.storage.local.set({ [STORAGE_OPTIONS_KEY]: currentOptions });
  } catch (err) {
    console.error('Failed to save options:', err);
  }
}

/**
 * Initializes onboarding banner visibility based on storage.
 */
async function initOnboarding(): Promise<void> {
  const banner = document.getElementById('onboarding-banner');
  const btnDismiss = document.getElementById('btn-dismiss-onboarding');

  try {
    const stored = (await browser.storage.local.get(STORAGE_ONBOARDING_KEY)) as Record<string, unknown>;
    if (!stored[STORAGE_ONBOARDING_KEY] && banner) {
      banner.hidden = false;
    }
  } catch {
    if (banner) banner.hidden = false;
  }

  btnDismiss?.addEventListener('click', async () => {
    if (banner) banner.hidden = true;
    try {
      await browser.storage.local.set({ [STORAGE_ONBOARDING_KEY]: true });
    } catch (err) {
      console.warn('Failed to persist onboarding dismissal:', err);
    }
  });
}

/**
 * Initializes the popup on load.
 */
async function init(): Promise<void> {
  // 1. Resolve language from storage or browser
  try {
    const storedLang = (await browser.storage.local.get(STORAGE_LOCALE_KEY)) as Record<string, unknown>;
    const val = storedLang[STORAGE_LOCALE_KEY];
    const loc: SupportedLocale = val === 'es' || val === 'en' ? val : detectBrowserLocale();
    setLocale(loc);
  } catch {
    setLocale(detectBrowserLocale());
  }

  // 2. Resolve stored options
  try {
    const stored = (await browser.storage.local.get(STORAGE_OPTIONS_KEY)) as Record<string, unknown>;
    const savedOpts = stored[STORAGE_OPTIONS_KEY];
    if (savedOpts && typeof savedOpts === 'object') {
      currentOptions = { ...DEFAULT_OPTIONS, ...(savedOpts as Partial<StoredOptions>) };
    }
  } catch {
    currentOptions = { ...DEFAULT_OPTIONS };
  }

  // 3. Reflect options in UI
  const radioArticle = document.getElementById('mode-article') as HTMLInputElement | null;
  const radioFull = document.getElementById('mode-full') as HTMLInputElement | null;
  const radioSelection = document.getElementById('mode-selection') as HTMLInputElement | null;

  if (currentOptions.mode === 'full' && radioFull) radioFull.checked = true;
  else if (currentOptions.mode === 'selection' && radioSelection) radioSelection.checked = true;
  else if (radioArticle) radioArticle.checked = true;

  const toggleLinks = document.getElementById('toggle-links') as HTMLInputElement | null;
  const toggleImagesAlt = document.getElementById('toggle-images-alt') as HTMLInputElement | null;
  const toggleMeta = document.getElementById('toggle-meta') as HTMLInputElement | null;
  const toggleCopyOnOpen = document.getElementById('toggle-copy-on-open') as HTMLInputElement | null;

  if (toggleLinks) toggleLinks.checked = currentOptions.includeLinks;
  if (toggleImagesAlt) toggleImagesAlt.checked = currentOptions.imagesAsAlt;
  if (toggleMeta) toggleMeta.checked = currentOptions.includeMeta;
  if (toggleCopyOnOpen) toggleCopyOnOpen.checked = currentOptions.copyOnOpen;

  updateLanguageUI();
  initOnboarding();
  bindEvents();

  // 4. Query active tab and start extraction
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      activeTabId = tab.id;
      activeTabUrl = tab.url || '';
      activeTabTitle = tab.title || '';
      renderPageContext(activeTabUrl, activeTabTitle);
      await performExtraction();
    } else {
      applyUIState('error', getUIElements(), {
        errorMessage: t('error_no_tab'),
        allowRetry: false,
      });
    }
  } catch {
    applyUIState('error', getUIElements(), {
      errorMessage: t('error_no_tab'),
      allowRetry: false,
    });
  }
}

/**
 * Attaches event listeners to DOM elements.
 */
function bindEvents(): void {
  const radioArticle = document.getElementById('mode-article') as HTMLInputElement | null;
  const radioFull = document.getElementById('mode-full') as HTMLInputElement | null;
  const radioSelection = document.getElementById('mode-selection') as HTMLInputElement | null;

  [radioArticle, radioFull, radioSelection].forEach((radio) => {
    radio?.addEventListener('change', () => {
      currentOptions.mode = (radio.value as 'article' | 'full' | 'selection');
      saveOptions();
      performExtraction();
    });
  });

  const toggleLinks = document.getElementById('toggle-links') as HTMLInputElement | null;
  toggleLinks?.addEventListener('change', () => {
    currentOptions.includeLinks = toggleLinks.checked;
    saveOptions();
    performExtraction();
  });

  const toggleImagesAlt = document.getElementById('toggle-images-alt') as HTMLInputElement | null;
  toggleImagesAlt?.addEventListener('change', () => {
    currentOptions.imagesAsAlt = toggleImagesAlt.checked;
    saveOptions();
    performExtraction();
  });

  const toggleMeta = document.getElementById('toggle-meta') as HTMLInputElement | null;
  toggleMeta?.addEventListener('change', () => {
    currentOptions.includeMeta = toggleMeta.checked;
    saveOptions();
    performExtraction();
  });

  const toggleCopyOnOpen = document.getElementById('toggle-copy-on-open') as HTMLInputElement | null;
  toggleCopyOnOpen?.addEventListener('change', () => {
    currentOptions.copyOnOpen = toggleCopyOnOpen.checked;
    saveOptions();
  });

  const chips = document.querySelectorAll<HTMLButtonElement>('.chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const limit = Number(chip.getAttribute('data-limit'));
      currentOptions.selectedLimit = limit;
      saveOptions();
      updateChipsStatus();
    });
  });

  const btnTrim = document.getElementById('btn-trim') as HTMLButtonElement | null;
  btnTrim?.addEventListener('click', () => {
    if (!fullExtractedMarkdown) return;
    const previewTextarea = document.getElementById('markdown-preview') as HTMLTextAreaElement | null;
    const trimmed = trimToTokens(fullExtractedMarkdown, currentOptions.selectedLimit);
    if (previewTextarea) previewTextarea.value = trimmed;
    updateChipsStatus(trimmed);
  });

  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;
  btnCopy?.addEventListener('click', triggerCopy);

  const btnRetry = document.getElementById('btn-retry') as HTMLButtonElement | null;
  btnRetry?.addEventListener('click', () => {
    performExtraction();
  });

  const btnShortcutSettings = document.getElementById('btn-shortcut-settings') as HTMLButtonElement | null;
  btnShortcutSettings?.addEventListener('click', async () => {
    try {
      await browser.tabs.create({ url: 'chrome://extensions/shortcuts' });
    } catch (err) {
      console.warn('Could not open shortcuts settings:', err);
    }
  });

  const btnLangToggle = document.getElementById('btn-lang-toggle') as HTMLButtonElement | null;
  btnLangToggle?.addEventListener('click', async () => {
    const newLocale: SupportedLocale = getLocale() === 'es' ? 'en' : 'es';
    setLocale(newLocale);
    try {
      await browser.storage.local.set({ [STORAGE_LOCALE_KEY]: newLocale });
    } catch (err) {
      console.error('Failed to save locale:', err);
    }
    updateLanguageUI();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.close();
    }
  });
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
