/**
 * DocGuard — Automated Test Suite
 * Zero dependencies · Runs on standard Node.js
 * Run with: node test/run-tests.js
 */

import assert from "node:assert";

// ─── Colors for terminal output ───
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ${GREEN}✓${RESET} ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ${RED}✗${RESET} ${desc}`);
    console.error(`    ${RED}${err.message}${RESET}`);
    failed++;
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ${GREEN}✓${RESET} ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ${RED}✗${RESET} ${desc}`);
    console.error(`    ${RED}${err.message}${RESET}`);
    failed++;
  }
}

// ─── Imported logic from sidepanel.js ───
function isMathOrFormula(rawSentence) {
  if (!rawSentence) return true;
  const trimmed = rawSentence.trim();
  const mathSymbolsCount = (trimmed.match(/[=+\-*/^<>±≈≠≤≥∑∫√∂%]/g) || []).length;
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 0) return true;

  const realWords = tokens.filter((t) => /^[\p{L}]{3,}$/u.test(t.replace(/[.,;:()]/g, "")));

  if (mathSymbolsCount >= 1 && realWords.length < 4) return true;

  const nonAlphaChars = (trimmed.match(/[\d=+\-*/^<>()[\]{}_]/g) || []).length;
  if (nonAlphaChars / trimmed.length > 0.35 && realWords.length < 5) return true;

  if (/^(det\(|Menor\s*\d+:|Ecuaci[oó]n\s*\d+:|Sustituci[oó]n\s*de|\([0-9]+\)\([0-9]+\))/i.test(trimmed)) {
    if (realWords.length < 5) return true;
  }

  return false;
}

function shouldSkipStructuralLine(trimmedBlock) {
  const SKIP_PATTERNS = [
    /^(SERVICIO NACIONAL|Programa:|Aprendiz:|Actividad de|Evidencia de|Competencia:|Resultado de)/i,
    /^(Facultad\s+de|Corporaci[oó]n\s+Universitaria|Universidad|Ingenier[íi]a\s+de|Docente\s+Tutor|Tutor:|Sustentaci[oó]n|ID\s+Banner|Autor\(es\)?|Estudiante:|Bogot[áa]\s+D\.?C\.?|Noviembre\s+de\s+\d{4})/i,
    /^(Tabla|Table|Figura|Figure|Gráfico|Chart)\s*\d/i,
    /^\d+[\.]\s*$/,
    /^[A-ZÁÉÍÓÚÑ\s\(\)\-]{3,150}$/,
    /^(ÍNDICE|INDICE|TABLA DE CONTENIDO|TABLE OF CONTENTS)\b/i,
    /(?:\.{2,}|\s{2,})\s*\d+\s*$/,
  ];
  return SKIP_PATTERNS.some((p) => p.test(trimmedBlock)) || /(?:\.{2,}|\s{2,})\s*\d+\s*$/.test(trimmedBlock);
}

function computeVerdict(originalityPercent, externalMatchCount, internalRepeatCount) {
  const similarityPercent = 100 - originalityPercent;

  if (similarityPercent <= 20 && externalMatchCount <= 3) {
    return { level: "safe", label: "LISTO PARA ENTREGAR" };
  }
  if (similarityPercent > 35 || externalMatchCount >= 6) {
    return { level: "danger", label: "SIMILITUD ELEVADA" };
  }
  return { level: "caution", label: "SIMILITUD MODERADA" };
}

function buildShingles(words, size = 5) {
  const shingles = new Set();
  if (words.length < size) return shingles;
  for (let i = 0; i <= words.length - size; i++) {
    shingles.add(words.slice(i, i + size).join(" "));
  }
  return shingles;
}

function computeShingleContainment(target, ref) {
  if (target.size === 0 || ref.size === 0) return 0;
  let hits = 0;
  for (const s of target) {
    if (ref.has(s)) hits++;
  }
  return hits / target.size;
}

