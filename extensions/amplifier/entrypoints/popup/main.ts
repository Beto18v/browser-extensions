import { extractDomain, isCapturableUrl } from '../../src/lib/domain';
import { detectBrowserLocale, SUPPORTED_LOCALES, t } from '../../src/lib/i18n';
import {
  clampVolume,
  DEFAULT_PRESET,
  DEFAULT_VOLUME,
  getMeterBlocksCount,
  getMeterZone,
} from '../../src/lib/presets';
import {
  getDomainProfile,
  getStoredSettings,
  saveDomainProfile,
  saveStoredSettings,
} from '../../src/lib/storage';
import type {
  AudibleTabInfo,
  Locale,
  Settings,
  TabAudioState,
  Theme,
  TonePresetId,
} from '../../src/lib/types';

// Elementos del DOM
const elements = {
  // Locale & Theme
  selectLocale: document.getElementById('select-locale') as HTMLSelectElement,
  localeDropdownWrapper: document.getElementById('locale-dropdown-wrapper') as HTMLElement,
  btnLocaleTrigger: document.getElementById('btn-locale-trigger') as HTMLButtonElement,
  currentLocaleFlag: document.getElementById('current-locale-flag') as HTMLElement,
  localeMenu: document.getElementById('locale-menu') as HTMLUListElement,
  localeItems: document.querySelectorAll<HTMLLIElement>('.locale-item'),
  btnThemeToggle: document.getElementById('btn-theme-toggle') as HTMLButtonElement,

  // Textos para i18n
  textAppTitle: document.getElementById('text-app-title') as HTMLElement,
  currentDomain: document.getElementById('current-domain') as HTMLElement,
  meterBadge: document.getElementById('meter-badge') as HTMLElement,
  btnMute: document.getElementById('btn-mute') as HTMLButtonElement,
  btnReset: document.getElementById('btn-reset') as HTMLButtonElement,
  volumeDisplay: document.getElementById('volume-display') as HTMLElement,
  vuMeter: document.getElementById('vu-meter') as HTMLElement,
  volumeSlider: document.getElementById('volume-slider') as HTMLInputElement,

  // Presets
  textPresetsHeading: document.getElementById('text-presets-heading') as HTMLElement,
  textPresetNormal: document.getElementById('text-preset-normal') as HTMLElement,
  textPresetNormalDesc: document.getElementById('text-preset-normal-desc') as HTMLElement,
  textPresetVoice: document.getElementById('text-preset-voice') as HTMLElement,
  textPresetVoiceDesc: document.getElementById('text-preset-voice-desc') as HTMLElement,
  textPresetBass: document.getElementById('text-preset-bass') as HTMLElement,
  textPresetBassDesc: document.getElementById('text-preset-bass-desc') as HTMLElement,
  textPresetNight: document.getElementById('text-preset-night') as HTMLElement,
  textPresetNightDesc: document.getElementById('text-preset-night-desc') as HTMLElement,
  presetButtons: document.querySelectorAll<HTMLButtonElement>('.btn-preset'),

  // Switches
  textLimiterLabel: document.getElementById('text-limiter-label') as HTMLElement,
  textLimiterDesc: document.getElementById('text-limiter-desc') as HTMLElement,
  toggleLimiter: document.getElementById('toggle-limiter') as HTMLInputElement,
  textRememberLabel: document.getElementById('text-remember-label') as HTMLElement,
  textRememberDesc: document.getElementById('text-remember-desc') as HTMLElement,
  toggleRemember: document.getElementById('toggle-remember') as HTMLInputElement,

  // Restricted
  restrictedBanner: document.getElementById('restricted-banner') as HTMLElement,
  textRestrictedTitle: document.getElementById('text-restricted-title') as HTMLElement,
  textRestrictedDesc: document.getElementById('text-restricted-desc') as HTMLElement,
  mainDeck: document.getElementById('main-deck') as HTMLElement,

  // Audible
  audibleSection: document.getElementById('audible-section') as HTMLElement,
  textAudibleTitle: document.getElementById('text-audible-title') as HTMLElement,
  audibleList: document.getElementById('audible-list') as HTMLUListElement,
  audibleEmpty: document.getElementById('audible-empty') as HTMLElement,
  textAudibleEmpty: document.getElementById('text-audible-empty') as HTMLElement,

  // Footer
  btnShortcutSettings: document.getElementById('btn-shortcut-settings') as HTMLButtonElement,
  textShortcutHint: document.getElementById('text-shortcut-hint') as HTMLElement,
};

