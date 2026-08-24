'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface SignatureRecord {
  id: string;
  signedBy: string;
  document: string;
  datetime: string;
  method: string;
  status: 'confirmed' | 'pending';
}

const STORAGE_KEY = 'iaas-signature-log';
const DOCUMENTS = [
  'Application IAAS-2026-00012 — DAS Declaration',
  'Trust Deed Agreement — Craig Stewart',
  'DAS Proposal — Janet Henderson',
  'Sequestration Petition — Kenneth MacDonald',
  'Moratorium Application — Fiona Campbell',
  'Creditor Consent Form — RBS',
];

export default function DigitalSignaturePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signed, setSigned] = useState(false);
  const [timestamp, setTimestamp] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(DOCUMENTS[0]);
  const [signatureLog, setSignatureLog] = useState<SignatureRecord[]>([]);
  const [currentUser, setCurrentUser] = useState('Admin User');

  // Load signature log and user from storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setSignatureLog(JSON.parse(stored)); } catch {}
    }
    const user = sessionStorage.getItem('iaas-current-user') || localStorage.getItem('iaas-current-user');
    if (user) {
      try { setCurrentUser(JSON.parse(user).name || 'Admin User'); } catch {}
    }
  }, []);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSigned(false);
    setTimestamp('');
  };

  const handleConfirm = () => {
    if (!hasDrawn) return;
    const ts = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    setTimestamp(ts);
    setSigned(true);

    // Add to audit log
    const record: SignatureRecord = {
      id: `SIG-${Date.now()}`,
      signedBy: currentUser,
      document: selectedDoc,
      datetime: ts,
      method: 'Electronic Signature (eIDAS)',
      status: 'confirmed',
    };
    const updated = [record, ...signatureLog];
    setSignatureLog(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSignatureLog([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">← Back to Admin</Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Digital Signature</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Capture electronic signatures for application declarations and legal documents</p>

        {/* Success Banner */}
        {signed && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
              <p className="text-green-800 dark:text-green-300 font-medium">
                Signature confirmed by <strong>{currentUser}</strong> at {timestamp}
              </p>
            </div>
          </div>
        )}

        {/* Document Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Document to Sign</h2>
          <select value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded px-3 py-2 text-sm">
            {DOCUMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Signature Canvas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Capture Signature</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Draw your signature with mouse or finger below</p>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900 mb-4">
            <canvas
              ref={canvasRef}
              width={700}
              height={200}
              className="w-full h-[200px] cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={clearCanvas}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-bold">
              ✕ Clear
            </button>
            <button onClick={handleConfirm} disabled={!hasDrawn || signed}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
              ✓ Confirm Signature
            </button>
          </div>
        </div>

        {/* Signature Details (current) */}
        {signed && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Signature Record</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-gray-500 dark:text-gray-400">Signatory</dt><dd className="text-gray-900 dark:text-white font-medium">{currentUser}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">Captured At</dt><dd className="text-gray-900 dark:text-white font-medium">{timestamp}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">Document</dt><dd className="text-gray-900 dark:text-white font-medium">{selectedDoc}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">Method</dt><dd className="text-gray-900 dark:text-white font-medium">Electronic Signature (eIDAS)</dd></div>
            </dl>
          </div>
        )}

        {/* Signature Audit Log */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Signature Audit Log</h2>
            {signatureLog.length > 0 && (
              <button onClick={clearHistory} className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline">Clear History</button>
            )}
          </div>
          {signatureLog.length === 0 ? (
            <p className="text-sm text-gray-400">No signatures recorded yet. Sign a document above to create an entry.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Date/Time</th>
                    <th className="text-left px-3 py-2 font-medium">Signed By</th>
                    <th className="text-left px-3 py-2 font-medium">Document</th>
                    <th className="text-left px-3 py-2 font-medium">Method</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {signatureLog.map(record => (
                    <tr key={record.id}>
                      <td className="px-3 py-2 text-xs">{record.datetime}</td>
                      <td className="px-3 py-2 font-medium">{record.signedBy}</td>
                      <td className="px-3 py-2 text-xs">{record.document}</td>
                      <td className="px-3 py-2 text-xs">{record.method}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
