'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function VoiceInputPage() {
  const [state, setState] = useState<'idle' | 'listening' | 'transcribed' | 'applied'>('idle');

  const handleMicClick = () => {
    setState('listening');
    setTimeout(() => setState('transcribed'), 2000);
  };

  const handleApply = () => {
    setState('applied');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link href="/admin" className="text-blue-400 hover:text-blue-300 mb-8 inline-block">
        ← Back to Admin
      </Link>

      <h1 className="text-3xl font-bold mb-2">Voice Input Demo</h1>
      <p className="text-gray-400 mb-8">Speech-to-text for form filling</p>

      <div className="max-w-xl mx-auto text-center space-y-8">
        {/* Microphone Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleMicClick}
            disabled={state === 'listening'}
            className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl transition-all ${
              state === 'listening'
                ? 'bg-red-600 animate-pulse shadow-lg shadow-red-500/50'
                : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30'
            }`}
          >
            🎤
          </button>

          {state === 'idle' && (
            <p className="text-gray-300 text-lg">Press to speak</p>
          )}

          {state === 'listening' && (
            <p className="text-red-400 text-lg animate-pulse">Listening...</p>
          )}
        </div>

        {/* Transcription */}
        {(state === 'transcribed' || state === 'applied') && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-left">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Transcription</h3>
            <p className="text-lg text-white italic">
              &ldquo;My name is Alistair Morrison and I have eighteen thousand pounds of debt&rdquo;
            </p>
          </div>
        )}

        {/* Apply Button */}
        {state === 'transcribed' && (
          <button
            onClick={handleApply}
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Apply to form
          </button>
        )}

        {/* Applied Confirmation */}
        {state === 'applied' && (
          <div className="bg-green-900/50 border border-green-600 rounded-lg p-4">
            <p className="text-green-400 text-lg font-semibold">✓ Applied to Personal Details section</p>
          </div>
        )}

        {/* Note */}
        <p className="text-gray-500 text-sm mt-12">
          Powered by Web Speech API — Chrome/Edge supported
        </p>
      </div>
    </div>
  );
}
