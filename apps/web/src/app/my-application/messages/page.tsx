'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MessagesPage() {
  const [replyText, setReplyText] = useState('');

  const messages = [
    {
      sender: 'System',
      timestamp: '29 June 2026, 10:15',
      text: 'Your application has been received. Reference: IAAS-2026-00012. You will receive updates as your application progresses.',
      type: 'system',
    },
    {
      sender: 'System',
      timestamp: '29 June 2026, 10:18',
      text: 'Credit check completed successfully. No further action required from you at this stage.',
      type: 'system',
    },
    {
      sender: 'AiB Officer (Karen MacLeod)',
      timestamp: '1 July 2026, 14:32',
      text: "We've reviewed your application and have a few questions about your council tax arrears. Could you confirm whether these relate to your current or previous address, and whether any payment arrangement is already in place?",
      type: 'aib',
    },
    {
      sender: 'You',
      timestamp: '2 July 2026, 09:45',
      text: 'Hi, the council tax was from my previous address at 14 Elm Street, Edinburgh. I have a payment plan in place now with the City of Edinburgh Council — I pay £45/month and the balance is reducing.',
      type: 'debtor',
    },
    {
      sender: 'AiB Officer (Karen MacLeod)',
      timestamp: '3 July 2026, 11:20',
      text: 'Thank you for clarifying. This is helpful and consistent with what we can see on the Council Tax Register. Your application has been approved for DAS. You will receive your formal decision letter within 2 working days.',
      type: 'aib',
    },
  ];

  const getSenderBadgeClasses = (type: string) => {
    switch (type) {
      case 'system':
        return 'bg-gray-700 text-gray-300';
      case 'aib':
        return 'bg-blue-900 text-blue-300';
      case 'debtor':
        return 'bg-green-900 text-green-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const getMessageBgClasses = (type: string) => {
    switch (type) {
      case 'system':
        return 'bg-gray-800 border-gray-700';
      case 'aib':
        return 'bg-gray-800 border-blue-800';
      case 'debtor':
        return 'bg-gray-800 border-green-800';
      default:
        return 'bg-gray-800 border-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/my-application" className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-block">
            &larr; Back to My Application
          </Link>
          <h1 className="text-2xl font-bold">Secure Messages</h1>
          <p className="text-gray-400 text-sm mt-1">Reference: IAAS-2026-00012</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Message Thread */}
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`border rounded-lg p-4 ${getMessageBgClasses(msg.type)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSenderBadgeClasses(msg.type)}`}>
                  {msg.sender}
                </span>
                <span className="text-gray-500 text-xs">{msg.timestamp}</span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Reply Input */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <label htmlFor="reply" className="block text-sm font-medium text-gray-400 mb-2">
            Reply
          </label>
          <textarea
            id="reply"
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your message here..."
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-gray-500 text-xs">
              🔒 Messages are encrypted and stored securely. Only you and authorised AiB staff can view this conversation.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors">
              Send Message
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
