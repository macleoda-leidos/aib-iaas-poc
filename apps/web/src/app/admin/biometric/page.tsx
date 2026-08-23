'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BiometricPage() {
  const [fingerprintState, setFingerprintState] = useState<'ready' | 'scanning' | 'confirmed'>('ready');
  const [faceState, setFaceState] = useState<'ready' | 'scanning' | 'confirmed'>('ready');
  const [fingerprintProgress, setFingerprintProgress] = useState(0);
  const [faceProgress, setFaceProgress] = useState(0);

  const simulateFingerprint = () => {
    setFingerprintState('scanning');
    setFingerprintProgress(0);
    const interval = setInterval(() => {
      setFingerprintProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setFingerprintState('confirmed');
          return 100;
        }
        return p + 3.33;
      });
    }, 100);
  };

  const simulateFace = () => {
    setFaceState('scanning');
    setFaceProgress(0);
    const interval = setInterval(() => {
      setFaceProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setFaceState('confirmed');
          return 100;
        }
        return p + 3.33;
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link href="/admin" className="text-blue-400 hover:text-blue-300 mb-8 inline-block">
        ← Back to Admin
      </Link>

      <h1 className="text-3xl font-bold mb-2">Biometric Authentication</h1>
      <p className="text-gray-400 mb-8">Fingerprint and Face ID simulation</p>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Fingerprint Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center space-y-4">
          <div className="text-7xl">👆</div>
          <h2 className="text-xl font-bold">Fingerprint</h2>
          <p className="text-gray-400">Touch sensor to authenticate</p>

          {fingerprintState === 'ready' && (
            <>
              <div className="inline-block bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                Status: Ready
              </div>
              <div>
                <button
                  onClick={simulateFingerprint}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Simulate Authentication
                </button>
              </div>
            </>
          )}

          {fingerprintState === 'scanning' && (
            <div className="space-y-3">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${Math.min(fingerprintProgress, 100)}%` }}
                />
              </div>
              <p className="text-blue-400 animate-pulse">Scanning...</p>
            </div>
          )}

          {fingerprintState === 'confirmed' && (
            <div className="space-y-3">
              <p className="text-green-400 font-semibold text-lg">✓ Identity confirmed</p>
              <p className="text-green-300">Confidence: 99.7%</p>
              <div className="inline-block bg-green-900/50 border border-green-600 text-green-400 px-3 py-1 rounded-full text-sm">
                Biometric (Level 3 assurance)
              </div>
            </div>
          )}
        </div>

        {/* Face ID Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center space-y-4">
          <div className="text-7xl">🔓</div>
          <h2 className="text-xl font-bold">Face ID</h2>
          <p className="text-gray-400">Look at camera</p>

          {faceState === 'ready' && (
            <>
              <div className="inline-block bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                Status: Ready
              </div>
              <div>
                <button
                  onClick={simulateFace}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Simulate Authentication
                </button>
              </div>
            </>
          )}

          {faceState === 'scanning' && (
            <div className="space-y-3">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${Math.min(faceProgress, 100)}%` }}
                />
              </div>
              <p className="text-blue-400 animate-pulse">Scanning...</p>
            </div>
          )}

          {faceState === 'confirmed' && (
            <div className="space-y-3">
              <p className="text-green-400 font-semibold text-lg">✓ Identity confirmed</p>
              <p className="text-green-300">Confidence: 99.7%</p>
              <div className="inline-block bg-green-900/50 border border-green-600 text-green-400 px-3 py-1 rounded-full text-sm">
                Biometric (Level 3 assurance)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
