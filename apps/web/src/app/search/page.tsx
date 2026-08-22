'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Fuse, { FuseResult, FuseResultMatch } from 'fuse.js';
import { applications as applicationsApi, ApplicationSummary } from '../../lib/apiClient';

// Synthetic search results with cross-system variants simulating how the same debtor
// appears differently across BASYS, eDEN, DAS etc. due to typos or deliberate evasion
const SEED_RESULTS = [
  { ref: 'IAAS-2026-00012', name: 'Alistair Morrison', status: 'submitted', debt: 18400, product: 'DAS', date: '28 Jun 2026', ni: 'AB123456C', source: 'BASYS' },
  { ref: 'IAAS-2026-00011', name: 'Brenda Campbell', status: 'under_review', debt: 9200, product: 'MAP', date: '27 Jun 2026', ni: 'CD654321B', source: 'BASYS' },
  { ref: 'IAAS-2026-00010', name: 'Craig Stewart', status: 'additional_info_required', debt: 23100, product: 'PTD', date: '26 Jun 2026', ni: 'EF789012D', source: 'BASYS' },
  { ref: 'IAAS-2026-00009', name: 'Diana Murray', status: 'submitted', debt: 6800, product: 'Sequestration', date: '25 Jun 2026', ni: 'GH345678A', source: 'DAS' },
  { ref: 'IAAS-2026-00008', name: 'Eleanor MacPherson', status: 'approved', debt: 14200, product: 'DAS', date: '20 Jun 2026', ni: 'QQ123456C', source: 'BASYS' },
  { ref: 'IAAS-2026-00007', name: 'Fiona MacDonald', status: 'under_review', debt: 8900, product: 'MAP', date: '18 Jun 2026', ni: 'CD789012E', source: 'eDEN' },
  { ref: 'IAAS-2026-00006', name: 'Craig Henderson', status: 'approved', debt: 28500, product: 'PTD', date: '15 Jun 2026', ni: 'AB654321D', source: 'BASYS' },
  { ref: 'IAAS-2026-00005', name: 'Alistair Robertson', status: 'approved', debt: 19800, product: 'DAS', date: '12 Jun 2026', ni: 'EF345678F', source: 'DAS' },
  { ref: 'IAAS-2026-00004', name: 'Derek Smith', status: 'rejected', debt: 3200, product: 'Signposting', date: '10 Jun 2026', ni: 'GH901234A', source: 'BASYS' },
  { ref: 'IAAS-2026-00003', name: 'Margaret Wilson', status: 'approved', debt: 11500, product: 'DAS', date: '8 Jun 2026', ni: 'IJ567890B', source: 'eDEN' },
  // Cross-system variants — same person, different spelling across systems
  { ref: 'EDEN-2025-04412', name: 'John Smith', status: 'approved', debt: 12300, product: 'DAS', date: '15 Mar 2026', ni: 'KL234567D', source: 'BASYS' },
  { ref: 'DAS-2025-08831', name: 'Jhon Smith', status: 'submitted', debt: 12300, product: 'DAS', date: '22 Apr 2026', ni: 'KL234567D', source: 'eDEN' },
  { ref: 'BASYS-2026-00291', name: 'Jon Smith', status: 'under_review', debt: 11800, product: 'MAP', date: '3 May 2026', ni: 'KL234568D', source: 'DAS' },
  { ref: 'EDEN-2025-07743', name: 'Alister Morison', status: 'approved', debt: 17900, product: 'PTD', date: '1 Feb 2026', ni: 'AB123457C', source: 'eDEN' },
  { ref: 'DAS-2026-01192', name: 'Brendan Campbel', status: 'submitted', debt: 9100, product: 'DAS', date: '14 May 2026', ni: 'CD654322B', source: 'DAS' },
];

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-amber-100 text-amber-800',
  additional_info_required: 'bg-orange-100 text-orange-800',
  recommendation_issued: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-600',
};

const SOURCE_BADGE: Record<string, string> = {
  BASYS: 'bg-indigo-100 text-indigo-700',
  eDEN: 'bg-teal-100 text-teal-700',
  DAS: 'bg-rose-100 text-rose-700',
  RoI: 'bg-cyan-100 text-cyan-700',
};

// Fuse.js configuration for fuzzy matching
const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 2.0 },
    { name: 'ref', weight: 1.5 },
    { name: 'ni', weight: 1.5 },
    { name: 'product', weight: 0.5 },
  ],
  threshold: 0.4,
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
  useExtendedSearch: false,
};

