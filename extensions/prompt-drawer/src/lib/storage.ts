import { browser } from 'wxt/browser';
import { extractVariables, type PromptVariable } from './variables';

export type { PromptVariable };

export const STORAGE_PROMPTS_KEY = 'pv_prompts_v1';
export const STORAGE_SETTINGS_KEY = 'pv_settings_v1';
export const STORAGE_THEME_KEY = 'pv_theme_v1';
export const STORAGE_CATEGORIES_KEY = 'pv_categories_v1';

export type ThemePreference = 'light' | 'dark';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Prompt {
  id: string;
  title: string;
  body: string;
  tags: string[];
  categoryId?: string;
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
  tags: string[] = [],
  categoryId?: string
): Promise<Prompt> {
  const prompts = await loadPrompts();
  const now = Date.now();
  const normalizedTags = tags.map((t) => t.trim()).filter(Boolean);

  const prompt: Prompt = {
    id: generateId(),
    title: title.trim(),
    body,
    tags: normalizedTags,
    ...(categoryId ? { categoryId } : {}),
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

/**
 * Loads all user-created categories from browser.storage.local.
 */
export async function loadCategories(): Promise<Category[]> {
  const result = await browser.storage.local.get(STORAGE_CATEGORIES_KEY);
  const raw = result[STORAGE_CATEGORIES_KEY];
  return Array.isArray(raw) ? (raw as Category[]) : [];
}

/**
 * Persists the category list to browser.storage.local.
 */
export async function saveCategories(categories: Category[]): Promise<void> {
  await browser.storage.local.set({ [STORAGE_CATEGORIES_KEY]: categories });
}

/**
 * Creates a new user category with name and hex color.
 */
export async function createCategory(name: string, color: string): Promise<Category> {
  const categories = await loadCategories();
  const category: Category = {
    id: generateId(),
    name: name.trim(),
    color,
  };
  categories.push(category);
  await saveCategories(categories);
  return category;
}

/**
 * Deletes a category by id and clears categoryId on any prompts that referenced it.
 */
export async function deleteCategory(id: string): Promise<void> {
  const [categories, prompts] = await Promise.all([loadCategories(), loadPrompts()]);
  const nextCategories = categories.filter((c) => c.id !== id);
  await saveCategories(nextCategories);

  let changed = false;
  const nextPrompts = prompts.map((p) => {
    if (p.categoryId === id) {
      changed = true;
      const { categoryId: _removed, ...rest } = p;
      return rest;
    }
    return p;
  });

  if (changed) {
    await savePrompts(nextPrompts);
  }
}
