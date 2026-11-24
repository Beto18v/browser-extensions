import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { pageToMarkdown } from '../src/lib/page-to-markdown';

function loadFixtureDocument(filename: string, url = 'https://example.com/test-page'): Document {
  const filePath = resolve(__dirname, 'fixtures', filename);
  const html = readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html, { url });
  return dom.window.document;
}

describe('pageToMarkdown', () => {
  it('extracts article content and metadata from article.html', () => {
    const doc = loadFixtureDocument('article.html', 'https://example.com/ai-architectures');
    const md = pageToMarkdown(doc, { mode: 'article', includeMeta: true });

    // Verify metadata frontmatter
    expect(md).toContain('---');
    expect(md).toContain('title: "Understanding Modern AI Architectures"');
    expect(md).toContain('author: "Dr. Elena Vance"');
    expect(md).toContain('source: "https://example.com/ai-architectures"');
    expect(md).toContain('description: "A comprehensive analysis of transformer models and local inference performance."');

    // Verify content headers and text
    expect(md).toContain('## The Rise of Small Local Models');
    expect(md).toContain('> Local-first architectures guarantee privacy');

    // Verify readability stripped boilerplate (nav and aside should not be in the article)
    expect(md).not.toContain('Sponsored Link');
    expect(md).not.toContain('Analytics tracker running');
  });

  it('omits metadata frontmatter when includeMeta is false', () => {
    const doc = loadFixtureDocument('article.html');
    const md = pageToMarkdown(doc, { includeMeta: false });

    expect(md.startsWith('---')).toBe(false);
    expect(md).not.toContain('description:');
    expect(md).toContain('The Rise of Small Local Models');
  });

  it('correctly converts GFM tables and code blocks with languages', () => {
    const doc = loadFixtureDocument('table-code.html');
    const md = pageToMarkdown(doc, { includeMeta: false });

    // Verify GFM Table
    expect(md).toContain('| Model | Quantization | Tokens/sec | VRAM (GB) |');
    expect(md).toContain('| --- | --- | --- | --- |');
    expect(md).toContain('| Llama-3-8B | Q4\\_K\\_M | 84.2 | 5.4 |');
    expect(md).toContain('| Mistral-7B | FP16 | 38.5 | 14.2 |');

    // Verify code block with TypeScript language
    expect(md).toContain('```typescript\ninterface ModelConfig {');
    expect(md).toContain('export function loadModel(config: ModelConfig): boolean {');

    // Verify code block with Python language from class="lang-python"
    expect(md).toContain('```python\ndef generate_response(prompt: str) -> str:');

    // Verify code block with Rust language from data-lang="rust"
    expect(md).toContain('```rust\nfn compute_dot_product(a: &[f32], b: &[f32]) -> f32 {');
  });

  it('strips links when includeLinks is false', () => {
    const doc = loadFixtureDocument('media-links.html');

    const withLinks = pageToMarkdown(doc, { includeLinks: true, includeMeta: false });
    expect(withLinks).toContain('[W3C Official Standards](https://w3.org/standards)');
    expect(withLinks).toContain('MDN Documentation');
    expect(withLinks).toContain('(https://developer.mozilla.org');

    const withoutLinks = pageToMarkdown(doc, { includeLinks: false, includeMeta: false });
    expect(withoutLinks).not.toContain('[W3C Official Standards](');
    expect(withoutLinks).not.toContain('[MDN Documentation](');
    expect(withoutLinks).toContain('W3C Official Standards');
    expect(withoutLinks).toContain('MDN Documentation');
  });

  it('removes images when includeImages is false', () => {
    const doc = loadFixtureDocument('media-links.html');

    const withImages = pageToMarkdown(doc, { includeImages: true, includeMeta: false });
    expect(withImages).toContain('![Architecture Diagram](https://example.com/assets/diagram.png)');

    const withoutImages = pageToMarkdown(doc, { includeImages: false, includeMeta: false });
    expect(withoutImages).not.toContain('![Architecture Diagram]');
    expect(withoutImages).not.toContain('![Interface Screenshot]');
    expect(withoutImages).toContain('Figure 1: High level architecture overview.');
  });

  it('supports mode="full" to convert the entire body', () => {
    const doc = loadFixtureDocument('article.html');
    const md = pageToMarkdown(doc, { mode: 'full', includeMeta: false });

    // Full mode should include elements outside the main article like nav and aside
    expect(md).toContain('Home');
    expect(md).toContain('Archive');
    expect(md).toContain('Sponsored Link');
    // Scripts should still be sanitized
    expect(md).not.toContain('Analytics tracker running');
  });

  it('handles empty and minimal documents gracefully', () => {
    const dom = new JSDOM('<!doctype html><html><head><title>Empty</title></head><body></body></html>');
    const md = pageToMarkdown(dom.window.document, { includeMeta: false });
    expect(md).toBe('');

    const mdWithMeta = pageToMarkdown(dom.window.document, { includeMeta: true });
    expect(mdWithMeta).toContain('title: "Empty"');
  });
});
