import { estimateTokens } from './token-estimator';

export const TRIM_SUFFIX = '[...recortado]';

/**
 * Checks if the text currently has an unclosed fenced code block (``` or ~~~).
 * Returns the opening fence string if unclosed, or null if all fences are balanced.
 */
export function getUnclosedFence(text: string): string | null {
  const lines = text.split('\n');
  let openFence: string | null = null;

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      const fenceType = trimmed.slice(0, 3);
      if (!openFence) {
        openFence = fenceType;
      } else if (trimmed.startsWith(openFence)) {
        openFence = null;
      }
    }
  }

  return openFence;
}

/**
 * Closes any unclosed code block and appends the trimmed suffix.
 */
function assembleTrimmedMarkdown(content: string): string {
  let cleaned = content.trimEnd();
  if (!cleaned) return TRIM_SUFFIX;

  const unclosed = getUnclosedFence(cleaned);
  if (unclosed) {
    cleaned = `${cleaned}\n${unclosed}`;
  }

  return `${cleaned}\n\n${TRIM_SUFFIX}`;
}

/**
 * Trims markdown text to fit within a given token limit.
 *
 * Rules:
 * - Cuts at paragraph boundaries (\n\n) first.
 * - If a single block / paragraph is huge, cuts at line boundaries (\n).
 * - Never leaves a code block unclosed.
 * - Appends "[...recortado]" at the end.
 * - Guarantees estimateTokens(result) <= limit.
 *
 * @param markdown - Input markdown string
 * @param limit - Maximum token budget
 * @returns Trimmed markdown string
 */
export function trimToTokens(markdown: string, limit: number): string {
  if (!markdown || typeof markdown !== 'string') return '';
  if (limit <= 0) return TRIM_SUFFIX;

  const initialTokens = estimateTokens(markdown);
  if (initialTokens <= limit) {
    return markdown;
  }

  const suffixTokens = estimateTokens(`\n\n${TRIM_SUFFIX}`);
  if (limit <= suffixTokens) {
    return TRIM_SUFFIX;
  }

  // Split into paragraphs by double newlines
  const paragraphs = markdown.split(/\n\s*\n/);
  const candidateParagraphs: string[] = [];
  let bestResult = TRIM_SUFFIX;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]!;
    const testContent = candidateParagraphs.length === 0
      ? para
      : `${candidateParagraphs.join('\n\n')}\n\n${para}`;

    const candidateResult = assembleTrimmedMarkdown(testContent);
    if (estimateTokens(candidateResult) <= limit) {
      candidateParagraphs.push(para);
      bestResult = candidateResult;
    } else {
      // Paragraph boundary exceeded limit.
      // Cut inside this paragraph at line boundary ("o de línea si un bloque es enorme")
      const lines = para.split('\n');
      const prefix = candidateParagraphs.length === 0 ? '' : `${candidateParagraphs.join('\n\n')}\n\n`;
      const accumulatedLines: string[] = [];

      for (let j = 0; j < lines.length; j++) {
        const line = lines[j]!;
        const testLines = `${prefix}${accumulatedLines.length === 0 ? line : `${accumulatedLines.join('\n')}\n${line}`}`;
        const lineResult = assembleTrimmedMarkdown(testLines);

        if (estimateTokens(lineResult) <= limit) {
          accumulatedLines.push(line);
          bestResult = lineResult;
        } else {
          break;
        }
      }
      break;
    }
  }

  return bestResult;
}
