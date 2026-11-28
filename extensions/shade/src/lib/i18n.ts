import type { Locale } from './types';

export const SUPPORTED_LOCALES: Locale[] = [
  'en',
  'es',
  'pt_BR',
  'fr',
  'de',
  'ja',
];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt_BR: 'Português (BR)',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
};

export type TranslationKey =
  | 'appTitle'
  | 'toggleTheme'
  | 'language'
  | 'siteStatusActive'
  | 'siteStatusInactive'
  | 'adapterGeneric'
  | 'adapterGoogleDocs'
  | 'adapterGoogleSheets'
  | 'adapterGoogleSlides'
  | 'masterSwitchLabel'
  | 'btnReset'
  | 'presetsHeading'
  | 'presetCarbon'
  | 'presetCarbonDesc'
  | 'presetWarmPaper'
  | 'presetWarmPaperDesc'
  | 'presetNightShift'
  | 'presetNightShiftDesc'
  | 'presetCrispDark'
  | 'presetCrispDarkDesc'
  | 'calibrationHeading'
  | 'labelBrightness'
  | 'labelContrast'
  | 'labelWarmth'
  | 'labelDarkenCanvas'
  | 'descDarkenCanvas'
  | 'descDarkenCanvasWorkspace'
  | 'labelRememberSite'
  | 'descRememberSite'
  | 'restrictedTitle'
  | 'restrictedDesc'
  | 'shortcutHint'
  | 'footerBy';

