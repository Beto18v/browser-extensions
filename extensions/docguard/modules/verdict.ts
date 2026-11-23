/**
 * DocGuard — Submission Verdict & Risk Categorization
 * Matches academic integrity standards (Turnitin / University guidelines):
 * - Safe (<= 20% similarity, <= 3 external matches): Ready to Submit
 * - Caution (21% - 35% similarity): Moderate Similarity
 * - Danger (> 35% similarity or >= 6 external matches): High Similarity
 */

export type VerdictLevel = "safe" | "caution" | "danger";

export interface Verdict {
  level: VerdictLevel;
  label: string;
  badge: string;
  title: string;
  desc: string;
}

export interface VerdictMessages {
  safeBadge?: string;
  safeTitle?: string;
  safeDesc?: string;
  cautionBadge?: string;
  cautionTitle?: string;
  cautionDesc?: string;
  dangerBadge?: string;
  dangerTitle?: string;
  dangerDesc?: string;
}

/**
 * Calcula el veredicto y recomendación ejecutiva para saber si el trabajo
 * es seguro para entregar o si requiere parafraseo/revisión previa.
 */
export function computeVerdict(
  originalityPercent: number,
  externalMatchCount: number,
  _internalRepeatCount: number = 0,
  i18n?: VerdictMessages
): Verdict {
  const similarityPercent = 100 - originalityPercent;

  // Seguro / Listo para entrega (Rango estándar: Similitud <= 20% y <= 3 coincidencias web)
  if (similarityPercent <= 20 && externalMatchCount <= 3) {
    return {
      level: "safe",
      label: "LISTO PARA ENTREGAR",
      badge: i18n?.safeBadge || "LISTO PARA ENTREGAR",
      title: i18n?.safeTitle || "Aprobado para entrega académica",
      desc:
        i18n?.safeDesc ||
        "Rango seguro estándar (0% - 20%). Alta originalidad y baja similitud externa. Seguro para Turnitin.",
    };
  }

  // Alerta / No recomendado subir aún (Similitud > 35% o >= 6 coincidencias web directas)
  if (similarityPercent > 35 || externalMatchCount >= 6) {
    return {
      level: "danger",
      label: "SIMILITUD ELEVADA",
      badge: i18n?.dangerBadge || "SIMILITUD ELEVADA (> 35%)",
      title: i18n?.dangerTitle || "Revisión previa recomendada",
      desc:
        i18n?.dangerDesc ||
        "Se detectaron múltiples coincidencias web considerables. Existe riesgo de observación docente si no se parafrasea.",
    };
  }

  // Precaución / Similitud moderada (Rango técnico aceptable: 21% - 35%)
  return {
    level: "caution",
    label: "SIMILITUD MODERADA",
    badge: i18n?.cautionBadge || "SIMILITUD MODERADA",
    title: i18n?.cautionTitle || "Rango técnico aceptable (21% - 35%)",
    desc:
      i18n?.cautionDesc ||
      "Común en informes técnicos y marco teórico. Se recomienda verificar citas textuales antes de entregar.",
  };
}
