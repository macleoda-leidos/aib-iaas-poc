'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { applications as applicationsApi, ApplicationSummary } from '../../lib/apiClient';
import { seedApplications } from '../../lib/seedData';
import { scoreMatch, detectField, MATCH_THRESHOLD, MatchField } from '../../lib/nameSimilarity';

interface SearchRecord {
  ref: string;
  name: string;
  status: string;
  debt: number;
  product: string;
  /** Formatted for display. */
  date: string;
  /** Raw ISO, kept because "24 Aug 2026" cannot be sorted lexically. */
  dateISO: string;
  ni: string;
  source: string;
}

interface ScoredResult {
  item: SearchRecord;
  /** null when the user is browsing by filter alone, so nothing was scored. */
  similarity: number | null;
  reason: string;
  field: MatchField;
  highlights: [number, number][];
}

const formatDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const SEED_RESULTS: SearchRecord[] = seedApplications.map(app => ({
  ref: app.ref,
  name: `${app.firstName} ${app.lastName}`,
  status: app.status,
  debt: app.debt,
  product: app.product,
  date: formatDate(app.date),
  dateISO: app.date,
  ni: app.ni,
  source: app.source,
}));

/** The systems the corpus actually holds records from, in the order they appear. */
const SYSTEMS = ['BASYS', 'eDEN', 'DAS', 'IAAS'];

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

// One entry per value of SeedApplication.source. There used to be a RoI colour
// and no IAAS one, so a fifth of the corpus rendered the grey fallback.
const SOURCE_BADGE: Record<string, string> = {
  BASYS: 'bg-indigo-100 text-indigo-700',
  eDEN: 'bg-teal-100 text-teal-700',
  DAS: 'bg-rose-100 text-rose-700',
  IAAS: 'bg-cyan-100 text-cyan-700',
};

// Fuse generates candidates; nameSimilarity decides which of them are the same
// person and why. threshold 0.4 already gives complete recall on this corpus —
// it reaches "Sarah McDonald" from "MacDonlad" and "Elleanor Ross" from
// "Eleanro". Loosening it to 0.5 takes the "Morisson" candidate set from 6 to 35
// without adding a single record the gate then keeps.
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

/**
 * The API is a free Render instance that spins down after fifteen minutes idle,
 * so a cold request can take most of a minute and apiClient sets no timeout. The
 * seed corpus is searched either way, so waiting longer than this buys nothing
 * but a stalled search — and this page is a scripted demo beat.
 */
const API_DEADLINE_MS = 2500;

function withDeadline<T>(promise: Promise<T>): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null),
    new Promise<null>(resolve => setTimeout(() => resolve(null), API_DEADLINE_MS)),
  ]);
}

const FIELD_LABEL: Record<MatchField, string> = {
  name: 'Name',
  ni: 'NI number',
  ref: 'Reference',
};

/**
 * Bands run upwards, unlike the version this replaced: that one took a Fuse
 * score, where 0 is a perfect match, and would colour every row backwards now
 * the number on screen is a similarity.
 */
