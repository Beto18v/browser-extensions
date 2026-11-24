/**
 * UI State Machine for the MD for AI popup.
 * States: idle, loading, ready, empty, error.
 * Guarantees that the loading indicator is cleanly hidden on every terminal state.
 */

export type UIState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

export interface UIStateElements {
  loadingIndicator: HTMLElement | null;
  emptyState: HTMLElement | null;
  errorBanner: HTMLElement | null;
  errorMessage?: HTMLElement | null;
  btnCopy: HTMLButtonElement | null;
  btnTrim: HTMLButtonElement | null;
  btnRetry?: HTMLButtonElement | null;
  fallbackBanner?: HTMLElement | null;
  previewTextarea?: HTMLTextAreaElement | null;
}

export interface StateTransitionOptions {
  errorMessage?: string;
  isFallback?: boolean;
  hasContent?: boolean;
  canTrim?: boolean;
  allowRetry?: boolean;
}

/**
 * Applies deterministic UI updates for the given state.
 */
export function applyUIState(
  state: UIState,
  elements: UIStateElements,
  options: StateTransitionOptions = {}
): void {
  const {
    loadingIndicator,
    emptyState,
    errorBanner,
    errorMessage,
    btnCopy,
    btnTrim,
    btnRetry,
    fallbackBanner,
    previewTextarea,
  } = elements;

  // In all non-loading states, loading indicator MUST be hidden
  if (loadingIndicator) {
    loadingIndicator.hidden = state !== 'loading';
  }

  switch (state) {
    case 'idle': {
      if (emptyState) emptyState.hidden = true;
      if (errorBanner) errorBanner.hidden = true;
      if (fallbackBanner) fallbackBanner.hidden = true;
      if (btnCopy) btnCopy.disabled = true;
      if (btnTrim) btnTrim.disabled = true;
      if (btnRetry) btnRetry.hidden = true;
      break;
    }

    case 'loading': {
      if (emptyState) emptyState.hidden = true;
      if (errorBanner) errorBanner.hidden = true;
      if (fallbackBanner) fallbackBanner.hidden = true;
      if (btnCopy) btnCopy.disabled = true;
      if (btnTrim) btnTrim.disabled = true;
      if (btnRetry) btnRetry.hidden = true;
      break;
    }

    case 'ready': {
      if (emptyState) emptyState.hidden = true;
      if (errorBanner) errorBanner.hidden = true;
      if (fallbackBanner) fallbackBanner.hidden = !options.isFallback;
      if (btnCopy) btnCopy.disabled = !options.hasContent;
      if (btnTrim) btnTrim.disabled = !options.canTrim;
      if (btnRetry) btnRetry.hidden = true;
      break;
    }

    case 'empty': {
      if (emptyState) emptyState.hidden = false;
      if (errorBanner) errorBanner.hidden = true;
      if (fallbackBanner) fallbackBanner.hidden = true;
      if (btnCopy) btnCopy.disabled = true;
      if (btnTrim) btnTrim.disabled = true;
      if (btnRetry) btnRetry.hidden = true;
      if (previewTextarea) previewTextarea.value = '';
      break;
    }

    case 'error': {
      if (emptyState) emptyState.hidden = true;
      if (fallbackBanner) fallbackBanner.hidden = true;
      if (btnCopy) btnCopy.disabled = true;
      if (btnTrim) btnTrim.disabled = true;

      if (errorBanner) {
        errorBanner.hidden = false;
        if (errorMessage && options.errorMessage) {
          errorMessage.textContent = options.errorMessage;
        } else if (options.errorMessage) {
          errorBanner.textContent = options.errorMessage;
        }
      }
      if (btnRetry) {
        btnRetry.hidden = options.allowRetry === false;
      }
      break;
    }
  }
}
