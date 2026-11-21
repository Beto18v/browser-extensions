declare const chrome: any;

export class NivalLangSwitch extends HTMLElement {
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
        if (this._lang !== newLang) {
          this._lang = newLang;
          this.render();
        }
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

  private async toggleLang(): Promise<void> {
    const nextLang = this._lang === 'es' ? 'en' : 'es';
    this._lang = nextLang;
    if (this.getAttribute('lang') !== nextLang) {
      this.setAttribute('lang', nextLang);
    }
    this.render();

    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ app_lang: nextLang });
      }
    } catch {
      // Storage fallback
    }

    window.dispatchEvent(
      new CustomEvent('langchange', {
        bubbles: true,
        composed: true,
        detail: { lang: nextLang },
      })
    );
  }

  render(): void {
    if (!this.shadowRoot) return;

    const label = this._lang.toUpperCase();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          vertical-align: middle;
        }
        .lang-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
          border-radius: 9999px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted, #8b949e);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          font-family: inherit;
          line-height: 1.2;
          outline: none;
        }
        .lang-pill:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--accent-color, #14b8a6);
          border-color: var(--accent-color, #14b8a6);
          transform: translateY(-1px);
        }
        .lang-pill:active {
          transform: translateY(0);
        }
        .lang-text {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
      </style>
      <button type="button" class="lang-pill" title="Cambiar idioma / Switch language" aria-label="Toggle language">
        🌐 <span class="lang-text">${label}</span>
      </button>
    `;

    const btn = this.shadowRoot.querySelector('button');
    if (btn) {
      btn.addEventListener('click', () => {
        this.toggleLang();
      });
    }
  }
}

if (!customElements.get('nival-lang-switch')) {
  customElements.define('nival-lang-switch', NivalLangSwitch);
}
