import {
  detectSiteAdapter,
  extractDomain,
  isGoogleWorkspaceAdapter,
  isSupportedUrl,
} from '../../src/lib/domain';
import { getFlagSvg } from '../../src/lib/flags';
import {
  detectBrowserLocale,
  SUPPORTED_LOCALES,
  t,
  type TranslationKey,
} from '../../src/lib/i18n';
import {
  applyPresetToProfile,
  clampBrightness,
  clampContrast,
  clampWarmth,
  createDefaultProfile,
  PRESETS,
} from '../../src/lib/presets';
import {
  getDomainProfile,
  getStoredSettings,
  removeDomainProfile,
  saveDomainProfile,
  saveStoredSettings,
} from '../../src/lib/storage';
import type {
  DomainProfile,
  Locale,
  PresetId,
  Settings,
  SiteAdapter,
  Theme,
} from '../../src/lib/types';

const el = {
  localeSwitcher: document.getElementById('locale-switcher') as HTMLElement,
  btnLocaleTrigger: document.getElementById('btn-locale-trigger') as HTMLButtonElement,
  currentLocaleFlag: document.getElementById('current-locale-flag') as HTMLElement,
  localeMenu: document.getElementById('locale-menu') as HTMLUListElement,
  localeItems: document.querySelectorAll<HTMLLIElement>('.locale-item'),
  btnThemeToggle: document.getElementById('btn-theme-toggle') as HTMLButtonElement,

  restrictedBanner: document.getElementById('restricted-banner') as HTMLElement,
  textRestrictedTitle: document.getElementById('text-restricted-title') as HTMLElement,
  textRestrictedDesc: document.getElementById('text-restricted-desc') as HTMLElement,
  mainDeck: document.getElementById('main-deck') as HTMLElement,

  textAppTitle: document.getElementById('text-app-title') as HTMLElement,
  currentDomain: document.getElementById('current-domain') as HTMLElement,
  adapterBadge: document.getElementById('adapter-badge') as HTMLElement,
  statusPill: document.getElementById('status-pill') as HTMLElement,
  ledStatus: document.getElementById('led-status') as HTMLElement,
  textSiteStatus: document.getElementById('text-site-status') as HTMLElement,

  ledMaster: document.getElementById('led-master') as HTMLElement,
  textMasterLabel: document.getElementById('text-master-label') as HTMLElement,
  btnReset: document.getElementById('btn-reset') as HTMLButtonElement,
  textBtnReset: document.getElementById('text-btn-reset') as HTMLElement,
  toggleEnabled: document.getElementById('toggle-enabled') as HTMLInputElement,

  textPresetsHeading: document.getElementById('text-presets-heading') as HTMLElement,
  presetButtons: document.querySelectorAll<HTMLButtonElement>('.btn-preset'),
  textPresetCarbon: document.getElementById('text-preset-carbon') as HTMLElement,
  textPresetCarbonDesc: document.getElementById('text-preset-carbon-desc') as HTMLElement,
  textPresetWarmPaper: document.getElementById('text-preset-warm-paper') as HTMLElement,
  textPresetWarmPaperDesc: document.getElementById('text-preset-warm-paper-desc') as HTMLElement,
  textPresetNightShift: document.getElementById('text-preset-night-shift') as HTMLElement,
  textPresetNightShiftDesc: document.getElementById('text-preset-night-shift-desc') as HTMLElement,
  textPresetCrispDark: document.getElementById('text-preset-crisp-dark') as HTMLElement,
  textPresetCrispDarkDesc: document.getElementById('text-preset-crisp-dark-desc') as HTMLElement,

  textCalibrationHeading: document.getElementById('text-calibration-heading') as HTMLElement,
  textLabelBrightness: document.getElementById('text-label-brightness') as HTMLElement,
  valBrightness: document.getElementById('val-brightness') as HTMLElement,
  sliderBrightness: document.getElementById('slider-brightness') as HTMLInputElement,

  textLabelContrast: document.getElementById('text-label-contrast') as HTMLElement,
  valContrast: document.getElementById('val-contrast') as HTMLElement,
  sliderContrast: document.getElementById('slider-contrast') as HTMLInputElement,

  textLabelWarmth: document.getElementById('text-label-warmth') as HTMLElement,
  valWarmth: document.getElementById('val-warmth') as HTMLElement,
  sliderWarmth: document.getElementById('slider-warmth') as HTMLInputElement,

  rowDarkenCanvas: document.getElementById('row-darken-canvas') as HTMLElement,
  ledCanvas: document.getElementById('led-canvas') as HTMLElement,
  textLabelDarkenCanvas: document.getElementById('text-label-darken-canvas') as HTMLElement,
  textDescDarkenCanvas: document.getElementById('text-desc-darken-canvas') as HTMLElement,
  toggleDarkenCanvas: document.getElementById('toggle-darken-canvas') as HTMLInputElement,

  ledRemember: document.getElementById('led-remember') as HTMLElement,
  textLabelRememberSite: document.getElementById('text-label-remember-site') as HTMLElement,
  textDescRememberSite: document.getElementById('text-desc-remember-site') as HTMLElement,
  toggleRememberSite: document.getElementById('toggle-remember-site') as HTMLInputElement,

  btnShortcutSettings: document.getElementById('btn-shortcut-settings') as HTMLButtonElement,
  textShortcutHint: document.getElementById('text-shortcut-hint') as HTMLElement,
  textFooterBy: document.getElementById('text-footer-by') as HTMLElement,
};

