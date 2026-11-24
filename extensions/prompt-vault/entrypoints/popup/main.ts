import './style.css';
import { browser } from 'wxt/browser';
import {
  detectBrowserLocale,
  getLocale,
  setLocale,
  STORAGE_LOCALE_KEY,
  t,
  type SupportedLocale,
} from '@browser-extensions/shared';
import {
  createCategory,
  createPrompt,
  deleteCategory,
  deletePrompt,
  incrementUsage,
  loadCategories,
  loadPrompts,
  savePrompts,
  STORAGE_THEME_KEY,
  updatePrompt,
  type Category,
  type Prompt,
  type ThemePreference,
} from '../../src/lib/storage';
import { searchPrompts } from '../../src/lib/search';
import {
  findExampleIndex,
  getExampleTemplates,
  syncExamplesLocale,
} from '../../src/lib/examples';
import { extractVariables, hasVariables, resolveVariables } from '../../src/lib/variables';

// DOM Elements
const textAppTitle = document.getElementById('text-app-title') as HTMLSpanElement;
const btnHelp = document.getElementById('btn-help') as HTMLButtonElement;
const btnThemeToggle = document.getElementById('btn-theme-toggle') as HTMLButtonElement;
const iconThemeSun = document.getElementById('icon-theme-sun') as unknown as SVGSVGElement;
const iconThemeMoon = document.getElementById('icon-theme-moon') as unknown as SVGSVGElement;
const btnNew = document.getElementById('btn-new') as HTMLButtonElement;
const btnLangToggle = document.getElementById('btn-lang-toggle') as HTMLButtonElement;
const langCurrent = document.getElementById('lang-current') as HTMLSpanElement;

const helpPanel = document.getElementById('help-panel') as HTMLElement;
const textHelpTitle = document.getElementById('text-help-title') as HTMLHeadingElement;
const textHelpWhat = document.getElementById('text-help-what') as HTMLParagraphElement;
const textHelpVarsTitle = document.getElementById('text-help-vars-title') as HTMLElement;
const textHelpVarsDesc = document.getElementById('text-help-vars-desc') as HTMLParagraphElement;
const textHelpExampleLabel = document.getElementById('text-help-example-label') as HTMLSpanElement;
const textHelpExampleCode = document.getElementById('text-help-example-code') as HTMLElement;
const textHelpUsesTitle = document.getElementById('text-help-uses-title') as HTMLElement;
const textHelpUsesDesc = document.getElementById('text-help-uses-desc') as HTMLParagraphElement;
const textHelpCategoriesTitle = document.getElementById('text-help-categories-title') as HTMLElement;
const textHelpCategoriesDesc = document.getElementById('text-help-categories-desc') as HTMLParagraphElement;
const textHelpKeysTitle = document.getElementById('text-help-keys-title') as HTMLElement;
const textHelpKeysDesc = document.getElementById('text-help-keys-desc') as HTMLParagraphElement;
const btnHelpLoadExamples = document.getElementById('btn-help-load-examples') as HTMLButtonElement;
const btnHelpClose = document.getElementById('btn-help-close') as HTMLButtonElement;

const categoryFilter = document.getElementById('category-filter') as HTMLDivElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const promptList = document.getElementById('prompt-list') as HTMLUListElement;

const emptyState = document.getElementById('empty-state') as HTMLDivElement;
const textEmptyTitle = document.getElementById('text-empty-title') as HTMLParagraphElement;
const textEmptyDesc = document.getElementById('text-empty-desc') as HTMLParagraphElement;
const textEmptyVarsTip = document.getElementById('text-empty-vars-tip') as HTMLSpanElement;
const btnCreateFirst = document.getElementById('btn-create-first') as HTMLButtonElement;
const btnLoadExamples = document.getElementById('btn-load-examples') as HTMLButtonElement;

const noResults = document.getElementById('no-results') as HTMLDivElement;
const textNoResults = document.getElementById('text-no-results') as HTMLParagraphElement;

