'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const DOCS = [
  { file: 'executive-summary.md', title: 'Executive Summary', category: 'Strategic' },
  { file: 'business-requirements.md', title: 'Business Requirements', category: 'Strategic' },
  { file: 'bid-positioning.md', title: 'Bid Positioning', category: 'Strategic' },
  { file: 'options-analysis.md', title: 'Options Analysis', category: 'Strategic' },
  { file: 'roadmap.md', title: 'Platform Roadmap', category: 'Strategic' },
  { file: 'BETA_READINESS.md', title: 'Beta Readiness Assessment', category: 'Strategic' },
  { file: 'personas.md', title: 'User Personas', category: 'Functional' },
  { file: 'user-stories.md', title: 'User Stories', category: 'Functional' },
  { file: 'use-cases.md', title: 'Use Cases', category: 'Functional' },
  { file: 'user-journeys.md', title: 'User Journeys', category: 'Functional' },
  { file: 'feature-catalogue.md', title: 'Feature Catalogue', category: 'Functional' },
  { file: 'functionality-breakdown.md', title: 'Functionality Breakdown', category: 'Functional' },
  { file: 'architecture.md', title: 'Solution Architecture', category: 'Technical' },
  { file: 'architecture-decisions.md', title: 'Architecture Decision Records', category: 'Technical' },
  { file: 'integrations.md', title: 'Integration Documentation', category: 'Technical' },
  { file: 'security.md', title: 'Security Architecture', category: 'Technical' },
  { file: 'recommendation-engine.md', title: 'Recommendation Engine', category: 'Technical' },
  { file: 'identity-architecture.md', title: 'Identity Architecture', category: 'Technical' },
  { file: 'api-sdk-guide.md', title: 'API SDK Guide', category: 'Technical' },
  { file: 'testing.md', title: 'Test Documentation', category: 'Operations' },
  { file: 'administration-guide.md', title: 'Administration Guide', category: 'Operations' },
  { file: 'runbook-render.md', title: 'Render Runbook', category: 'Operations' },
  { file: 'disaster-recovery.md', title: 'Disaster Recovery', category: 'Operations' },
  { file: 'code-quality-report.md', title: 'Code Quality Report', category: 'Operations' },
  { file: 'security-scan-report.md', title: 'Security Scan Report', category: 'Operations' },
  { file: 'sprint-delivery-log.md', title: 'Sprint Delivery Log', category: 'Delivery' },
  { file: 'demo-script.md', title: 'Demo Script', category: 'Delivery' },
  { file: 'onboarding-guide.md', title: 'Onboarding Guide', category: 'Delivery' },
  { file: 'cost-model.md', title: 'Cost Model', category: 'Delivery' },
  { file: 'team-scaling-guide.md', title: 'Team Scaling Guide', category: 'Delivery' },
  { file: 'vendor-assessment.md', title: 'Vendor Assessment', category: 'Delivery' },
  { file: 'go-live-checklist.md', title: 'Go-Live Checklist', category: 'Delivery' },
  { file: 'ithc-penetration-test-report.md', title: 'ITHC Pen Test Report', category: 'Compliance' },
  { file: 'wcag-accessibility-audit.md', title: 'WCAG Accessibility Audit', category: 'Compliance' },
  { file: 'gds-service-assessment.md', title: 'GDS Service Assessment', category: 'Compliance' },
  { file: 'authority-to-operate.md', title: 'Authority to Operate', category: 'Compliance' },
];

const CATEGORIES = ['Strategic', 'Functional', 'Technical', 'Operations', 'Delivery', 'Compliance'];

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/macleoda-leidos/aib-iaas-poc/main/docs/';

// Simple markdown to HTML converter
function renderMarkdown(md: string): string {
  let html = md
    // Code blocks (before other processing)
    .replace(/```mermaid\s*\n([\s\S]*?)```/g, (_, diagram) => {
      const cleaned = diagram.trim();
      return `<pre class="mermaid">${cleaned}</pre>`;
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
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-700 dark:text-blue-400 underline" target="_blank">$1</a>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$1</li>')
    // Paragraphs (lines not already wrapped)
    .replace(/^(?!<[hltpud]|<li|<pre|<div|<table|<thead|<tbody|<tr)(.+)$/gm, '<p class="text-sm mb-2">$1</p>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-4 border-gray-300 dark:border-gray-600">')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-blue-400 pl-4 py-1 italic text-sm text-gray-600 dark:text-gray-400 mb-2">$1</blockquote>');

  return html;
}

export default function DevDocumentationPage() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const loadDocument = useCallback(async (filename: string) => {
    if (selectedDoc === filename) {
      setSelectedDoc(null);
      return;
    }
    setSelectedDoc(filename);
    setLoading(true);
    try {
      const res = await fetch(`${GITHUB_RAW_BASE}${filename}`);
      if (res.ok) {
        const md = await res.text();
        setContent(renderMarkdown(md));
      } else {
        setContent('<p class="text-red-500">Failed to load document. It may not exist on the main branch yet.</p>');
      }
    } catch {
      setContent('<p class="text-red-500">Network error — unable to fetch document.</p>');
    }
    setLoading(false);
  }, [selectedDoc]);

  // Load Mermaid.js for diagram rendering
  useEffect(() => {
    if (content.includes('class="mermaid"')) {
      const runMermaid = async () => {
        try {
          const m = (window as any).mermaid;
          if (m) {
            m.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose', suppressErrors: true });
            // Process each diagram individually so one failure doesn't break all
            const elements = document.querySelectorAll('.mermaid:not([data-processed])');
            for (const el of elements) {
              try {
                const { svg } = await m.render(`mermaid-${Math.random().toString(36).slice(2)}`, el.textContent || '');
                el.innerHTML = svg;
                el.setAttribute('data-processed', 'true');
              } catch {
                // Diagram failed — show as formatted code block instead
                el.classList.remove('mermaid');
                el.classList.add('bg-gray-100', 'dark:bg-gray-800', 'p-3', 'rounded', 'text-xs', 'overflow-x-auto');
                el.setAttribute('data-processed', 'true');
              }
            }
          }
        } catch {}
      };

      const existingScript = document.querySelector('script[src*="mermaid"]');
      if (existingScript) {
        runMermaid();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
      script.onload = () => runMermaid();
      document.head.appendChild(script);
    }
  }, [content]);

  const filteredDocs = categoryFilter === 'all' ? DOCS : DOCS.filter(d => d.category === categoryFilter);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">📖 Project Documentation</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{DOCS.length} documents • Click to expand and read inline with rendered Markdown + Mermaid diagrams</p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setCategoryFilter('all')} className={`px-3 py-1 rounded text-xs font-bold ${categoryFilter === 'all' ? 'bg-purple-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>All ({DOCS.length})</button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1 rounded text-xs font-bold ${categoryFilter === cat ? 'bg-purple-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
            {cat} ({DOCS.filter(d => d.category === cat).length})
          </button>
        ))}
      </div>

      {/* Document list */}
      <div className="space-y-2">
        {filteredDocs.map(doc => (
          <div key={doc.file} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button onClick={() => loadDocument(doc.file)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-lg">📄</span>
                <div>
                  <span className="font-bold text-sm">{doc.title}</span>
                  <span className="text-xs text-gray-400 ml-2">{doc.file}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{doc.category}</span>
                <span className="text-gray-400">{selectedDoc === doc.file ? '▼' : '▶'}</span>
              </div>
            </button>

            {selectedDoc === doc.file && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-900 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <p className="text-sm text-gray-500 animate-pulse">Loading document...</p>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