let currentTabId: number | null = null;
let activeDomain: string | null = null;
let currentAdapter: SiteAdapter = 'generic';
let supported = true;

let settings: Settings = {
  locale: 'en',
  theme: 'dark',
};

let profile: DomainProfile = createDefaultProfile();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function applyTheme(theme: Theme): void {
  settings.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
}

function renderFlagMenuIcons(): void {
  el.localeItems.forEach((item) => {
    const loc = item.dataset.locale as Locale;
    if (SUPPORTED_LOCALES.includes(loc)) {
      item.innerHTML = getFlagSvg(loc);
    }
  });
}

function getAdapterTranslationKey(adapter: SiteAdapter): TranslationKey {
  switch (adapter) {
    case 'google-docs':
      return 'adapterGoogleDocs';
    case 'google-sheets':
      return 'adapterGoogleSheets';
    case 'google-slides':
      return 'adapterGoogleSlides';
    default:
      return 'adapterGeneric';
  }
}

function applyTranslations(locale: Locale): void {
  settings.locale = locale;
  document.documentElement.lang = locale === 'pt_BR' ? 'pt-BR' : locale;

  el.currentLocaleFlag.innerHTML = getFlagSvg(locale);
  el.localeItems.forEach((item) => {
    const isActive = item.dataset.locale === locale;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-selected', String(isActive));
  });

  el.btnLocaleTrigger.setAttribute('aria-label', t(locale, 'language'));
  el.btnThemeToggle.setAttribute('aria-label', t(locale, 'toggleTheme'));
  el.textAppTitle.textContent = t(locale, 'appTitle');
  el.textRestrictedTitle.textContent = t(locale, 'restrictedTitle');
  el.textRestrictedDesc.textContent = t(locale, 'restrictedDesc');
  el.textMasterLabel.textContent = t(locale, 'masterSwitchLabel');
  el.textBtnReset.textContent = t(locale, 'btnReset');

  el.textPresetsHeading.textContent = t(locale, 'presetsHeading');
  el.textPresetCarbon.textContent = t(locale, 'presetCarbon');
  el.textPresetCarbonDesc.textContent = t(locale, 'presetCarbonDesc');
  el.textPresetWarmPaper.textContent = t(locale, 'presetWarmPaper');
  el.textPresetWarmPaperDesc.textContent = t(locale, 'presetWarmPaperDesc');
  el.textPresetNightShift.textContent = t(locale, 'presetNightShift');
  el.textPresetNightShiftDesc.textContent = t(locale, 'presetNightShiftDesc');
  el.textPresetCrispDark.textContent = t(locale, 'presetCrispDark');
  el.textPresetCrispDarkDesc.textContent = t(locale, 'presetCrispDarkDesc');

  el.textCalibrationHeading.textContent = t(locale, 'calibrationHeading');
  el.textLabelBrightness.textContent = t(locale, 'labelBrightness');
  el.textLabelContrast.textContent = t(locale, 'labelContrast');
  el.textLabelWarmth.textContent = t(locale, 'labelWarmth');

  el.textLabelDarkenCanvas.textContent = t(locale, 'labelDarkenCanvas');
  el.textDescDarkenCanvas.textContent = isGoogleWorkspaceAdapter(currentAdapter)
    ? t(locale, 'descDarkenCanvasWorkspace')
    : t(locale, 'descDarkenCanvas');

  el.textLabelRememberSite.textContent = t(locale, 'labelRememberSite');
  el.textDescRememberSite.textContent = t(locale, 'descRememberSite');
  el.textShortcutHint.textContent = t(locale, 'shortcutHint');
  el.textFooterBy.textContent = t(locale, 'footerBy');

  el.adapterBadge.textContent = t(locale, getAdapterTranslationKey(currentAdapter));
  el.textSiteStatus.textContent = profile.enabled
    ? t(locale, 'siteStatusActive')
    : t(locale, 'siteStatusInactive');
}

