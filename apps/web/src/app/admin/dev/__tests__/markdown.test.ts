import { describe, it, expect } from 'vitest';
import { escapeHtml, renderMarkdown } from '../markdown';

// A5 (security hardening) regression test. The admin documentation viewer feeds
// renderMarkdown() straight into dangerouslySetInnerHTML, so the escape-first
// ordering is the whole defence against stored XSS from a fetched document.
// These tests pin that behaviour: raw HTML in the source must never survive as
// live markup, while the legitimate markdown subset must still render.

describe('escapeHtml', () => {
  it('escapes all five HTML metacharacters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('escapes & first so existing entities are not double-mangled into live markup', () => {
    // The ampersand rule must run before the others, otherwise '<' → '&lt;' would
    // then have its '&' re-escaped. Order is verified by the exact output.
    expect(escapeHtml('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeHtml('Just a normal sentence.')).toBe('Just a normal sentence.');
  });
});

describe('renderMarkdown — XSS neutralisation (A5)', () => {
  it('neutralises a <script> tag so it cannot execute', () => {
    const html = renderMarkdown('# Title\n\n<script>steal(document.cookie)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('neutralises an <img onerror=...> payload', () => {
    const html = renderMarkdown('Hello <img src=x onerror="fetch(`/steal?t=${localStorage.getItem(\'iaas-auth-token\')}`)">');
    // The dangerous tag must be inert — rendered as escaped text, never an element.
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('neutralises an injected event handler / anchor onclick', () => {
    const html = renderMarkdown('<a href="x" onclick="alert(1)">click</a>');
    // No raw anchor with an onclick survives from the source.
    expect(html).not.toMatch(/<a [^>]*onclick=/i);
    expect(html).toContain('&lt;a');
  });

  it('escapes HTML that appears inside a code span rather than letting it through', () => {
    const html = renderMarkdown('Use `<b>bold</b>` carefully');
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(html).not.toContain('<b>bold</b>');
  });
});

describe('renderMarkdown — legitimate markdown still renders', () => {
  it('renders headings', () => {
    expect(renderMarkdown('# Hello')).toContain('<h1');
    expect(renderMarkdown('## Section')).toContain('<h2');
  });

  it('renders bold and inline code', () => {
    const html = renderMarkdown('This is **bold** and `code`.');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code');
  });

  it('renders a quoted line safely — the ">" marker is escaped, never live', () => {
    // Note: the paragraph transform consumes the line before the blockquote rule,
    // so a "> " line renders as a <p> containing the escaped marker rather than a
    // <blockquote>. That is a pre-existing cosmetic quirk; what matters for A5 is
    // that the marker is escaped (&gt;) and the text is preserved, never injected.
    const html = renderMarkdown('> a quoted line');
    expect(html).toContain('&gt; a quoted line');
    expect(html).not.toContain('> a quoted line'); // the raw '>' never survives
  });

  it('renders a safe markdown link as an anchor (the only anchors that should exist)', () => {
    const html = renderMarkdown('See [the docs](https://example.gov.uk).');
    expect(html).toContain('<a href="https://example.gov.uk"');
    expect(html).toContain('>the docs</a>');
  });

  it('renders list items', () => {
    const html = renderMarkdown('- one\n- two');
    expect(html).toContain('<li');
    expect(html).toContain('one');
  });
});
