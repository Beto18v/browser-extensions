export type Locale = 'en' | 'es' | 'pt_BR' | 'fr' | 'de' | 'ja';
export type Theme = 'light' | 'dark';
export type PresetId = 'carbon' | 'warm_paper' | 'night_shift' | 'crisp_dark';
export type SiteAdapter = 'generic' | 'google-docs' | 'google-sheets' | 'google-slides';

export interface DomainProfile {
  enabled: boolean;
  preset: PresetId;
  brightness: number; // 50 to 150 (integer, %)
  contrast: number; // 50 to 150 (integer, %)
  warmth: number; // 0 to 100 (integer, % sepia/warmth)
  darkenCanvas: boolean; // default true
  rememberSite: boolean; // default true
  updatedAt: number;
}

export interface Settings {
  locale: Locale;
  theme: Theme;
}

export interface ApplyProfileMessage {
  type: 'APPLY_PROFILE';
  profile: DomainProfile;
  adapter?: SiteAdapter;
}

export interface UpdateBadgeMessage {
  type: 'UPDATE_BADGE';
  tabId: number;
  enabled: boolean;
}

export type RuntimeMessage = ApplyProfileMessage | UpdateBadgeMessage;
