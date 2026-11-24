/**
 * Estimates LLM token count for any text locally (zero-network, 0ms latency).
 *
 * Heuristic calibrated against standard Byte-Pair Encoding (BPE) tokenizers (GPT-4, Claude, Gemini):
 * - English text: ~4 characters per token (or ~0.75-0.8 words per token)
 * - CJK (Chinese, Japanese, Korean): ~1.2 tokens per character
 * - Code & symbols: operators, delimiters, and indentation sequences count as distinct tokens
 */
export function estimateTokens(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;

  // 1. Count CJK (Chinese, Japanese, Korean) characters: ~1.2 tokens per char
  const cjkMatches = text.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;

  // 2. Strip CJK for Latin, code, and symbol analysis
  const nonCjk = text.replace(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g, '');

  // 3. Word tokens: short words (1-4 chars) = 1 token, longer words = ceil(len / 4)
  const words = nonCjk.match(/\b\w+\b/g) || [];
  let wordTokens = 0;
  for (const w of words) {
    wordTokens += Math.max(1, Math.ceil(w.length / 4));
  }

  // 4. Whitespace blocks (indentation >= 2 spaces or newlines)
  const whitespaceBlocks = nonCjk.match(/(\r?\n|[ ]{2,})/g) || [];
  let whitespaceTokens = 0;
  for (const ws of whitespaceBlocks) {
    whitespaceTokens += Math.max(1, Math.ceil(ws.length / 4));
  }

  // 5. Punctuation and symbols (operators, brackets, punctuation)
  const symbolMatches = nonCjk.match(/[^\w\s]/g) || [];
  const symbolTokens = Math.ceil(symbolMatches.length * 0.7);

  const total = Math.round(wordTokens + whitespaceTokens + symbolTokens + cjkCount * 1.2);
  return Math.max(1, total);
}
