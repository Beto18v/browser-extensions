/**
 * DocGuard v2.1 — Side Panel Main Controller
 * Academic Originality & Submission Readiness Auditor
 * Zero external dependencies · Zero API keys
 */

import {
  isMathOrFormula,
  shouldSkipStructuralLine,
  splitSentences,
  ParsedSentence,
} from "@/modules/filters";
import '@shared/components/nival-footer';
import '@shared/components/nival-lang-switch';
import {
  buildShingles,
  computeShingleContainment,
  buildTermFrequency,
  cosineSimilarity,
  stratifiedSample,
  tokenizeWords,
  SHINGLE_SIZE,
  MAX_SAMPLE_SENTENCES,
  MIN_WORDS_FOR_WEB,
  MIN_WORDS_FOR_INTERNAL,
  WEB_SNIPPET_SIZE,
  INTERNAL_THRESHOLD,
  STOPWORDS,
} from "@/modules/nlp";
import { computeVerdict, Verdict } from "@/modules/verdict";
import { I18N, Language, t } from "@/modules/i18n";

interface MatchFinding {
  type: "web" | "internal";
  sourceLabel: string;
  scorePct: number;
  text: string;
  sourceUrl: string;
}

interface AnalysisResult {
  totalWords: number;
  sentenceCount: number;
  externalMatchCount: number;
  internalRepeatCount: number;
  similarityPercent: number;
  originalityPercent: number;
  flaggedMatches: MatchFinding[];
  verdict?: Verdict;
}

type Theme = "dark" | "light" | "neobrutalism";
type FilterType = "all" | "web" | "internal";

// ─── State ───
let currentLang: Language = (localStorage.getItem("docguard_lang") as Language) || "es";
let lastResult: AnalysisResult | null = null;
let currentAnalysisToken = 0;
let currentFilter: FilterType = "all";

const state = {
  activeDocId: null as string | null,
  activeDocTitle: null as string | null,
  isAnalyzing: false,
};

// ─── Constants ───
const DOC_URL_REGEX = /^https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/;

// ─── DOM Elements ───
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const docStatusText = $<HTMLElement>("doc-status-text");
const docStatusDot = $<HTMLElement>("doc-status-dot");
const docTitleText = $<HTMLElement>("doc-title-text");
const docIdText = $<HTMLElement>("doc-id-text");
const refreshTabBtn = $<HTMLButtonElement>("refresh-tab-btn");
const analyzeBtn = $<HTMLButtonElement>("analyze-btn");
const errorBanner = $<HTMLElement>("error-banner");
const analyzedWordCount = $<HTMLElement>("analyzed-word-count");
const resultsEmpty = $<HTMLElement>("results-empty");
const resultsContainer = $<HTMLElement>("results-container");
const scoreCard = $<HTMLElement>("score-card");
const originalityPct = $<HTMLElement>("originality-pct");
const similarityPct = $<HTMLElement>("similarity-pct");
const similarityBar = $<HTMLElement>("similarity-bar");
const ringFill = document.getElementById("ring-fill") as unknown as SVGCircleElement;
const trafficIndicator = $<HTMLElement>("traffic-indicator");
const trafficLabel = $<HTMLElement>("traffic-label");
const verdictCard = $<HTMLElement>("verdict-card");
const verdictBadge = $<HTMLElement>("verdict-badge");
const verdictTitle = $<HTMLElement>("verdict-title");
const verdictDesc = $<HTMLElement>("verdict-desc");
const statSentences = $<HTMLElement>("stat-sentences");
const statExternal = $<HTMLElement>("stat-external");
const statInternal = $<HTMLElement>("stat-internal");
const matchesCount = $<HTMLElement>("matches-count");
const filterAllCount = $<HTMLElement>("filter-all-count");
const filterWebCount = $<HTMLElement>("filter-web-count");
const filterIntCount = $<HTMLElement>("filter-int-count");
const noMatchesBox = $<HTMLElement>("no-matches-box");
const matchesList = $<HTMLUListElement>("matches-list");
const copyReportBtn = $<HTMLButtonElement>("copy-report-btn");
const langToggle = document.getElementById("lang-toggle") as HTMLButtonElement | null;
const themeToggle = $<HTMLButtonElement>("theme-toggle");

