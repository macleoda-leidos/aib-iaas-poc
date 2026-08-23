'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DigitalSignaturePage() {
  const [signed, setSigned] = useState(false);
  const [timestamp, setTimestamp] = useState('');

  const handleConfirm = () => {
    setSigned(true);
    setTimestamp(new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }));
  };

  const handleClear = () => {
    setSigned(false);
    setTimestamp('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            ← Back to Admin
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Digital Signature</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Capture electronic signatures for application declarations</p>

        {/* Success Banner */}
        {signed && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
              <p className="text-green-800 dark:text-green-300 font-medium">
                Signature captured at {timestamp}
              </p>
            </div>
          </div>
        )}

        {/* Signature Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Capture Signature</h2>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Draw your signature with mouse or finger</p>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg h-48 flex items-center justify-center bg-white dark:bg-gray-900">
              {signed ? (
                <p className="text-4xl text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  A. Morrison
                </p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm">Sign here</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Confirm Signature
            </button>
          </div>
        </div>

        {/* Signature Details */}
        {signed && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Signature Record</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Signatory</dt>
                <dd className="text-gray-900 dark:text-white font-medium">A. Morrison</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Captured At</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{timestamp}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Method</dt>
                <dd className="text-gray-900 dark:text-white font-medium">Electronic Signature (eIDAS)</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Hash</dt>
                <dd className="text-gray-900 dark:text-white font-mono text-xs">sha256:a3f2b8c1...d4e5f6</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
