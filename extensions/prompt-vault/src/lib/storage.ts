import { browser } from 'wxt/browser';
import { extractVariables, type PromptVariable } from './variables';

export type { PromptVariable };

export const STORAGE_PROMPTS_KEY = 'pv_prompts_v1';
export const STORAGE_SETTINGS_KEY = 'pv_settings_v1';

export interface Prompt {
  id: string;
  title: string;
  body: string;
  tags: string[];
  variables: PromptVariable[];
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  pinned: boolean;
}

export interface Settings {
  locale: 'es' | 'en';
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10).padEnd(8, '0');
}

/**
 * Loads all saved prompts from chrome.storage.local.
 */
export async function loadPrompts(): Promise<Prompt[]> {
  const result = await browser.storage.local.get(STORAGE_PROMPTS_KEY);
  const raw = result[STORAGE_PROMPTS_KEY];
  return Array.isArray(raw) ? (raw as Prompt[]) : [];
}

/**
 * Persists the full prompt list to chrome.storage.local.
 */
export async function savePrompts(prompts: Prompt[]): Promise<void> {
  await browser.storage.local.set({ [STORAGE_PROMPTS_KEY]: prompts });
}

/**
 * Creates a new prompt, extracts its variables, and saves it to storage.
 */
export async function createPrompt(
  title: string,
  body: string,
  tags: string[] = []
): Promise<Prompt> {
  const prompts = await loadPrompts();
  const now = Date.now();
  const normalizedTags = tags.map((t) => t.trim()).filter(Boolean);

  const prompt: Prompt = {
    id: generateId(),
    title: title.trim(),
    body,
    tags: normalizedTags,
    variables: extractVariables(body),
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
    pinned: false,
  };

  prompts.push(prompt);
  await savePrompts(prompts);
  return prompt;
}

/**
 * Updates an existing prompt by id and persists the change.
 */
export async function updatePrompt(
  id: string,
  partial: Partial<Omit<Prompt, 'id' | 'createdAt'>>
): Promise<Prompt> {
  const prompts = await loadPrompts();
  const index = prompts.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`Prompt not found: ${id}`);
  }

  const existing = prompts[index];
  if (!existing) {
    throw new Error(`Prompt not found: ${id}`);
  }
  const nextBody = partial.body !== undefined ? partial.body : existing.body;
  const nextTags =
    partial.tags !== undefined
      ? partial.tags.map((t) => t.trim()).filter(Boolean)
      : existing.tags;

  const updated: Prompt = {
    ...existing,
    ...partial,
    title: partial.title !== undefined ? partial.title.trim() : existing.title,
    body: nextBody,
    tags: nextTags,
    variables: partial.body !== undefined ? extractVariables(nextBody) : existing.variables,
    updatedAt: Date.now(),
  };

  prompts[index] = updated;
  await savePrompts(prompts);
  return updated;
}

/**
 * Deletes a prompt by id from storage.
 */
export async function deletePrompt(id: string): Promise<void> {
  const prompts = await loadPrompts();
  const filtered = prompts.filter((p) => p.id !== id);
  await savePrompts(filtered);
}

/**
 * Increments the usageCount of a prompt by 1.
 */
export async function incrementUsage(id: string): Promise<void> {
  const prompts = await loadPrompts();
  const index = prompts.findIndex((p) => p.id === id);
  const existing = prompts[index];
  if (!existing) {
    return;
  }

  prompts[index] = {
    ...existing,
    usageCount: existing.usageCount + 1,
  };
  await savePrompts(prompts);
}