// ─── i18n View Binding ───
function translate(key: string, replacements?: Record<string, string | number>): string {
  return t(currentLang, key, replacements);
}

function applyI18N(): void {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const val = translate(key);
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      (el as HTMLInputElement).placeholder = val;
    } else {
      el.innerHTML = val;
    }
  });

  document.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (key) el.title = translate(key);
  });

  const langLabel = $("lang-label");
  if (langLabel) langLabel.textContent = currentLang.toUpperCase();
}

// ─── Theme Management ───
function getPreferredTheme(): Theme {
  const stored = localStorage.getItem("docguard_theme") as Theme | null;
  if (stored === "light" || stored === "dark" || stored === "neobrutalism") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.add("theme-transitioning");
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("docguard_theme", theme);

  const sunIcon = $("theme-icon-sun");
  const moonIcon = $("theme-icon-moon");
  const boltIcon = $("theme-icon-bolt");

  if (sunIcon) sunIcon.classList.add("hidden");
  if (moonIcon) moonIcon.classList.add("hidden");
  if (boltIcon) boltIcon.classList.add("hidden");

  if (theme === "light") {
    if (sunIcon) sunIcon.classList.remove("hidden");
  } else if (theme === "neobrutalism") {
    if (boltIcon) boltIcon.classList.remove("hidden");
  } else {
    if (moonIcon) moonIcon.classList.remove("hidden");
  }

  requestAnimationFrame(() => {
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
    }, 250);
  });
}

// ─── UI Helpers ───
function showError(message: string): void {
  if (!message) {
    errorBanner.textContent = "";
    errorBanner.classList.add("hidden");
    return;
  }
  errorBanner.textContent = message;
  errorBanner.classList.remove("hidden");
}

function cleanGoogleDocTitle(rawTitle?: string): string {
  if (!rawTitle) return translate("untitledDoc");
  return (
    rawTitle
      .replace(/\s*-\s*(Google\s+Docs|Documentos\s+de\s+Google)\s*$/i, "")
      .trim() || "Google Doc"
  );
}

function updateRing(percent: number): void {
  const circumference = 2 * Math.PI * 52; // r=52 -> 326.73
  const offset = circumference - (percent / 100) * circumference;
  ringFill.style.strokeDashoffset = String(offset);
}

// ─── Tab Detection ───
async function detectActiveGoogleDoc(): Promise<void> {
  if (state.isAnalyzing) return;

  showError("");
  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeTab = tabs && tabs[0];

    if (!activeTab || !activeTab.url) {
      state.activeDocId = null;
      docStatusText.textContent = translate("statusNoTab");
      docStatusText.className = "meta-value status-warn";
      if (docStatusDot) docStatusDot.className = "status-dot status-warn";
      docTitleText.textContent = "—";
      docIdText.textContent = "—";
      analyzeBtn.disabled = true;
      return;
    }

    const match = activeTab.url.match(DOC_URL_REGEX);
    if (!match) {
      state.activeDocId = null;
      docStatusText.textContent = translate("statusNotDoc");
      docStatusText.className = "meta-value status-warn";
      if (docStatusDot) docStatusDot.className = "status-dot status-warn";
      docTitleText.textContent = activeTab.title || "—";
      docIdText.textContent = "—";
      analyzeBtn.disabled = true;
      return;
    }

    state.activeDocId = match[1];
    state.activeDocTitle = cleanGoogleDocTitle(activeTab.title);
    docStatusText.textContent = translate("statusDetected");
    docStatusText.className = "meta-value status-ok";
    if (docStatusDot) docStatusDot.className = "status-dot status-ok";
    docTitleText.textContent = state.activeDocTitle;
    docTitleText.title = state.activeDocTitle || "";
    docIdText.textContent = state.activeDocId;
    docIdText.title = state.activeDocId || "";
    analyzeBtn.disabled = false;
  } catch (err: unknown) {
    state.activeDocId = null;
    docStatusText.textContent = translate("statusError");
    docStatusText.className = "meta-value status-warn";
    if (docStatusDot) docStatusDot.className = "status-dot status-warn";
    showError(err instanceof Error ? err.message : String(err));
  }
}

