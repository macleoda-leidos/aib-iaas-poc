'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const KNOWLEDGE_BASE: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ['das', 'debt arrangement', 'debt arrangement scheme'],
    response: 'The Debt Arrangement Scheme (DAS) is a Scottish Government debt management tool that lets you repay your debts in full over an extended period through a Debt Payment Programme (DPP). While in DAS, interest and charges are frozen, and creditors cannot take enforcement action against you. You keep your assets and there is no entry on the public register. DAS is suitable if you have regular income and can afford affordable monthly payments.',
  },
  {
    keywords: ['map', 'minimal asset', 'minimal asset process'],
    response: 'The Minimal Asset Process (MAP) is a simplified form of bankruptcy for people with low income, few assets, and debts below £25,000. It provides debt relief within approximately 6 months. To be eligible, you generally need: total debts under £25,000, no single debt over £17,000, no land/property ownership, vehicle value under £3,000, and total assets under £2,000. There is no application fee for MAP.',
  },
  {
    keywords: ['ptd', 'trust deed', 'protected trust deed'],
    response: 'A Protected Trust Deed (PTD) is a formal agreement between you and your creditors to repay what you can afford over 4 years. After the trust period, remaining debt is written off. You must have debts of at least £5,000 and be able to make regular contributions. A licensed insolvency practitioner (trustee) manages the arrangement. Your property may be at risk, and PTDs appear on the public register.',
  },
  {
    keywords: ['sequestration', 'bankruptcy', 'bankrupt'],
    response: 'Sequestration is the Scottish legal term for bankruptcy. It typically lasts 4 years during which a trustee manages your finances. After discharge, most debts are written off. You may lose assets including your home. It appears on the public register and can affect certain professions. Sequestration may be appropriate when debts are unmanageable and other solutions are not viable. The application fee is currently £150.',
  },
  {
    keywords: ['eligib', 'qualify', 'am i eligible', 'can i get', 'criteria'],
    response: 'Eligibility depends on your specific circumstances including: total debt level, monthly income and expenditure, assets (property, vehicles, savings), employment status, and whether you have existing insolvency proceedings. Our recommendation engine evaluates all these factors automatically when you complete an application. Generally: MAP requires debts under £25,000 with minimal assets; DAS requires surplus income for repayment; PTD requires debts over £5,000 with regular income; Sequestration is for unmanageable debt situations.',
  },
  {
    keywords: ['document', 'paperwork', 'what do i need', 'evidence', 'upload'],
    response: 'For a complete application you will typically need: 1) Proof of identity (passport, driving licence, or national ID), 2) Proof of address (utility bill or council tax notice from last 3 months), 3) Income evidence (payslips, benefit letters, or tax returns), 4) Debt evidence (statements or letters from creditors showing amounts owed). All documents are virus-scanned automatically when uploaded. You can upload PDF, JPG, or PNG files up to 10MB each.',
  },
  {
    keywords: ['apply', 'application', 'how to apply', 'process', 'what happens', 'after'],
    response: 'After you submit your application: 1) System checks run automatically across 6 AiB databases (BASYS, eDEN, DAS, CFT, Moratorium, RoI), 2) A credit check is performed (with your consent), 3) Our recommendation engine analyses your circumstances and suggests the most suitable debt solution, 4) A case officer reviews your application, 5) You receive a formal recommendation, 6) If you accept, a money adviser is assigned to help you proceed. The typical processing time is 3-10 working days.',
  },
  {
    keywords: ['house', 'property', 'home', 'keep my house', 'mortgage'],
    response: 'Whether you can keep your house depends on the debt solution: With DAS, you keep all assets including your home. With a PTD, your property equity may need to be realised — but trustees often allow you to remain if equity is low or a third party can contribute. With Sequestration, your home is typically at risk and the trustee may sell it to repay creditors. If keeping your home is a priority, DAS or a PTD with equity buyback arrangement may be most suitable.',
  },
  {
    keywords: ['recommend', 'engine', 'how does', 'algorithm', 'rules'],
    response: 'Our recommendation engine uses a rules-based system that evaluates your financial circumstances against eligibility criteria for 7 Scottish debt solutions. It considers: total debt level, disposable income, asset values, employment status, existing insolvency proceedings, and credit history. The engine produces a primary recommendation with a confidence score (high/medium/low), contributing factors, and alternative options. All recommendations are reviewed by qualified case officers before being communicated to you.',
  },
  {
    keywords: ['how long', 'duration', 'time', 'years'],
    response: 'Duration varies by solution: MAP provides debt relief in approximately 6 months. DAS repayment plans typically last 4-7 years depending on your surplus income and debt level. Protected Trust Deeds last 4 years. Sequestration discharge is typically after 1 year but restrictions may last 4 years. DPP (Debt Payment Programmes) under DAS are individually calculated based on your affordable monthly payment.',
  },
  {
    keywords: ['credit', 'credit score', 'credit rating', 'affect my credit'],
    response: 'All formal debt solutions will appear on your credit file for 6 years from the start date. DAS is recorded on your credit file but does not appear on the public insolvency register. PTD and Sequestration appear on both your credit file and the public Register of Insolvencies. During any debt solution, obtaining new credit may be restricted. After discharge or completion, your credit score will gradually improve over time.',
  },
  {
    keywords: ['cost', 'fee', 'how much', 'price', 'payment'],
    response: 'Costs vary by solution: MAP has no application fee. DAS has no fee for the application itself — money adviser services are free through approved providers. Sequestration has an application fee of £150 (may be waived in some circumstances). PTDs are managed by a licensed insolvency practitioner whose fees come from your contributions (not an additional charge to you). Our initial assessment and recommendation service is completely free.',
  },
];

const SUGGESTED_QUESTIONS = [
  'What is DAS?',
  'Am I eligible for MAP?',
  'What documents do I need?',
];

function matchResponse(input: string): string {
  const lower = input.toLowerCase().trim();

  for (const entry of KNOWLEDGE_BASE) {
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) {
        return entry.response;
      }
    }
  }

  return 'I can help with questions about Scottish debt solutions. Try asking about DAS (Debt Arrangement Scheme), MAP (Minimal Asset Process), PTD (Protected Trust Deed), or Sequestration. I can also explain eligibility criteria, required documents, the application process, or how the recommendation engine works.';
}

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

    // Simulate AI thinking delay
    setTimeout(() => {
      const response = matchResponse(text);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 500 + Math.random() * 500);
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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#d32205] hover:bg-[#a81b03] text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
        aria-label="Ask AiB AI"
        title="Ask AiB AI"
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
            Ask AiB AI
          </span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[350px] h-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-in]">
          {/* Header */}
          <div className="bg-[#d32205] text-white px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-sm">🤖</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-white">AiB Digital Assistant</p>
              <p className="text-xs text-red-200">Powered by AI</p>
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
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#d32205] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {msg.content}
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
              AI assistant for general guidance only — not financial advice
            </p>
          </div>
        </div>
      )}
    </>
  );
}