let currentTabId: number | null = null;
let currentUrl = '';
let activeDomain: string | null = null;
let capturable = true;

let state: TabAudioState = {
  tabId: -1,
  volume: DEFAULT_VOLUME,
  preset: DEFAULT_PRESET,
  limiter: true,
  muted: false,
  previousVolume: DEFAULT_VOLUME,
  active: false,
};

let settings: Settings = {
  locale: 'en',
  theme: 'dark',
  rememberByDomain: true,
};

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Aplicar tema en el DOM
function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  settings.theme = theme;
}

// Aplicar textos del idioma actual
function applyTranslations(locale: Locale) {
  settings.locale = locale;
  elements.selectLocale.value = locale;

  // Copiar el SVG de la bandera seleccionada hacia el trigger
  const selectedItem = document.querySelector(`.locale-item[data-locale="${locale}"]`);
  if (selectedItem) {
    const flagSvg = selectedItem.querySelector('.flag-icon');
    if (flagSvg) {
      elements.currentLocaleFlag.innerHTML = flagSvg.outerHTML;
    }
  }

  // Marcar ítem activo en el menú
  elements.localeItems.forEach((item) => {
    const itemLoc = item.getAttribute('data-locale');
    if (itemLoc === locale) {
      item.classList.add('selected');
      item.setAttribute('aria-selected', 'true');
    } else {
      item.classList.remove('selected');
      item.setAttribute('aria-selected', 'false');
    }
  });

  elements.textAppTitle.textContent = t(locale, 'appTitle');
  elements.btnMute.title = state.muted ? t(locale, 'unmute') : t(locale, 'mute');
  elements.btnReset.title = t(locale, 'resetTo100');

  elements.textPresetsHeading.textContent = t(locale, 'tonePresets');
  elements.textPresetNormal.textContent = t(locale, 'presetNormal');
  elements.textPresetNormalDesc.textContent = t(locale, 'presetNormalDesc');
  elements.textPresetVoice.textContent = t(locale, 'presetVoice');
  elements.textPresetVoiceDesc.textContent = t(locale, 'presetVoiceDesc');
  elements.textPresetBass.textContent = t(locale, 'presetBass');
  elements.textPresetBassDesc.textContent = t(locale, 'presetBassDesc');
  elements.textPresetNight.textContent = t(locale, 'presetNight');
  elements.textPresetNightDesc.textContent = t(locale, 'presetNightDesc');

  elements.textLimiterLabel.textContent = t(locale, 'limiterLabel');
  elements.textLimiterDesc.textContent = t(locale, 'limiterDesc');
  elements.textRememberLabel.textContent = t(locale, 'rememberLabel');
  elements.textRememberDesc.textContent = t(locale, 'rememberDesc');

  elements.textRestrictedTitle.textContent = t(locale, 'restrictedTitle');
  elements.textRestrictedDesc.textContent = t(locale, 'restrictedDesc');

  elements.textAudibleTitle.textContent = t(locale, 'audibleTitle');
  elements.textAudibleEmpty.textContent = t(locale, 'audibleEmpty');
  elements.textShortcutHint.textContent = t(locale, 'shortcutHint');

  updateUI();
}