const editorPanel = document.getElementById('editor-panel') as HTMLDivElement;
const editorTitle = document.getElementById('editor-title') as HTMLHeadingElement;
const labelTitle = document.getElementById('label-title') as HTMLLabelElement;
const inputTitle = document.getElementById('input-title') as HTMLInputElement;
const labelBody = document.getElementById('label-body') as HTMLLabelElement;
const inputBody = document.getElementById('input-body') as HTMLTextAreaElement;
const bodyVariablesHint = document.getElementById('body-variables-hint') as HTMLSpanElement;
const labelTags = document.getElementById('label-tags') as HTMLLabelElement;
const inputTags = document.getElementById('input-tags') as HTMLInputElement;
const labelCategory = document.getElementById('label-category') as HTMLSpanElement;
const editorCategoryOptions = document.getElementById('editor-category-options') as HTMLDivElement;
const categoryEmptyHint = document.getElementById('category-empty-hint') as HTMLSpanElement;
const inputCategoryName = document.getElementById('input-category-name') as HTMLInputElement;
const inputCategoryColor = document.getElementById('input-category-color') as HTMLInputElement;
const btnAddCategory = document.getElementById('btn-add-category') as HTMLButtonElement;
const btnCancelEdit = document.getElementById('btn-cancel-edit') as HTMLButtonElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;

const variablesModal = document.getElementById('variables-modal') as HTMLDivElement;
const textVariablesTitle = document.getElementById('text-variables-title') as HTMLHeadingElement;
const variablesFields = document.getElementById('variables-fields') as HTMLDivElement;
const btnCancelVars = document.getElementById('btn-cancel-vars') as HTMLButtonElement;
const btnConfirmVars = document.getElementById('btn-confirm-vars') as HTMLButtonElement;

const copyToast = document.getElementById('copy-toast') as HTMLDivElement;
const textCopyToast = document.getElementById('text-copy-toast') as HTMLSpanElement;

const btnShortcutSettings = document.getElementById('btn-shortcut-settings') as HTMLButtonElement;
const textShortcutHint = document.getElementById('text-shortcut-hint') as HTMLSpanElement;

// State
let allPrompts: Prompt[] = [];
let allCategories: Category[] = [];
let visiblePrompts: Prompt[] = [];
let activeCategoryId: string | undefined;
let selectedCategoryId: string | undefined;
let focusedIndex = 0;
let editingId: string | null = null;
let pendingVarPrompt: Prompt | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
const deleteTimers = new Map<string, ReturnType<typeof setTimeout>>();

function getEffectiveTheme(): ThemePreference {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') {
    return explicit;
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return 'dark';
}

function updateThemeButtonUI(): void {
  const current = getEffectiveTheme();
  const isDark = current === 'dark';
  iconThemeSun.toggleAttribute('hidden', !isDark);
  iconThemeMoon.toggleAttribute('hidden', isDark);
  const label = isDark ? t('pv_theme_light') : t('pv_theme_dark');
  btnThemeToggle.setAttribute('aria-label', label);
  btnThemeToggle.title = label;
}

function isMacOS(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
  );
}