// ─── Filter Pills ───
function applyFilter(filterType: FilterType): void {
  currentFilter = filterType;
  document.querySelectorAll(".filter-pill").forEach((pill) => {
    pill.classList.toggle("active", pill.getAttribute("data-filter") === filterType);
  });
  document.querySelectorAll<HTMLElement>(".match-item").forEach((item) => {
    const type = item.getAttribute("data-match-type");
    if (filterType === "all" || type === filterType) {
      item.classList.remove("hidden");
    } else {
      item.classList.add("hidden");
    }
  });
}

// ─── Render Results ───
function renderResults(result: AnalysisResult): void {
  lastResult = result;
  resultsEmpty.classList.add("hidden");
  resultsContainer.classList.remove("hidden");

  analyzedWordCount.textContent = `${result.totalWords} ${translate("words")}`;
  originalityPct.textContent = `${result.originalityPercent}%`;
  similarityPct.textContent = `${result.similarityPercent}%`;
  similarityBar.style.width = `${result.similarityPercent}%`;
  updateRing(result.originalityPercent);

  // Score ring card styling
  scoreCard.classList.remove("level-green", "level-amber", "level-red");
  if (result.similarityPercent <= 20 && result.externalMatchCount <= 3) {
    scoreCard.classList.add("level-green");
    trafficLabel.textContent = translate("riskLow");
  } else if (result.similarityPercent <= 35) {
    scoreCard.classList.add("level-amber");
    trafficLabel.textContent = translate("riskMedium");
  } else {
    scoreCard.classList.add("level-red");
    trafficLabel.textContent = translate("riskHigh");
  }

  // Submission Verdict Card
  const verdict = computeVerdict(
    result.originalityPercent,
    result.externalMatchCount,
    result.internalRepeatCount,
    {
      safeBadge: translate("verdictSafeBadge"),
      safeTitle: translate("verdictSafeTitle"),
      safeDesc: translate("verdictSafeDesc"),
      cautionBadge: translate("verdictCautionBadge"),
      cautionTitle: translate("verdictCautionTitle"),
      cautionDesc: translate("verdictCautionDesc"),
      dangerBadge: translate("verdictDangerBadge"),
      dangerTitle: translate("verdictDangerTitle"),
      dangerDesc: translate("verdictDangerDesc"),
    }
  );
  result.verdict = verdict;

  if (verdictCard) {
    verdictCard.className = `verdict-card verdict-${verdict.level}`;
    if (verdictBadge) verdictBadge.textContent = verdict.badge;
    if (verdictTitle) verdictTitle.textContent = verdict.title;
    if (verdictDesc) verdictDesc.textContent = verdict.desc;
  }

  statSentences.textContent = String(result.sentenceCount);
  statExternal.textContent = String(result.externalMatchCount);
  statInternal.textContent = String(result.internalRepeatCount);
  matchesCount.textContent = String(result.flaggedMatches.length);

  // Filter counts
  const webCount = result.flaggedMatches.filter((m) => m.type === "web").length;
  const intCount = result.flaggedMatches.filter((m) => m.type === "internal").length;
  if (filterAllCount) filterAllCount.textContent = `(${result.flaggedMatches.length})`;
  if (filterWebCount) filterWebCount.textContent = `(${webCount})`;
  if (filterIntCount) filterIntCount.textContent = `(${intCount})`;

  matchesList.innerHTML = "";

  if (result.flaggedMatches.length === 0) {
    noMatchesBox.classList.remove("hidden");
    matchesList.classList.add("hidden");
    copyReportBtn.classList.remove("hidden");
    return;
  }

  noMatchesBox.classList.add("hidden");
  matchesList.classList.remove("hidden");
  copyReportBtn.classList.remove("hidden");

  result.flaggedMatches.forEach((match) => {
    const li = document.createElement("li");
    li.className = "match-item";
    li.setAttribute("data-match-type", match.type || "internal");

    const topDiv = document.createElement("div");
    topDiv.className = "match-top";

    const originSpan = document.createElement("span");
    originSpan.className = "match-origin";
    originSpan.textContent = match.sourceLabel;

    const scoreSpan = document.createElement("span");
    scoreSpan.className = `match-score ${match.scorePct >= 75 ? "high" : "medium"}`;
    scoreSpan.textContent = `${match.scorePct}%`;

    topDiv.appendChild(originSpan);
    topDiv.appendChild(scoreSpan);

    const quoteP = document.createElement("p");
    quoteP.className = "match-quote";
    quoteP.textContent = match.text;

    li.appendChild(topDiv);
    li.appendChild(quoteP);

    if (match.sourceUrl) {
      const link = document.createElement("a");
      link.href = match.sourceUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "match-link";
      link.textContent = translate("openSource");
      li.appendChild(link);
    }

    matchesList.appendChild(li);
  });

  applyFilter(currentFilter);
}

