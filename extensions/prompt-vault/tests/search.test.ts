import { describe, expect, it } from 'vitest';
import { searchPrompts } from '../src/lib/search';
import type { Prompt } from '../src/lib/storage';

function makePrompt(overrides: Partial<Prompt> & { id: string; title: string }): Prompt {
  return {
    body: 'Default body',
    tags: [],
    variables: [],
    createdAt: 1000,
    updatedAt: 1000,
    usageCount: 0,
    pinned: false,
    ...overrides,
  };
}

describe('searchPrompts', () => {
  const prompts: Prompt[] = [
    makePrompt({
      id: '1',
      title: 'Translate',
      body: 'Translate text to Spanish',
      tags: ['language'],
      categoryId: 'writing',
      usageCount: 5,
      pinned: false,
    }),
    makePrompt({
      id: '2',
      title: 'Code Review',
      body: 'Review TypeScript code for bugs',
      tags: ['typescript', 'review'],
      categoryId: 'code',
      usageCount: 2,
      pinned: true,
    }),
    makePrompt({
      id: '3',
      title: 'Summarize',
      body: 'Summarize the article in 3 bullets',
      tags: ['writing', 'review'],
      categoryId: 'writing',
      usageCount: 12,
      pinned: false,
    }),
    makePrompt({
      id: '4',
      title: 'Review',
      body: 'General review checklist',
      tags: ['qa'],
      categoryId: 'code',
      usageCount: 1,
      pinned: false,
    }),
  ];

  it('returns all prompts sorted by pinned first then usageCount desc on empty query', () => {
    const result = searchPrompts(prompts, '   ');
    expect(result.map((p) => p.id)).toEqual(['2', '3', '1', '4']);
  });

  it('ranks exact title > title substring > tags > body, keeping pinned first', () => {
    const result = searchPrompts(prompts, 'review');
    // '2' is pinned (and matches title+tags), '4' is exact title 'Review', '3' matches tag 'review'
    expect(result.map((p) => p.id)).toEqual(['2', '4', '3']);
  });

  it('matches by body when title and tags do not match', () => {
    const result = searchPrompts(prompts, 'bullets');
    expect(result.map((p) => p.id)).toEqual(['3']);
  });

  it('matches by tags', () => {
    const result = searchPrompts(prompts, 'typescript');
    expect(result.map((p) => p.id)).toEqual(['2']);
  });

  it('returns empty array when nothing matches', () => {
    const result = searchPrompts(prompts, 'nonexistent-xyz');
    expect(result).toEqual([]);
  });

  it('filters by category code and returns only prompts in that category', () => {
    const result = searchPrompts(prompts, '', 'code');
    expect(result.map((p) => p.id)).toEqual(['2', '4']);
  });

  it('combines text search with category filter', () => {
    const result = searchPrompts(prompts, 'review', 'writing');
    expect(result.map((p) => p.id)).toEqual(['3']);
  });

  it('does not filter when categoryId is undefined (All)', () => {
    const result = searchPrompts(prompts, '', undefined);
    expect(result.map((p) => p.id)).toEqual(['2', '3', '1', '4']);
  });
});