function applyTranslations(): void {
  const locale = getLocale();
  document.documentElement.lang = locale;
  langCurrent.textContent = locale.toUpperCase();

  textAppTitle.textContent = t('pv_app_name');
  btnHelp.setAttribute('aria-label', t('pv_btn_help'));
  btnHelp.title = t('pv_btn_help');
  btnNew.setAttribute('aria-label', t('pv_btn_new'));
  btnNew.title = t('pv_btn_new');

  textHelpTitle.textContent = t('pv_help_title');
  textHelpWhat.textContent = t('pv_help_what');
  textHelpVarsTitle.textContent = t('pv_help_vars_title');
  textHelpVarsDesc.textContent = t('pv_help_vars_desc');
  textHelpExampleLabel.textContent = t('pv_help_example_label');
  textHelpExampleCode.textContent = t('pv_help_example_code');
  textHelpUsesTitle.textContent = t('pv_help_uses_title');
  textHelpUsesDesc.textContent = t('pv_help_uses_desc');
  textHelpCategoriesTitle.textContent = t('pv_help_categories_title');
  textHelpCategoriesDesc.textContent = t('pv_help_categories_desc');
  textHelpKeysTitle.textContent = t('pv_help_keys_title');
  textHelpKeysDesc.textContent = t('pv_help_keys_desc');
  btnHelpLoadExamples.textContent = t('pv_btn_load_examples');
  btnHelpClose.textContent = t('pv_help_close');

  searchInput.placeholder = t('pv_search_placeholder');
  searchInput.setAttribute('aria-label', t('pv_search_placeholder'));

  textEmptyTitle.textContent = t('pv_empty_title');
  textEmptyDesc.textContent = t('pv_empty_desc');
  textEmptyVarsTip.textContent = t('pv_help_vars_desc');
  btnCreateFirst.textContent = t('pv_btn_create_first');
  btnLoadExamples.textContent = t('pv_btn_load_examples');

  editorTitle.textContent = editingId ? t('pv_editor_edit_title') : t('pv_editor_new_title');
  labelTitle.textContent = t('pv_label_title');
  labelBody.textContent = t('pv_label_body');
  inputBody.placeholder = t('pv_placeholder_body');
  labelTags.textContent = t('pv_label_tags');
  inputTags.placeholder = t('pv_placeholder_tags');
  labelCategory.textContent = t('pv_category_label');
  categoryEmptyHint.textContent = t('pv_category_empty_hint');
  inputCategoryName.placeholder = t('pv_category_name_placeholder');
  btnAddCategory.textContent = t('pv_category_add');
  btnCancelEdit.textContent = t('pv_btn_cancel');
  btnSave.textContent = t('pv_btn_save');

  textVariablesTitle.textContent = t('pv_variables_modal_title');
  btnCancelVars.textContent = t('pv_btn_cancel');
  btnConfirmVars.textContent = t('pv_btn_confirm_vars');
  textCopyToast.textContent = t('pv_btn_copied');

  textShortcutHint.textContent = isMacOS() ? t('pv_shortcut_hint_mac') : t('pv_shortcut_hint');
  renderCategoryFilter();
  renderEditorCategoryOptions();
  updateThemeButtonUI();
  updateBodyVariablesHint();
}

