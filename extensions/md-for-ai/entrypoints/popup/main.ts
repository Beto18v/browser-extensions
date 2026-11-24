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

const STORAGE_OPTIONS_KEY = 'mdai_options_v1';

const LIMITS = [8192, 32768, 131072, 204800] as const;

interface StoredOptions {
  mode: 'article' | 'full' | 'selection';
  includeLinks: boolean;
  imagesAsAlt: boolean;
  includeMeta: boolean;
  selectedLimit: number;
}

const DEFAULT_OPTIONS: StoredOptions = {
  mode: 'article',
  includeLinks: true,
  imagesAsAlt: true,
  includeMeta: true,
  selectedLimit: 8192,
};

// Application state
let currentOptions: StoredOptions = { ...DEFAULT_OPTIONS };
let fullExtractedMarkdown = '';
let activeTabId: number | null = null;
let activeTabUrl = '';

// DOM Elements
const errorBanner = document.getElementById('error-banner') as HTMLDivElement;
const btnLangToggle = document.getElementById('btn-lang-toggle') as HTMLButtonElement;
const langCurrent = document.getElementById('lang-current') as HTMLSpanElement;

const radioArticle = document.getElementById('mode-article') as HTMLInputElement;
const radioFull = document.getElementById('mode-full') as HTMLInputElement;
const radioSelection = document.getElementById('mode-selection') as HTMLInputElement;

const toggleLinks = document.getElementById('toggle-links') as HTMLInputElement;
const toggleImagesAlt = document.getElementById('toggle-images-alt') as HTMLInputElement;
const toggleMeta = document.getElementById('toggle-meta') as HTMLInputElement;

const previewTextarea = document.getElementById('markdown-preview') as HTMLTextAreaElement;
const tokenCounter = document.getElementById('token-counter') as HTMLSpanElement;

const chips = document.querySelectorAll<HTMLButtonElement>('.chip');
const btnTrim = document.getElementById('btn-trim') as HTMLButtonElement;
const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement;

/**
 * Updates all UI text labels according to active locale.
 */
function updateLanguageUI(): void {
  const loc = getLocale();
  langCurrent.textContent = loc.toUpperCase();

  const setElText = (id: string, key: TranslationKey) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };

  setElText('text-app-title', 'app_name');
  setElText('text-mode-legend', 'mode_label');
  setElText('text-mode-article', 'mode_article');
  setElText('text-mode-full', 'mode_full');
  setElText('text-mode-selection', 'mode_selection');
  setElText('text-toggle-links', 'toggle_links');
  setElText('text-toggle-images-alt', 'toggle_images_alt');
  setElText('text-toggle-meta', 'toggle_meta');
  setElText('text-preview-label', 'preview_label');
  setElText('text-btn-trim', 'btn_trim');
  setElText('text-btn-copy', 'btn_copy');

  updateChipsStatus();
}

/**
 * Checks if a URL cannot be injected with content scripts.
 */