// Confidence badge based on Fuse.js score (0 = perfect, 1 = no match)
function ConfidenceBadge({ score }: { score: number }) {
  const confidence = Math.round((1 - score) * 100);
  let colourClass = '';
  let label = '';

  if (score < 0.05) {
    colourClass = 'bg-green-100 text-green-800 border-green-300';
    label = `${confidence}% — Exact`;
  } else if (score < 0.2) {
    colourClass = 'bg-blue-100 text-blue-800 border-blue-300';
    label = `${confidence}% match`;
  } else if (score < 0.35) {
    colourClass = 'bg-amber-100 text-amber-800 border-amber-300';
    label = `${confidence}% match`;
  } else {
    colourClass = 'bg-gray-100 text-gray-600 border-gray-300';
    label = `${confidence}% match`;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold ${colourClass}`}>
      {label}
    </span>
  );
}

// Highlight matched characters using Fuse.js match indices
function FuseHighlight({ text, indices }: { text: string; indices?: readonly [number, number][] }) {
  if (!indices || indices.length === 0) return <>{text}</>;

  const parts: { text: string; highlight: boolean }[] = [];
  let lastEnd = 0;

  for (const [start, end] of indices) {
    if (start > lastEnd) {
      parts.push({ text: text.slice(lastEnd, start), highlight: false });
    }
    parts.push({ text: text.slice(start, end + 1), highlight: true });
    lastEnd = end + 1;
  }
  if (lastEnd < text.length) {
    parts.push({ text: text.slice(lastEnd), highlight: false });
  }

  return (
    <>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 px-0.5 rounded font-bold">{part.text}</mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

// Get matched field info from Fuse result
function getMatchedFields(matches: readonly FuseResultMatch[] | undefined): string[] {
  if (!matches) return [];
  const fieldNames: Record<string, string> = { name: 'Name', ref: 'Reference', ni: 'NI Number', product: 'Product' };
  return [...new Set(matches.map(m => fieldNames[m.key || ''] || m.key || ''))].filter(Boolean);
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [results, setResults] = useState<FuseResult<typeof SEED_RESULTS[0]>[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);

  // Memoize Fuse instance — only recreated if seed data changes
  const fuse = useMemo(() => new Fuse(SEED_RESULTS, FUSE_OPTIONS), []);

  const search = useCallback(async (term: string) => {
    if (!term.trim() && statusFilter === 'all') {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    // Normalise NI number input (strip spaces/dashes)
    const normalisedTerm = term.replace(/[\s-]/g, '');

    try {
      // Try API first
      const params: any = { pageSize: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (term.trim()) params.referenceNumber = term.trim();
      const response = await applicationsApi.list(params);

      if (response.data && response.data.length > 0) {
        // Map API results into seed format and run fuzzy search on them
        const apiRecords = (response.data || []).map((app: ApplicationSummary) => ({
          ref: app.referenceNumber,
          name: app.summary?.applicantName || 'Unknown',
          status: app.status,
          debt: app.summary?.totalDebt || 0,
          product: 'Pending',
          date: app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          ni: '',
          source: 'IAAS',
        }));
        const apiFuse = new Fuse(apiRecords, FUSE_OPTIONS);
        const apiResults = normalisedTerm ? apiFuse.search(normalisedTerm) : apiRecords.map((item: any, i: number) => ({ item, score: 0, refIndex: i }));
        setResults(apiResults as any);
        setApiOnline(true);
      } else {
        throw new Error('No API results');
      }
    } catch {
      // Fallback to fuzzy search on seed data
      let fuzzyResults = normalisedTerm ? fuse.search(normalisedTerm) : SEED_RESULTS.map((item, i) => ({ item, score: 0, refIndex: i, matches: [] as any }));

      // Apply status filter on top of fuzzy results
      if (statusFilter !== 'all') {
        fuzzyResults = fuzzyResults.filter(r => r.item.status === statusFilter);
      }

      setResults(fuzzyResults);
      setApiOnline(false);
    }

    setLoading(false);
  }, [statusFilter, fuse]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2 || statusFilter !== 'all') {
        search(query);
      } else if (query.length === 0) {
        setResults([]);
        setSearched(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, statusFilter, search]);

  // Find best match indices for a specific field from Fuse result
  function getFieldIndices(matches: readonly FuseResultMatch[] | undefined, key: string): readonly [number, number][] | undefined {
    if (!matches) return undefined;
    const match = matches.find(m => m.key === key);
    return match?.indices;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Search Cases</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-1">Find applications by reference number, applicant name, or National Insurance number.</p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mb-6 flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs font-bold">✨ Fuzzy Matching</span>
        Tolerates typos, transpositions, and partial names — surfaces matches across all systems
      </p>

      {/* Search input */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, reference (IAAS-2026-...), or NI number..."
            className="w-full border-2 border-gray-900 dark:border-gray-600 dark:bg-gray-800 p-3 pr-10 text-base min-h-[48px] focus:outline-2 focus:outline-yellow-400"
            autoFocus
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border-2 border-gray-900 dark:border-gray-600 dark:bg-gray-800 p-3 min-h-[48px]">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="additional_info_required">Awaiting Info</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Status */}
      {loading && <p className="text-sm text-gray-500 animate-pulse mb-4">Searching...</p>}
      {!loading && searched && (
        <p className="text-sm text-gray-500 mb-4">
          {results.length} result{results.length !== 1 ? 's' : ''} found
          {results.length > 0 && <span className="ml-2">— ranked by match confidence</span>}
          {apiOnline && <span className="text-green-600 ml-2">• Live data</span>}
          {!apiOnline && <span className="text-amber-600 ml-2">• Demo data</span>}
        </p>
      )}

      {/* Results */}
      <div className="space-y-3">
        {results.map((r, i) => (
          <a key={i} href={`/case/${r.item.ref}`} className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all no-underline text-inherit">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                    <FuseHighlight text={r.item.ref} indices={getFieldIndices(r.matches, 'ref')} />
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${STATUS_BADGE[r.item.status] || 'bg-gray-100'}`}>
                    {r.item.status.replace(/_/g, ' ')}
                  </span>
                  {r.item.source && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${SOURCE_BADGE[r.item.source] || 'bg-gray-100 text-gray-600'}`}>
                      {r.item.source}
                    </span>
                  )}
                  {typeof r.score === 'number' && <ConfidenceBadge score={r.score} />}
                </div>
                <p className="font-bold text-lg">
                  <FuseHighlight text={r.item.name} indices={getFieldIndices(r.matches, 'name')} />
                </p>
                <div className="flex gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                  {r.item.product && <span>Product: {r.item.product}</span>}
                  {r.item.date && <span>Submitted: {r.item.date}</span>}
                  {r.item.ni && (
                    <span className="font-mono">
                      <FuseHighlight text={r.item.ni} indices={getFieldIndices(r.matches, 'ni')} />
                    </span>
                  )}
                </div>
                {/* Matched fields indicator */}
                {r.matches && r.matches.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {getMatchedFields(r.matches).map(field => (
                      <span key={field} className="text-xs px-1.5 py-0.5 rounded bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700">
                        Matched: {field}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                {r.item.debt > 0 && <p className="font-bold text-lg">£{r.item.debt.toLocaleString()}</p>}
                <p className="text-xs text-gray-400">Total debt</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* No results */}
      {searched && !loading && results.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-bold text-lg mb-2">No cases found</p>
          <p className="text-sm">Try a different search term or adjust your filters.</p>
          <div className="mt-4 text-xs text-gray-400">
            <p>Tip: Fuzzy matching handles typos — try approximate spellings like &quot;Morisson&quot; or &quot;Jhon&quot;</p>
          </div>
        </div>
      )}

      {/* Quick search suggestions (when empty) */}
      {!searched && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-bold text-sm mb-3">Try fuzzy search — type a misspelled name and see it match:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {[
              { term: 'John Smith', hint: 'Finds: John, Jhon, Jon Smith across systems' },
              { term: 'Morisson', hint: 'Finds: Alistair Morrison (extra letter)' },
              { term: 'Campbel', hint: 'Finds: Brenda Campbell (missing letter)' },
              { term: 'MacDonlad', hint: 'Finds: Fiona MacDonald (transposition)' },
              { term: 'AB123465C', hint: 'Finds: AB123456C (digit swap)' },
              { term: 'Eleanro', hint: 'Finds: Eleanor MacPherson (transposition)' },
            ].map(({ term, hint }) => (
              <button key={term} onClick={() => setQuery(term)}
                className="text-left px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
                <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400">{term}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            💡 This demonstrates cross-system identity matching — a debtor may appear with slightly different names
            in BASYS, eDEN, and DAS due to data-entry errors or deliberate evasion. Fuzzy search surfaces all variants.
          </p>
        </div>
      )}
    </div>
  );
}
