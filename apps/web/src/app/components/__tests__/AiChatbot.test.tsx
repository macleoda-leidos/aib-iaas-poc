import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MAP } from '@aib-iaas/statutory';
import AiChatbot from '../AiChatbot';
import { FALLBACK, TOPIC_GENERIC_FOR_TEST } from '../../../lib/chatbotKnowledge';

// jsdom implements no scrolling, and the component scrolls to the newest message
// on every render. Stubbed here rather than in the shared setup file because it
// is this component's requirement, not the suite's.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Open the panel and ask a question, advancing past the reply pause. */
function ask(question: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Ask the AiB Digital Assistant' }));
  fireEvent.change(screen.getByPlaceholderText('Ask about debt solutions...'), {
    target: { value: question },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  act(() => {
    vi.advanceTimersByTime(500);
  });
}

describe('AiChatbot', () => {
  it('does not claim to be powered by AI', () => {
    // The component is a keyword lookup over a fixed table. Labelling it "Powered
    // by AI" overstated what it does on a page offering statutory debt guidance.
    render(<AiChatbot />);
    fireEvent.click(screen.getByRole('button', { name: 'Ask the AiB Digital Assistant' }));

    expect(screen.queryByText(/powered by ai/i)).toBeNull();
    expect(screen.getByText('AiB Digital Assistant')).toBeTruthy();
    expect(screen.getByText(/not financial advice/i)).toBeTruthy();
  });

  it('answers a question and shows the provision behind the figures', () => {
    render(<AiChatbot />);
    ask('Am I eligible for MAP?');

    expect(screen.getByText(/Minimal Asset Process/)).toBeTruthy();
    // The citation is the point of the change: the answer is checkable.
    expect(screen.getByText(MAP.maxDebt.citation)).toBeTruthy();
    expect(screen.getByText(MAP.maxSingleAsset.citation)).toBeTruthy();
  });

  it('answers the topic asked rather than the product mentioned', () => {
    render(<AiChatbot />);
    ask('Will DAS affect my credit score?');

    expect(screen.getByText(TOPIC_GENERIC_FOR_TEST.credit.text)).toBeTruthy();
  });

  it('offers a money adviser when it cannot answer', () => {
    render(<AiChatbot />);
    ask('can you look up my case number');

    expect(screen.getByText(FALLBACK.text)).toBeTruthy();
    expect(screen.getByRole('button', { name: /money adviser/i })).toBeTruthy();
  });

  it('offers a money adviser when it declines to state an unheld figure', () => {
    render(<AiChatbot />);
    ask('How much does a trust deed cost?');

    expect(screen.getByText(TOPIC_GENERIC_FOR_TEST.cost.text)).toBeTruthy();
    expect(screen.getByRole('button', { name: /money adviser/i })).toBeTruthy();
  });

  it('is explicit that the handoff sends nothing', () => {
    // Anything implying a request had been submitted would be a false promise to
    // someone in debt: there is no adviser-request endpoint behind this button.
    render(<AiChatbot />);
    ask('can you look up my case number');
    fireEvent.click(screen.getByRole('button', { name: /money adviser/i }));

    expect(screen.getByText(/nothing is sent from this window/i)).toBeTruthy();
  });

  it('shows no citation list for an answer that quotes no figure', () => {
    render(<AiChatbot />);
    ask('What happens after I apply?');

    expect(screen.getByText(TOPIC_GENERIC_FOR_TEST.process.text)).toBeTruthy();
    expect(screen.queryByText(/Act 2016/)).toBeNull();
  });

  it('ignores an empty message', () => {
    render(<AiChatbot />);
    fireEvent.click(screen.getByRole('button', { name: 'Ask the AiB Digital Assistant' }));
    const send = screen.getByRole('button', { name: 'Send message' });

    expect(send).toHaveProperty('disabled', true);
  });
});
