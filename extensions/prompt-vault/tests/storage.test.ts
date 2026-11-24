import { beforeEach, describe, expect, it, vi } from 'vitest';

let store: Record<string, unknown> = {};

vi.mock('wxt/browser', () => ({
  browser: {
    storage: {
      local: {
        get: async (key: string) => ({ [key]: store[key] }),
        set: async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        },
      },
    },
  },
}));

import {
  createPrompt,
  deletePrompt,
  incrementUsage,
  loadPrompts,
  savePrompts,
  STORAGE_PROMPTS_KEY,
  updatePrompt,
} from '../src/lib/storage';

beforeEach(() => {
  store = {};
});

describe('storage', () => {
  it('returns empty array when no prompts exist', async () => {
    const prompts = await loadPrompts();
    expect(prompts).toEqual([]);
  });

  it('creates a prompt with extracted variables and persists it', async () => {
    const created = await createPrompt(
      'Code Review',
      'Review this {{language}} code for {{focus}}.',
      ['code', ' review ']
    );

    expect(created.id).toHaveLength(8);
    expect(created.title).toBe('Code Review');
    expect(created.tags).toEqual(['code', 'review']);
    expect(created.variables).toEqual([{ name: 'language' }, { name: 'focus' }]);
    expect(created.usageCount).toBe(0);
    expect(created.pinned).toBe(false);

    const loaded = await loadPrompts();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe(created.id);
    expect(Array.isArray(store[STORAGE_PROMPTS_KEY])).toBe(true);
  });

  it('updates an existing prompt and recomputes variables when body changes', async () => {
    const created = await createPrompt('Draft', 'Hello {{name}}', ['greeting']);
    const updated = await updatePrompt(created.id, {
      title: 'Updated Draft',
      body: 'Hello {{firstName}} {{lastName}}',
      pinned: true,
    });

    expect(updated.title).toBe('Updated Draft');
    expect(updated.pinned).toBe(true);
    expect(updated.variables).toEqual([{ name: 'firstName' }, { name: 'lastName' }]);

    const loaded = await loadPrompts();
    expect(loaded[0]?.pinned).toBe(true);
  });

  it('throws when updating a non-existent prompt', async () => {
    await expect(updatePrompt('missing1', { title: 'Nope' })).rejects.toThrow(
      'Prompt not found: missing1'
    );
  });

  it('deletes a prompt by id', async () => {
    const first = await createPrompt('First', 'Body 1', []);
    const second = await createPrompt('Second', 'Body 2', []);

    await deletePrompt(first.id);
    const loaded = await loadPrompts();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe(second.id);
  });

  it('increments usageCount for a prompt', async () => {
    const created = await createPrompt('Commit', 'Generate commit message', ['git']);
    await incrementUsage(created.id);
    await incrementUsage(created.id);

    const loaded = await loadPrompts();
    expect(loaded[0]?.usageCount).toBe(2);
  });

  it('saves prompts directly via savePrompts', async () => {
    const created = await createPrompt('One', 'Body', []);
    await savePrompts([{ ...created, usageCount: 10 }]);

    const loaded = await loadPrompts();
    expect(loaded[0]?.usageCount).toBe(10);
  });
});