// ─── RUN ALL SUITES ───
async function runTests() {
  console.log(`\n${CYAN}══════════════════════════════════════════════${RESET}`);
  console.log(`${CYAN}   DocGuard — Automated Engine Verification   ${RESET}`);
  console.log(`${CYAN}══════════════════════════════════════════════${RESET}\n`);

  console.log(`${YELLOW}1. Structural Exclusion: Table of Contents & Cover Page (Turnitin Rules):${RESET}`);
  it("Should skip Table of Contents line: '3.4.1. Despeje de x3 a partir de la restricción...... 6'", () => {
    assert.strictEqual(shouldSkipStructuralLine("3.4.1. Despeje de x3 a partir de la restricción...... 6"), true);
  });

  it("Should skip Table of Contents line: '2. Definición de Variables y Matriz de Consumo...... 4'", () => {
    assert.strictEqual(shouldSkipStructuralLine("2. Definición de Variables y Matriz de Consumo...... 4"), true);
  });

  it("Should skip institutional cover page line: 'Corporación Universitaria Iberoamericana'", () => {
    assert.strictEqual(shouldSkipStructuralLine("Corporación Universitaria Iberoamericana"), true);
  });

  it("Should skip student ID line: 'ID Banner: 200343762'", () => {
    assert.strictEqual(shouldSkipStructuralLine("ID Banner: 200343762"), true);
  });

  it("Should skip tutor line: 'Docente Tutor: Christian Becerra'", () => {
    assert.strictEqual(shouldSkipStructuralLine("Docente Tutor: Christian Becerra"), true);
  });

  it("Should ALLOW actual research paragraph in Section 1", () => {
    const paragraph = "En entornos de generación aumentada por recuperación, la infraestructura se despliega desacoplada en tres microservicios independientes.";
    assert.strictEqual(shouldSkipStructuralLine(paragraph), false);
  });

  console.log(`\n${YELLOW}2. Math & Formula Filter (No NASCAR False Positives):${RESET}`);
  it("Should identify calculation '(4)(5) - (1)(2) = 20 - 2 = 18' as math formula", () => {
    assert.strictEqual(isMathOrFormula("(4)(5) - (1)(2) = 20 - 2 = 18"), true);
  });

  it("Should identify determinant formula 'det(A) = 3(18) - 1(0) + 2(-36)' as math formula", () => {
    assert.strictEqual(isMathOrFormula("det(A) = 3(18) - 1(0) + 2(-36)"), true);
  });

  it("Should identify algebra step '= 12 y x3 = - Obtención de x3 sustituyendo x1 = 12 en (Ecuación 4):' as formula", () => {
    assert.strictEqual(isMathOrFormula("= 12 y x3 = - Obtención de x3 sustituyendo x1 = 12 en (Ecuación 4):"), true);
  });

  it("Should ALLOW genuine natural language prose", () => {
    assert.strictEqual(isMathOrFormula("La inteligencia artificial es una disciplina de la computación moderna"), false);
  });

  console.log(`\n${YELLOW}3. University & Turnitin Standard Submission Verdicts:${RESET}`);
  it("Clean technical report (85% originality, 2 web matches, 15% similarity) -> Must be 'safe' (LISTO PARA ENTREGAR)", () => {
    const res = computeVerdict(85, 2, 1);
    assert.strictEqual(res.level, "safe");
  });

  it("Moderate similarity technical work (75% originality, 25% similarity) -> Must be 'caution' (SIMILITUD MODERADA)", () => {
    const res = computeVerdict(75, 4, 8);
    assert.strictEqual(res.level, "caution");
  });

  it("Heavy unquoted copy (50% originality, 50% similarity, 8 web matches) -> Must be 'danger' (SIMILITUD ELEVADA)", () => {
    const res = computeVerdict(50, 8, 12);
    assert.strictEqual(res.level, "danger");
  });

  console.log(`\n${YELLOW}4. Live External Knowledge APIs (Wikipedia & OpenAlex):${RESET}`);
  const wikiHeaders = { 'User-Agent': 'DocGuardTest/2.1 (https://nival.is-a.dev/; contact@nival.is-a.dev)' };

  await itAsync("Wikipedia API should find exact match for 'teoria de la relatividad especial'", async () => {
    const q = encodeURIComponent('"teoria de la relatividad especial"');
    const res = await fetch(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&utf8=&format=json`, { headers: wikiHeaders });
    assert.strictEqual(res.ok, true);
    const data = await res.json();
    assert.ok(data.query && data.query.search.length > 0);
  });

  await itAsync("Wikipedia API should return 0 hits for nonsensical phrase", async () => {
    const q = encodeURIComponent('"mi perro salta en los charcos azules de marte"');
    const res = await fetch(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&utf8=&format=json`, { headers: wikiHeaders });
    assert.strictEqual(res.ok, true);
    const data = await res.json();
    assert.strictEqual(data.query.search.length, 0);
  });

  await itAsync("OpenAlex Academic API should be queried with graceful fallback on rate limits", async () => {
    const res = await fetch(`https://api.openalex.org/works?search=neural+networks&per_page=1&mailto=docguard.open@gmail.com`);
    // OpenAlex devuelve 200 (éxito), 429 (rate-limit) o 503 (indisponibilidad temporal que el motor absorbe limpiamente)
    assert.ok(res.status === 200 || res.status === 429 || res.status === 503);
  });

  // ─── FINAL SUMMARY ───
  console.log(`\n${CYAN}──────────────────────────────────────────────${RESET}`);
  console.log(`  Results: ${passed > 0 ? GREEN : ""}${passed} passed${RESET}, ${failed > 0 ? RED : ""}${failed} failed${RESET}`);
  console.log(`${CYAN}──────────────────────────────────────────────${RESET}\n`);

  if (failed > 0) process.exit(1);
}

runTests();