function renderCategoryFilter(): void {
  categoryFilter.innerHTML = '';

  if (allCategories.length === 0 || !helpPanel.hidden || !editorPanel.hidden) {
    categoryFilter.hidden = true;
    return;
  }

  categoryFilter.hidden = false;

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = `category-chip${activeCategoryId === undefined ? ' active' : ''}`;
  allBtn.setAttribute('role', 'tab');
  allBtn.setAttribute('aria-selected', activeCategoryId === undefined ? 'true' : 'false');
  allBtn.textContent = t('pv_filter_all');
  allBtn.addEventListener('click', () => {
    activeCategoryId = undefined;
    focusedIndex = 0;
    renderCategoryFilter();
    renderList();
  });
  categoryFilter.append(allBtn);

  allCategories.forEach((category) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isActive = activeCategoryId === category.id;
    btn.className = `category-chip${isActive ? ' active' : ''}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    if (isActive) {
      btn.style.borderColor = category.color;
    }

    const dot = document.createElement('span');
    dot.className = 'category-dot';
    dot.style.backgroundColor = category.color;
    dot.setAttribute('aria-hidden', 'true');

    const text = document.createTextNode(category.name);
    btn.append(dot, text);
    btn.addEventListener('click', () => {
      activeCategoryId = category.id;
      focusedIndex = 0;
      renderCategoryFilter();
      renderList();
    });
    categoryFilter.append(btn);
  });
}

function renderEditorCategoryOptions(): void {
  editorCategoryOptions.innerHTML = '';
  categoryEmptyHint.hidden = allCategories.length > 0;

  allCategories.forEach((category) => {
    const wrap = document.createElement('div');
    wrap.className = 'category-option-wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    const isSelected = selectedCategoryId === category.id;
    btn.className = `category-option-btn${isSelected ? ' selected' : ''}`;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    if (isSelected) {
      btn.style.borderColor = category.color;
    }

    const dot = document.createElement('span');
    dot.className = 'category-dot';
    dot.style.backgroundColor = category.color;
    dot.setAttribute('aria-hidden', 'true');

    const text = document.createTextNode(category.name);
    btn.append(dot, text);
    btn.addEventListener('click', () => {
      selectedCategoryId = selectedCategoryId === category.id ? undefined : category.id;
      renderEditorCategoryOptions();
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'category-delete-btn';
    delBtn.setAttribute('aria-label', t('pv_category_delete'));
    delBtn.title = t('pv_category_delete');
    delBtn.textContent = 'x';
    delBtn.addEventListener('click', () => {
      void (async () => {
        await deleteCategory(category.id);
        allCategories = allCategories.filter((c) => c.id !== category.id);
        allPrompts = allPrompts.map((p) => {
          if (p.categoryId === category.id) {
            const { categoryId: _removed, ...rest } = p;
            return rest;
          }
          return p;
        });
        if (selectedCategoryId === category.id) {
          selectedCategoryId = undefined;
        }
        if (activeCategoryId === category.id) {
          activeCategoryId = undefined;
        }
        renderEditorCategoryOptions();
      })();
    });

    wrap.append(btn, delBtn);
    editorCategoryOptions.append(wrap);
  });
}

function updateNoResultsText(query: string): void {
  const template = t('pv_no_results', { query: '__QUERY__' });
  const [before = '', after = ''] = template.split('__QUERY__');
  textNoResults.textContent = '';
  textNoResults.append(document.createTextNode(before));
  const span = document.createElement('span');
  span.id = 'search-query-display';
  span.textContent = query;
  textNoResults.append(span);
  if (after) {
    textNoResults.append(document.createTextNode(after));
  }
}

function updateBodyVariablesHint(): void {
  const vars = extractVariables(inputBody.value);
  if (vars.length === 0) {
    bodyVariablesHint.textContent = '';
    return;
  }
  bodyVariablesHint.textContent = t('pv_variables_hint', {
    vars: vars.map((v) => v.name).join(', '),
  });
}

function showToast(message: string): void {
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  textCopyToast.textContent = message;
  copyToast.hidden = false;
  toastTimer = setTimeout(() => {
    copyToast.hidden = true;
    toastTimer = null;
  }, 1500);
}

async function copyTextAndTrack(promptId: string, text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
  await incrementUsage(promptId);
  const target = allPrompts.find((p) => p.id === promptId);
  if (target) {
    target.usageCount += 1;
  }
  showToast(t('pv_btn_copied'));
}

function handleCopyRequest(prompt: Prompt): void {
  if (hasVariables(prompt.body)) {
    openVariablesModal(prompt);
    return;
  }
  void copyTextAndTrack(prompt.id, prompt.body);
}

function openVariablesModal(prompt: Prompt): void {
  pendingVarPrompt = prompt;
  const vars = extractVariables(prompt.body);
  variablesFields.innerHTML = '';

  vars.forEach((variable, idx) => {
    const group = document.createElement('div');
    group.className = 'field-group';

    const label = document.createElement('label');
    const inputId = `var-input-${idx}`;
    label.htmlFor = inputId;
    label.textContent = variable.name;

    const input = document.createElement('input');
    input.id = inputId;
    input.type = 'text';
    input.className = 'text-input var-input';
    input.dataset.varName = variable.name;
    input.autocomplete = 'off';
    if (variable.placeholder) {
      input.placeholder = variable.placeholder;
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmVariablesModal();
      }
    });

    group.append(label, input);
    variablesFields.append(group);
  });

  variablesModal.hidden = false;
  const firstInput = variablesFields.querySelector('input') as HTMLInputElement | null;
  firstInput?.focus();
}

function closeVariablesModal(): void {
  variablesModal.hidden = true;
  pendingVarPrompt = null;
  variablesFields.innerHTML = '';
  searchInput.focus();
}

function confirmVariablesModal(): void {
  if (!pendingVarPrompt) return;
  const values: Record<string, string> = {};
  const inputs = variablesFields.querySelectorAll<HTMLInputElement>('input[data-var-name]');
  inputs.forEach((input) => {
    const name = input.dataset.varName;
    if (name) {
      values[name] = input.value;
    }
  });

  const resolved = resolveVariables(pendingVarPrompt.body, values);
  const promptId = pendingVarPrompt.id;
  closeVariablesModal();
  void copyTextAndTrack(promptId, resolved);
}

function setHelpOpen(open: boolean): void {
  helpPanel.hidden = !open;
  btnHelp.classList.toggle('active', open);
  btnHelp.setAttribute('aria-expanded', open ? 'true' : 'false');

  if (open) {
    editorPanel.hidden = true;
    categoryFilter.hidden = true;
    searchInput.parentElement!.hidden = true;
    promptList.hidden = true;
    emptyState.hidden = true;
    noResults.hidden = true;
    btnHelpClose.focus();
  } else {
    renderCategoryFilter();
    searchInput.parentElement!.hidden = false;
    renderList();
    searchInput.focus();
  }
}

async function loadExampleTemplates(): Promise<void> {
  const examples = getExampleTemplates(getLocale());
  const existingIndices = new Set(
    allPrompts.map((p) => findExampleIndex(p)).filter((idx) => idx !== -1)
  );
  const existingTitles = new Set(allPrompts.map((p) => p.title.trim().toLowerCase()));
  let added = 0;

  for (let i = 0; i < examples.length; i += 1) {
    const example = examples[i];
    if (!example) continue;
    if (!existingIndices.has(i) && !existingTitles.has(example.title.trim().toLowerCase())) {
      const created = await createPrompt(example.title, example.body, example.tags);
      allPrompts.push(created);
      added += 1;
    }
  }

  if (!helpPanel.hidden) {
    setHelpOpen(false);
  } else {
    renderList();
  }

  if (added > 0) {
    showToast(t('pv_examples_loaded'));
  }
}

function openEditor(prompt?: Prompt): void {
  helpPanel.hidden = true;
  btnHelp.classList.remove('active');
  btnHelp.setAttribute('aria-expanded', 'false');

  editingId = prompt ? prompt.id : null;
  selectedCategoryId = prompt ? prompt.categoryId : undefined;
  editorTitle.textContent = editingId ? t('pv_editor_edit_title') : t('pv_editor_new_title');
  inputTitle.value = prompt ? prompt.title : '';
  inputBody.value = prompt ? prompt.body : '';
  inputTags.value = prompt ? prompt.tags.join(', ') : '';
  inputTitle.classList.remove('input-error');
  inputBody.classList.remove('input-error');
  renderEditorCategoryOptions();
  updateBodyVariablesHint();

  promptList.hidden = true;
  emptyState.hidden = true;
  noResults.hidden = true;
  categoryFilter.hidden = true;
  searchInput.parentElement!.hidden = true;
  editorPanel.hidden = false;
  inputTitle.focus();
}

function closeEditor(): void {
  editingId = null;
  selectedCategoryId = undefined;
  editorPanel.hidden = true;
  renderCategoryFilter();
  searchInput.parentElement!.hidden = false;
  renderList();
  searchInput.focus();
}

async function saveEditor(): Promise<void> {
  const title = inputTitle.value.trim();
  const body = inputBody.value.trim();
  inputTitle.classList.toggle('input-error', !title);
  inputBody.classList.toggle('input-error', !body);

  if (!title) {
    inputTitle.focus();
    return;
  }
  if (!body) {
    inputBody.focus();
    return;
  }

  const tags = inputTags.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (editingId) {
    const updated = await updatePrompt(editingId, {
      title,
      body: inputBody.value,
      tags,
      categoryId: selectedCategoryId,
    });
    allPrompts = allPrompts.map((p) => (p.id === updated.id ? updated : p));
  } else {
    const created = await createPrompt(title, inputBody.value, tags, selectedCategoryId);
    allPrompts.push(created);
  }

  closeEditor();
}

function updateFocusedItem(): void {
  const items = promptList.querySelectorAll<HTMLLIElement>('.prompt-item');
  items.forEach((item, idx) => {
    const isFocused = idx === focusedIndex;
    item.classList.toggle('focused', isFocused);
    item.setAttribute('aria-selected', isFocused ? 'true' : 'false');
    if (isFocused) {
      item.scrollIntoView({ block: 'nearest' });
    }
  });
}

function renderList(): void {
  if (!editorPanel.hidden || !helpPanel.hidden) return;

  const query = searchInput.value;
  visiblePrompts = searchPrompts(allPrompts, query, activeCategoryId);
  promptList.innerHTML = '';

  if (allPrompts.length === 0) {
    promptList.hidden = true;
    noResults.hidden = true;
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  if (visiblePrompts.length === 0 && (query.trim().length > 0 || activeCategoryId !== undefined)) {
    promptList.hidden = true;
    const activeCat = allCategories.find((c) => c.id === activeCategoryId);
    const displayLabel = query.trim() || (activeCat ? activeCat.name : '');
    updateNoResultsText(displayLabel);
    noResults.hidden = false;
    return;
  }

  noResults.hidden = true;
  promptList.hidden = false;

  if (focusedIndex >= visiblePrompts.length) {
    focusedIndex = Math.max(0, visiblePrompts.length - 1);
  }

  visiblePrompts.forEach((prompt, idx) => {
    const li = document.createElement('li');
    li.className = `prompt-item${prompt.pinned ? ' pinned' : ''}${idx === focusedIndex ? ' focused' : ''}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', idx === focusedIndex ? 'true' : 'false');
    li.dataset.id = prompt.id;

    const header = document.createElement('div');
    header.className = 'prompt-item-header';

    const category = prompt.categoryId
      ? allCategories.find((c) => c.id === prompt.categoryId)
      : undefined;
    const categoryDot = document.createElement('span');
    categoryDot.className = 'prompt-category-dot';
    categoryDot.setAttribute('aria-hidden', 'true');
    if (category) {
      categoryDot.style.backgroundColor = category.color;
      categoryDot.title = category.name;
    }

    const titleSpan = document.createElement('span');
    titleSpan.className = 'prompt-title';
    titleSpan.textContent = prompt.title;

    const actions = document.createElement('div');
    actions.className = 'prompt-actions';

    const pinBtn = document.createElement('button');
    pinBtn.type = 'button';
    pinBtn.className = `btn-pin${prompt.pinned ? ' active' : ''}`;
    const pinLabel = prompt.pinned ? t('pv_btn_unpin') : t('pv_btn_pin');
    pinBtn.setAttribute('aria-label', pinLabel);
    pinBtn.setAttribute('aria-pressed', prompt.pinned ? 'true' : 'false');
    pinBtn.title = pinLabel;
    pinBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="${
      prompt.pinned ? 'currentColor' : 'none'
    }" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`;
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      void (async () => {
        const updated = await updatePrompt(prompt.id, { pinned: !prompt.pinned });
        allPrompts = allPrompts.map((p) => (p.id === updated.id ? updated : p));
        renderList();
      })();
    });

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-edit';
    editBtn.setAttribute('aria-label', t('pv_btn_edit'));
    editBtn.title = t('pv_btn_edit');
    editBtn.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditor(prompt);
    });

    const trashIconSvg =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-delete';
    deleteBtn.setAttribute('aria-label', t('pv_btn_delete'));
    deleteBtn.title = t('pv_btn_delete');
    deleteBtn.innerHTML = trashIconSvg;
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (deleteBtn.dataset.confirming === 'true') {
        const existingTimer = deleteTimers.get(prompt.id);
        if (existingTimer) {
          clearTimeout(existingTimer);
          deleteTimers.delete(prompt.id);
        }
        void (async () => {
          await deletePrompt(prompt.id);
          allPrompts = allPrompts.filter((p) => p.id !== prompt.id);
          renderList();
        })();
        return;
      }

      deleteBtn.dataset.confirming = 'true';
      deleteBtn.classList.add('confirming');
      deleteBtn.textContent = t('pv_btn_delete_confirm');
      const timer = setTimeout(() => {
        deleteBtn.dataset.confirming = 'false';
        deleteBtn.classList.remove('confirming');
        deleteBtn.innerHTML = trashIconSvg;
        deleteTimers.delete(prompt.id);
      }, 3000);
      deleteTimers.set(prompt.id, timer);
    });

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn-copy-prompt btn-primary';
    copyBtn.setAttribute('aria-label', t('pv_btn_copy'));
    copyBtn.textContent = t('pv_btn_copy');
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleCopyRequest(prompt);
    });

    actions.append(pinBtn, editBtn, deleteBtn, copyBtn);
    header.append(categoryDot, titleSpan, actions);

    const preview = document.createElement('p');
    preview.className = 'prompt-preview';
    const compactBody = prompt.body.replace(/\s+/g, ' ').trim();
    preview.textContent = compactBody.length > 160 ? `${compactBody.slice(0, 160)}...` : compactBody;

    li.append(header, preview);

    if (prompt.tags.length > 0 || prompt.variables.length > 0) {
      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'prompt-tags';
      prompt.variables.forEach((variable) => {
        const badge = document.createElement('span');
        badge.className = 'prompt-var-badge';
        badge.textContent = `{{${variable.name}}}`;
        tagsWrap.append(badge);
      });
      prompt.tags.forEach((tag) => {
        const chip = document.createElement('span');
        chip.className = 'prompt-tag';
        chip.textContent = tag;
        tagsWrap.append(chip);
      });
      li.append(tagsWrap);
    }

    li.addEventListener('click', () => {
      focusedIndex = idx;
      updateFocusedItem();
      handleCopyRequest(prompt);
    });

    promptList.append(li);
  });
}

