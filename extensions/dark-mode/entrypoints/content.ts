export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_start",
  main() {
    const STYLE_ID = "__eclipse_dark_theme__";
    const hostname = window.location.hostname;

    // Attribute-based Dark Theme CSS
    // Toggling is achieved instantaneously by setting/removing data-eclipse-dark on <html>
    const DARK_CSS = `
      html[data-eclipse-dark="true"] {
        filter: invert(90%) hue-rotate(180deg) contrast(95%) !important;
        background-color: #121212 !important;
      }

      /* Re-invert media elements to preserve original colors without lag */
      html[data-eclipse-dark="true"] img,
      html[data-eclipse-dark="true"] video,
      html[data-eclipse-dark="true"] picture,
      html[data-eclipse-dark="true"] [role="img"] {
        filter: invert(100%) hue-rotate(180deg) !important;
      }

      /* Scrollbars */
      html[data-eclipse-dark="true"] ::-webkit-scrollbar {
        width: 10px !important;
        height: 10px !important;
        background-color: #1a1a1a !important;
      }
      html[data-eclipse-dark="true"] ::-webkit-scrollbar-thumb {
        background-color: #333333 !important;
        border-radius: 5px !important;
      }
      html[data-eclipse-dark="true"] ::-webkit-scrollbar-thumb:hover {
        background-color: #555555 !important;
      }
    `;

    // In-memory state
    let isGlobalEnabled = true;
    let isSiteDisabled = false;

    // Synchronous zero-flashbang check at document_start via sessionStorage
    try {
      isSiteDisabled = sessionStorage.getItem("__eclipse_disabled") === "true";
    } catch {
      // Ignore security errors in restricted/sandboxed iframes
    }

    function injectStyleOnce() {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = DARK_CSS;
      const target = document.head || document.documentElement;
      if (target) {
        target.appendChild(style);
      } else {
        const observer = new MutationObserver(() => {
          const t = document.head || document.documentElement;
          if (t) {
            observer.disconnect();
            if (!document.getElementById(STYLE_ID)) {
              t.appendChild(style);
            }
          }
        });
        observer.observe(document, { childList: true, subtree: true });
      }
    }

    function updateTheme() {
      injectStyleOnce();
      const shouldBeDark = isGlobalEnabled && !isSiteDisabled;
      const el = document.documentElement;
      if (el) {
        if (shouldBeDark) {
          el.setAttribute("data-eclipse-dark", "true");
        } else {
          el.removeAttribute("data-eclipse-dark");
        }
      }
    }

    function syncSessionStorage() {
      try {
        if (isSiteDisabled) {
          sessionStorage.setItem("__eclipse_disabled", "true");
        } else {
          sessionStorage.removeItem("__eclipse_disabled");
        }
      } catch {
        // Ignore storage errors
      }
    }

    // 1. Inject stylesheet ONCE at document_start
    injectStyleOnce();

    // 2. Synchronous zero-latency initial activation
    updateTheme();

    // 3. Reconcile with chrome.storage.local
    chrome.storage.local
      .get(["eclipse_enabled", "eclipse_disabled_sites"])
      .then((data) => {
        if (data.eclipse_enabled !== undefined) {
          isGlobalEnabled = data.eclipse_enabled !== false;
        }
        if (data.eclipse_disabled_sites) {
          const disabledSites: string[] = data.eclipse_disabled_sites;
          isSiteDisabled = disabledSites.some(
            (site) => hostname === site || hostname.endsWith(`.${site}`)
          );
          syncSessionStorage();
        }
        updateTheme();
      })
      .catch(() => {
        // Fallback keep existing theme state
      });

    // 4. Message listener for direct popup updates & keyboard shortcuts
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.type === "ECLIPSE_SET_STATE") {
        if (typeof msg.globalEnabled === "boolean") {
          isGlobalEnabled = msg.globalEnabled;
        }
        if (typeof msg.siteEnabled === "boolean") {
          isSiteDisabled = !msg.siteEnabled;
          syncSessionStorage();
        }
        updateTheme();
        sendResponse({ ok: true });
        return;
      }

      if (msg.type === "ECLIPSE_TOGGLE_SITE") {
        isSiteDisabled = !isSiteDisabled;
        syncSessionStorage();
        updateTheme();
        sendResponse({ ok: true, isSiteDisabled });

        // Persist to storage in background
        chrome.storage.local
          .get(["eclipse_disabled_sites"])
          .then((data) => {
            let disabledSites: string[] = data.eclipse_disabled_sites || [];
            if (isSiteDisabled) {
              if (!disabledSites.includes(hostname)) {
                disabledSites.push(hostname);
              }
            } else {
              disabledSites = disabledSites.filter(
                (s) => s !== hostname && !hostname.endsWith(`.${s}`)
              );
            }
            return chrome.storage.local.set({ eclipse_disabled_sites: disabledSites });
          })
          .catch(() => {});
        return;
      }

      if (msg.type === "ECLIPSE_GET_STATUS") {
        sendResponse({
          global: isGlobalEnabled,
          siteDisabled: isSiteDisabled,
          hostname,
        });
        return;
      }
    });

    // 5. Cross-tab storage change synchronization (reads newValue directly)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      let changed = false;

      if (changes.eclipse_enabled) {
        isGlobalEnabled = changes.eclipse_enabled.newValue !== false;
        changed = true;
      }

      if (changes.eclipse_disabled_sites) {
        const disabledSites: string[] = changes.eclipse_disabled_sites.newValue || [];
        isSiteDisabled = disabledSites.some(
          (site) => hostname === site || hostname.endsWith(`.${site}`)
        );
        syncSessionStorage();
        changed = true;
      }

      if (changed) {
        updateTheme();
      }
    });
  },
});
