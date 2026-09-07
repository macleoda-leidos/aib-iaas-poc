import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Input, NumberInput, Select, CheckStatusBadge } from '../fields';

/**
 * That every control in the citizen journey has a programmatically associated label.
 *
 * The defect (GAP-022): the page's `Input` rendered `<label>` with no `htmlFor` and
 * `<input>` with no `id`, and seven `<select>` elements had sibling `<label>`s with no
 * association at all. Nothing tied any of them together, so a screen reader announced
 * "edit text, blank" for the applicant's name, date of birth, National Insurance number,
 * every address, every creditor and every figure. Errors were plain `<p>` with no
 * `aria-describedby`, `aria-invalid` or `role="alert"`, so someone who submitted an invalid
 * form was told nothing. The alias fields had only `placeholder`, which is not an
 * accessible name and vanishes on typing.
 *
 * WCAG 2.2 AA 1.3.1, 3.3.2 and 4.1.2, on the primary journey of a service the Public Sector
 * Bodies (Websites and Mobile Applications) Accessibility Regulations 2018 apply to.
 *
 * `getByLabelText` throughout, deliberately: it resolves through the accessibility tree, so
 * it fails on an unassociated label where `getByText` would pass. That distinction is the
 * whole point — the old markup rendered every label visibly and associated none of them.
 *
 * Assertions use plain DOM properties rather than `@testing-library/jest-dom` matchers
 * (`toHaveAttribute`, `toHaveTextContent`), because that package is not a dependency of this
 * repo and adding one for syntactic sugar is not worth the supply chain.
 */

describe('Input', () => {
  it('associates its label with its input', () => {
    render(<Input label="National Insurance number" value="" onChange={() => {}} />);

    const field = screen.getByLabelText('National Insurance number');
    expect(field.tagName).toBe('INPUT');
  });

  it('gives two fields sharing a label their own ids', () => {
    // Four creditors each have an "Outstanding amount (£)" field. Deriving the id from the
    // label text would produce duplicates, and a duplicate id associates the *last* label
    // with every input — a defect that looks fixed and is not.
    const { container } = render(
      <>
        <Input label="Amount" value="" onChange={() => {}} />
        <Input label="Amount" value="" onChange={() => {}} />
      </>
    );

    const ids = [...container.querySelectorAll('input')].map(i => i.id);
    expect(ids[0]).toBeTruthy();
    expect(ids[0]).not.toBe(ids[1]);
    expect(screen.getAllByLabelText('Amount')).toHaveLength(2);
  });

  it('announces its hint through aria-describedby', () => {
    render(<Input label="Date of birth" hint="YYYY-MM-DD format" value="" onChange={() => {}} />);

    const field = screen.getByLabelText('Date of birth');
    const describedBy = field.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe('YYYY-MM-DD format');
  });

  it('marks an invalid field invalid, and points at the reason', () => {
    render(<Input label="First name" error="First name must be at least 2 characters" value="A" onChange={() => {}} />);

    const field = screen.getByLabelText('First name');
    expect(field.getAttribute('aria-invalid')).toBe('true');

    const describedBy = field.getAttribute('aria-describedby')!;
    expect(document.getElementById(describedBy)?.textContent).toContain('at least 2 characters');
  });

  it('gives the error message role="alert", so it is announced when it appears', () => {
    // Without this a screen reader user submits, focus does not move, and nothing is said —
    // they are left to discover the error by navigating the form again.
    render(<Input label="First name" error="Too short" value="" onChange={() => {}} />);
    expect(screen.getByRole('alert').textContent).toContain('Too short');
  });

  it('prefixes the error with "Error:" for screen readers only', () => {
    // The visible marker is "⚠", which is announced inconsistently and sometimes not at all.
    render(<Input label="First name" error="Too short" value="" onChange={() => {}} />);
    expect(screen.getByRole('alert').textContent).toContain('Error:');
  });

  it('sets neither aria-invalid nor a describedby when there is nothing to report', () => {
    // A field permanently marked invalid is as unhelpful as one never marked.
    render(<Input label="Phone" value="" onChange={() => {}} />);
    const field = screen.getByLabelText('Phone');
    expect(field.hasAttribute('aria-invalid')).toBe(false);
    expect(field.hasAttribute('aria-describedby')).toBe(false);
  });

  it('keeps its data-demo hook on the wrapper', () => {
    // demoSelectors.test.ts enforces these too, but this pins that the accessibility fix did
    // not move them: per CLAUDE.md the wrapper is deliberately the target, because the label
    // and hint are what the demo audience needs to read.
    const { container } = render(<Input label="NI number" demo="field-ni" value="" onChange={() => {}} />);
    expect(container.querySelector('[data-demo="field-ni"]')).not.toBeNull();
  });
});

