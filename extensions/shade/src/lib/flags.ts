import type { Locale } from './types';

export const FLAGS: Record<Locale, string> = {
  en: '<svg class="flag-icon" viewBox="0 0 60 40" width="16" height="12" aria-hidden="true"><clipPath id="shade-us-clip"><rect width="60" height="40" rx="2"/></clipPath><g clip-path="url(#shade-us-clip)"><rect width="60" height="40" fill="#B22234"/><path d="M0,6.15h60 M0,12.3h60 M0,18.45h60 M0,24.6h60 M0,30.75h60 M0,36.9h60" stroke="#FFFFFF" stroke-width="3.08"/><rect width="26" height="21.5" fill="#3C3B6E"/></g></svg>',
  es: '<svg class="flag-icon" viewBox="0 0 60 40" width="16" height="12" aria-hidden="true"><clipPath id="shade-es-clip"><rect width="60" height="40" rx="2"/></clipPath><g clip-path="url(#shade-es-clip)"><rect width="60" height="40" fill="#AA151B"/><rect y="10" width="60" height="20" fill="#F1BF00"/></g></svg>',
  pt_BR: '<svg class="flag-icon" viewBox="0 0 60 40" width="16" height="12" aria-hidden="true"><clipPath id="shade-br-clip"><rect width="60" height="40" rx="2"/></clipPath><g clip-path="url(#shade-br-clip)"><rect width="60" height="40" fill="#009B3A"/><polygon points="30,4 56,20 30,36 4,20" fill="#FEDF00"/><circle cx="30" cy="20" r="8" fill="#002776"/></g></svg>',
  fr: '<svg class="flag-icon" viewBox="0 0 60 40" width="16" height="12" aria-hidden="true"><clipPath id="shade-fr-clip"><rect width="60" height="40" rx="2"/></clipPath><g clip-path="url(#shade-fr-clip)"><rect width="20" height="40" fill="#002395"/><rect x="20" width="20" height="40" fill="#FFFFFF"/><rect x="40" width="20" height="40" fill="#ED2939"/></g></svg>',
  de: '<svg class="flag-icon" viewBox="0 0 60 40" width="16" height="12" aria-hidden="true"><clipPath id="shade-de-clip"><rect width="60" height="40" rx="2"/></clipPath><g clip-path="url(#shade-de-clip)"><rect width="60" height="13.3" fill="#000000"/><rect y="13.3" width="60" height="13.3" fill="#DD0000"/><rect y="26.6" width="60" height="13.4" fill="#FFCC00"/></g></svg>',
  ja: '<svg class="flag-icon" viewBox="0 0 60 40" width="16" height="12" aria-hidden="true"><clipPath id="shade-ja-clip"><rect width="60" height="40" rx="2"/></clipPath><g clip-path="url(#shade-ja-clip)"><rect width="60" height="40" fill="#FFFFFF"/><circle cx="30" cy="20" r="10" fill="#BC002D"/></g></svg>',
};

export function getFlagSvg(locale: Locale): string {
  return FLAGS[locale] ?? FLAGS.en;
}
