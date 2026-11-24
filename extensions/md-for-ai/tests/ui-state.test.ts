import { describe, it, expect, beforeEach } from 'vitest';
import { applyUIState, type UIStateElements } from '../src/lib/ui-state';

describe('UI State Machine', () => {
  let elements: UIStateElements;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="loading-indicator"></div>
      <div id="empty-state"></div>
      <div id="fallback-banner"></div>
      <div id="error-banner">
        <span id="error-message"></span>
        <button id="btn-retry"></button>
      </div>
      <textarea id="markdown-preview"></textarea>
      <button id="btn-copy"></button>
      <button id="btn-trim"></button>
    `;

    elements = {
      loadingIndicator: document.getElementById('loading-indicator'),
      emptyState: document.getElementById('empty-state'),
      fallbackBanner: document.getElementById('fallback-banner'),
      errorBanner: document.getElementById('error-banner'),
      errorMessage: document.getElementById('error-message'),
      btnRetry: document.getElementById('btn-retry') as HTMLButtonElement,
      previewTextarea: document.getElementById('markdown-preview') as HTMLTextAreaElement,
      btnCopy: document.getElementById('btn-copy') as HTMLButtonElement,
      btnTrim: document.getElementById('btn-trim') as HTMLButtonElement,
    };
  });

  it('loading state displays spinner and disables action buttons', () => {
    applyUIState('loading', elements);

    expect(elements.loadingIndicator?.hidden).toBe(false);
    expect(elements.emptyState?.hidden).toBe(true);
    expect(elements.errorBanner?.hidden).toBe(true);
    expect(elements.btnCopy?.disabled).toBe(true);
    expect(elements.btnTrim?.disabled).toBe(true);
  });

  it('ready state hides spinner and activates actions when content exists', () => {
    applyUIState('ready', elements, {
      hasContent: true,
      canTrim: true,
      isFallback: false,
    });

    expect(elements.loadingIndicator?.hidden).toBe(true);
    expect(elements.emptyState?.hidden).toBe(true);
    expect(elements.errorBanner?.hidden).toBe(true);
    expect(elements.fallbackBanner?.hidden).toBe(true);
    expect(elements.btnCopy?.disabled).toBe(false);
    expect(elements.btnTrim?.disabled).toBe(false);
  });

  it('ready state displays fallback banner when article mode fell back to full page', () => {
    applyUIState('ready', elements, {
      hasContent: true,
      canTrim: false,
      isFallback: true,
    });

    expect(elements.loadingIndicator?.hidden).toBe(true);
    expect(elements.fallbackBanner?.hidden).toBe(false);
    expect(elements.btnCopy?.disabled).toBe(false);
    expect(elements.btnTrim?.disabled).toBe(true);
  });

  it('empty state hides spinner and shows empty container', () => {
    applyUIState('empty', elements);

    expect(elements.loadingIndicator?.hidden).toBe(true);
    expect(elements.emptyState?.hidden).toBe(false);
    expect(elements.errorBanner?.hidden).toBe(true);
    expect(elements.btnCopy?.disabled).toBe(true);
    expect(elements.btnTrim?.disabled).toBe(true);
    expect(elements.previewTextarea?.value).toBe('');
  });

  it('error state hides spinner, shows error banner and enables retry button', () => {
    applyUIState('error', elements, {
      errorMessage: 'Network timeout',
      allowRetry: true,
    });

    expect(elements.loadingIndicator?.hidden).toBe(true);
    expect(elements.emptyState?.hidden).toBe(true);
    expect(elements.errorBanner?.hidden).toBe(false);
    expect(elements.errorMessage?.textContent).toBe('Network timeout');
    expect(elements.btnRetry?.hidden).toBe(false);
    expect(elements.btnCopy?.disabled).toBe(true);
    expect(elements.btnTrim?.disabled).toBe(true);
  });
});