// ─── Copy Report ───
function buildReportText(): string {
  if (!lastResult) return "";
  const L = I18N[currentLang];
  const now = new Date().toLocaleString(currentLang === "es" ? "es-ES" : "en-US");
  const verdict =
    lastResult.verdict ||
    computeVerdict(
      lastResult.originalityPercent,
      lastResult.externalMatchCount,
      lastResult.internalRepeatCount,
      {
        safeBadge: translate("verdictSafeBadge"),
        safeTitle: translate("verdictSafeTitle"),
        safeDesc: translate("verdictSafeDesc"),
        cautionBadge: translate("verdictCautionBadge"),
        cautionTitle: translate("verdictCautionTitle"),
        cautionDesc: translate("verdictCautionDesc"),
        dangerBadge: translate("verdictDangerBadge"),
        dangerTitle: translate("verdictDangerTitle"),
        dangerDesc: translate("verdictDangerDesc"),
      }
    );

  const lines = [
    L.reportTitle,
    "",
    `${L.reportDate}: ${now}`,
    `${L.reportDoc}: ${state.activeDocTitle || "—"}`,
    "",
    `${L.verdictLabel}: [${verdict.badge}] ${verdict.title}`,
    `   ${verdict.desc}`,
    "",
    `${L.reportOriginality}: ${lastResult.originalityPercent}%`,
    `${L.reportSimilarity}: ${lastResult.similarityPercent}%`,
    `${L.reportSentencesAnalyzed}: ${lastResult.sentenceCount}`,
    `${L.reportWebMatches}: ${lastResult.externalMatchCount}`,
    `${L.reportInternalRepeats}: ${lastResult.internalRepeatCount}`,
    `${L.sourcesTitle}: Wikipedia (ES/EN), OpenAlex Academic (250M+ Papers), Local NLP Engine`,
    "",
  ];

  if (lastResult.flaggedMatches.length > 0) {
    lines.push(`── ${L.reportFindings} ──`);
    lines.push("");
    lastResult.flaggedMatches.forEach((m, i) => {
      lines.push(`${i + 1}. [${m.scorePct}%] [${(m.type || "").toUpperCase()}] ${m.sourceLabel}`);
      lines.push(`   "${m.text}"`);
      if (m.sourceUrl) lines.push(`   ${m.sourceUrl}`);
      lines.push("");
    });
  } else {
    lines.push(L.reportNoFindings);
    lines.push("");
  }

  lines.push("—");
  lines.push(L.reportGeneratedBy);
  return lines.join("\n");
}

async function handleCopyReport(): Promise<void> {
  const text = buildReportText();
  try {
    await navigator.clipboard.writeText(text);
    copyReportBtn.innerHTML = translate("copyDone");
    setTimeout(() => {
      copyReportBtn.innerHTML = translate("copyReport");
    }, 2000);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.inset = "0";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      // Fallback
    }
    document.body.removeChild(ta);
    if (copied) {
      copyReportBtn.innerHTML = translate("copyDone");
      setTimeout(() => {
        copyReportBtn.innerHTML = translate("copyReport");
      }, 2000);
    }
  }
}

