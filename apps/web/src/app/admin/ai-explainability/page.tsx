'use client';

import Link from 'next/link';

export default function AIExplainabilityPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link href="/admin" className="text-blue-400 hover:text-blue-300 mb-8 inline-block">
        ← Back to Admin
      </Link>

      <h1 className="text-3xl font-bold mb-2">AI Decision Explainability</h1>
      <p className="text-gray-400 mb-8">Case IAAS-2026-00012 — Alistair Morrison</p>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Decision Tree */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-6">Decision Tree</h2>
          <div className="space-y-4">
            {/* Start */}
            <div className="flex items-center gap-3">
              <div className="bg-gray-700 px-4 py-2 rounded-lg text-sm font-mono">START</div>
              <div className="text-gray-500">→</div>
            </div>

            {/* Node 1 */}
            <div className="ml-8 flex items-center gap-3">
              <div className="bg-gray-700 px-4 py-2 rounded-lg text-sm">Debt &gt; £5,000?</div>
              <span className="bg-green-900/50 border border-green-600 text-green-400 px-2 py-0.5 rounded text-xs">Yes (£18,000)</span>
              <span className="bg-green-900/30 text-green-500 px-2 py-0.5 rounded text-xs">+ve impact</span>
            </div>

            {/* Node 2 */}
            <div className="ml-16 flex items-center gap-3">
              <div className="bg-gray-700 px-4 py-2 rounded-lg text-sm">Disposable income &gt; £100/mo?</div>
              <span className="bg-green-900/50 border border-green-600 text-green-400 px-2 py-0.5 rounded text-xs">Yes (£230/mo)</span>
              <span className="bg-green-900/30 text-green-500 px-2 py-0.5 rounded text-xs">+ve impact</span>
            </div>

            {/* Node 3 */}
            <div className="ml-24 flex items-center gap-3">
              <div className="bg-gray-700 px-4 py-2 rounded-lg text-sm">Assets &lt; £5,000?</div>
              <span className="bg-green-900/50 border border-green-600 text-green-400 px-2 py-0.5 rounded text-xs">Yes (£2,100)</span>
              <span className="bg-green-900/30 text-green-500 px-2 py-0.5 rounded text-xs">+ve impact</span>
            </div>

            {/* Result */}
            <div className="ml-32 flex items-center gap-3">
              <div className="bg-blue-600 px-4 py-2 rounded-lg text-sm font-bold">→ DAS (94% confidence)</div>
            </div>
          </div>
        </div>

        {/* Explanations */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-orange-400 mb-3">Why not PTD?</h3>
            <p className="text-gray-300">
              Assets (£9,700 including vehicle) below PTD threshold of £5,000 for equity. DAS preferred as debt repayment is viable with disposable income of £230/mo.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="bg-red-900/50 border border-red-600 text-red-400 px-2 py-0.5 rounded text-xs">-ve: Assets too low</span>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-orange-400 mb-3">Why not MAP?</h3>
            <p className="text-gray-300">
              Disposable income £230/mo exceeds MAP threshold of £50/mo. Applicant can afford structured repayment through DAS.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="bg-red-900/50 border border-red-600 text-red-400 px-2 py-0.5 rounded text-xs">-ve: Income too high</span>
            </div>
          </div>
        </div>

        {/* Feature Importance (SHAP-style bars) */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-6">Feature Importance</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Disposable Income (£230/mo)</span>
                <span className="text-green-400">+0.34</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Total Debt (£18,000)</span>
                <span className="text-green-400">+0.28</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: '70%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Number of Creditors (4)</span>
                <span className="text-green-400">+0.18</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Asset Value (£2,100)</span>
                <span className="text-blue-400">+0.09</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '22%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Employment Status (Employed)</span>
                <span className="text-red-400">-0.05</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-red-500 h-3 rounded-full" style={{ width: '12%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
