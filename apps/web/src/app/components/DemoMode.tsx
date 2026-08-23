'use client';

import { useState } from 'react';
import Link from 'next/link';

const STEPS = [
  { title: 'Welcome to IAAS', description: 'The citizen-facing portal for Scottish debt solutions. Service status, guidance, and start application button.', link: '/' },
  { title: 'Apply for Debt Advice', description: '9-step application with real-time eligibility prediction, validation, and progress saving.', link: '/apply' },
  { title: 'Staff Dashboard', description: 'AI-powered case prioritisation, anomaly detection, and live notifications for caseworkers.', link: '/dashboard' },
  { title: 'Case Detail + AI', description: 'AI case summary, quality checks, risk scoring, predictive outcomes, and guided decision support.', link: '/case/IAAS-2026-00012' },
  { title: 'Administration Portal', description: 'Rules engine, digital mailroom, AI governance, policy simulation, and knowledge hub.', link: '/admin' },
];

export default function DemoMode() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="fixed bottom-4 left-4 z-50 bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 print:hidden">
        ▶ Demo
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t-2 border-purple-500 shadow-2xl p-4 print:hidden">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-bold">Demo {step + 1}/{STEPS.length}</span>
            <span className="font-bold text-sm">{STEPS[step].title}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{STEPS[step].description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-30">← Back</button>
          <Link href={STEPS[step].link} className="px-3 py-1 text-sm rounded bg-purple-700 text-white font-bold no-underline hover:bg-purple-800">Go →</Link>
          <button onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))} disabled={step === STEPS.length - 1} className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-30">Next →</button>
          <button onClick={() => { setOpen(false); setStep(0); }} className="px-2 py-1 text-sm text-gray-400 hover:text-red-500">✕</button>
        </div>
      </div>
    </div>
  );
}