// ─── Analysis Engine ───
async function handleAnalyze(): Promise<void> {
  if (state.isAnalyzing || !state.activeDocId) return;

  const myToken = ++currentAnalysisToken;

  showError("");
  state.isAnalyzing = true;
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = translate("analyzingReading");

  try {
    // 1. Fetch document text
    const docRes = await chrome.runtime.sendMessage({
      type: "FETCH_DOC_TEXT",
      docId: state.activeDocId,
    });

    if (!docRes || !docRes.ok) {
      throw new Error(docRes?.error || translate("errorGeneric"));
    }

    // 2. Parse sentences (filtrando fórmulas y matemáticas)
    const allSentences: ParsedSentence[] = splitSentences(docRes.text, tokenizeWords);
    const totalWords = allSentences.reduce((sum, s) => sum + s.wordCount, 0);

    if (allSentences.length === 0) {
      throw new Error(translate("errorInsufficientSentences"));
    }

    // 3. Stratified sampling for web check (hasta 35 oraciones representativas)
    const sampledSentences = stratifiedSample(allSentences, MAX_SAMPLE_SENTENCES);

    // 4. Prepare all sentences for internal analysis
    const preparedAll = allSentences.map((s, idx) => ({
      index: idx,
      raw: s.raw,
      words: s.words,
      wordCount: s.wordCount,
      shingles: buildShingles(s.words, SHINGLE_SIZE),
      tf: buildTermFrequency(s.words),
    }));

    const sampledSet = new Set(sampledSentences.map((s) => s.raw));
    const preparedSampled = preparedAll.filter((p) => sampledSet.has(p.raw));

    const flaggedMatches: MatchFinding[] = [];
    let internalRepeatCount = 0;
    let externalMatchCount = 0;
    let weightedSimilarityWords = 0;

    // Progress update before NLP loop
    analyzeBtn.textContent = translate("analyzingInternal");
    await new Promise((r) => setTimeout(r, 0));

    // 5. Internal repetition detection (oraciones de prosa >= MIN_WORDS_FOR_INTERNAL)
    for (let i = 0; i < preparedAll.length; i++) {
      const docSent = preparedAll[i];
      if (docSent.words.length < MIN_WORDS_FOR_INTERNAL) continue;

      let bestInternalScore = 0;
      let repeatedWithIndex = -1;

      for (let j = 0; j < preparedAll.length; j++) {
        if (i === j) continue;
        const other = preparedAll[j];
        if (other.words.length < MIN_WORDS_FOR_INTERNAL) continue;

        const sentShingle = computeShingleContainment(docSent.shingles, other.shingles);
        const cos = cosineSimilarity(docSent.tf, other.tf);
        const combined = Math.max(sentShingle, cos);

        if (combined >= INTERNAL_THRESHOLD && combined > bestInternalScore) {
          bestInternalScore = combined;
          repeatedWithIndex = j;
        }
      }

      if (bestInternalScore >= INTERNAL_THRESHOLD) {
        internalRepeatCount++;
        weightedSimilarityWords += docSent.wordCount * (bestInternalScore * 0.45);
        flaggedMatches.push({
          type: "internal",
          sourceLabel: translate("internalRepeat", { n: repeatedWithIndex + 1 }),
          scorePct: Math.min(100, Math.round(bestInternalScore * 100)),
          text: docSent.raw,
          sourceUrl: "",
        });
      }
    }

    // 6. Web verification across Wikipedia & OpenAlex
    const webCandidates = preparedSampled.filter(
      (s) => s.raw.split(/\s+/).length >= MIN_WORDS_FOR_WEB
    );

    for (let k = 0; k < webCandidates.length; k++) {
      analyzeBtn.textContent = translate("analyzingWeb", {
        current: k + 1,
        total: webCandidates.length,
      });

      const rawWords = webCandidates[k].raw.split(/\s+/);
      const start = Math.max(0, Math.floor((rawWords.length - WEB_SNIPPET_SIZE) / 2));
      const snippet = rawWords.slice(start, start + WEB_SNIPPET_SIZE).join(" ");

      // Exigir al menos 4 palabras léxicas reales
      const lexicalWords = snippet.split(/\s+/).filter((w) => {
        const clean = w.toLowerCase().replace(/[^\p{L}]/gu, "");
        return clean.length >= 3 && !STOPWORDS.has(clean);
      });
      if (lexicalWords.length < 4) continue;

      // Rate limit: 120ms between requests for fast responsive auditing
      await new Promise((r) => setTimeout(r, 120));

      if (myToken !== currentAnalysisToken) return;

      const webCheck = await chrome.runtime
        .sendMessage({
          type: "CHECK_WEB_PHRASE",
          phrase: snippet,
          lang: currentLang,
        })
        .catch(() => null);

      if (myToken !== currentAnalysisToken) return;

      if (webCheck && webCheck.ok && webCheck.matched) {
        externalMatchCount++;
        weightedSimilarityWords += webCandidates[k].wordCount;
        const matchLabel = webCheck.sourceTitle
          ? `${translate("externalMatch")} · ${webCheck.sourceTitle}`
          : translate("externalMatch");
        flaggedMatches.push({
          type: "web",
          sourceLabel: matchLabel,
          scorePct: 100,
          text: `"${snippet}" — ${webCandidates[k].raw}`,
          sourceUrl: webCheck.sourceUrl || "",
        });
      } else if (webCheck && !webCheck.ok && webCheck.error === "rate_limited") {
        showError(translate("errorRateLimited"));
      }
    }

    // 7. Compute scores
    const similarityPercent = Math.max(
      0,
      Math.min(
        100,
        totalWords > 0 ? Math.round((weightedSimilarityWords / totalWords) * 100) : 0
      )
    );
    const originalityPercent = 100 - similarityPercent;

    renderResults({
      totalWords,
      sentenceCount: preparedAll.length,
      externalMatchCount,
      internalRepeatCount,
      similarityPercent,
      originalityPercent,
      flaggedMatches,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("Could not establish connection") ||
      msg.includes("Extension context invalidated")
    ) {
      showError(translate("errorSwAsleep"));
    } else {
      showError(msg || translate("errorGeneric"));
    }
  } finally {
    state.isAnalyzing = false;
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = translate("analyzeBtn");
  }
}

// ─── Event Listeners ───
refreshTabBtn.addEventListener("click", detectActiveGoogleDoc);
analyzeBtn.addEventListener("click", handleAnalyze);
copyReportBtn.addEventListener("click", handleCopyReport);

document.querySelectorAll<HTMLButtonElement>(".filter-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    const f = pill.getAttribute("data-filter") as FilterType;
    if (f) applyFilter(f);
  });
});

