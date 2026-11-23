/**
 * DocGuard — Internationalization (i18n) Dictionary & Helpers
 * Supports English (en) and Spanish (es) with parameter substitution.
 */

export type Language = "es" | "en";

export interface I18nDictionary {
  [key: string]: string;
}

export const I18N: Record<Language, I18nDictionary> = {
  es: {
    sec1Title: "1. Documento activo",
    sec2Title: "2. Resultados de originalidad",
    statusLabel: "Estado",
    titleLabel: "Título",
    statusDetecting: "Detectando pestaña…",
    statusDetected: "Google Doc detectado",
    statusNoTab: "Sin pestaña activa",
    statusNotDoc: "No es un Google Doc",
    statusError: "Error al leer pestaña",
    refreshTitle: "Volver a detectar pestaña activa",
    analyzeBtn: "Analizar Google Doc actual",
    analyzingReading: "Leyendo Google Doc…",
    analyzingWeb: "Verificando web ({current}/{total})…",
    analyzingInternal: "Analizando repeticiones internas…",
    emptyState:
      "Pulsa <strong>Analizar Google Doc actual</strong> para auditar repeticiones internas y verificar coincidencias literales en la web automáticamente.",
    step1: "Abre tu Google Doc",
    step2: "Clic en Analizar",
    step3: "Copia el reporte",
    originalityLabel: "Originalidad",
    similarityLabel: "Similitud",
    riskLow: "Riesgo bajo · Originalidad alta",
    riskMedium: "Precaución · Similitud moderada",
    riskHigh: "Alerta · Similitud elevada",
    statSentences: "Oraciones",
    statWebMatches: "Coinc. web",
    statInternal: "Rep. interna",
    matchesTitle: "Hallazgos detectados",
    noMatches: "Sin coincidencias literales en la web ni repeticiones internas significativas.",
    copyReport: "Copiar reporte",
    copyDone: "Copiado",
    externalMatch: "Coincidencia web",
    internalRepeat: "Repetición interna (Oración #{n})",
    openSource: "Abrir fuente coincidente ↗",
    words: "palabras",
    untitledDoc: "Documento sin título",
    errorInsufficientSentences:
      "El documento no contiene suficientes oraciones completas de texto para analizar.",
    errorGeneric: "Ocurrió un error al analizar el documento.",
    errorSwAsleep: "El servicio está iniciando. Por favor, reintenta en un momento.",
    errorRateLimited: "El motor web limitó las consultas. Análisis completado parcialmente.",
    footerText: "Desarrollado por",
    verdictLabel: "Veredicto",
    verdictSublabel: "Recomendación",
    verdictSafeBadge: "LISTO PARA ENTREGAR",
    verdictSafeTitle: "Aprobado para entrega académica",
    verdictSafeDesc:
      "Rango seguro estándar (0% - 20%). Alta originalidad y baja similitud externa. Seguro para Turnitin.",
    verdictCautionBadge: "SIMILITUD MODERADA",
    verdictCautionTitle: "Rango técnico aceptable (21% - 35%)",
    verdictCautionDesc:
      "Común en informes técnicos y marco teórico. Se recomienda verificar citas textuales antes de entregar.",
    verdictDangerBadge: "SIMILITUD ELEVADA (> 35%)",
    verdictDangerTitle: "Revisión previa recomendada",
    verdictDangerDesc:
      "Se detectaron múltiples coincidencias web considerables. Existe riesgo de observación docente si no se parafrasea.",
    filterAll: "Todos",
    filterWeb: "Web",
    filterInternal: "Internos",
    sourcesTitle: "Bases de consulta activas",
    sourcesDesc:
      "Verificación multi-fuente en tiempo real sin almacenamiento en servidores externos (100% privado).",
    sourceWikiDetail: "Enciclopedia global y definiciones conceptuales (ES / EN)",
    sourceOpenAlexDetail: "+250M de papers, journals y literatura científica indexada",
    sourceLocalDetail: "Shingling 5-gram + Jaccard para redundancia interna",
    reportTitle: "═══ REPORTE DOCGUARD ═══",
    reportDate: "Fecha",
    reportDoc: "Documento",
    reportOriginality: "Índice de originalidad",
    reportSimilarity: "Similitud detectada",
    reportSentencesAnalyzed: "Oraciones analizadas",
    reportWebMatches: "Coincidencias web",
    reportInternalRepeats: "Repeticiones internas",
    reportFindings: "HALLAZGOS",
    reportNoFindings: "No se encontraron hallazgos.",
    reportGeneratedBy: "Generado por DocGuard v2.1 — 100% local, sin API keys",
  },
  en: {
    sec1Title: "1. Active Document",
    sec2Title: "2. Originality Results",
    statusLabel: "Status",
    titleLabel: "Title",
    statusDetecting: "Detecting tab…",
    statusDetected: "Google Doc detected",
    statusNoTab: "No active tab",
    statusNotDoc: "Not a Google Doc",
    statusError: "Error reading tab",
    refreshTitle: "Re-detect active tab",
    analyzeBtn: "Analyze current Google Doc",
    analyzingReading: "Reading Google Doc…",
    analyzingWeb: "Checking web ({current}/{total})…",
    analyzingInternal: "Analyzing internal repetitions…",
    emptyState:
      "Press <strong>Analyze current Google Doc</strong> to audit internal repetitions and verify literal web matches automatically.",
    step1: "Open your Google Doc",
    step2: "Click Analyze",
    step3: "Copy report",
    originalityLabel: "Originality",
    similarityLabel: "Similarity",
    riskLow: "Low risk · High originality",
    riskMedium: "Caution · Moderate similarity",
    riskHigh: "Alert · High similarity",
    statSentences: "Sentences",
    statWebMatches: "Web matches",
    statInternal: "Int. repeats",
    matchesTitle: "Findings detected",
    noMatches: "No literal web matches or significant internal repetitions found.",
    copyReport: "Copy report",
    copyDone: "Copied",
    externalMatch: "Web match",
    internalRepeat: "Internal repetition (Sentence #{n})",
    openSource: "Open matching source ↗",
    words: "words",
    untitledDoc: "Untitled document",
    errorInsufficientSentences:
      "The document does not contain enough complete text sentences to analyze.",
    errorGeneric: "An error occurred while analyzing the document.",
    errorSwAsleep: "The service is starting up. Please try again in a moment.",
    errorRateLimited: "Web engine rate-limited requests. Analysis completed partially.",
    footerText: "Developed by",
    verdictLabel: "Verdict",
    verdictSublabel: "Recommendation",
    verdictSafeBadge: "READY TO SUBMIT",
    verdictSafeTitle: "Approved for academic submission",
    verdictSafeDesc:
      "Standard safe range (0% - 20%). High originality and low external similarity. Safe for Turnitin.",
    verdictCautionBadge: "MODERATE SIMILARITY",
    verdictCautionTitle: "Acceptable technical range (21% - 35%)",
    verdictCautionDesc:
      "Common in technical reports and literature reviews. Double-check direct quotes before submitting.",
    verdictDangerBadge: "HIGH SIMILARITY (> 35%)",
    verdictDangerTitle: "Prior revision recommended",
    verdictDangerDesc:
      "Multiple considerable web matches detected. Risk of academic penalty unless paraphrased or quoted.",
    filterAll: "All",
    filterWeb: "Web",
    filterInternal: "Internal",
    sourcesTitle: "Active Knowledge Engines",
    sourcesDesc: "Real-time multi-source verification with zero external storage (100% private).",
    sourceWikiDetail: "Global encyclopedia & conceptual domain definitions (ES / EN)",
    sourceOpenAlexDetail: "250M+ scientific papers, journals & academic literature",
    sourceLocalDetail: "5-gram shingling + Jaccard similarity for internal redundancy",
    reportTitle: "═══ DOCGUARD REPORT ═══",
    reportDate: "Date",
    reportDoc: "Document",
    reportOriginality: "Originality index",
    reportSimilarity: "Detected similarity",
    reportSentencesAnalyzed: "Sentences analyzed",
    reportWebMatches: "Web matches",
    reportInternalRepeats: "Internal repetitions",
    reportFindings: "FINDINGS",
    reportNoFindings: "No findings detected.",
    reportGeneratedBy: "Generated by DocGuard v2.1 — 100% local, no API keys",
  },
};

export function t(lang: Language, key: string, replacements?: Record<string, string | number>): string {
  let str = (I18N[lang] && I18N[lang][key]) || key;
  if (replacements) {
    for (const [k, v] of Object.entries(replacements)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