describe('Select', () => {
  it('associates its label with its select', () => {
    render(<Select label="Marital status" value="" onChange={() => {}} options={[['single', 'Single']]} />);
    expect(screen.getByLabelText('Marital status').tagName).toBe('SELECT');
  });

  it('renders a placeholder option plus every value', () => {
    render(
      <Select
        label="Employment status"
        value=""
        onChange={() => {}}
        options={[['employed', 'Employed'], ['self_employed', 'Self-employed']]}
      />
    );

    const select = screen.getByLabelText('Employment status') as HTMLSelectElement;
    expect([...select.options].map(o => o.value)).toEqual(['', 'employed', 'self_employed']);
    // The value/label split matters: 'Self-employed' must submit as 'self_employed', which
    // is what the API's enum accepts.
    expect([...select.options].map(o => o.textContent)).toEqual(['Select', 'Employed', 'Self-employed']);
  });

  it('marks an invalid select invalid and announces why', () => {
    render(
      <Select label="Type" value="" onChange={() => {}} error="Type is required" options={[['bank', 'Bank']]} />
    );

    const select = screen.getByLabelText('Type');
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('alert').textContent).toContain('Type is required');
  });

  it('gives two selects sharing a label their own ids', () => {
    const { container } = render(
      <>
        <Select label="Type" value="" onChange={() => {}} options={[['a', 'A']]} />
        <Select label="Type" value="" onChange={() => {}} options={[['a', 'A']]} />
      </>
    );
    const ids = [...container.querySelectorAll('select')].map(s => s.id);
    expect(ids[0]).not.toBe(ids[1]);
  });
});