if (langToggle) {
  langToggle.addEventListener("click", () => {
    currentLang = currentLang === "es" ? "en" : "es";
    localStorage.setItem("docguard_lang", currentLang);
    applyI18N();
    if (lastResult) renderResults(lastResult);
  });
}

window.addEventListener("langchange", (e: Event) => {
  const ce = e as CustomEvent<{ lang?: Language }>;
  if (ce.detail?.lang && (ce.detail.lang === "es" || ce.detail.lang === "en")) {
    currentLang = ce.detail.lang;
    localStorage.setItem("docguard_lang", currentLang);
    applyI18N();
    if (lastResult) renderResults(lastResult);
  }
});

themeToggle.addEventListener("click", () => {
  const current = (document.documentElement.getAttribute("data-theme") || "dark") as Theme;
  let nextTheme: Theme = "dark";
  if (current === "dark") nextTheme = "light";
  else if (current === "light") nextTheme = "neobrutalism";
  else nextTheme = "dark";
  applyTheme(nextTheme);
});

if (chrome.tabs && chrome.tabs.onActivated) {
  chrome.tabs.onActivated.addListener(detectActiveGoogleDoc);
}
if (chrome.tabs && chrome.tabs.onUpdated) {
  chrome.tabs.onUpdated.addListener((_tabId: number, changeInfo: { status?: string; url?: string; title?: string }, tab: chrome.tabs.Tab) => {
    if (tab && tab.active && (changeInfo.url || changeInfo.title || changeInfo.status === "complete")) {
      detectActiveGoogleDoc();
    }
  });
}

// ─── Initialization ───
applyTheme(getPreferredTheme());
applyI18N();
detectActiveGoogleDoc();