// Event Listeners
btnHelp.addEventListener('click', () => setHelpOpen(helpPanel.hidden));
btnThemeToggle.addEventListener('click', () => {
  const next: ThemePreference = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  updateThemeButtonUI();
  void browser.storage.local.set({ [STORAGE_THEME_KEY]: next });
});
btnHelpClose.addEventListener('click', () => setHelpOpen(false));
btnHelpLoadExamples.addEventListener('click', () => void loadExampleTemplates());
btnLoadExamples.addEventListener('click', () => void loadExampleTemplates());

btnNew.addEventListener('click', () => openEditor());
btnCreateFirst.addEventListener('click', () => openEditor());
btnCancelEdit.addEventListener('click', () => closeEditor());
btnSave.addEventListener('click', () => void saveEditor());
inputBody.addEventListener('input', updateBodyVariablesHint);

async function addCategoryFromEditor(): Promise<void> {
  const name = inputCategoryName.value.trim();
  if (!name) {
    inputCategoryName.focus();
    return;
  }

  const created = await createCategory(name, inputCategoryColor.value || '#3b82f6');
  allCategories.push(created);
  selectedCategoryId = created.id;
  inputCategoryName.value = '';
  renderEditorCategoryOptions();
}

btnAddCategory.addEventListener('click', () => void addCategoryFromEditor());
inputCategoryName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    void addCategoryFromEditor();
  }
});

