'use client';

import { useState, useRef, useEffect } from 'react';
import { answer, FALLBACK, SUGGESTED_QUESTIONS } from '../../lib/chatbotKnowledge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  /** Provisions behind any figure in `content`, rendered beneath it. */
  citations?: string[];
  /** Show the money-adviser handoff under this message (US-063 criterion 2). */
  offerAdviser?: boolean;
}

// The demo narration bar is fixed to the bottom of the viewport and was covering
// the launcher, so both the button and the panel sit above whatever height
// DemoMode publishes as --demo-bar-height (0 when no demo is running). The
// z-index has to beat the bar's z-50 too: it is rendered after us in the layout,
// so an equal z-index let it win on paint order.
const LAUNCHER_BOTTOM = 'calc(1.5rem + var(--demo-bar-height, 0px))';
const PANEL_BOTTOM = 'calc(6rem + var(--demo-bar-height, 0px))';

const THINKING_PAUSE_MS = 350;

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // A short fixed pause, not simulated thinking: lookup is synchronous, but a
    // reply appearing in the same frame as the question reads as a glitch rather
    // than an answer. Fixed rather than random so tests can advance timers by a
    // known amount.
    setTimeout(() => {
      const result = answer(text);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: result.text,
        timestamp: new Date(),
        citations: Array.from(new Set(result.citations)),
        // Offered when the assistant either did not understand the question or
        // is declining to state a figure it cannot source — the two cases where
        // a person is more use than this component.
        offerAdviser: result.text === FALLBACK.text || result.unsourced === true,
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, THINKING_PAUSE_MS);
  };

  /**
   * The handoff states plainly that nothing is sent from here. There is no
   * adviser-request endpoint, and an "an adviser will be in touch" confirmation
   * that reached nobody would be the worst possible failure for someone in debt.
   */
  const requestAdviser = () => {
    setMessages(prev => [
      ...prev,
      {
        id: `bot-adviser-${Date.now()}`,
        role: 'assistant',
        content:
          'A money adviser can go through your own circumstances with you, which I cannot do. You can ask for one as part of an application, and advice from an approved provider is free. I cannot pass a message on myself — nothing is sent from this window.',
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ bottom: LAUNCHER_BOTTOM }}
        className="fixed right-6 z-[60] w-14 h-14 rounded-full bg-[#d32205] hover:bg-[#a81b03] text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group print:hidden"
        aria-label="Ask the AiB Digital Assistant"
        title="Ask the AiB Digital Assistant"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl">💬</span>
        )}
        {!isOpen && (
          <span className="absolute -top-8 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ask a question
          </span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{ bottom: PANEL_BOTTOM }}
          className="fixed right-6 z-[60] w-[350px] h-[500px] max-h-[calc(100vh-8rem-var(--demo-bar-height,0px))] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-in] print:hidden"
        >
          {/* Header */}
          <div className="bg-[#d32205] text-white px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-sm">💬</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-white">AiB Digital Assistant</p>
              <p className="text-xs text-red-200">Answers cited to Scottish insolvency legislation</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white" aria-label="Close chat">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-bold mb-1">Hello! I am the AiB Digital Assistant.</p>
                  <p>I can answer questions about Scottish debt solutions, eligibility, the application process, and more. How can I help you today?</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">Suggested questions:</p>
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="block w-full text-left text-sm px-3 py-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%] space-y-1.5">
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#d32205] text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* The provision behind each figure quoted above. This is the
                      difference between an assistant asserting a number and one a
                      caseworker or adviser can check. */}
                  {msg.citations && msg.citations.length > 0 && (
                    <ul className="text-[11px] leading-snug text-gray-500 dark:text-gray-400 pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-0.5">
                      {msg.citations.map((citation) => (
                        <li key={citation}>{citation}</li>
                      ))}
                    </ul>
                  )}

                  {msg.offerAdviser && (
                    <button
                      onClick={requestAdviser}
                      className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                    >
                      Speak to a money adviser instead
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about debt solutions..."
                className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d32205] focus:border-transparent"
                disabled={isTyping}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="bg-[#d32205] text-white rounded-lg px-3 py-2 hover:bg-[#a81b03] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center">
              General guidance only — not financial advice
            </p>
          </div>
        </div>
      )}
    </>
  );
}
