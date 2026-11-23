import '@shared/components/nival-footer';
import '@shared/components/nival-lang-switch';

declare const chrome: any;

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Query active tab immediately as the very first operation before any await storage calls
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const globalToggle = document.getElementById("global-toggle") as HTMLInputElement;
  const siteToggle = document.getElementById("site-toggle") as HTMLInputElement;
  const siteLabel = document.getElementById("site-label") as HTMLElement;
  const siteSublabel = document.getElementById("site-sublabel") as HTMLElement;
  const globalLabel = document.getElementById("global-label") as HTMLElement;
  const globalSublabel = document.getElementById("global-sublabel") as HTMLElement;
  const shortcutLabel = document.getElementById("shortcut-label") as HTMLElement;

  let currentHost = "";
  let isRestricted = false;

  if (tab?.url) {
    try {
      const url = new URL(tab.url);
      currentHost = url.hostname;
      if (!["http:", "https:"].includes(url.protocol)) {
        isRestricted = true;
      }
    } catch {
      isRestricted = true;
    }
  } else {
    isRestricted = true;
  }

  // Helper to notify active tab directly (0ms latency, not blocked by isRestricted, catches errors silently)
  function notifyActiveTab(payload: Record<string, unknown>) {
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, payload).catch(() => {});
    }
  }

  // Gracefully handle UI state for internal or restricted pages
  if (isRestricted) {
    siteToggle.disabled = true;
    siteToggle.checked = false;
  }

  let currentLang: "es" | "en" = "es";
  try {
    const stored = await chrome.storage.local.get(["app_lang"]);
    if (stored?.app_lang === "en" || stored?.app_lang === "es") {
      currentLang = stored.app_lang;
    }
  } catch {}

  const i18n = {
    es: {
      globalLabel: "Dark Mode Global",
      globalSublabel: "Activar en toda la web",
      siteLabel: "Sitio actual",
      siteDetecting: "detectando...",
      notAvailable: "No disponible",
      internalPage: "Página interna",
      shortcut: "Atajo rápido:",
    },
    en: {
      globalLabel: "Global Dark Mode",
      globalSublabel: "Activate across the web",
      siteLabel: "Current site",
      siteDetecting: "detecting...",
      notAvailable: "Not available",
      internalPage: "Internal page",
      shortcut: "Quick shortcut:",
    },
  };

  function updateLabels() {
    const t = i18n[currentLang];
    if (globalLabel) globalLabel.textContent = t.globalLabel;
    if (globalSublabel) globalSublabel.textContent = t.globalSublabel;
    if (shortcutLabel) shortcutLabel.textContent = t.shortcut;
    if (isRestricted) {
      if (siteLabel) siteLabel.textContent = t.notAvailable;
      if (siteSublabel) siteSublabel.textContent = currentHost || t.internalPage;
    } else {
      if (siteLabel) siteLabel.textContent = t.siteLabel;
      if (siteSublabel) siteSublabel.textContent = currentHost || t.siteDetecting;
    }
  }

  window.addEventListener("langchange", (e: Event) => {
    const ce = e as CustomEvent<{ lang?: "es" | "en" }>;
    if (ce.detail?.lang && (ce.detail.lang === "es" || ce.detail.lang === "en")) {
      currentLang = ce.detail.lang;
      updateLabels();
    }
  });

  updateLabels();

  // 2. Load stored settings
  const data = await chrome.storage.local.get(["eclipse_enabled", "eclipse_disabled_sites"]);
  const isGlobalEnabled = data.eclipse_enabled !== false;
  const disabledSites: string[] = data.eclipse_disabled_sites || [];
  const isSiteDisabled = disabledSites.some(
    (site) => currentHost === site || currentHost.endsWith(`.${site}`)
  );

  globalToggle.checked = isGlobalEnabled;
  if (!isRestricted) {
    siteToggle.checked = !isSiteDisabled;
  }

  // 3. Handle global toggle change
  globalToggle.addEventListener("change", async () => {
    const globalEnabled = globalToggle.checked;
    notifyActiveTab({ type: "ECLIPSE_SET_STATE", globalEnabled });
    await chrome.storage.local.set({ eclipse_enabled: globalEnabled });
  });

  // 4. Handle per-site toggle change
  siteToggle.addEventListener("change", async () => {
    if (!currentHost && tab?.url) {
      try {
        currentHost = new URL(tab.url).hostname;
      } catch {}
    }
    if (!currentHost) return;
    const siteEnabled = siteToggle.checked;
    notifyActiveTab({ type: "ECLIPSE_SET_STATE", siteEnabled });

    const currentData = await chrome.storage.local.get(["eclipse_disabled_sites"]);
    let list: string[] = currentData.eclipse_disabled_sites || [];

    if (siteEnabled) {
      list = list.filter((s) => s !== currentHost && !currentHost.endsWith(`.${s}`));
    } else {
      if (!list.includes(currentHost)) {
        list.push(currentHost);
      }
    }

    await chrome.storage.local.set({ eclipse_disabled_sites: list });
  });
});
