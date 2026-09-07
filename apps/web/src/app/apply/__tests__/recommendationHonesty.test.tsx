import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useState } from 'react';

/**
 * That a debt-solution recommendation is never invented on the client. (GAP-023)
 *
 * The defect. `RecommendationSection`'s `catch` fabricated a complete response —
 * `product: 'debt_arrangement_scheme'`, `confidence: 'high'`, hard-coded reasoning prose,
 * and three factor weights (0.3, 0.25, 0.15) that no engine ever produced — and rendered it
 * identically to a real answer. `console.warn` was the only trace. So an applicant whose
 * figures point to MAP, to sequestration or to signposting was told DAS was their best
 * route, with high confidence, by a system presenting that as a rules-engine output.
 *
 * DAS is not a neutral default. It is a repayment programme, so the fabricated answer
 * specifically told people who cannot afford to repay that they should.
 *
 * The assertion that matters is the negative one: with the engine unreachable, **no product
 * name appears anywhere in the output** and the step is not marked complete. Asserting only
 * that an error is shown would still pass if a product were rendered alongside it.
 *
 * The component is exercised through its real module rather than a stub, so a future change
 * that reintroduces a fallback fails here rather than passing against a mock of the version
 * that does not have one.
 */

const PRODUCT_NAMES = [
  'Debt Arrangement Scheme',
  'DAS',
  'Minimal Asset Process',
  'MAP',
  'Protected Trust Deed',
  'Bankruptcy',
  'Sequestration',
  'Moratorium',
  'Debt Payment Programme',
  'DPP',
];

/** The API client is module-level, so it is mocked per test and the module graph reset. */
const recommendationsGet = vi.fn();

vi.mock('../../../lib/apiClient', async () => {
  const actual = await vi.importActual<any>('../../../lib/apiClient');
  return {
    ...actual,
    recommendations: { get: (...args: any[]) => recommendationsGet(...args) },
  };
});

/**
 * Render the section with a mock `updateField`, for the failure cases.
 *
 * Sufficient there because the assertions are about what `updateField` was *asked* to do and
 * about markup that renders regardless of the parent's state.
 */
async function renderSection(formData: any = {}) {
  const { RecommendationSection } = await import('../RecommendationSection');
  const updateField = vi.fn();
  const result = render(<RecommendationSection formData={formData} updateField={updateField} />);
  return { ...result, updateField };
}

/**
 * Render inside a parent that actually applies `updateField`, for the success cases.
 *
 * The result panel is gated on `formData.recommendation.received`, which the *parent* owns —
 * the section reports upward and re-renders from the prop coming back down. With a `vi.fn()`
 * standing in for the parent, that never happens and the section stays on its initial button
 * for ever, so a success-path test would silently assert against the wrong state.
 *
 * Worth having both harnesses rather than only this one: the failure cases need to observe
 * `received` being set to `false` specifically, which is easier to assert on the mock.
 */
async function renderWithState(initial: any = {}) {
  const { RecommendationSection } = await import('../RecommendationSection');
  const updates: Array<[string, string, any]> = [];

  function Harness() {
    const [formData, setFormData] = useState(initial);
    return (
      <RecommendationSection
        formData={formData}
        updateField={(section: string, field: string, value: any) => {
          updates.push([section, field, value]);
          setFormData((prev: any) => ({ ...prev, [section]: { ...(prev[section] || {}), [field]: value } }));
        }}
      />
    );
  }

  return { ...render(<Harness />), updates };
}