function ConfidenceBadge({ similarity }: { similarity: number }) {
  const value = similarity % 1 === 0 ? similarity : similarity.toFixed(1);

  let colourClass: string;
  let label: string;
  if (similarity === 100) {
    colourClass = 'bg-green-100 text-green-800 border-green-300';
    label = `${value}% — Exact`;
  } else if (similarity >= 92) {
    colourClass = 'bg-blue-100 text-blue-800 border-blue-300';
    label = `${value}% match`;
  } else if (similarity >= MATCH_THRESHOLD) {
    colourClass = 'bg-amber-100 text-amber-800 border-amber-300';
    label = `${value}% match`;
  } else {
    colourClass = 'bg-gray-100 text-gray-600 border-gray-300';
    label = `${value}% match`;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold ${colourClass}`}>
      {label}
    </span>
  );
}

/**
 * Mark the characters that differ from the query.
 *
 * Indices come from the similarity alignment rather than from Fuse, which
 * returns the whole string ([[0, 9]] for "Jhon Smith") and so highlights
 * nothing useful.
 */
function Highlight({ text, indices }: { text: string; indices?: readonly [number, number][] }) {
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

/** Only the field the query was aimed at carries highlight ranges. */
const indicesFor = (result: ScoredResult, field: MatchField) =>
  result.field === field && result.highlights.length > 0 ? result.highlights : undefined;

const slug = (term: string) => term.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// Row counts and system counts are measured against the 110-record corpus, so
// the hint a client reads is the result they get. See nameSimilarity.test.ts.
const QUICK_SEARCHES = [
  { term: 'John Smith', hint: '4 records across 4 systems — Jhon, Jon, Smyth' },
  { term: 'Morisson', hint: '6 records across 4 systems — Morison, Morrisson, Morrison' },
  { term: 'Campbel', hint: '5 records across 4 systems — Campbel and four Campbells' },
  { term: 'MacDonlad', hint: '6 records across 3 systems — MacDonald, McDonald, MacDonnald' },
  { term: 'SC129837A', hint: '4 records across 4 systems — one NI, three digits transposed' },
  { term: 'Eleanro', hint: '7 records across 3 systems — six Eleanor, one Elleanor' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [fuzzy, setFuzzy] = useState(true);
  const [raw, setRaw] = useState<ScoredResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [corpusSize, setCorpusSize] = useState(SEED_RESULTS.length);

  const search = useCallback(async (term: string) => {
    if (!term.trim() && statusFilter === 'all') {
      setRaw([]);
      setSearched(false);
      // This branch used to return without clearing the flag, leaving the
      // spinner spinning over an empty page.
      setLoading(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    // The gateway reads only page, pageSize, status and assignedTo. Passing the
    // query as an unknown parameter got back "the first 20 applications", which
    // is a non-empty response, so the page reported 0 results against live data
    // whenever the API happened to be warm. Fetch what it will give and match
    // locally instead.
    const response = await withDeadline(applicationsApi.list({ pageSize: 100 }));
    const apiRecords: SearchRecord[] = (response?.data || []).map((app: ApplicationSummary) => ({
      ref: app.referenceNumber,
      name: app.summary?.applicantName || 'Unknown',
      status: app.status,
      debt: app.summary?.totalDebt || 0,
      product: 'Pending',
      date: formatDate(app.createdAt || ''),
      dateISO: app.createdAt || '',
      ni: '',
      source: 'IAAS',
    }));
    setApiOnline(apiRecords.length > 0);

    // One corpus whether or not the API answered. A seed record wins a reference
    // collision because it carries the source system, product and NI number the
    // API summary has no field for.
    const seedRefs = new Set(SEED_RESULTS.map(r => r.ref));
    const corpus = [...SEED_RESULTS, ...apiRecords.filter(r => r.ref && !seedRefs.has(r.ref))];
    setCorpusSize(corpus.length);

    const trimmed = term.trim();
    if (!trimmed) {
      // Browsing by status alone: nothing to score, so no row claims a percentage.
      setRaw(corpus.map(item => ({ item, similarity: null, reason: '', field: 'name' as MatchField, highlights: [] })));
      setLoading(false);
      return;
    }

    // Spaces are noise inside an identifier and meaning inside a name. The old
    // unconditional strip turned "John Smith" into "JohnSmith", which Fuse then
    // scored worse than three unrelated Johnstons.
    const fuseTerm = detectField(trimmed) === 'ni' ? trimmed.replace(/[\s-]/g, '') : trimmed;

    const fuse = new Fuse(corpus, FUSE_OPTIONS);
    setRaw(fuse.search(fuseTerm).map(({ item }) => ({ item, ...scoreMatch(trimmed, item) })));
    setLoading(false);
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2 || statusFilter !== 'all') {
        search(query);
      } else if (query.length === 0) {
        setRaw([]);
        setSearched(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, statusFilter, search]);

  // Filtering, gating and sorting are derived from the stored candidates rather
  // than done inside search(). Both selects used to be applied only on the
  // API-failure path, and neither was in a dependency array, so changing them
  // did nothing at all. Deriving is also what lets the fuzzy switch re-filter
  // without another round trip.
  const filtered = useMemo(
    () =>
      raw.filter(
        r =>
          (statusFilter === 'all' || r.item.status === statusFilter) &&
          (productFilter === 'all' || r.item.product === productFilter)
      ),
    [raw, statusFilter, productFilter]
  );

  /** Rows that fuzzy matching found and turning it off would take away. */
  const nearMatches = useMemo(
    () => filtered.filter(r => r.similarity !== null && r.similarity >= MATCH_THRESHOLD && r.similarity < 100),
    [filtered]
  );

  const results = useMemo(() => {
    // filter() returns a new array, so sorting it in place cannot disturb `raw`.
    const out = filtered.filter(
      r => r.similarity === null || (fuzzy ? r.similarity >= MATCH_THRESHOLD : r.similarity === 100)
    );
    switch (sortBy) {
      case 'debt_high':
        return out.sort((a, b) => b.item.debt - a.item.debt);
      case 'debt_low':
        return out.sort((a, b) => a.item.debt - b.item.debt);
      case 'name_az':
        return out.sort((a, b) => a.item.name.localeCompare(b.item.name));
      case 'date_newest':
        return out.sort((a, b) => b.item.dateISO.localeCompare(a.item.dateISO));
      case 'date_oldest':
        return out.sort((a, b) => a.item.dateISO.localeCompare(b.item.dateISO));
      default:
        return out.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
    }
  }, [filtered, fuzzy, sortBy]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Search Cases</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-1">Find applications by reference number, applicant name, or National Insurance number.</p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mb-4 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs font-bold">✨ Fuzzy Matching</span>
        Scores every candidate for typos, transpositions and spelling variants, and shows why each one differs
      </p>

      {/* Search input */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            data-demo="search-input"
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
        <select value={productFilter} onChange={e => setProductFilter(e.target.value)}
          className="border-2 border-gray-900 dark:border-gray-600 dark:bg-gray-800 p-3 min-h-[48px]">
          <option value="all">All products</option>
          <option value="DAS">DAS</option>
          <option value="MAP">MAP</option>
          <option value="PTD">PTD</option>
          <option value="Sequestration">Sequestration</option>
          <option value="DPP">DPP</option>
          <option value="Signposting">Signposting</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="border-2 border-gray-900 dark:border-gray-600 dark:bg-gray-800 p-3 min-h-[48px]">
          <option value="relevance">Sort: Relevance</option>
          <option value="date_newest">Date (newest)</option>
          <option value="date_oldest">Date (oldest)</option>
          <option value="debt_high">Debt (highest)</option>
          <option value="debt_low">Debt (lowest)</option>
          <option value="name_az">Name (A-Z)</option>
        </select>
      </div>

      {/* Fuzzy matching switch — sits with the search field because it re-filters
          what is already on screen rather than triggering a new search. */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          role="switch"
          aria-checked={fuzzy}
          aria-labelledby="fuzzy-label"
          data-demo="search-fuzzy-toggle"
          onClick={() => setFuzzy(f => !f)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-2 focus:outline-yellow-400 ${
            fuzzy ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              fuzzy ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <label id="fuzzy-label" className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">Fuzzy matching {fuzzy ? 'on' : 'off'}</span>
          <span className="text-gray-500 dark:text-gray-400">
            {fuzzy
              ? ` — showing records scoring ${MATCH_THRESHOLD}% or better`
              : ' — showing exact matches only'}
          </span>
        </label>
      </div>

      {/* Status */}
      {loading && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded flex items-center gap-3">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full flex-shrink-0"></div>
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Searching across {SYSTEMS.length} systems...</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {SYSTEMS.map((sys, i) => (
                <span key={sys} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
                  {sys}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      {!loading && searched && (
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            {results.length} result{results.length !== 1 ? 's' : ''} found
            {results.length > 0 && <span className="ml-2">— ranked by similarity</span>}
            {apiOnline
              ? <span className="text-green-600 ml-2">• {corpusSize} records searched (live API + demo data)</span>
              : <span className="text-amber-600 ml-2">• {corpusSize} records searched (demo data)</span>}
          </p>
          {!fuzzy && nearMatches.length > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
              {nearMatches.length} near match{nearMatches.length !== 1 ? 'es' : ''} scoring {MATCH_THRESHOLD}% or better {nearMatches.length !== 1 ? 'are' : 'is'} hidden while fuzzy matching is off.
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Results from: {SYSTEMS.map((sys, i) => (
              <span key={sys}>{i > 0 && ', '}<span className="font-medium">{sys}</span></span>
            ))}
          </p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-3" data-demo="search-results">
        {results.map(r => (
          <Link key={r.item.ref} href={`/case/${r.item.ref}`} className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all no-underline text-inherit">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                    <Highlight text={r.item.ref} indices={indicesFor(r, 'ref')} />
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${STATUS_BADGE[r.item.status] || 'bg-gray-100'}`}>
                    {r.item.status.replace(/_/g, ' ')}
                  </span>
                  {r.item.source && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${SOURCE_BADGE[r.item.source] || 'bg-gray-100 text-gray-600'}`}>
                      {r.item.source}
                    </span>
                  )}
                  {r.similarity !== null && <ConfidenceBadge similarity={r.similarity} />}
                </div>
                <p className="font-bold text-lg">
                  <Highlight text={r.item.name} indices={indicesFor(r, 'name')} />
                </p>
                <div className="flex gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                  {r.item.product && <span>Product: {r.item.product}</span>}
                  {r.item.date && <span>Submitted: {r.item.date}</span>}
                  {r.item.ni && (
                    <span className="font-mono">
                      <Highlight text={r.item.ni} indices={indicesFor(r, 'ni')} />
                    </span>
                  )}
                </div>
                {/* Why this record was matched, in words — the percentage on its
                    own tells a caseworker nothing they can act on. */}
                {r.similarity !== null && r.reason && (
                  <div className="mt-2 flex gap-1 flex-wrap items-center">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700">
                      Matched: {FIELD_LABEL[r.field]}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{r.reason}</span>
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                {r.item.debt > 0 && <p className="font-bold text-lg">£{r.item.debt.toLocaleString()}</p>}
                <p className="text-xs text-gray-400">Total debt</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* No results. With fuzzy matching off, three of the six quick searches
          have no exact match at all, and a bare "No cases found" would read as a
          broken page rather than the point being made. */}
      {searched && !loading && results.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">🔍</p>
          {!fuzzy && nearMatches.length > 0 ? (
            <>
              <p className="font-bold text-lg mb-2">No exact match</p>
              <p className="text-sm">
                Fuzzy matching is off. {nearMatches.length} record{nearMatches.length !== 1 ? 's' : ''} scoring {MATCH_THRESHOLD}% or better {nearMatches.length !== 1 ? 'are' : 'is'} hidden.
              </p>
              <p className="text-sm mt-1">Turn fuzzy matching back on to see the variants held in other systems.</p>
            </>
          ) : (
            <>
              <p className="font-bold text-lg mb-2">No cases found</p>
              <p className="text-sm">Try a different search term or adjust your filters.</p>
              <div className="mt-4 text-xs text-gray-400">
                <p>Tip: fuzzy matching handles typos — try an approximate spelling like &quot;Morisson&quot; or &quot;Jhon&quot;</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Quick search suggestions (when empty) */}
      {!searched && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-bold text-sm mb-3">Try fuzzy search — click a misspelling to see it match across systems:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {QUICK_SEARCHES.map(({ term, hint }) => (
              <button key={term} onClick={() => setQuery(term)}
                data-demo={`search-tile-${slug(term)}`}
                className="text-left px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
                <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400">{term}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            💡 This demonstrates cross-system identity matching — a debtor may appear with slightly different names
            in BASYS, eDEN, DAS and IAAS through data-entry error or deliberate evasion. Each result is scored, and
            anything at {MATCH_THRESHOLD}% or better is offered as the same person.
          </p>
        </div>
      )}
    </div>
  );
}
