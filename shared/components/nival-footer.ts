declare const chrome: any;

export class NivalFooter extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['lang'];
  }

  private _lang: 'es' | 'en' = 'es';
  private _boundOnLangChange: (e: Event) => void;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._boundOnLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ lang?: string }>;
      const newLang = customEvent.detail?.lang;
      if (newLang === 'es' || newLang === 'en') {
        this.lang = newLang;
      }
    };
  }

  override get lang(): string {
    return this._lang;
  }

  override set lang(val: string) {
    const normalized = val === 'en' ? 'en' : 'es';
    if (this._lang !== normalized || this.getAttribute('lang') !== normalized) {
      this._lang = normalized;
      if (this.getAttribute('lang') !== normalized) {
        this.setAttribute('lang', normalized);
      }
      this.render();
    }
  }

  public setLang(val: 'es' | 'en'): void {
    this.lang = val;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'lang' && oldValue !== newValue && newValue) {
      const normalized = newValue === 'en' ? 'en' : 'es';
      if (this._lang !== normalized) {
        this._lang = normalized;
        this.render();
      }
    }
  }

  async connectedCallback(): Promise<void> {
    const attrLang = this.getAttribute('lang');
    if (attrLang === 'es' || attrLang === 'en') {
      this._lang = attrLang;
    } else {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          const res = await chrome.storage.local.get(['app_lang']);
          if (res?.app_lang === 'es' || res?.app_lang === 'en') {
            this._lang = res.app_lang;
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    this.render();
    window.addEventListener('langchange', this._boundOnLangChange);
  }

  disconnectedCallback(): void {
    window.removeEventListener('langchange', this._boundOnLangChange);
  }

  render(): void {
    if (!this.shadowRoot) return;

    const isEs = this._lang === 'es';
    const prefix = isEs ? 'Desarrollado por' : 'Built by';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          box-sizing: border-box;
        }
        *, *::before, *::after {
          box-sizing: inherit;
        }
        .footer-branding {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 11px;
          color: var(--text-muted, #8b949e);
          padding-top: 10px;
          border-top: 1px dashed var(--border-subtle, rgba(255, 255, 255, 0.08));
          font-family: inherit;
          text-align: center;
        }
        .footer-branding a {
          color: var(--accent-color, #14b8a6);
          text-decoration: none;
          font-weight: 600;
          transition: color 0.15s ease, opacity 0.15s ease;
        }
        .footer-branding a:hover {
          text-decoration: underline;
          opacity: 0.9;
        }
      </style>
      <footer class="footer-branding">
        <span>${prefix}</span>
        <a href="https://nival.is-a.dev/" target="_blank" rel="noopener noreferrer">Nicolás Valenzuela</a>
      </footer>
    `;
  }
}

if (!customElements.get('nival-footer')) {
  customElements.define('nival-footer', NivalFooter);
}
