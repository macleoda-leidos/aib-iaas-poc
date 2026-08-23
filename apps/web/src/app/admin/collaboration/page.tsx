'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CollaborationPage() {
  const [locked, setLocked] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link href="/admin" className="text-blue-400 hover:text-blue-300 mb-8 inline-block">
        ← Back to Admin
      </Link>

      <h1 className="text-3xl font-bold mb-2">Real-time Collaboration</h1>
      <p className="text-gray-400 mb-8">Multi-user case viewing and editing</p>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Case Header */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold">IAAS-2026-00012</h2>
              <p className="text-gray-400">Alistair Morrison</p>
            </div>
            <div className="flex items-center gap-2">
              {locked && (
                <span className="bg-yellow-900/50 border border-yellow-600 text-yellow-400 px-3 py-1 rounded-full text-sm">
                  🔒 Locked by you
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Currently Viewing */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Currently Viewing</h3>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm">
              KM
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
              JW
            </div>
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold text-sm">
              You
            </div>
            <span className="text-gray-400 text-sm ml-2">3 users viewing this case</span>
          </div>
        </div>

        {/* Active Cursors */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Active Editing</h3>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-purple-300">Karen</span>
            <span className="text-gray-400">is editing</span>
            <span className="text-white font-semibold">Staff Notes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-blue-300">James</span>
            <span className="text-gray-400">is viewing</span>
            <span className="text-white font-semibold">Recommendation</span>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Activity Feed</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-gray-300">
                <span className="text-white font-semibold">Karen MacLeod</span> added a note
              </span>
              <span className="text-gray-500 ml-auto">30s ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-300">
                <span className="text-white font-semibold">James Wilson</span> viewed credit check
              </span>
              <span className="text-gray-500 ml-auto">2m ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-300">
                <span className="text-white font-semibold">You</span> opened case
              </span>
              <span className="text-gray-500 ml-auto">5m ago</span>
            </div>
          </div>
        </div>

        {/* Lock Button */}
        <div className="text-center">
          <button
            onClick={() => setLocked(!locked)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              locked
                ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {locked ? '🔓 Unlock case' : '🔒 Lock case for editing'}
          </button>
        </div>
      </div>
    </div>
  );
}
