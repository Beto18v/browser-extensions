import { describe, expect, it } from 'vitest';
import { extractVariables, hasVariables, resolveVariables } from '../src/lib/variables';

describe('variables', () => {
  it('extracts unique variables in order of appearance', () => {
    const vars = extractVariables(
      'Explain {{topic}} in {{language}} for a {{level}} audience. Focus on {{topic}}.'
    );
    expect(vars).toEqual([{ name: 'topic' }, { name: 'language' }, { name: 'level' }]);
  });

  it('returns empty array and false when no variables exist', () => {
    const body = 'Summarize this article in three bullet points.';
    expect(extractVariables(body)).toEqual([]);
    expect(hasVariables(body)).toBe(false);
  });

  it('detects variables even with whitespace inside braces', () => {
    expect(hasVariables('Hello {{ name }}!')).toBe(true);
    expect(extractVariables('Hello {{ name }}!')).toEqual([{ name: 'name' }]);
  });

  it('resolves variables with provided values and defaults missing to empty string', () => {
    const body = 'Write a {{format}} about {{topic}} in {{language}}.';
    const resolved = resolveVariables(body, {
      format: 'blog post',
      topic: 'TypeScript',
    });
    expect(resolved).toBe('Write a blog post about TypeScript in .');
  });
});
