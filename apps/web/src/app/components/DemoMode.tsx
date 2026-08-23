'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const DEMO_STEPS = [
  { path: '/', duration: 5, title: '🏠 Welcome', narration: 'Welcome to IAAS — AiB\'s digital front door. Service status shows all systems operational.' },
  { path: '/login', duration: 5, title: '🔐 Staff Login', narration: 'Staff authenticate via Keycloak with MFA. 4 demo accounts available.' },
  { path: '/dashboard', duration: 6, title: '📊 Staff Dashboard', narration: 'AI prioritisation, anomaly alerts, live notifications. Cases sorted by urgency.' },
  { path: '/case/IAAS-2026-00012', duration: 7, title: '📋 Case Detail', narration: 'AI Summary auto-generated. Risk score: Low. Quality check: 5/6 passed. Predicted: 92% approved.' },
  { path: '/case/IAAS-2026-00012/recommendation', duration: 6, title: '✅ Recommendation', narration: 'DAS at 94% confidence. Decision factors, alternatives chart, evidence from 6 systems.' },
  { path: '/case/IAAS-2026-00012/audit', duration: 5, title: '📜 Audit Trail', narration: '18 events permanently recorded. Full compliance. Every action traceable.' },
  { path: '/', duration: 3, title: '👤 Citizen Journey...', narration: 'Now the citizen experience — applying for debt advice online.' },
  { path: '/apply', duration: 6, title: '📝 Step 1: Personal Details', narration: 'Citizen enters name, DOB, NI number. Validated in real-time (format, age, prefix checks).' },
  { path: '/apply', duration: 5, title: '🏠 Step 2: Address', narration: 'Address history with UK postcode validation. 5-year requirement checked.' },
  { path: '/apply', duration: 5, title: '💳 Step 3: Debts', narration: 'Multiple creditors added. £2,000 + £3,000 + £2,000 = £7,000 total.' },
  { path: '/apply', duration: 5, title: '💰 Step 4: Income', narration: 'Salary, benefits, other income. Auto-calculated disposable income shown live.' },
  { path: '/apply', duration: 5, title: '📊 Step 5: Expenditure', narration: 'Utilities, rent, food, transport. Eligibility meter predicts DAS.' },
  { path: '/apply', duration: 4, title: '🏡 Step 6: Assets', narration: 'House, car, savings declared. Affects PTD vs DAS recommendation.' },
  { path: '/apply', duration: 4, title: '📄 Step 7: Documents', narration: 'Payslip.pdf, BankStatement.pdf, UtilityBill.pdf uploaded. ClamAV virus scan: Clean ✓' },
  { path: '/apply', duration: 5, title: '🔍 Step 8: System Checks', narration: 'BASYS, eDEN, DAS, CFT, Moratorium, RoI — all checked in parallel. All clear.' },
  { path: '/apply', duration: 6, title: '✅ Step 9: Recommendation', narration: 'AI generates: Debt Arrangement Scheme (DAS) at 94% confidence.' },
  { path: '/apply', duration: 5, title: '📨 Step 10: Submit', narration: 'Application submitted! Reference IAAS-2026-00101 generated. Confirmation shown.' },
  { path: '/dashboard', duration: 5, title: '📥 In Staff Queue', narration: 'New case appears in dashboard immediately. Priority: High. Assigned to Karen MacLeod.' },
  { path: '/case/IAAS-2026-00012', duration: 5, title: '✓ Caseworker Approves', narration: 'AI quality check passes (5/6). Karen clicks Approve. Audit event created.' },
  { path: '/my-application', duration: 5, title: '🎉 Debtor Notified', narration: 'Citizen sees: Status updated to Approved. Decision notification email sent.' },
  { path: '/search', duration: 5, title: '🔍 Cross-System Search', narration: '100 applications searchable. Fuzzy matching finds "Jhon Smith" from "John Smith".' },
  { path: '/admin', duration: 5, title: '⚙️ Admin: 32 Features', narration: 'Rules engine, Digital Mailroom, AI Governance, Policy Simulation, and 28 more.' },
  { path: '/admin/ai-explainability', duration: 5, title: '🧠 AI Explainability', narration: 'Visual decision tree. Full transparency — exactly HOW the AI decided.' },
  { path: '/', duration: 6, title: '🏁 Demo Complete', narration: 'Live API • 57+ pages • 648 tests • 12 AI capabilities • 32 admin features • £0/month. Questions?' },
];

type Speed = 'slow' | 'normal' | 'fast';
const SPEED_MS: Record<Speed, number> = { slow: 10000, normal: 6000, fast: 3000 };

export default function DemoMode() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>('normal');
  const [progress, setProgress] = useState(0);

  const currentStep = DEMO_STEPS[step];

  const goToStep = useCallback((idx: number) => {
    if (idx >= 0 && idx < DEMO_STEPS.length) {
      setStep(idx);
      setProgress(0);
      router.push(DEMO_STEPS[idx].path);
    }
  }, [router]);

  const startDemo = () => {
    setActive(true);
    setStep(0);
    setPlaying(true);
    setProgress(0);
    router.push(DEMO_STEPS[0].path);
  };

  const endDemo = () => {
    setActive(false);
    setPlaying(false);
    setStep(0);
    setProgress(0);
  };

  // Auto-advance timer
  useEffect(() => {
    if (!active || !playing) return;

    const stepDuration = (currentStep?.duration || 6) * 1000;
    const tick = 100; // progress update every 100ms

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (tick / stepDuration) * 100;
        if (next >= 100) {
          // Advance to next step
          const nextStep = step + 1;
          if (nextStep < DEMO_STEPS.length) {
            setStep(nextStep);
            router.push(DEMO_STEPS[nextStep].path);
            return 0;
          } else {
            setPlaying(false);
            return 100;
          }
        }
        return next;
      });
    }, tick);

    return () => clearInterval(interval);
  }, [active, playing, step, currentStep, router]);

  // Floating start button
  if (!active) {
    return (
      <button onClick={startDemo} className="fixed bottom-4 left-4 z-50 bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2.5 rounded-full shadow-lg text-sm flex items-center gap-2 transition-all hover:scale-105 print:hidden">
        <span className="text-lg">▶</span> Start Demo
      </button>
    );
  }

  // Demo narration panel
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 print:hidden">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div className="h-full bg-purple-600 transition-all duration-100" style={{ width: `${(step / DEMO_STEPS.length) * 100 + (progress / DEMO_STEPS.length)}%` }} />
      </div>

      {/* Narration panel */}
      <div className="bg-white dark:bg-gray-900 border-t-2 border-purple-500 shadow-2xl px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          {/* Step info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
                {step + 1} / {DEMO_STEPS.length}
              </span>
              <span className="font-bold text-sm truncate">{currentStep?.title}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{currentStep?.narration}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => goToStep(step - 1)} disabled={step === 0} className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800">⏮</button>
            <button onClick={() => setPlaying(!playing)} className="w-8 h-8 flex items-center justify-center rounded bg-purple-700 text-white text-sm hover:bg-purple-800">
              {playing ? '⏸' : '▶'}
            </button>
            <button onClick={() => goToStep(step + 1)} disabled={step >= DEMO_STEPS.length - 1} className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800">⏭</button>

            {/* Speed */}
            <select value={speed} onChange={e => setSpeed(e.target.value as Speed)} className="text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded px-1 py-1 ml-1">
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>

            <button onClick={endDemo} className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 ml-1">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}
