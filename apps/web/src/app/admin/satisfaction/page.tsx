'use client';

import Link from 'next/link';

export default function SatisfactionPage() {
  const feedback = [
    { quote: 'Very easy to use, got my recommendation in minutes', stars: 5 },
    { quote: 'Would have preferred to speak to someone first', stars: 3 },
    { quote: 'Clear guidance throughout the process', stars: 5 },
    { quote: "Wasn't sure what DAS meant at first but the chatbot helped", stars: 4 },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link href="/admin" className="text-blue-400 hover:text-blue-300 mb-8 inline-block">
        ← Back to Admin
      </Link>

      <h1 className="text-3xl font-bold mb-2">Citizen Satisfaction</h1>
      <p className="text-gray-400 mb-8">NPS survey results and feedback</p>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* NPS Score */}
        <div className="bg-gray-800 border border-green-700 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm uppercase font-semibold mb-2">Net Promoter Score</p>
          <div className="text-7xl font-bold text-green-400 mb-2">72</div>
          <span className="inline-block bg-green-900/50 border border-green-600 text-green-400 px-4 py-1 rounded-full text-lg font-semibold">
            Excellent
          </span>
        </div>

        {/* Distribution */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-6">Score Distribution</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-400">Promoters (9-10)</span>
                <span className="text-green-400 font-semibold">68%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div className="bg-green-500 h-4 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-yellow-400">Passives (7-8)</span>
                <span className="text-yellow-400 font-semibold">22%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div className="bg-yellow-500 h-4 rounded-full" style={{ width: '22%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-400">Detractors (0-6)</span>
                <span className="text-red-400 font-semibold">10%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div className="bg-red-500 h-4 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Quotes */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-6">Recent Feedback</h2>
          <div className="space-y-4">
            {feedback.map((item, i) => (
              <div key={i} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-gray-200 italic">&ldquo;{item.quote}&rdquo;</p>
                  <span className="text-yellow-400 whitespace-nowrap">
                    {'⭐'.repeat(item.stars)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Monthly Satisfaction Trend</h2>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-300">68</p>
              <p className="text-gray-500 text-sm">June</p>
            </div>
            <div className="text-green-400 text-xl">→</div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-200">70</p>
              <p className="text-gray-500 text-sm">July</p>
            </div>
            <div className="text-green-400 text-xl">→</div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">72</p>
              <p className="text-gray-500 text-sm">August</p>
            </div>
          </div>
          <p className="text-center text-green-400 text-sm mt-4">↑ Trending up (+4 over 3 months)</p>
        </div>

        {/* Response Rate */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm uppercase font-semibold mb-2">Response Rate</p>
          <p className="text-3xl font-bold text-white">34%</p>
          <p className="text-gray-500 text-sm mt-1">of applicants completed the survey</p>
        </div>
      </div>
    </div>
  );
}
