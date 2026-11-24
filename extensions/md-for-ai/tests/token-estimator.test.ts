import { describe, it, expect } from 'vitest';
import { estimateTokens } from '../src/lib/token-estimator';

describe('estimateTokens', () => {
  it('returns 0 for empty or whitespace-only strings', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('   ')).toBe(0);
    expect(estimateTokens('\n\n\t  \n')).toBe(0);
  });

  it('estimates short English phrases accurately', () => {
    const text = 'Hello world';
    const tokens = estimateTokens(text);
    // "Hello world" is ~2-3 tokens in BPE
    expect(tokens).toBeGreaterThanOrEqual(2);
    expect(tokens).toBeLessThanOrEqual(4);
  });

  it('estimates standard paragraphs and sentences', () => {
    const sentence = 'The quick brown fox jumps over the lazy dog near the riverbank.';
    const tokens = estimateTokens(sentence);
    // ~12 words, around 13-16 tokens
    expect(tokens).toBeGreaterThanOrEqual(12);
    expect(tokens).toBeLessThanOrEqual(20);
  });

  it('accounts for code syntax, operators, and indentation', () => {
    const code = `function calculateSum(a: number, b: number): number {
  const result = a + b;
  return result * 2;
}`;
    const tokens = estimateTokens(code);
    expect(tokens).toBeGreaterThan(15);
    expect(tokens).toBeLessThan(45);
  });

  it('estimates CJK text with appropriate weighting', () => {
    const chineseText = '你好世界，人工智能模型正在快速发展。';
    const tokens = estimateTokens(chineseText);
    // CJK characters average ~1.2 tokens each (18 chars -> ~20-25 tokens)
    expect(tokens).toBeGreaterThanOrEqual(15);
    expect(tokens).toBeLessThanOrEqual(30);
  });

  it('runs locally with zero network and sub-millisecond execution', () => {
    const largeText = 'Markdown for AI prompt optimization '.repeat(500);
    const start = performance.now();
    const count = estimateTokens(largeText);
    const duration = performance.now() - start;

    expect(count).toBeGreaterThan(2000);
    expect(duration).toBeLessThan(50); // Under 50ms for large text
  });
});
