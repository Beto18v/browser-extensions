import { describe, it, expect } from 'vitest';
import { trimToTokens, getUnclosedFence, TRIM_SUFFIX } from '../src/lib/trim-to-tokens';
import { estimateTokens } from '../src/lib/token-estimator';

describe('trimToTokens', () => {
  it('returns original markdown if estimated tokens are within limit', () => {
    const text = '## Simple Heading\n\nThis is a short paragraph that easily fits.';
    const limit = 500;
    const result = trimToTokens(text, limit);

    expect(result).toBe(text);
    expect(result).not.toContain(TRIM_SUFFIX);
  });

  it('cuts at paragraph boundary when multiple paragraphs exceed limit', () => {
    const paragraphs = [
      '# Introduction\n\nFirst paragraph with introductory text explaining the concepts.',
      'Second paragraph with detailed explanations of architecture and system design.',
      'Third paragraph discussing performance benchmarks and memory usage.',
      'Fourth paragraph concluding with final remarks and recommendations.',
    ];
    const fullText = paragraphs.join('\n\n');
    const fullTokens = estimateTokens(fullText);

    // Target a limit that fits roughly the first 2 paragraphs
    const limit = Math.floor(fullTokens * 0.6);
    const result = trimToTokens(fullText, limit);

    expect(result).toContain(TRIM_SUFFIX);
    expect(result.endsWith(TRIM_SUFFIX)).toBe(true);
    expect(estimateTokens(result)).toBeLessThanOrEqual(limit);
    expect(result).toContain('First paragraph');
    expect(result).not.toContain('Fourth paragraph');
  });

  it('cuts at line boundary if a single paragraph or block is huge', () => {
    const lines = [
      'Line 1: Detailed trace information for the initialization routine.',
      'Line 2: Loading modules and resolving dependency graphs.',
      'Line 3: Allocating heap buffers and compiling shaders.',
      'Line 4: Connecting local sockets and binding IPC ports.',
      'Line 5: Flushing pending event loops and dispatching tasks.',
    ];
    // A single block with single newlines
    const singleBlock = lines.join('\n');
    const totalTokens = estimateTokens(singleBlock);

    const limit = Math.floor(totalTokens * 0.5);
    const result = trimToTokens(singleBlock, limit);

    expect(result).toContain(TRIM_SUFFIX);
    expect(result.endsWith(TRIM_SUFFIX)).toBe(true);
    expect(estimateTokens(result)).toBeLessThanOrEqual(limit);
    expect(result).toContain('Line 1');
    expect(result).not.toContain('Line 5');
  });

  it('never leaves a fenced code block unclosed when truncated', () => {
    const markdownWithCode = `# Code Demonstration

Here is the sample implementation:

\`\`\`typescript
interface Pipeline {
  id: string;
  stages: number[];
  execute(): Promise<void>;
  rollback(): void;
  cleanup(): void;
}
\`\`\`

Additional closing remarks after the code block.`;

    const totalTokens = estimateTokens(markdownWithCode);
    // Limit that cuts right inside the code block
    const limit = Math.floor(totalTokens * 0.6);
    const result = trimToTokens(markdownWithCode, limit);

    expect(result).toContain(TRIM_SUFFIX);
    expect(estimateTokens(result)).toBeLessThanOrEqual(limit);

    // Verify code block is closed before suffix
    const unclosed = getUnclosedFence(result.replace(TRIM_SUFFIX, ''));
    expect(unclosed).toBeNull();
    expect(result).toMatch(/```\s*\n\n\[\.\.\.recortado\]$/);
  });

  it('handles small or zero limits safely', () => {
    const text = 'Some markdown text with words.';
    expect(trimToTokens(text, 0)).toBe(TRIM_SUFFIX);
    expect(trimToTokens(text, -10)).toBe(TRIM_SUFFIX);
  });

  it('handles empty strings gracefully', () => {
    expect(trimToTokens('', 100)).toBe('');
  });
});