function renderProfile(): void {
  el.toggleEnabled.checked = profile.enabled;
  el.ledMaster.classList.toggle('on', profile.enabled);
  el.ledStatus.classList.toggle('on', profile.enabled);
  el.statusPill.classList.toggle('active', profile.enabled);
  el.textSiteStatus.textContent = profile.enabled
    ? t(settings.locale, 'siteStatusActive')
    : t(settings.locale, 'siteStatusInactive');

  el.presetButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.preset === profile.preset);
  });

  el.sliderBrightness.value = String(profile.brightness);
  el.valBrightness.textContent = `${profile.brightness}%`;

  el.sliderContrast.value = String(profile.contrast);
  el.valContrast.textContent = `${profile.contrast}%`;

  el.sliderWarmth.value = String(profile.warmth);
  el.valWarmth.textContent = `${profile.warmth}%`;

  el.toggleDarkenCanvas.checked = profile.darkenCanvas;
  el.ledCanvas.classList.toggle('on', profile.darkenCanvas);

  el.toggleRememberSite.checked = profile.rememberSite;
  el.ledRemember.classList.toggle('on', profile.rememberSite);
}

async function dispatchLiveUpdate(): Promise<void> {
  if (currentTabId === null || !supported) return;

  const message = {
    type: 'APPLY_PROFILE' as const,
    profile,
    adapter: currentAdapter,
  };

  try {
    await chrome.tabs.sendMessage(currentTabId, message);
  } catch {
    // Tab was already open before extension install/reload: inject content script on demand
    try {
      await chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        files: ['content-scripts/content.js'],
      });
      await chrome.tabs.sendMessage(currentTabId, message);
    } catch {
      // Restricted or closed tab
    }
  }

  void chrome.runtime
    .sendMessage({
      type: 'UPDATE_BADGE',
      tabId: currentTabId,
      enabled: profile.enabled,
    })
    .catch(() => {
      // Ignore background wake errors
    });
}

function schedulePersist(): void {
  if (!activeDomain) return;
  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    if (!activeDomain) return;
    if (profile.rememberSite) {
      void saveDomainProfile(activeDomain, profile);
    } else {
      void removeDomainProfile(activeDomain);
    }
  }, 120);
}

function updateProfile(mutator: (prev: DomainProfile) => DomainProfile): void {
  profile = mutator(profile);
  renderProfile();
  dispatchLiveUpdate();
  schedulePersist();
}

function closeLocaleMenu(): void {
  el.localeMenu.classList.add('hidden');
  el.btnLocaleTrigger.setAttribute('aria-expanded', 'false');
}

function toggleLocaleMenu(): void {
  const isOpen = !el.localeMenu.classList.contains('hidden');
  if (isOpen) {
    closeLocaleMenu();
  } else {
    el.localeMenu.classList.remove('hidden');
    el.btnLocaleTrigger.setAttribute('aria-expanded', 'true');
  }
}

function selectPreset(presetId: PresetId): void {
  if (!PRESETS[presetId]) return;
  updateProfile((prev) => ({
    ...applyPresetToProfile(prev, presetId),
    enabled: true,
  }));
}

function resetCurrentPreset(): void {
  updateProfile((prev) => applyPresetToProfile(prev, prev.preset));
}