// Actualizar componentes reactivos de la UI
function updateUI() {
  const vol = state.volume;
  const isMuted = state.muted;
  const zone = isMuted ? 'muted' : getMeterZone(vol);

  // Dominio
  elements.currentDomain.textContent = activeDomain || t(settings.locale, 'noDomain');

  // Display de volumen
  elements.volumeDisplay.textContent = isMuted ? t(settings.locale, 'zoneMuted') : `${vol}%`;
  elements.volumeDisplay.className = `volume-display zone-${zone}`;

  // Badge
  const zoneKey =
    zone === 'muted'
      ? 'zoneMuted'
      : zone === 'safe'
      ? 'zoneSafe'
      : zone === 'boost'
      ? 'zoneBoost'
      : 'zoneOverdrive';
  elements.meterBadge.textContent = t(settings.locale, zoneKey);
  elements.meterBadge.className = `meter-badge zone-${zone}`;

  // Slider
  elements.volumeSlider.value = String(vol);

  // Mute button
  if (isMuted) {
    elements.btnMute.classList.add('is-muted');
    elements.btnMute.setAttribute('aria-pressed', 'true');
  } else {
    elements.btnMute.classList.remove('is-muted');
    elements.btnMute.setAttribute('aria-pressed', 'false');
  }

  // Presets
  elements.presetButtons.forEach((btn) => {
    const p = btn.getAttribute('data-preset');
    if (p === state.preset) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  // Switches
  elements.toggleLimiter.checked = state.limiter;
  elements.toggleRemember.checked = settings.rememberByDomain;

  // VU Meter (12 bloques)
  const litCount = isMuted ? 0 : getMeterBlocksCount(vol, 12);
  const blocks = elements.vuMeter.querySelectorAll<HTMLElement>('.meter-block');
  blocks.forEach((block, idx) => {
    block.className = 'meter-block';
    if (idx < litCount) {
      if (idx < 2) {
        block.classList.add('lit-safe');
      } else if (idx < 6) {
        block.classList.add('lit-boost');
      } else {
        block.classList.add('lit-overdrive');
      }
    }
  });
}

let audioChangeRafId: number | null = null;
let lastEmittedState: string | null = null;

// Envío y persistencia de audio
function emitAudioChange(options?: { immediateStorage?: boolean }) {
  if (!currentTabId || !capturable) return;

  const stateKey = `${state.volume}_${state.preset}_${state.limiter}_${state.muted}`;

  const send = () => {
    if (lastEmittedState === stateKey) return;
    lastEmittedState = stateKey;

    chrome.runtime.sendMessage({
      type: 'SET_TAB_AUDIO',
      tabId: currentTabId,
      volume: state.volume,
      preset: state.preset,
      limiter: state.limiter,
      muted: state.muted,
    });
  };

  // Si es un cambio inmediato (botones de salto, mute, preset) lo enviamos directo;
  // si es arrastre del slider, usamos requestAnimationFrame para tasa de refresco a 60-120fps en tiempo real sin saturar
  if (options?.immediateStorage) {
    if (audioChangeRafId) cancelAnimationFrame(audioChangeRafId);
    send();
  } else {
    if (audioChangeRafId) cancelAnimationFrame(audioChangeRafId);
    audioChangeRafId = requestAnimationFrame(() => {
      send();
      audioChangeRafId = null;
    });
  }

  if (settings.rememberByDomain && activeDomain) {
    if (options?.immediateStorage) {
      saveDomainProfile(activeDomain, {
        volume: state.volume,
        preset: state.preset,
        limiter: state.limiter,
      });
    } else {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (activeDomain) {
          saveDomainProfile(activeDomain, {
            volume: state.volume,
            preset: state.preset,
            limiter: state.limiter,
          });
        }
      }, 150);
    }
  }
}

// Render de la lista de pestañas que emiten sonido
function renderAudibleTabs(tabs: AudibleTabInfo[]) {
  elements.audibleList.innerHTML = '';
  // Excluir la pestaña actual de la lista de "otras" pestañas
  const otherTabs = tabs.filter((t) => t.id !== currentTabId);

  if (otherTabs.length === 0) {
    elements.audibleEmpty.classList.remove('hidden');
    return;
  }

  elements.audibleEmpty.classList.add('hidden');

  for (const tab of otherTabs) {
    const li = document.createElement('li');
    li.className = 'audible-item';

    const info = document.createElement('div');
    info.className = 'audible-tab-info';
    info.title = tab.title;

    if (tab.favIconUrl) {
      const img = document.createElement('img');
      img.className = 'audible-favicon';
      img.src = tab.favIconUrl;
      img.alt = '';
      info.appendChild(img);
    }

    const titleSpan = document.createElement('span');
    titleSpan.className = 'audible-title';
    titleSpan.textContent = tab.title;
    info.appendChild(titleSpan);

    info.addEventListener('click', () => {
      chrome.tabs.update(tab.id, { active: true });
    });

    const actions = document.createElement('div');
    actions.className = 'audible-actions';

    const btnMute = document.createElement('button');
    btnMute.className = 'btn-audible';
    const isMuted = tab.mutedInfo?.muted ?? false;
    btnMute.textContent = isMuted
      ? t(settings.locale, 'unmute')
      : t(settings.locale, 'mute');

    btnMute.addEventListener('click', async (e) => {
      e.stopPropagation();
      const nextMuted = !isMuted;
      // 1. Notificar al background para pestañas capturadas
      chrome.runtime.sendMessage({
        type: 'SET_TAB_AUDIO',
        tabId: tab.id,
        volume: nextMuted ? 0 : 100,
        muted: nextMuted,
      });
      // 2. Actualizar también la propiedad nativa de la pestaña en Chrome
      try {
        await chrome.tabs.update(tab.id, { muted: nextMuted });
      } catch {
        // Ignorar si la pestaña ya cerró
      }
      setTimeout(loadAudibleTabs, 100);
    });

    actions.appendChild(btnMute);
    li.appendChild(info);
    li.appendChild(actions);
    elements.audibleList.appendChild(li);
  }
}

