'use client';

import { useState, useEffect, useCallback } from 'react';
import { applications as applicationsApi, ApplicationSummary } from '../../lib/apiClient';

// Synthetic search results (fallback when API unavailable)
const SEED_RESULTS = [
  { ref: 'IAAS-2026-00012', name: 'Alistair Morrison', status: 'submitted', debt: 18400, product: 'DAS', date: '28 Jun 2026', ni: 'AB123456C' },
  { ref: 'IAAS-2026-00011', name: 'Brenda Campbell', status: 'under_review', debt: 9200, product: 'MAP', date: '27 Jun 2026', ni: 'CD654321B' },
  { ref: 'IAAS-2026-00010', name: 'Craig Stewart', status: 'additional_info_required', debt: 23100, product: 'PTD', date: '26 Jun 2026', ni: 'EF789012D' },
  { ref: 'IAAS-2026-00009', name: 'Diana Murray', status: 'submitted', debt: 6800, product: 'Sequestration', date: '25 Jun 2026', ni: 'GH345678A' },
  { ref: 'IAAS-2026-00008', name: 'Eleanor MacPherson', status: 'approved', debt: 14200, product: 'DAS', date: '20 Jun 2026', ni: 'QQ123456C' },
  { ref: 'IAAS-2026-00007', name: 'Fiona MacDonald', status: 'under_review', debt: 8900, product: 'MAP', date: '18 Jun 2026', ni: 'CD789012E' },
  { ref: 'IAAS-2026-00006', name: 'Craig Henderson', status: 'approved', debt: 28500, product: 'PTD', date: '15 Jun 2026', ni: 'AB654321D' },
  { ref: 'IAAS-2026-00005', name: 'Alistair Robertson', status: 'approved', debt: 19800, product: 'DAS', date: '12 Jun 2026', ni: 'EF345678F' },
  { ref: 'IAAS-2026-00004', name: 'Derek Smith', status: 'rejected', debt: 3200, product: 'Signposting', date: '10 Jun 2026', ni: 'GH901234A' },
  { ref: 'IAAS-2026-00003', name: 'Margaret Wilson', status: 'approved', debt: 11500, product: 'DAS', date: '8 Jun 2026', ni: 'IJ567890B' },
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

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);

  const search = useCallback(async (term: string) => {
    if (!term.trim() && statusFilter === 'all') {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const params: any = { pageSize: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (term.trim()) params.referenceNumber = term.trim();
      const response = await applicationsApi.list(params);
      const mapped = (response.data || []).map((app: ApplicationSummary) => ({
        ref: app.referenceNumber,
        name: app.summary?.applicantName || 'Unknown',
        status: app.status,
        debt: app.summary?.totalDebt || 0,
        product: 'Pending',
        date: app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        id: app.id,
      }));
      setResults(mapped.length > 0 ? mapped : filterSeedResults(term, statusFilter));
      setApiOnline(true);
    } catch {
      setResults(filterSeedResults(term, statusFilter));
      setApiOnline(false);
    }

    setLoading(false);
  }, [statusFilter]);

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

  function filterSeedResults(term: string, status: string) {
    return SEED_RESULTS.filter(r => {
      const matchesTerm = !term ||
        r.name.toLowerCase().includes(term.toLowerCase()) ||
        r.ref.toLowerCase().includes(term.toLowerCase()) ||
        r.ni.toLowerCase().includes(term.toLowerCase().replace(/\s/g, ''));
      const matchesStatus = status === 'all' || r.status === status;
      return matchesTerm && matchesStatus;
    });
  }

  function highlightMatch(text: string, term: string) {
    if (!term) return text;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">{text.slice(idx, idx + term.length)}</mark>
        {text.slice(idx + term.length)}
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Search Cases</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Find applications by reference number, applicant name, or National Insurance number.</p>

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
          {apiOnline && <span className="text-green-600 ml-2">• Live data</span>}
          {!apiOnline && <span className="text-amber-600 ml-2">• Demo data</span>}
        </p>
      )}

      {/* Results */}
      <div className="space-y-3">
        {results.map((r, i) => (
          <a key={i} href={`/case/${r.ref}`} className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all no-underline text-inherit">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{highlightMatch(r.ref, query)}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${STATUS_BADGE[r.status] || 'bg-gray-100'}`}>
                    {r.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="font-bold text-lg">{highlightMatch(r.name, query)}</p>
                <div className="flex gap-4 mt-1 text-sm text-gray-500">
                  {r.product && <span>Product: {r.product}</span>}
                  {r.date && <span>Submitted: {r.date}</span>}
                  {r.ni && <span className="font-mono">{highlightMatch(r.ni, query)}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {r.debt > 0 && <p className="font-bold text-lg">£{r.debt.toLocaleString()}</p>}
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
            <p>Tip: Search by partial name (e.g. "Morrison"), reference (e.g. "00012"), or NI number</p>
          </div>
        </div>
      )}

      {/* Quick search suggestions (when empty) */}
      {!searched && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-bold text-sm mb-3">Quick searches:</h3>
          <div className="flex flex-wrap gap-2">
            {['Morrison', 'IAAS-2026-00012', 'Campbell', 'AB123456C', 'MacDonald'].map(term => (
              <button key={term} onClick={() => setQuery(term)}
                className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm hover:border-blue-400 hover:bg-blue-50">
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