export const DICTIONARY: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    appTitle: 'Shade',
    toggleTheme: 'Toggle theme',
    language: 'Language',
    siteStatusActive: 'ACTIVE',
    siteStatusInactive: 'BYPASS',
    adapterGeneric: 'STANDARD WEB',
    adapterGoogleDocs: 'GOOGLE DOCS',
    adapterGoogleSheets: 'GOOGLE SHEETS',
    adapterGoogleSlides: 'GOOGLE SLIDES',
    masterSwitchLabel: 'Enable on this site',
    btnReset: 'Reset',
    presetsHeading: 'OPTICAL PRESETS',
    presetCarbon: 'Carbon',
    presetCarbonDesc: 'Soft graphite',
    presetWarmPaper: 'Warm Paper',
    presetWarmPaperDesc: 'Daytime tint',
    presetNightShift: 'Night Shift',
    presetNightShiftDesc: 'Warm dark',
    presetCrispDark: 'Crisp Dark',
    presetCrispDarkDesc: 'High contrast',
    calibrationHeading: 'CALIBRATION',
    labelBrightness: 'Brightness',
    labelContrast: 'Contrast',
    labelWarmth: 'Warmth',
    labelDarkenCanvas: 'Darken canvas (Docs / Sheets)',
    descDarkenCanvas: 'Invert canvas-heavy web apps',
    descDarkenCanvasWorkspace: 'Workspace hybrid canvas engine',
    labelRememberSite: 'Remember site profile',
    descRememberSite: 'Auto-apply on future visits',
    restrictedTitle: 'Protected System Page',
    restrictedDesc:
      'Browser security policies restrict CSS injection on internal pages and the Chrome Web Store.',
    shortcutHint: 'Add shortcut',
    footerBy: 'Created by',
  },
  es: {
    appTitle: 'Shade',
    toggleTheme: 'Cambiar tema',
    language: 'Idioma',
    siteStatusActive: 'ACTIVO',
    siteStatusInactive: 'OMITIR',
    adapterGeneric: 'WEB ESTÁNDAR',
    adapterGoogleDocs: 'GOOGLE DOCS',
    adapterGoogleSheets: 'GOOGLE SHEETS',
    adapterGoogleSlides: 'GOOGLE SLIDES',
    masterSwitchLabel: 'Activar en este sitio',
    btnReset: 'Restablecer',
    presetsHeading: 'PERFILES ÓPTICOS',
    presetCarbon: 'Carbon',
    presetCarbonDesc: 'Grafito suave',
    presetWarmPaper: 'Warm Paper',
    presetWarmPaperDesc: 'Tinte diurno',
    presetNightShift: 'Night Shift',
    presetNightShiftDesc: 'Oscuro cálido',
    presetCrispDark: 'Crisp Dark',
    presetCrispDarkDesc: 'Alto contraste',
    calibrationHeading: 'CALIBRACIÓN',
    labelBrightness: 'Brillo',
    labelContrast: 'Contraste',
    labelWarmth: 'Calidez',
    labelDarkenCanvas: 'Oscurecer lienzo (Docs / Sheets)',
    descDarkenCanvas: 'Invertir lienzos en apps web',
    descDarkenCanvasWorkspace: 'Motor híbrido de Workspace',
    labelRememberSite: 'Recordar perfil del sitio',
    descRememberSite: 'Aplicar automáticamente al volver',
    restrictedTitle: 'Página protegida del sistema',
    restrictedDesc:
      'Las políticas del navegador restringen la inyección de estilos en páginas internas y Chrome Web Store.',
    shortcutHint: 'Agregar atajo',
    footerBy: 'Creado por',
  },
  pt_BR: {
    appTitle: 'Shade',
    toggleTheme: 'Alternar tema',
    language: 'Idioma',
    siteStatusActive: 'ATIVO',
    siteStatusInactive: 'IGNORAR',
    adapterGeneric: 'WEB PADRÃO',
    adapterGoogleDocs: 'GOOGLE DOCS',
    adapterGoogleSheets: 'GOOGLE SHEETS',
    adapterGoogleSlides: 'GOOGLE SLIDES',
    masterSwitchLabel: 'Ativar neste site',
    btnReset: 'Redefinir',
    presetsHeading: 'PERFIS ÓPTICOS',
    presetCarbon: 'Carbon',
    presetCarbonDesc: 'Grafite suave',
    presetWarmPaper: 'Warm Paper',
    presetWarmPaperDesc: 'Tom diurno',
    presetNightShift: 'Night Shift',
    presetNightShiftDesc: 'Escuro quente',
    presetCrispDark: 'Crisp Dark',
    presetCrispDarkDesc: 'Alto contraste',
    calibrationHeading: 'CALIBRAÇÃO',
    labelBrightness: 'Brilho',
    labelContrast: 'Contraste',
    labelWarmth: 'Temperatura',
    labelDarkenCanvas: 'Escurecer tela (Docs / Sheets)',
    descDarkenCanvas: 'Inverter telas em web apps',
    descDarkenCanvasWorkspace: 'Motor híbrido do Workspace',
    labelRememberSite: 'Lembrar perfil do site',
    descRememberSite: 'Aplicar automaticamente ao retornar',
    restrictedTitle: 'Página Protegida do Sistema',
    restrictedDesc:
      'As políticas do navegador restringem a injeção de CSS em páginas internas e na Chrome Web Store.',
    shortcutHint: 'Adicionar atalho',
    footerBy: 'Criado por',
  },
  fr: {
    appTitle: 'Shade',
    toggleTheme: 'Changer de thème',
    language: 'Langue',
    siteStatusActive: 'ACTIF',
    siteStatusInactive: 'CONTOURNER',
    adapterGeneric: 'WEB STANDARD',
    adapterGoogleDocs: 'GOOGLE DOCS',
    adapterGoogleSheets: 'GOOGLE SHEETS',
    adapterGoogleSlides: 'GOOGLE SLIDES',
    masterSwitchLabel: 'Activer sur ce site',
    btnReset: 'Réinitialiser',
    presetsHeading: 'PROFILS OPTIQUES',
    presetCarbon: 'Carbon',
    presetCarbonDesc: 'Graphite doux',
    presetWarmPaper: 'Warm Paper',
    presetWarmPaperDesc: 'Teinte de jour',
    presetNightShift: 'Night Shift',
    presetNightShiftDesc: 'Sombre chaud',
    presetCrispDark: 'Crisp Dark',
    presetCrispDarkDesc: 'Haut contraste',
    calibrationHeading: 'CALIBRATION',
    labelBrightness: 'Luminosité',
    labelContrast: 'Contraste',
    labelWarmth: 'Chaleur',
    labelDarkenCanvas: 'Assombrir le canevas (Docs / Sheets)',
    descDarkenCanvas: 'Inverser les canevas web',
    descDarkenCanvasWorkspace: 'Moteur hybride Workspace',
    labelRememberSite: 'Mémoriser ce site',
    descRememberSite: 'Appliquer lors des prochaines visites',
    restrictedTitle: 'Page système protégée',
    restrictedDesc:
      'La sécurité du navigateur bloque l’injection CSS sur les pages internes et le Chrome Web Store.',
    shortcutHint: 'Ajouter un raccourci',
    footerBy: 'Créé par',
  },
  de: {
    appTitle: 'Shade',
    toggleTheme: 'Design wechseln',
    language: 'Sprache',
    siteStatusActive: 'AKTIV',
    siteStatusInactive: 'UMGEHEN',
    adapterGeneric: 'STANDARD-WEB',
    adapterGoogleDocs: 'GOOGLE DOCS',
    adapterGoogleSheets: 'GOOGLE SHEETS',
    adapterGoogleSlides: 'GOOGLE SLIDES',
    masterSwitchLabel: 'Auf dieser Seite aktivieren',
    btnReset: 'Zurücksetzen',
    presetsHeading: 'OPTISCHE PROFILE',
    presetCarbon: 'Carbon',
    presetCarbonDesc: 'Sanftes Graphit',
    presetWarmPaper: 'Warm Paper',
    presetWarmPaperDesc: 'Tageslicht-Ton',
    presetNightShift: 'Night Shift',
    presetNightShiftDesc: 'Warmes Dunkel',
    presetCrispDark: 'Crisp Dark',
    presetCrispDarkDesc: 'Hoher Kontrast',
    calibrationHeading: 'KALIBRIERUNG',
    labelBrightness: 'Helligkeit',
    labelContrast: 'Kontrast',
    labelWarmth: 'Wärme',
    labelDarkenCanvas: 'Canvas abdunkeln (Docs / Sheets)',
    descDarkenCanvas: 'Web-App-Canvas invertieren',
    descDarkenCanvasWorkspace: 'Workspace-Hybrid-Engine',
    labelRememberSite: 'Seitenprofil merken',
    descRememberSite: 'Bei künftigen Besuchen anwenden',
    restrictedTitle: 'Geschützte Systemseite',
    restrictedDesc:
      'Browsersicherheitsrichtlinien blockieren CSS-Injektion auf internen Seiten und im Chrome Web Store.',
    shortcutHint: 'Tastenkürzel hinzufügen',
    footerBy: 'Erstellt von',
  },
  ja: {
    appTitle: 'Shade',
    toggleTheme: 'テーマ切替',
    language: '言語',
    siteStatusActive: '有効',
    siteStatusInactive: 'バイパス',
    adapterGeneric: '標準ウェブ',
    adapterGoogleDocs: 'GOOGLE DOCS',
    adapterGoogleSheets: 'GOOGLE SHEETS',
    adapterGoogleSlides: 'GOOGLE SLIDES',
    masterSwitchLabel: 'このサイトで有効化',
    btnReset: 'リセット',
    presetsHeading: '光学プリセット',
    presetCarbon: 'Carbon',
    presetCarbonDesc: 'ソフトグラファイト',
    presetWarmPaper: 'Warm Paper',
    presetWarmPaperDesc: '昼間用暖色',
    presetNightShift: 'Night Shift',
    presetNightShiftDesc: '暖色ダーク',
    presetCrispDark: 'Crisp Dark',
    presetCrispDarkDesc: '高コントラスト',
    calibrationHeading: 'キャリブレーション',
    labelBrightness: '明るさ',
    labelContrast: 'コントラスト',
    labelWarmth: '暖色フィルタ',
    labelDarkenCanvas: 'キャンバスを暗くする (Docs / Sheets)',
    descDarkenCanvas: 'Webアプリのキャンバスを反転',
    descDarkenCanvasWorkspace: 'Workspace ハイブリッドエンジン',
    labelRememberSite: 'サイト設定を記憶',
    descRememberSite: '次回アクセス時に自動適用',
    restrictedTitle: '保護されたシステムページ',
    restrictedDesc:
      'ブラウザのセキュリティポリシーにより、内部ページやChromeウェブストアではスタイルを適用できません。',
    shortcutHint: 'ショートカットを追加',
    footerBy: '作成:',
  },
};

export function detectBrowserLocale(navLang?: string): Locale {
  const raw = (
    navLang ||
    (typeof navigator !== 'undefined' ? navigator.language : 'en') ||
    'en'
  ).toLowerCase();

  if (raw.startsWith('pt')) return 'pt_BR';
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('fr')) return 'fr';
  if (raw.startsWith('de')) return 'de';
  if (raw.startsWith('ja')) return 'ja';
  return 'en';
}

export function t(locale: Locale, key: TranslationKey): string {
  const dict = DICTIONARY[locale] ?? DICTIONARY.en;
  return dict[key] ?? DICTIONARY.en[key];
}