describe('NumberInput', () => {
  it('associates its label, and treats zero as an answer', () => {
    // Zero dependants is a legitimate answer, and a falsy check reads it as missing — the
    // regression tests/integration/dependants-validation.test.ts exists for.
    render(<NumberInput label="Number of dependants" value={0} min={0} max={20} onChange={() => {}} />);

    const field = screen.getByLabelText('Number of dependants') as HTMLInputElement;
    expect(field.value).toBe('0');
  });

  it('clamps an out-of-range entry rather than passing it through', () => {
    // fireEvent.change, not a raw dispatchEvent: React attaches its own value tracker to the
    // node, so setting .value directly and dispatching leaves React seeing the old value and
    // onChange never fires — the test then passes because nothing happened.
    const onChange = vi.fn();
    render(<NumberInput label="Dependants" value={5} min={0} max={20} onChange={onChange} />);
    const field = screen.getByLabelText('Dependants');

    fireEvent.change(field, { target: { value: '99' } });
    expect(onChange).toHaveBeenLastCalledWith(20);

    fireEvent.change(field, { target: { value: '-4' } });
    expect(onChange).toHaveBeenLastCalledWith(0);

    fireEvent.change(field, { target: { value: '3' } });
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it('reads a cleared field as zero, not NaN', () => {
    // parseInt('') is NaN, and NaN reaches the API as null — where the dependants column is
    // NOT NULL. Deleting the contents of the field is an ordinary thing to do mid-edit.
    const onChange = vi.fn();
    render(<NumberInput label="Dependants" value={5} min={0} max={20} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Dependants'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('declares its range in the markup as well', () => {
    // So a browser and assistive technology can both enforce and announce it, rather than
    // the constraint existing only in the handler.
    render(<NumberInput label="Dependants" value={0} min={0} max={20} onChange={() => {}} />);
    const field = screen.getByLabelText('Dependants');
    expect(field.getAttribute('min')).toBe('0');
    expect(field.getAttribute('max')).toBe('20');
  });
});

describe('CheckStatusBadge', () => {
  it('never renders an unreachable register as clear', () => {
    // The GAP-023 assertion in badge form. "✓ Clear" for a check that did not happen told
    // applicants they had no existing case when a register was merely down.
    render(<CheckStatusBadge status="unavailable" />);
    const badge = screen.getByText(/Not checked/);
    expect(badge).toBeTruthy();
    expect(badge.textContent).not.toContain('Clear');
  });

  it('marks simulated output as simulated', () => {
    render(<CheckStatusBadge status="clear" simulated />);
    expect(screen.getByText(/simulated/i)).toBeTruthy();
  });

  it('distinguishes a real clear from a simulated one', () => {
    const real = render(<CheckStatusBadge status="clear" />);
    expect(real.container.textContent).toBe('✓ Clear');
  });

  it('does not claim a result for an unknown status', () => {
    // A status the client has not been taught about must not default to the reassuring
    // answer, which is how `clear` became the fallback in the first place.
    render(<CheckStatusBadge status={undefined} />);
    expect(screen.getByText('Unknown')).toBeTruthy();
  });
});

describe('the page markup itself', () => {
  /**
   * A source-level check, because the component tests above prove the shared components are
   * correct and cannot prove the page *uses* them. Every one of the seven unlabelled selects
   * was hand-written inline; a new one would be too.
   *
   * Crude, and deliberately so — the failure mode is "somebody adds a field in a hurry", and
   * a test that names the line is what makes that visible at the point it happens.
   *
   * All three files: the page's own markup, plus the sibling modules the components moved
   * into. Scanning only `page.tsx` would miss a hand-written control added to either.
   */
  const source = ['page.tsx', 'fields.tsx', 'RecommendationSection.tsx']
    .map(f => readFileSync(join(__dirname, '..', f), 'utf8'))
    .join('\n');

  /**
   * Comments are stripped before scanning.
   *
   * The first version of this counted its own explanatory prose: the comments in these files
   * describe the defect, and quote `<input>` and `<select>` while doing so. A source scan that
   * reads commentary as code fails for reasons that have nothing to do with the markup, which
   * is worse than not having the check — it trains people to ignore it.
   */
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  function inlineControls(tag: string): string[] {
    return code
      .split(/\r?\n/)
      .map((line, i) => ({ line, n: i + 1 }))
      .filter(({ line }) => line.includes(`<${tag}`))
      .map(({ line, n }) => `${n}: ${line.trim().slice(0, 90)}`);
  }

  it('has no hand-written <select> outside the shared Select component', () => {
    // Exactly one: the <select> inside Select itself.
    expect(inlineControls('select')).toHaveLength(1);
  });

  it('has only the accounted-for <input> elements', () => {
    // Input, NumberInput, the "no assets" checkbox (wrapped in a <label>, which is a valid
    // implicit association) and the file input (aria-label, since its visible name is on the
    // button that activates it).
    const inputs = inlineControls('input');
    expect(inputs.length, inputs.join('\n')).toBeLessThanOrEqual(4);
  });

  it('does not reintroduce a fabricated recommendation', () => {
    // GAP-023. The catch block returned a complete response — a product, 'high' confidence,
    // reasoning prose and three invented factor weights — rendered identically to a real
    // one. Pinned by name because a plausible-looking fallback is exactly the thing a future
    // change would add back to make an error go away.
    expect(code).not.toContain("product: 'debt_arrangement_scheme'");
    expect(code).not.toMatch(/weight:\s*0\.3/);
  });

  it('does not reintroduce a fabricated credit score', () => {
    // Two different invented scores existed — 620 on the failure path and 520 in the render
    // fallback — so the system disagreed with itself about a fictional applicant. 620
    // survives once, in the deliberate offline demo branch, which is now labelled simulated.
    expect(code).not.toContain('Score 520');
    expect((code.match(/score: 620/g) ?? []).length).toBe(1);
  });

  it('keeps the offline demo branch labelled as simulated', () => {
    // The branch is a legitimate feature. What made it a defect was being
    // indistinguishable from a real check, so the label is the fix and must not be dropped
    // along with a future tidy-up of the mock data.
    expect(code).toContain('simulated: true');
  });
});
