'use client';

import { useId } from 'react';

/**
 * The journey's form controls, and the badge for a register check.
 *
 * These lived inside `apply/page.tsx`. They are here because Next.js App Router forbids
 * arbitrary named exports from a route file — `page.tsx` may export only `default`,
 * `metadata` and a fixed set of route config keys, and anything else fails the generated
 * type check with "Property 'Select' is incompatible with index signature". So a component
 * defined in a page cannot be imported by a test. Splitting them out is the fix, and is
 * better structure regardless: the whole point of the change below is that there should be
 * *one* implementation of a labelled field.
 */

/**
 * A labelled text input.
 *
 * This rendered `<label>` with no `htmlFor` and `<input>` with no `id`. Nothing associated
 * the two, so a screen reader announced "edit text, blank" for every field in the citizen
 * journey — name, date of birth, National Insurance number, every address, every creditor
 * and every figure. Errors were plain `<p>` with no `aria-describedby`, `aria-invalid` or
 * `role="alert"`, so someone submitting an invalid form was told nothing at all.
 *
 * That is a WCAG 2.2 AA failure on 1.3.1, 3.3.2 and 4.1.2, and the Public Sector Bodies
 * (Websites and Mobile Applications) Accessibility Regulations 2018 require AA of this
 * service. (GAP-022)
 *
 * `useId()` rather than deriving the id from the label text: two fields legitimately share
 * a label ("Outstanding amount (£)" on each of four creditors), and duplicate ids would
 * associate the last label with every input — a defect that looks fixed and is not.
 *
 * Why this is not `GovInput` from packages/ui-components, which already does all of the
 * above correctly: that component has no `data-demo` support and different Tailwind classes,
 * so swapping it in would change the journey's visual design and silently break the demo
 * script. The two now share a contract; only the styling differs.
 *
 * `demo` puts a data-demo hook on the wrapper so demo mode can scroll to this field. It sits
 * on the wrapper rather than the <input> because the label and hint are the part the audience
 * needs to read.
 */