function bindEvents(): void {
  el.btnLocaleTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLocaleMenu();
  });

  el.localeItems.forEach((item) => {
    const choose = () => {
      const loc = item.dataset.locale as Locale;
      if (!SUPPORTED_LOCALES.includes(loc)) return;
      applyTranslations(loc);
      void saveStoredSettings({ locale: loc });
      closeLocaleMenu();
    };
    item.addEventListener('click', choose);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        choose();
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!el.localeSwitcher.contains(e.target as Node)) {
      closeLocaleMenu();
    }
  });

  el.btnThemeToggle.addEventListener('click', () => {
    const nextTheme: Theme = settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    void saveStoredSettings({ theme: nextTheme });
  });

  el.toggleEnabled.addEventListener('change', () => {
    updateProfile((prev) => ({
      ...prev,
      enabled: el.toggleEnabled.checked,
      updatedAt: Date.now(),
    }));
  });

  el.btnReset.addEventListener('click', () => {
    resetCurrentPreset();
  });

  el.presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const presetId = btn.dataset.preset as PresetId;
      selectPreset(presetId);
    });
  });

  el.sliderBrightness.addEventListener('input', () => {
    const value = clampBrightness(Number(el.sliderBrightness.value));
    updateProfile((prev) => ({
      ...prev,
      enabled: true,
      brightness: value,
      updatedAt: Date.now(),
    }));
  });

  el.sliderContrast.addEventListener('input', () => {
    const value = clampContrast(Number(el.sliderContrast.value));
    updateProfile((prev) => ({
      ...prev,
      enabled: true,
      contrast: value,
      updatedAt: Date.now(),
    }));
  });

  el.sliderWarmth.addEventListener('input', () => {
    const value = clampWarmth(Number(el.sliderWarmth.value));
    updateProfile((prev) => ({
      ...prev,
      enabled: true,
      warmth: value,
      updatedAt: Date.now(),
    }));
  });

  el.toggleDarkenCanvas.addEventListener('change', () => {
    updateProfile((prev) => ({
      ...prev,
      enabled: true,
      darkenCanvas: el.toggleDarkenCanvas.checked,
      updatedAt: Date.now(),
    }));
  });

  el.toggleRememberSite.addEventListener('change', () => {
    updateProfile((prev) => ({
      ...prev,
      rememberSite: el.toggleRememberSite.checked,
      updatedAt: Date.now(),
    }));
  });

  el.btnShortcutSettings.addEventListener('click', () => {
    void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  // Keyboard navigation: Space/Enter toggles main switch, 1-4 presets, R resets, C toggles canvas, Escape dismisses menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLocaleMenu();
      return;
    }

    if (!supported) return;

    const target = e.target as HTMLElement | null;
    const isInputRange =
      target instanceof HTMLInputElement && target.type === 'range';

    if (e.key === '1') {
      selectPreset('carbon');
    } else if (e.key === '2') {
      selectPreset('warm_paper');
    } else if (e.key === '3') {
      selectPreset('night_shift');
    } else if (e.key === '4') {
      selectPreset('crisp_dark');
    } else if (e.key === 'r' || e.key === 'R') {
      resetCurrentPreset();
    } else if (e.key === 'c' || e.key === 'C') {
      updateProfile((prev) => ({
        ...prev,
        enabled: true,
        darkenCanvas: !prev.darkenCanvas,
        updatedAt: Date.now(),
      }));
    } else if (
      (e.key === ' ' || e.key === 'Enter') &&
      !isInputRange &&
      !(target instanceof HTMLButtonElement) &&
      !(target instanceof HTMLAnchorElement) &&
      !(target instanceof HTMLLIElement) &&
      target?.id !== 'toggle-enabled' &&
      target?.id !== 'toggle-darken-canvas' &&
      target?.id !== 'toggle-remember-site'
    ) {
      e.preventDefault();
      updateProfile((prev) => ({
        ...prev,
        enabled: !prev.enabled,
        updatedAt: Date.now(),
      }));
    }
  });
}

async function init(): Promise<void> {
  renderFlagMenuIcons();
  bindEvents();

  const stored = await getStoredSettings();
  const systemDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const initialTheme: Theme = stored.theme ?? (systemDark ? 'dark' : 'light');
  const initialLocale: Locale = SUPPORTED_LOCALES.includes(stored.locale)
    ? stored.locale
    : detectBrowserLocale();

  applyTheme(initialTheme);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id !== undefined) {
      currentTabId = tab.id;
    }
    const url = tab?.url ?? tab?.pendingUrl ?? '';
    supported = isSupportedUrl(url);
    activeDomain = extractDomain(url);
    currentAdapter = detectSiteAdapter(url);

    if (!supported || !activeDomain) {
      el.restrictedBanner.classList.remove('hidden');
      el.mainDeck.classList.add('hidden');
      applyTranslations(initialLocale);
      return;
    }

    el.currentDomain.textContent = activeDomain;
    const isWorkspace = isGoogleWorkspaceAdapter(currentAdapter);
    el.adapterBadge.classList.toggle('workspace', isWorkspace);
    el.rowDarkenCanvas.classList.toggle('workspace-highlight', isWorkspace);

    const savedProfile = await getDomainProfile(activeDomain);
    if (savedProfile) {
      profile = createDefaultProfile(savedProfile);
    } else {
      profile = createDefaultProfile();
    }
  } catch {
    el.restrictedBanner.classList.remove('hidden');
    el.mainDeck.classList.add('hidden');
  }

  applyTranslations(initialLocale);
  renderProfile();

  // Autofocus primary control on popup open
  if (supported) {
    el.toggleEnabled.focus();
  }
}

void init();
