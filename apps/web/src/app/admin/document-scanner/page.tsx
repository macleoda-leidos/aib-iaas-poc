'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DocumentScannerPage() {
  const [state, setState] = useState<'viewfinder' | 'captured' | 'added'>('viewfinder');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link href="/admin" className="text-blue-400 hover:text-blue-300 mb-8 inline-block">
        ← Back to Admin
      </Link>

      <h1 className="text-3xl font-bold mb-2">Document Scanner</h1>
      <p className="text-gray-400 mb-8">Camera-based document capture with OCR</p>

      <div className="max-w-2xl mx-auto space-y-6">
        {state === 'viewfinder' && (
          <>
            {/* Mock Camera Viewfinder */}
            <div className="relative bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg h-80 flex items-center justify-center">
              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-blue-400" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-blue-400" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-blue-400" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-blue-400" />

              <p className="text-gray-400 text-lg">Position document within frame</p>
            </div>

            <div className="text-center">
              <button
                onClick={() => setState('captured')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
              >
                📷 Capture
              </button>
            </div>
          </>
        )}

        {(state === 'captured' || state === 'added') && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-green-400">✓ Document Captured</h2>
              <span className="bg-green-900/50 border border-green-600 text-green-400 px-3 py-1 rounded-full text-sm">
                Confidence: 96%
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">OCR Results</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Document type:</span>
                    <span className="text-white font-semibold">Bank Statement (NatWest)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account holder:</span>
                    <span className="text-white font-semibold">A. Morrison</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sort code:</span>
                    <span className="text-white font-mono">80-12-34</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Balance:</span>
                    <span className="text-white font-semibold">£1,247.50</span>
                  </div>
                </div>
              </div>
            </div>

            {state === 'captured' && (
              <button
                onClick={() => setState('added')}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full"
              >
                Add to application
              </button>
            )}

            {state === 'added' && (
              <div className="bg-green-900/50 border border-green-600 rounded-lg p-4 text-center">
                <p className="text-green-400 font-semibold">✓ Document added to application IAAS-2026-00012</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
