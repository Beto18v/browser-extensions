/// <reference path="../types/turndown-plugin-gfm.d.ts" />
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import { gfm } from '@joplin/turndown-plugin-gfm';

export type MarkdownExtractionMode = 'article' | 'full' | 'selection';

export interface PageToMarkdownOptions {
  mode?: MarkdownExtractionMode;
  includeLinks?: boolean;
  includeImages?: boolean;
  imagesAsAlt?: boolean;
  selectedHtml?: string;
  includeMeta?: boolean;
}

export interface ExtractedMetadata {
  title?: string;
  author?: string;
  description?: string;
  siteName?: string;
  published?: string;
  source?: string;
}

export interface PageToMarkdownResult {
  markdown: string;
  isFallback: boolean;
}

/**
 * Extracts programming language from a code/pre element.
 * Checks class names (e.g. language-ts, lang-python, highlight-source-js) and data attributes.
 */
function extractCodeLanguage(node: HTMLElement): string {
  const codeNode = node.nodeName === 'CODE' ? node : node.querySelector('code');
  const candidates: Array<HTMLElement | null> = [codeNode, node, node.parentElement];

  for (const el of candidates) {
    if (!el) continue;

    // 1. Data attributes
    const dataLang = el.getAttribute('data-lang') || el.getAttribute('data-language');
    if (dataLang) return dataLang.trim().toLowerCase();

    // 2. Class names
    const className = el.className;
    if (typeof className === 'string') {
      const match = className.match(/(?:language|lang|highlight-source)-([a-zA-Z0-9_+#.-]+)/i);
      if (match && match[1]) return match[1].toLowerCase();
    }
  }

  return '';
}

/**
 * Creates and configures a TurndownService instance with GFM tables,
 * code blocks with languages, and custom link/image filtering.
 */
function createTurndownService(options: Required<Omit<PageToMarkdownOptions, 'mode' | 'includeMeta' | 'selectedHtml'>>): TurndownService {
  const ts = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });

  // Enable GFM (tables, strikethrough, task lists)
  ts.use(gfm);

  // Custom rule for fenced code blocks with detected language
  ts.addRule('fencedCodeBlockWithLanguage', {
    filter(node, opts) {
      return (
        opts.codeBlockStyle === 'fenced' &&
        node.nodeName === 'PRE'
      );
    },
    replacement(_content, node, opts) {
      const el = node as HTMLElement;
      const codeNode = el.querySelector('code');
      const lang = extractCodeLanguage(el);
      const codeText = codeNode ? (codeNode.textContent || '') : (el.textContent || '');
      const fence = opts.fence || '```';
      // Normalize trailing newlines inside code
      const cleanCode = codeText.replace(/\r\n/g, '\n').replace(/\n+$/, '');
      return `\n\n${fence}${lang}\n${cleanCode}\n${fence}\n\n`;
    },
  });

  // Filter links when includeLinks is false
  if (!options.includeLinks) {
    ts.addRule('stripLinks', {
      filter: ['a'],
      replacement(content) {
        return content;
      },
    });
  }

  // Handle images as alt text or completely stripped
  if (options.imagesAsAlt) {
    ts.addRule('imagesAsAlt', {
      filter: ['img'],
      replacement(_content, node) {
        const el = node as HTMLElement;
        const alt = el.getAttribute('alt') || el.getAttribute('title') || '';
        return alt.trim() ? ` [${alt.trim()}] ` : '';
      },
    });
  } else if (!options.includeImages) {
    ts.addRule('stripImages', {
      filter: ['img'],
      replacement() {
        return '';
      },
    });
  }

  return ts;
}

/**
 * Builds YAML frontmatter from metadata if any fields exist.
 */
function buildFrontmatter(meta: ExtractedMetadata): string {
  const lines: string[] = [];

  if (meta.title) {
    lines.push(`title: ${JSON.stringify(meta.title)}`);
  }
  if (meta.author) {
    lines.push(`author: ${JSON.stringify(meta.author)}`);
  }
  if (meta.source) {
    lines.push(`source: ${JSON.stringify(meta.source)}`);
  }
  if (meta.published) {
    lines.push(`published: ${JSON.stringify(meta.published)}`);
  }
  if (meta.siteName) {
    lines.push(`site: ${JSON.stringify(meta.siteName)}`);
  }
  if (meta.description) {
    lines.push(`description: ${JSON.stringify(meta.description)}`);
  }

  if (lines.length === 0) return '';
  return `---\n${lines.join('\n')}\n---\n\n`;
}

/**
 * Extracts metadata from standard meta tags in a Document.
 */
function extractMetaTags(doc: Document): ExtractedMetadata {
  const meta: ExtractedMetadata = {};

  if (doc.title) {
    meta.title = doc.title.trim();
  }

  const url = doc.URL || (doc.location ? doc.location.href : '');
  if (url && url !== 'about:blank') {
    meta.source = url;
  }

  const getMeta = (names: string[]): string | undefined => {
    for (const name of names) {
      const el = doc.querySelector(`meta[name="${name}" i], meta[property="${name}" i]`);
      const val = el?.getAttribute('content')?.trim();
      if (val) return val;
    }
    return undefined;
  };

  meta.author = getMeta(['author', 'article:author', 'og:article:author']);
  meta.description = getMeta(['description', 'og:description', 'twitter:description']);
  meta.siteName = getMeta(['og:site_name', 'application-name']);
  meta.published = getMeta(['article:published_time', 'date', 'pubdate']);

  return meta;
}

/**
 * Cleans non-content elements from a cloned container (scripts, styles, templates).
 */
function sanitizeContainer(element: Element): void {
  const elementsToRemove = element.querySelectorAll('script, style, noscript, template, iframe');
  elementsToRemove.forEach((el) => el.remove());
}

/**
 * Converts a DOM Document to Markdown formatted for LLMs with fallback tracking.
 *
 * @param doc - Browser or JSDOM Document
 * @param options - Configuration options for mode, links, images, and metadata
 * @returns Clean Markdown string and whether fallback was used
 */
export function pageToMarkdownResult(doc: Document, options: PageToMarkdownOptions = {}): PageToMarkdownResult {
  const {
    mode = 'article',
    includeLinks = true,
    includeImages = true,
    imagesAsAlt = false,
    selectedHtml = '',
    includeMeta = true,
  } = options;

  let htmlContent = '';
  let metadata: ExtractedMetadata = extractMetaTags(doc);
  let isFallback = false;

  if (mode === 'article') {
    // Readability mutates the DOM, so clone before parsing
    const clonedDoc = doc.cloneNode(true) as Document;
    try {
      const reader = new Readability(clonedDoc, { keepClasses: true });
      const article = reader.parse();

      if (article && article.content && article.content.trim()) {
        htmlContent = article.content;
        if (article.title) metadata.title = article.title.trim();
        if (article.byline) metadata.author = article.byline.trim();
        if (article.excerpt) metadata.description = article.excerpt.trim();
        if (article.siteName) metadata.siteName = article.siteName.trim();
        if (article.publishedTime) metadata.published = article.publishedTime.trim();
      } else {
        // Fallback to sanitized full body if Readability finds no article
        if (doc.body) {
          const clonedBody = doc.body.cloneNode(true) as HTMLElement;
          sanitizeContainer(clonedBody);
          htmlContent = clonedBody.innerHTML;
        } else {
          htmlContent = '';
        }
        isFallback = true;
      }
    } catch {
      if (doc.body) {
        const clonedBody = doc.body.cloneNode(true) as HTMLElement;
        sanitizeContainer(clonedBody);
        htmlContent = clonedBody.innerHTML;
      } else {
        htmlContent = '';
      }
      isFallback = true;
    }
  } else if (mode === 'selection') {
    let resolvedSelection = selectedHtml.trim();

    if (!resolvedSelection) {
      const win = doc.defaultView;
      const selection = win?.getSelection ? win.getSelection() : null;

      if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
        const container = doc.createElement('div');
        for (let i = 0; i < selection.rangeCount; i++) {
          container.appendChild(selection.getRangeAt(i).cloneContents());
        }
        sanitizeContainer(container);
        resolvedSelection = container.innerHTML;
      }
    }

    if (resolvedSelection) {
      htmlContent = resolvedSelection;
    } else {
      // Fallback to sanitized body if selection is empty
      if (doc.body) {
        const clonedBody = doc.body.cloneNode(true) as HTMLElement;
        sanitizeContainer(clonedBody);
        htmlContent = clonedBody.innerHTML;
      } else {
        htmlContent = '';
      }
      isFallback = true;
    }
  } else {
    // 'full' mode: entire document body cleaned of scripts/styles
    if (doc.body) {
      const clonedBody = doc.body.cloneNode(true) as HTMLElement;
      sanitizeContainer(clonedBody);
      htmlContent = clonedBody.innerHTML;
    }
  }

  // Convert HTML to Markdown with Turndown
  const turndown = createTurndownService({ includeLinks, includeImages, imagesAsAlt });
  const rawMarkdown = turndown.turndown(htmlContent);

  // Clean extra blank lines
  const cleanMarkdown = rawMarkdown.replace(/\n{3,}/g, '\n\n').trim();

  // Prepend metadata frontmatter if enabled
  if (includeMeta) {
    const frontmatter = buildFrontmatter(metadata);
    return {
      markdown: `${frontmatter}${cleanMarkdown}`.trim(),
      isFallback,
    };
  }

  return {
    markdown: cleanMarkdown,
    isFallback,
  };
}

/**
 * Converts a DOM Document to Markdown formatted for LLMs.
 */
export function pageToMarkdown(doc: Document, options: PageToMarkdownOptions = {}): string {
  return pageToMarkdownResult(doc, options).markdown;
}