beforeEach(() => {
  recommendationsGet.mockReset();
  // The component waits 2–3s "for demo effect" before calling the API, and retries once
  // after 1.5s. Fake timers keep the suite fast without changing the code under test.
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Click "Get my recommendation" and let every internal delay elapse. */
async function requestRecommendation() {
  fireEvent.click(screen.getByText(/Get my recommendation/));
  // The artificial delay, then the request, then the retry pause, then the retry.
  await vi.advanceTimersByTimeAsync(4000);
  await vi.advanceTimersByTimeAsync(2000);
}

describe('when the engine cannot be reached', () => {
  const financials = {
    income: { wages: 900 },
    expenditure: { rent: 880 },
    debts: { items: [{ outstandingAmount: '12000' }] },
    assets: { noAssets: true },
    personal: { employmentStatus: 'unemployed' },
  };

  it('names no product at all', async () => {
    // The finding, inverted. This applicant — £12,000 of debt, £20 a month spare, no assets —
    // is a MAP case. The old fallback told them DAS.
    recommendationsGet.mockRejectedValue(new Error('Failed to fetch'));
    const { container } = await renderSection(financials);

    await requestRecommendation();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());

    for (const name of PRODUCT_NAMES) {
      expect(container.textContent, `rendered a product name: ${name}`).not.toContain(name);
    }
  });

  it('says plainly that it could not produce one', async () => {
    recommendationsGet.mockRejectedValue(new Error('Failed to fetch'));
    await renderSection(financials);

    await requestRecommendation();

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('could not work out your recommendation');
    });
  });

  it('does not mark the step as received', async () => {
    // If it did, the journey advances past the recommendation without one — which is what
    // made the fabrication load-bearing rather than cosmetic.
    recommendationsGet.mockRejectedValue(new Error('Failed to fetch'));
    const { updateField } = await renderSection(financials);

    await requestRecommendation();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());

    const receivedCalls = updateField.mock.calls.filter(([a, b]) => a === 'recommendation' && b === 'received');
    expect(receivedCalls.length).toBeGreaterThan(0);
    expect(receivedCalls.every(([, , value]) => value === false)).toBe(true);
  });

  it('records no product, confidence or reasoning against the application', async () => {
    // The fallback also wrote nothing to `recommendationResult`, so the *stored* application
    // and the *displayed* recommendation disagreed — a caseworker reviewing the case would
    // see no product while the applicant had been shown one.
    recommendationsGet.mockRejectedValue(new Error('Failed to fetch'));
    const { updateField } = await renderSection(financials);

    await requestRecommendation();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());

    expect(updateField.mock.calls.filter(([section]) => section === 'recommendationResult')).toEqual([]);
  });

  it('offers a retry rather than a dead end', async () => {
    recommendationsGet.mockRejectedValue(new Error('Failed to fetch'));
    await renderSection(financials);

    await requestRecommendation();

    // getByRole, not getByText: the panel's prose also says "Try again" (in a <strong>), so
    // a text query matches two nodes and throws. The button is the thing being asserted.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy());
  });

  it('retries once before giving up, because a cold start is not an outage', async () => {
    // Render's free plan spins the container down after 15 minutes idle, so the first request
    // after a quiet period fails while it wakes. That is the situation the fabricated
    // fallback was really covering for, and one retry is what replaces it.
    recommendationsGet.mockRejectedValue(new Error('Failed to fetch'));
    await renderSection(financials);

    await requestRecommendation();
    await waitFor(() => expect(recommendationsGet).toHaveBeenCalledTimes(2));
  });

  it('succeeds on the retry without ever showing an error', async () => {
    recommendationsGet
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce({
        data: {
          product: 'minimal_asset_process',
          confidence: 'high',
          reasoning: 'Minimal assets and limited ability to pay.',
          factors: [],
        },
      });

    const { container } = await renderWithState(financials);
    await requestRecommendation();

    await waitFor(() => expect(container.textContent).toContain('Minimal Asset Process'));
    expect(screen.queryByText(/could not work out/)).toBeNull();
  });
});

describe('when the engine answers', () => {
  it('renders the product the engine chose, not a default', async () => {
    // The other half of the same property: the displayed product must come from the
    // response. A fallback that happened to agree with the engine would hide a broken call.
    recommendationsGet.mockResolvedValue({
      data: {
        product: 'bankruptcy',
        confidence: 'medium',
        reasoning: 'Debt exceeds the thresholds for simpler solutions.',
        factors: [],
      },
    });

    const { container } = await renderWithState({
      income: { wages: 1400 },
      expenditure: { rent: 1600 },
      debts: { items: [{ outstandingAmount: '40000' }] },
      assets: { noAssets: true },
      personal: { employmentStatus: 'unemployed' },
    });

    await requestRecommendation();

    await waitFor(() => expect(container.textContent).toContain('Bankruptcy'));
    // And specifically not the product the fabrication always chose.
    expect(container.textContent).not.toContain('Debt Arrangement Scheme');
  });

  it('sends the applicant\'s own figures to the engine', async () => {
    // A recommendation computed from the wrong numbers is as wrong as an invented one, and
    // would look entirely legitimate.
    recommendationsGet.mockResolvedValue({
      data: { product: 'debt_payment_programme', confidence: 'high', reasoning: '', factors: [] },
    });

    await renderSection({
      income: { wages: 2000, benefits: 150 },
      expenditure: { rent: 850, councilTax: 145 },
      debts: { items: [{ outstandingAmount: '3000' }, { outstandingAmount: '1500' }] },
      assets: { noAssets: true },
      personal: { employmentStatus: 'employed' },
    });

    await requestRecommendation();

    await waitFor(() => expect(recommendationsGet).toHaveBeenCalled());
    expect(recommendationsGet.mock.calls[0][0]).toMatchObject({
      totalDebt: 4500,
      creditorsCount: 2,
      monthlyIncome: 2150,
      monthlyExpenditure: 995,
      disposableIncome: 1155,
      employmentStatus: 'employed',
    });
  });
});
