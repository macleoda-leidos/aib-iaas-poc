'use client';

import Link from 'next/link';

export default function CarbonTrackerPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link href="/admin" className="text-blue-400 hover:text-blue-300 mb-8 inline-block">
        ← Back to Admin
      </Link>

      <h1 className="text-3xl font-bold mb-2">Carbon Tracker</h1>
      <p className="text-gray-400 mb-8">Digital-first sustainability metrics and savings</p>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Stat */}
        <div className="bg-gray-800 border border-green-700 rounded-xl p-8 text-center">
          <div className="inline-block bg-green-900/50 border border-green-600 text-green-400 px-4 py-1 rounded-full text-sm font-semibold mb-4">
            🌱 Digital First
          </div>
          <div className="text-6xl font-bold text-green-400 mb-2">247</div>
          <p className="text-2xl text-green-300">trees saved equivalent</p>
        </div>

        {/* Calculations */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Impact Breakdown</h2>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">1,247</div>
              <p className="text-gray-400 text-sm">digital applications vs paper</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">6,235</div>
              <p className="text-gray-400 text-sm">fewer printed pages</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">0.74 tonnes</div>
              <p className="text-gray-400 text-sm">CO2 saved</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">2026 Sustainability Target</h2>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-green-400 font-semibold">74%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div className="bg-green-500 h-4 rounded-full" style={{ width: '74%' }} />
          </div>
          <p className="text-gray-500 text-sm mt-2">74% toward 2026 sustainability target</p>
        </div>

        {/* Monthly Trend */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Monthly Trend</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">July 2026</span>
              <div className="flex items-center gap-3">
                <div className="w-48 bg-gray-700 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: '86%' }} />
                </div>
                <span className="text-white font-mono w-12 text-right">180</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">August 2026</span>
              <div className="flex items-center gap-3">
                <div className="w-48 bg-gray-700 rounded-full h-3">
                  <div className="bg-green-400 h-3 rounded-full" style={{ width: '100%' }} />
                </div>
                <span className="text-white font-mono w-12 text-right">210</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Comparison */}
        <div data-demo="carbon-cost-comparison" className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Cost Comparison</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
              <p className="text-red-400 text-sm uppercase font-semibold mb-1">Paper Process</p>
              <p className="text-3xl font-bold text-red-400">£4.20</p>
              <p className="text-gray-500 text-sm">per application</p>
            </div>
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 text-center">
              <p className="text-green-400 text-sm uppercase font-semibold mb-1">Digital Process</p>
              <p className="text-3xl font-bold text-green-400">£0.08</p>
              <p className="text-gray-500 text-sm">per application</p>
            </div>
          </div>
          <p className="text-center text-gray-400 mt-4 text-sm">
            98% cost reduction per application through digital-first approach
          </p>
        </div>
      </div>
    </div>
  );
}