async function loadAudibleTabs() {
  chrome.runtime.sendMessage({ type: 'GET_AUDIBLE_TABS' }, (res) => {
    if (res && Array.isArray(res.tabs)) {
      renderAudibleTabs(res.tabs);
    }
  });
}

// Inicialización
async function init() {
  // 1. Cargar preferencias guardadas
  const stored = await getStoredSettings();
  settings = stored;
  applyTheme(settings.theme);

  // Idioma
  const initialLocale =
    settings.locale ||
    (SUPPORTED_LOCALES.includes(detectBrowserLocale()) ? detectBrowserLocale() : 'en');
  applyTranslations(initialLocale);

  // 2. Obtener pestaña activa
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    currentTabId = tab.id;
    currentUrl = tab.url || '';
    state.tabId = tab.id;
    activeDomain = extractDomain(currentUrl);
    capturable = isCapturableUrl(currentUrl);

    // Precargar el documento offscreen en segundo plano al abrir el popup
    // de modo que cuando el usuario mueva el slider ya esté 100% montado
    if (capturable) {
      chrome.runtime.sendMessage({ type: 'PRELOAD_OFFSCREEN' });
    }
  }

  // Si es página restringida
  if (!capturable) {
    elements.restrictedBanner.classList.remove('hidden');
    elements.volumeSlider.disabled = true;
    elements.btnMute.disabled = true;
    elements.btnReset.disabled = true;
    elements.presetButtons.forEach((b) => (b.disabled = true));
    elements.toggleLimiter.disabled = true;
    loadAudibleTabs();
    return;
  }

  // 3. Consultar estado en vivo del background o perfil guardado del dominio
  chrome.runtime.sendMessage(
    { type: 'GET_TAB_STATE', tabId: currentTabId },
    async (res) => {
      if (res && res.state) {
        state = res.state;
      } else if (activeDomain && settings.rememberByDomain) {
        const profile = await getDomainProfile(activeDomain);
        if (profile) {
          state.volume = clampVolume(profile.volume);
          state.preset = profile.preset;
          state.limiter = profile.limiter;
        }
      }
      updateUI();
    }
  );

  // 4. Cargar lista de pestañas audibles
  loadAudibleTabs();

  // 5. Configurar eventos de la UI
  setupEventListeners();
}

