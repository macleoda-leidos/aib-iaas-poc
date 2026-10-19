// Markdown rendering for the admin documentation viewer, extracted from
// page.tsx so the security-critical escaping is unit-testable (A5).
//
// The viewer feeds the output of renderMarkdown() straight into
// dangerouslySetInnerHTML, so the escape-then-transform ordering here is the
// whole defence against stored XSS — a fetched document containing
// `<script>` or `<img onerror=...>` must never reach the DOM as live HTML. The
// companion __tests__/markdown.test.ts asserts exactly that.

// Escape the five HTML metacharacters so nothing in the source markdown can be
// interpreted as live HTML. This runs BEFORE any markdown transform: the
// transforms below only ADD a fixed set of safe tags (headings, lists, tables,
// code, links to known hosts), and every scrap of document text they wrap has
// already been neutralised here. Without this, renderMarkdown fed straight into
// dangerouslySetInnerHTML is a stored-XSS sink — a document containing
// `<img src=x onerror=...>` or `<script>` would execute with the admin's
// localStorage bearer token in scope. No DOMPurify dependency is pulled in; the
// escape-then-transform order is the dependency-free equivalent for this
// controlled subset of markdown. (A5 / security hardening.)
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Simple markdown to HTML converter
export function renderMarkdown(md: string): string {
  // Neutralise all HTML first; the transforms re-introduce only safe markup.
  let html = escapeHtml(md)
    // Code blocks (before other processing) — mermaid diagrams
    .replace(/```mermaid\s*\n([\s\S]*?)```/g, (_, diagram) => {
      const cleaned = diagram.trim();
      return `<div class="diagram-wrapper my-4"><pre class="mermaid">${cleaned}</pre></div>`;
    })
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto text-xs"><code>$2</code></pre>')
    // Tables
    .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n)*)/g, (match, header, body) => {
      const headers = header.split('|').filter(Boolean).map((h: string) => `<th class="px-3 py-2 text-left text-xs font-bold border-b">${h.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map((row: string) => {
        const cells = row.split('|').filter(Boolean).map((c: string) => `<td class="px-3 py-2 text-xs border-b">${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table class="w-full border-collapse mb-4 text-sm"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    })
    // Headers
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-bold mt-4 mb-2">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3 pb-2 border-b">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
    // Bold/Italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">$1</code>')
    // Links — relative .md links → GitHub view. Path segments may be separated by
    // slashes because some docs live in subdirectories (e.g. sow-response/01-statement-of-work.md);
    // the first segment stays dot-free so that `../up-a-level.md` falls through to the generic URL rule
    // rather than resolving to a wrong docs/ path.
    .replace(/\[([^\]]+)\]\(\.?\/?([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*\.md)\)/g, '<a href="https://github.com/macleoda-leidos/aib-iaas-poc/blob/main/docs/$2" class="text-blue-700 dark:text-blue-400 underline" target="_blank">$1 ↗</a>')
    // Links — all other URLs
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-700 dark:text-blue-400 underline" target="_blank">$1</a>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$1</li>')
    // Paragraphs
    .replace(/^(?!<[hltpud]|<li|<pre|<div|<table|<thead|<tbody|<tr)(.+)$/gm, '<p class="text-sm mb-2">$1</p>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-4 border-gray-300 dark:border-gray-600">')
    // Blockquotes. The '>' marker is '&gt;' after the HTML-escape above.
    .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-blue-400 pl-4 py-1 italic text-sm text-gray-600 dark:text-gray-400 mb-2">$1</blockquote>');

  return html;
}
