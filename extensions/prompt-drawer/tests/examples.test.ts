import { describe, expect, it } from 'vitest';
import { getExampleTemplates, syncExamplesLocale } from '../src/lib/examples';
import type { Prompt } from '../src/lib/storage';
import { extractVariables } from '../src/lib/variables';

describe('examples locale sync', () => {
  it('translates unmodified example prompts from es to en and back', () => {
    const esFirst = getExampleTemplates('es')[0]!;
    const enFirst = getExampleTemplates('en')[0]!;

    const stored: Prompt[] = [
      {
        id: 'ex000001',
        title: esFirst.title,
        body: esFirst.body,
        tags: esFirst.tags,
        variables: extractVariables(esFirst.body),
        createdAt: 1000,
        updatedAt: 1000,
        usageCount: 3,
        pinned: true,
      },
      {
        id: 'custom01',
        title: 'Mi prompt personalizado',
        body: 'Texto propio {{dato}}',
        tags: ['custom'],
        variables: extractVariables('Texto propio {{dato}}'),
        createdAt: 2000,
        updatedAt: 2000,
        usageCount: 1,
        pinned: false,
      },
    ];

    const toEn = syncExamplesLocale(stored, 'en');
    expect(toEn.changed).toBe(true);
    expect(toEn.prompts[0]?.title).toBe(enFirst.title);
    expect(toEn.prompts[0]?.body).toBe(enFirst.body);
    expect(toEn.prompts[0]?.pinned).toBe(true);
    expect(toEn.prompts[0]?.usageCount).toBe(3);
    expect(toEn.prompts[0]?.variables).toEqual(extractVariables(enFirst.body));
    expect(toEn.prompts[1]?.title).toBe('Mi prompt personalizado');

    const toEs = syncExamplesLocale(toEn.prompts, 'es');
    expect(toEs.changed).toBe(true);
    expect(toEs.prompts[0]?.title).toBe(esFirst.title);
    expect(toEs.prompts[0]?.body).toBe(esFirst.body);
  });
});