function setupEventListeners() {
  // Selector de idioma personalizado (Dropdown con banderas)
  if (elements.btnLocaleTrigger && elements.localeMenu) {
    elements.btnLocaleTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !elements.localeMenu.classList.contains('hidden');
      if (isOpen) {
        elements.localeMenu.classList.add('hidden');
        elements.localeDropdownWrapper.classList.remove('open');
        elements.btnLocaleTrigger.setAttribute('aria-expanded', 'false');
      } else {
        elements.localeMenu.classList.remove('hidden');
        elements.localeDropdownWrapper.classList.add('open');
        elements.btnLocaleTrigger.setAttribute('aria-expanded', 'true');
      }
    });

    elements.localeItems.forEach((item) => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const newLocale = item.getAttribute('data-locale') as Locale;
        if (newLocale && SUPPORTED_LOCALES.includes(newLocale)) {
          applyTranslations(newLocale);
          await saveStoredSettings({ locale: newLocale });
        }
        elements.localeMenu.classList.add('hidden');
        elements.localeDropdownWrapper.classList.remove('open');
        elements.btnLocaleTrigger.setAttribute('aria-expanded', 'false');
      });
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', () => {
      elements.localeMenu.classList.add('hidden');
      elements.localeDropdownWrapper.classList.remove('open');
      elements.btnLocaleTrigger.setAttribute('aria-expanded', 'false');
    });
  }

  // Selector de idioma nativo (fallback de accesibilidad)
  elements.selectLocale.addEventListener('change', async () => {
    const newLocale = elements.selectLocale.value as Locale;
    applyTranslations(newLocale);
    await saveStoredSettings({ locale: newLocale });
  });

  // Toggle de tema
  elements.btnThemeToggle.addEventListener('click', async () => {
    const newTheme: Theme = settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    await saveStoredSettings({ theme: newTheme });
  });

  // Slider de volumen
  elements.volumeSlider.addEventListener('input', () => {
    const val = parseInt(elements.volumeSlider.value, 10);
    state.volume = clampVolume(val);
    state.muted = state.volume === 0;
    updateUI();
    emitAudioChange();
  });

  // Botón Mute / Unmute
  elements.btnMute.addEventListener('click', () => {
    if (state.muted) {
      state.muted = false;
      state.volume = state.previousVolume > 0 ? state.previousVolume : 100;
    } else {
      state.previousVolume = state.volume;
      state.muted = true;
      state.volume = 0;
    }
    updateUI();
    emitAudioChange({ immediateStorage: true });
  });

  // Botón Reset (100% y normal)
  elements.btnReset.addEventListener('click', () => {
    state.volume = 100;
    state.preset = 'normal';
    state.muted = false;
    updateUI();
    if (currentTabId) {
      chrome.runtime.sendMessage({ type: 'RESET_TAB_AUDIO', tabId: currentTabId });
      if (activeDomain && settings.rememberByDomain) {
        saveDomainProfile(activeDomain, {
          volume: 100,
          preset: 'normal',
          limiter: state.limiter,
        });
      }
    }
  });

  // Botones de salto rápido
  document.querySelectorAll<HTMLButtonElement>('.btn-jump').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.getAttribute('data-jump') || '100', 10);
      state.volume = clampVolume(target);
      state.muted = state.volume === 0;
      updateUI();
      emitAudioChange({ immediateStorage: true });
    });
  });

  // Presets
  elements.presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-preset') as TonePresetId;
      if (p) {
        state.preset = p;
        updateUI();
        emitAudioChange({ immediateStorage: true });
      }
    });
  });

  // Switch de Limitador
  elements.toggleLimiter.addEventListener('change', () => {
    state.limiter = elements.toggleLimiter.checked;
    updateUI();
    emitAudioChange({ immediateStorage: true });
  });

  // Switch de Recordar sitio
  elements.toggleRemember.addEventListener('change', async () => {
    settings.rememberByDomain = elements.toggleRemember.checked;
    await saveStoredSettings({ rememberByDomain: settings.rememberByDomain });
    if (settings.rememberByDomain && activeDomain) {
      saveDomainProfile(activeDomain, {
        volume: state.volume,
        preset: state.preset,
        limiter: state.limiter,
      });
    }
  });

  // Atajo de Chrome
  elements.btnShortcutSettings.addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  // Atajos de teclado en el popup
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement && e.target.type === 'text') return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.shiftKey ? 25 : 5;
      state.volume = clampVolume(state.volume + step);
      state.muted = false;
      updateUI();
      emitAudioChange();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? 25 : 5;
      state.volume = clampVolume(state.volume - step);
      state.muted = state.volume === 0;
      updateUI();
      emitAudioChange();
    } else if (e.key.toLowerCase() === 'm') {
      e.preventDefault();
      elements.btnMute.click();
    } else if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      elements.btnReset.click();
    } else if (['1', '2', '3', '4'].includes(e.key)) {
      const map: Record<string, TonePresetId> = {
        '1': 'normal',
        '2': 'voice',
        '3': 'bass',
        '4': 'night',
      };
      const p = map[e.key];
      if (p) {
        state.preset = p;
        updateUI();
        emitAudioChange({ immediateStorage: true });
      }
    }
  });
}

// Iniciar al cargar el DOM
document.addEventListener('DOMContentLoaded', init);
