'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function QRLoginPage() {
  const [status, setStatus] = useState<'waiting' | 'authenticated'>('waiting');
  const [seconds, setSeconds] = useState(272); // 4:32

  useEffect(() => {
    if (status === 'waiting' && seconds > 0) {
      const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [status, seconds]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSimulateScan = () => {
    setStatus('authenticated');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link href="/admin" className="text-blue-400 hover:text-blue-300 mb-8 inline-block">
        ← Back to Admin
      </Link>

      <h1 className="text-3xl font-bold mb-2">QR Code Login</h1>
      <p className="text-gray-400 mb-8">Scan with your phone to log in instantly</p>

      <div className="max-w-md mx-auto text-center space-y-6">
        {/* Mock QR Code */}
        <div className="inline-block bg-white p-4 rounded-lg">
          <svg width="200" height="200" viewBox="0 0 20 20" className="block">
            {/* Simple QR-like pattern */}
            {[
              [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],
              [0,8],[0,9],[0,11],
              [0,13],[0,14],[0,15],[0,16],[0,17],[0,18],[0,19],
              [1,0],[1,6],[1,8],[1,10],[1,13],[1,19],
              [2,0],[2,2],[2,3],[2,4],[2,6],[2,9],[2,10],[2,11],[2,13],[2,15],[2,16],[2,17],[2,19],
              [3,0],[3,2],[3,3],[3,4],[3,6],[3,8],[3,11],[3,13],[3,15],[3,16],[3,17],[3,19],
              [4,0],[4,2],[4,3],[4,4],[4,6],[4,9],[4,10],[4,13],[4,15],[4,16],[4,17],[4,19],
              [5,0],[5,6],[5,8],[5,9],[5,11],[5,13],[5,19],
              [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,8],[6,10],[6,12],[6,13],[6,14],[6,15],[6,16],[6,17],[6,18],[6,19],
              [7,8],[7,9],[7,11],
              [8,0],[8,1],[8,3],[8,5],[8,6],[8,8],[8,10],[8,11],[8,12],[8,14],[8,16],[8,18],[8,19],
              [9,1],[9,2],[9,4],[9,6],[9,8],[9,9],[9,12],[9,14],[9,15],[9,17],[9,19],
              [10,0],[10,2],[10,4],[10,5],[10,7],[10,9],[10,10],[10,11],[10,13],[10,15],[10,17],[10,18],
              [11,1],[11,3],[11,5],[11,7],[11,8],[11,10],[11,12],[11,14],[11,16],[11,18],[11,19],
              [12,0],[12,2],[12,4],[12,6],[12,8],[12,10],[12,11],[12,13],[12,15],[12,17],[12,19],
              [13,0],[13,1],[13,2],[13,3],[13,4],[13,5],[13,6],[13,8],[13,10],[13,12],[13,14],[13,16],[13,18],
              [14,0],[14,6],[14,9],[14,11],[14,13],[14,15],[14,17],[14,19],
              [15,0],[15,2],[15,3],[15,4],[15,6],[15,8],[15,9],[15,10],[15,12],[15,14],[15,16],[15,18],
              [16,0],[16,2],[16,3],[16,4],[16,6],[16,8],[16,11],[16,13],[16,15],[16,17],[16,19],
              [17,0],[17,2],[17,3],[17,4],[17,6],[17,9],[17,10],[17,12],[17,14],[17,16],[17,18],[17,19],
              [18,0],[18,6],[18,8],[18,10],[18,11],[18,13],[18,15],[18,17],
              [19,0],[19,1],[19,2],[19,3],[19,4],[19,5],[19,6],[19,8],[19,9],[19,11],[19,12],[19,14],[19,16],[19,18],[19,19],
            ].map(([row, col], i) => (
              <rect key={i} x={col} y={row} width="1" height="1" fill="black" />
            ))}
          </svg>
        </div>

        {/* Countdown */}
        <p className="text-gray-400">
          QR code expires in <span className="text-white font-mono font-bold">{formatTime(seconds)}</span>
        </p>

        {/* Status */}
        {status === 'waiting' ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-300">Waiting for scan...</p>
          </div>
        ) : (
          <div className="bg-green-900/50 border border-green-600 rounded-lg p-4">
            <p className="text-green-400 text-lg font-semibold">
              ✓ Authenticated as Karen MacLeod — redirecting...
            </p>
          </div>
        )}

        {/* Simulate Button */}
        {status === 'waiting' && (
          <button
            onClick={handleSimulateScan}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Simulate Scan
          </button>
        )}
      </div>
    </div>
  );
}