function isRestrictedUrl(url: string): boolean {
  if (!url) return true;
  return (
    url.startsWith('chrome://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('chrome-extension://') ||
    url.includes('chrome.google.com/webstore') ||
    url.includes('chromewebstore.google.com') ||
    url.endsWith('.pdf') ||
    url.startsWith('view-source:')
  );
}

/**
 * Displays error banner with accessible message.
 */
function showError(message: string): void {
  errorBanner.textContent = message;
  errorBanner.hidden = false;
  btnCopy.disabled = true;
  btnTrim.disabled = true;
}

/**
 * Clears error banner.
 */
function clearError(): void {
  errorBanner.hidden = true;
  errorBanner.textContent = '';
}

/**
 * Updates limit chip status badges ("Cabe" / "Excede") and active selection.
 */
function updateChipsStatus(): void {
  const currentTokens = estimateTokens(previewTextarea.value);
  tokenCounter.textContent = t('tokens_approx', { count: currentTokens });

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

  // Trim button is only enabled when current tokens exceed the chosen limit
  btnTrim.disabled = currentTokens <= currentOptions.selectedLimit || !previewTextarea.value.trim();
  btnCopy.disabled = !previewTextarea.value.trim();
}

/**
 * Injects extract content script and requests page markdown.
 */
async function performExtraction(): Promise<void> {
  clearError();

  if (!activeTabId) {
    showError(t('error_no_tab'));
    return;
  }

  if (isRestrictedUrl(activeTabUrl)) {
    showError(t('error_restricted'));
    return;
  }

  previewTextarea.placeholder = t('preview_placeholder');

  try {
    // Inject runtime content script in active tab
    await browser.scripting.executeScript({
      target: { tabId: activeTabId },
      files: ['/content-scripts/extract.js'],
    });
  } catch (_err) {
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

    if (response && response.error) {
      showError(t('error_extract_failed'));
      return;
    }

    if (response && typeof response.markdown === 'string') {
      fullExtractedMarkdown = response.markdown;

      if (!fullExtractedMarkdown && currentOptions.mode === 'selection') {
        showError(t('error_no_selection'));
        previewTextarea.value = '';
      } else {
        previewTextarea.value = fullExtractedMarkdown;
      }

      updateChipsStatus();
    }
  } catch (_err) {
    showError(t('error_extract_failed'));
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
  if (currentOptions.mode === 'full') radioFull.checked = true;
  else if (currentOptions.mode === 'selection') radioSelection.checked = true;
  else radioArticle.checked = true;

  toggleLinks.checked = currentOptions.includeLinks;
  toggleImagesAlt.checked = currentOptions.imagesAsAlt;
  toggleMeta.checked = currentOptions.includeMeta;

  updateLanguageUI();

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

// Event Listeners

// Mode selector
[radioArticle, radioFull, radioSelection].forEach((radio) => {
  radio.addEventListener('change', () => {
    currentOptions.mode = radio.value as 'article' | 'full' | 'selection';
    saveOptions();
    performExtraction();
  });
});

// Toggles
toggleLinks.addEventListener('change', () => {
  currentOptions.includeLinks = toggleLinks.checked;
  saveOptions();
  performExtraction();
});

toggleImagesAlt.addEventListener('change', () => {
  currentOptions.imagesAsAlt = toggleImagesAlt.checked;
  saveOptions();
  performExtraction();
});

toggleMeta.addEventListener('change', () => {
  currentOptions.includeMeta = toggleMeta.checked;
  saveOptions();
  performExtraction();
});

// Chips
chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const limit = Number(chip.getAttribute('data-limit'));
    currentOptions.selectedLimit = limit;
    saveOptions();
    updateChipsStatus();
  });
});

// Trim button
btnTrim.addEventListener('click', () => {
  if (!fullExtractedMarkdown) return;
  const trimmed = trimToTokens(fullExtractedMarkdown, currentOptions.selectedLimit);
  previewTextarea.value = trimmed;
  updateChipsStatus();
});

// Copy button
btnCopy.addEventListener('click', async () => {
  const text = previewTextarea.value;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    const originalText = document.getElementById('text-btn-copy')?.textContent || t('btn_copy');
    const textCopySpan = document.getElementById('text-btn-copy');
    if (textCopySpan) textCopySpan.textContent = t('btn_copied');
    btnCopy.classList.add('copied');

    setTimeout(() => {
      if (textCopySpan) textCopySpan.textContent = originalText;
      btnCopy.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
});

// Language toggle button
btnLangToggle.addEventListener('click', async () => {
  const newLocale: SupportedLocale = getLocale() === 'es' ? 'en' : 'es';
  setLocale(newLocale);
  try {
    await browser.storage.local.set({ [STORAGE_LOCALE_KEY]: newLocale });
  } catch (err) {
    console.error('Failed to save locale:', err);
  }
  updateLanguageUI();
});

// Keyboard navigation: Escape key closes popup or blurs
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.close();
  }
});

// Initialize on DOMContentLoaded or immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