btnCancelVars.addEventListener('click', () => closeVariablesModal());
btnConfirmVars.addEventListener('click', () => confirmVariablesModal());

btnLangToggle.addEventListener('click', () => {
  const next: SupportedLocale = getLocale() === 'es' ? 'en' : 'es';
  setLocale(next);
  const synced = syncExamplesLocale(allPrompts, next);
  if (synced.changed) {
    allPrompts = synced.prompts;
    void savePrompts(allPrompts);
  }
  applyTranslations();
  renderList();
  void browser.storage.local.set({ [STORAGE_LOCALE_KEY]: next });
});

btnShortcutSettings.addEventListener('click', () => {
  try {
    void browser.tabs.create({ url: 'chrome://extensions/shortcuts' });
  } catch {
    // Ignore if tabs API is unavailable outside extension context
  }
});

searchInput.addEventListener('input', () => {
  focusedIndex = 0;
  renderList();
});

document.addEventListener('keydown', (e) => {
  if (!variablesModal.hidden) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeVariablesModal();
    }
    return;
  }

  if (!helpPanel.hidden) {
    if (e.key === 'Escape') {
      e.preventDefault();
      setHelpOpen(false);
    }
    return;
  }

  if (!editorPanel.hidden) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeEditor();
    }
    return;
  }

  if (visiblePrompts.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    focusedIndex = (focusedIndex + 1) % visiblePrompts.length;
    updateFocusedItem();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    focusedIndex = (focusedIndex - 1 + visiblePrompts.length) % visiblePrompts.length;
    updateFocusedItem();
  } else if (e.key === 'Enter' && document.activeElement === searchInput) {
    e.preventDefault();
    const selected = visiblePrompts[focusedIndex];
    if (selected) {
      handleCopyRequest(selected);
    }
  }
});

async function init(): Promise<void> {
  const [prompts, categories, storagePrefs] = await Promise.all([
    loadPrompts(),
    loadCategories(),
    browser.storage.local.get([STORAGE_LOCALE_KEY, STORAGE_THEME_KEY]),
  ]);

  const savedTheme = storagePrefs[STORAGE_THEME_KEY];
  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.documentElement.dataset.theme = savedTheme;
  }

  const savedLocale = storagePrefs[STORAGE_LOCALE_KEY];
  const initialLocale: SupportedLocale =
    savedLocale === 'es' || savedLocale === 'en' ? savedLocale : detectBrowserLocale();

  setLocale(initialLocale);
  allCategories = categories;
  const synced = syncExamplesLocale(prompts, initialLocale);
  allPrompts = synced.prompts;
  if (synced.changed) {
    void savePrompts(allPrompts);
  }
  applyTranslations();
  renderList();
  searchInput.focus();
}

void init();
