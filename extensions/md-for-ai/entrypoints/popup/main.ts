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

// Application state
let currentOptions: StoredOptions = { ...DEFAULT_OPTIONS };
let fullExtractedMarkdown = '';
let activeTabId: number | null = null;
let activeTabUrl = '';

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
  setElText('text-shortcut-hint', 'shortcut_hint');

  const previewTextarea = document.getElementById('markdown-preview') as HTMLTextAreaElement | null;
  if (previewTextarea) {
    previewTextarea.placeholder = t('preview_placeholder');
  }

  updateChipsStatus();
}

/**
 * Displays error banner with accessible message.
 */
function showError(message: string): void {
  const errorBanner = document.getElementById('error-banner') as HTMLDivElement | null;
  const loadingIndicator = document.getElementById('loading-indicator') as HTMLDivElement | null;
  const emptyState = document.getElementById('empty-state') as HTMLDivElement | null;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;
  const btnTrim = document.getElementById('btn-trim') as HTMLButtonElement | null;

  if (errorBanner) {
    errorBanner.textContent = message;
    errorBanner.hidden = false;
  }
  if (loadingIndicator) loadingIndicator.hidden = true;
  if (emptyState) emptyState.hidden = true;
  if (btnCopy) btnCopy.disabled = true;
  if (btnTrim) btnTrim.disabled = true;
}

/**
 * Clears error banner.
 */
function clearError(): void {
  const errorBanner = document.getElementById('error-banner') as HTMLDivElement | null;
  if (errorBanner) {
    errorBanner.hidden = true;
    errorBanner.textContent = '';
  }
}

/**
 * Updates limit chip status badges ("Cabe" / "Excede") and active selection.
 */
function updateChipsStatus(): void {
  const previewTextarea = document.getElementById('markdown-preview') as HTMLTextAreaElement | null;
  const tokenCounter = document.getElementById('token-counter') as HTMLSpanElement | null;
  const btnTrim = document.getElementById('btn-trim') as HTMLButtonElement | null;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;
  const chips = document.querySelectorAll<HTMLButtonElement>('.chip');

  const currentTokens = previewTextarea ? estimateTokens(previewTextarea.value) : 0;
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

  const hasContent = Boolean(previewTextarea?.value.trim());
  if (btnTrim) {
    btnTrim.disabled = !hasContent || currentTokens <= currentOptions.selectedLimit;
  }
  if (btnCopy) {
    btnCopy.disabled = !hasContent;
  }
}

/**
 * Injects extract content script and requests page markdown.
 */
async function performExtraction(): Promise<void> {
  clearError();

  const loadingIndicator = document.getElementById('loading-indicator') as HTMLDivElement | null;
  const emptyState = document.getElementById('empty-state') as HTMLDivElement | null;
  const previewTextarea = document.getElementById('markdown-preview') as HTMLTextAreaElement | null;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;
  const btnTrim = document.getElementById('btn-trim') as HTMLButtonElement | null;

  if (!activeTabId) {
    showError(t('error_no_tab'));
    return;
  }

  if (isRestrictedUrl(activeTabUrl)) {
    showError(t('error_restricted'));
    return;
  }

  if (loadingIndicator) loadingIndicator.hidden = false;
  if (emptyState) emptyState.hidden = true;
  if (btnCopy) btnCopy.disabled = true;
  if (btnTrim) btnTrim.disabled = true;

  try {
    // Inject runtime content script in active tab
    await browser.scripting.executeScript({
      target: { tabId: activeTabId },
      files: ['/content-scripts/extract.js'],
    });
  } catch (_err) {
    if (loadingIndicator) loadingIndicator.hidden = true;
    showError(t('error_restricted'));
    return;
  }

  try {
    const response = await browser.tabs.sendMessage(activeTabId, {
      type: 'mdai:extract',
      options: {
        mode: currentOptions.mode,
        includeLinks: currentOptions.includeLinks,
        imagesAsAlt: currentOptions.imagesAsAlt,
        includeMeta: currentOptions.includeMeta,
      },
    });

    if (loadingIndicator) loadingIndicator.hidden = true;

    if (response && response.error) {
      showError(t('error_extract_failed'));
      return;
    }

    if (response && typeof response.markdown === 'string') {
      fullExtractedMarkdown = response.markdown;

      if (!fullExtractedMarkdown.trim()) {
        if (emptyState) emptyState.hidden = false;
        if (previewTextarea) previewTextarea.value = '';
      } else {
        if (emptyState) emptyState.hidden = true;
        if (previewTextarea) previewTextarea.value = fullExtractedMarkdown;

        // Auto-copy on open if option enabled
        if (currentOptions.copyOnOpen) {
          triggerCopy();
        }
      }

      updateChipsStatus();
    } else {
      if (emptyState) emptyState.hidden = false;
    }
  } catch (_err) {
    if (loadingIndicator) loadingIndicator.hidden = true;
    showError(t('error_extract_failed'));
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
  bindEvents();

  // 4. Query active tab
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      activeTabId = tab.id;
      activeTabUrl = tab.url || '';
      await performExtraction();
    } else {
      showError(t('error_no_tab'));
    }
  } catch {
    showError(t('error_no_tab'));
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
    updateChipsStatus();
  });

  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;
  btnCopy?.addEventListener('click', triggerCopy);

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
