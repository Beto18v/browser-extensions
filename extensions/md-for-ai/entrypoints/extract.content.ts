import { pageToMarkdownResult } from '../src/lib/page-to-markdown';
import { estimateTokens } from '../src/lib/token-estimator';

export default defineContentScript({
  matches: ['*://*/*'],
  registration: 'runtime',
  main() {
    // Prevent duplicate listeners if injected multiple times
    if ((window as any).__MDAI_EXTRACT_CONTENT_SCRIPT__) {
      return;
    }
    (window as any).__MDAI_EXTRACT_CONTENT_SCRIPT__ = true;

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || typeof message !== 'object') {
        return;
      }

      // Ping handshake: ensures listener is actively listening
      if (message.type === 'mdai:ping') {
        sendResponse({ status: 'ready' });
        return true;
      }

      if (message.type === 'mdai:extract') {
        try {
          const options = message.options || {};
          let selectedHtml: string | undefined;

          // In selection mode, capture HTML from window.getSelection()
          if (options.mode === 'selection') {
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
              const container = document.createElement('div');
              for (let i = 0; i < selection.rangeCount; i++) {
                container.appendChild(selection.getRangeAt(i).cloneContents());
              }
              selectedHtml = container.innerHTML;
            }
          }

          const result = pageToMarkdownResult(document, {
            mode: options.mode || 'article',
            includeLinks: options.includeLinks ?? true,
            includeImages: options.includeImages ?? true,
            imagesAsAlt: options.imagesAsAlt ?? false,
            includeMeta: options.includeMeta ?? true,
            selectedHtml,
          });

          const tokens = estimateTokens(result.markdown);
          const title = document.title || '';
          const url = window.location.href || '';
          const mode = options.mode || 'article';

          sendResponse({
            markdown: result.markdown,
            title,
            url,
            tokens,
            mode,
            isFallback: result.isFallback,
          });
        } catch (error) {
          sendResponse({
            error: error instanceof Error ? error.message : String(error),
            markdown: '',
            title: document.title || '',
            url: window.location.href || '',
            tokens: 0,
            mode: message.options?.mode || 'article',
            isFallback: false,
          });
        }
        return true;
      }
    });
  },
});
