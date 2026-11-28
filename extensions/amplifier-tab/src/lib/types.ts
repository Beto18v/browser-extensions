export type Locale = 'en' | 'es' | 'pt_BR' | 'fr' | 'de' | 'ja';
export type Theme = 'light' | 'dark';
export type TonePresetId = 'normal' | 'voice' | 'bass' | 'night';
export type MeterZone = 'muted' | 'safe' | 'boost' | 'overdrive';

export interface DomainProfile {
  volume: number; // 0 a 600 (entero)
  preset: TonePresetId;
  limiter: boolean; // true por defecto (anti-distorsión)
  updatedAt: number;
}

export interface Settings {
  locale: Locale;
  theme: Theme;
  rememberByDomain: boolean; // true por defecto
}

export interface TabAudioState {
  tabId: number;
  volume: number;
  preset: TonePresetId;
  limiter: boolean;
  muted: boolean;
  previousVolume: number; // para restaurar al quitar mute
  active: boolean; // si el AudioContext está conectado
}

export interface AudibleTabInfo {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  audible: boolean;
  mutedInfo?: {
    muted: boolean;
  };
}

// Mensajes internos entre Popup, Background y Offscreen
export type ExtensionMessage =
  | {
      type: 'GET_TAB_STATE';
      tabId: number;
    }
  | {
      type: 'TAB_STATE_RESPONSE';
      state: TabAudioState | null;
    }
  | {
      type: 'SET_TAB_AUDIO';
      tabId: number;
      volume: number;
      preset?: TonePresetId;
      limiter?: boolean;
      muted?: boolean;
    }
  | {
      type: 'RESET_TAB_AUDIO';
      tabId: number;
    }
  | {
      type: 'GET_AUDIBLE_TABS';
    }
  | {
      type: 'AUDIBLE_TABS_RESPONSE';
      tabs: AudibleTabInfo[];
    }
  | {
      type: 'INIT_OFFSCREEN_STREAM';
      tabId: number;
      streamId: string;
      volume: number;
      preset: TonePresetId;
      limiter: boolean;
    }
  | {
      type: 'UPDATE_OFFSCREEN_AUDIO';
      tabId: number;
      volume: number;
      preset: TonePresetId;
      limiter: boolean;
    }
  | {
      type: 'STOP_OFFSCREEN_AUDIO';
      tabId: number;
    };
