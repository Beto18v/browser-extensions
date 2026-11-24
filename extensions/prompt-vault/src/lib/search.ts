import type { Prompt } from './storage';

function getMatchScore(prompt: Prompt, normalizedQuery: string): number {
  const titleLower = prompt.title.trim().toLowerCase();
  if (titleLower === normalizedQuery) {
    return 4;
  }
  if (titleLower.includes(normalizedQuery)) {
    return 3;
  }
  if (prompt.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))) {
    return 2;
  }
  if (prompt.body.toLowerCase().includes(normalizedQuery)) {
    return 1;
  }
  return 0;
}

/**
 * Filters and ranks prompts locally by query.
 * Empty query returns all prompts sorted by pinned first, then usageCount desc.
 * Non-empty query ranks by: exact title > title substring > tags > body, keeping pinned first.
 */
export function searchPrompts(prompts: Prompt[], query: string): Prompt[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [...prompts].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return b.updatedAt - a.updatedAt;
    });
  }

  const scored: Array<{ prompt: Prompt; score: number }> = [];
  for (const prompt of prompts) {
    const score = getMatchScore(prompt, normalizedQuery);
    if (score > 0) {
      scored.push({ prompt, score });
    }
  }

  scored.sort((a, b) => {
    if (a.prompt.pinned !== b.prompt.pinned) {
      return a.prompt.pinned ? -1 : 1;
    }
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.prompt.usageCount !== a.prompt.usageCount) {
      return b.prompt.usageCount - a.prompt.usageCount;
    }
    return b.prompt.updatedAt - a.prompt.updatedAt;
  });

  return scored.map((entry) => entry.prompt);
}