export function Input({ label, type = 'text', value, onChange, hint, error, demo }: {
  label: string; type?: string; value?: any; onChange: (v: string) => void; hint?: string; error?: string; demo?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className="mb-1" data-demo={demo}>
      <label htmlFor={id} className="block font-bold mb-1 text-sm">{label}</label>
      {hint && <p id={hintId} className="text-xs text-gray-500 mb-1">{hint}</p>}
      {error && (
        // role="alert" so the message is announced when it appears, rather than only being
        // found by someone who goes looking for it.
        <p id={errorId} role="alert" className="text-xs text-red-600 font-bold mb-1">
          <span className="sr-only">Error: </span>⚠ {error}
        </p>
      )}
      <input
        id={id}
        name={id}
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        aria-describedby={[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        className={`border-2 ${error ? 'border-red-500' : 'border-gray-900 dark:border-gray-600'} dark:bg-gray-800 p-2.5 w-full text-base min-h-[44px] focus:outline-2 focus:outline-yellow-400`}
      />
    </div>
  );
}

/**
 * A labelled numeric input with a clamp.
 *
 * Separate from `Input` because that one is typed for string values and passes the raw string
 * through; the dependants field must clamp to 0–20 and coerce, and doing that inside `Input`
 * would mean every text field carried numeric handling it does not want.
 *
 * `parseInt(...) || 0` handles the cleared field: `parseInt('')` is NaN, and NaN reaches the
 * API as null, where the dependants column is NOT NULL. Deleting the contents of a field is
 * an ordinary thing to do mid-edit.
 */
export function NumberInput({ label, value, onChange, min, max, error, hint }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className="mb-1">
      <label htmlFor={id} className="block font-bold mb-1 text-sm">{label}</label>
      {hint && <p id={hintId} className="text-xs text-gray-500 mb-1">{hint}</p>}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 font-bold mb-1">
          <span className="sr-only">Error: </span>⚠ {error}
        </p>
      )}
      <input
        id={id}
        name={id}
        type="number"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={e => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
        aria-describedby={[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        className={`border-2 ${error ? 'border-red-500' : 'border-gray-900 dark:border-gray-600'} dark:bg-gray-800 p-2.5 w-full text-base min-h-[44px] focus:outline-2 focus:outline-yellow-400`}
      />
    </div>
  );
}

/**
 * A labelled select, for the same reason as `Input`.
 *
 * Every `<select>` on the apply page had a sibling `<label>` with no association — the same
 * defect, repeated seven times. Extracted rather than fixed in place so there is one
 * implementation to get right, and so a new dropdown cannot reintroduce it.
 *
 * `options` takes `[value, label]` pairs because several of these derive the value from the
 * label (`'Self-employed'` -> `'self_employed'`), and doing that inline at each call site is
 * how they came to disagree about the transform.
 */
export function Select({ label, value, onChange, options, error, placeholder = 'Select', className = '', demo }: {
  label: string;
  value?: any;
  onChange: (v: string) => void;
  options: Array<[value: string, label: string]>;
  error?: string;
  placeholder?: string;
  className?: string;
  demo?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div data-demo={demo}>
      <label htmlFor={id} className="block font-bold mb-1 text-sm">{label}</label>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 font-bold mb-1">
          <span className="sr-only">Error: </span>⚠ {error}
        </p>
      )}
      <select
        id={id}
        name={id}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className={`border-2 ${error ? 'border-red-500' : 'border-gray-900 dark:border-gray-600'} dark:bg-gray-800 p-2.5 min-h-[44px] w-full ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

/**
 * The badge for one register check.
 *
 * Extracted because the same four-way conditional was written twice — once for the
 * in-progress list and once for the final results — and the two had already drifted. The
 * cases that matter:
 *
 *  - `unavailable` is visually distinct from `clear`, and worded as an absence of an answer
 *    rather than a negative one. Rendering a failed search as "✓ Clear" is what told
 *    applicants they had no existing case when a register was merely unreachable (GAP-023).
 *  - `simulated` marks output from the deliberate offline demo mode, so a real check and a
 *    fabricated one can never be confused for each other.
 *  - An unrecognised status reports "Unknown" rather than falling through to the reassuring
 *    answer, which is how `clear` became the default in the first place.
 */
export function CheckStatusBadge({ status, simulated }: { status?: string; simulated?: boolean }) {
  if (status === 'found') {
    return <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">⚠ Case Found</span>;
  }
  if (status === 'unavailable') {
    return (
      <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold" title="This register could not be reached, so it was not searched.">
        ⚠ Not checked
      </span>
    );
  }
  if (status === 'error') {
    return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">⚠ Error</span>;
  }
  if (status === 'clear') {
    return (
      <span className={`text-xs px-2 py-0.5 rounded font-bold ${simulated ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
        {simulated ? '✓ Clear (simulated)' : '✓ Clear'}
      </span>
    );
  }
  return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">Unknown</span>;
}

/**
 * Try once, wait, try again — then give up and let the caller report it.
 *
 * Deliberately one retry rather than a backoff loop. The failure this covers is a single cold
 * start (Render's free plan spins an idle container down after 15 minutes); anything that
 * survives a second attempt is a real outage, and retrying harder just makes the applicant
 * wait longer before being told so.
 */
export async function withOneRetry<T>(attempt: () => Promise<T>, pauseMs = 1500): Promise<T> {
  try {
    return await attempt();
  } catch {
    await new Promise(r => setTimeout(r, pauseMs));
    return attempt();
  }
}

/** Product ids as they are shown to an applicant. */
export const PRODUCT_LABELS: Record<string, string> = {
  debt_arrangement_scheme: 'Debt Arrangement Scheme (DAS)',
  minimal_asset_process: 'Minimal Asset Process (MAP)',
  protected_trust_deed: 'Protected Trust Deed',
  bankruptcy: 'Bankruptcy / Sequestration',
  moratorium: 'Moratorium (Breathing Space)',
  debt_payment_programme: 'Debt Payment Programme (DPP)',
  signposting_advice: 'Signposting to Money Advice',
};
