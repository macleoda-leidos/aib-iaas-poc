'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { dispatchDemoAction, DemoAction } from '../../lib/demoEvents';
import { generateRandomApplication, GeneratedApplication } from '../../lib/applicationGenerator';

interface DemoStepAction {
  delay: number; // ms after step starts
  action: DemoAction;
}

interface DemoStep {
  path: string;
  duration: number; // total seconds for this step
  title: string;
  narration: string;
  actions?: DemoStepAction[];
}

function buildDemoSteps(app: GeneratedApplication): DemoStep[] {
  const totalDebt = app.debts.reduce((s, d) => s + d.outstandingAmount, 0);
  const totalIncome = app.income.wages + app.income.benefits + app.income.pension + app.income.other;
  const totalExp = app.expenditure.rent + app.expenditure.councilTax + app.expenditure.utilities + app.expenditure.food + app.expenditure.transport + app.expenditure.insurance + app.expenditure.childcare + app.expenditure.other;

  return [
    // Staff demo (steps 0-6)
    {
      path: '/',
      duration: 5,
      title: '\u{1F3E0} Welcome',
      narration: 'Welcome to IAAS — AiB\'s digital front door. Service status shows all systems operational.',
    },
    {
      path: '/login',
      duration: 5,
      title: '\u{1F510} Staff Login',
      narration: 'Staff authenticate via Keycloak with MFA. 4 demo accounts available.',
    },
    {
      path: '/dashboard',
      duration: 6,
      title: '\u{1F4CA} Staff Dashboard',
      narration: 'AI prioritisation, anomaly alerts, live notifications. Cases sorted by urgency.',
    },
    {
      path: '/case/IAAS-2026-00012',
      duration: 7,
      title: '\u{1F4CB} Case Detail',
      narration: 'AI Summary auto-generated. Risk score: Low. Quality check: 5/6 passed. Predicted: 92% approved.',
    },
    {
      path: '/case/IAAS-2026-00012/recommendation',
      duration: 6,
      title: '✅ Recommendation',
      narration: 'DAS at 94% confidence. Decision factors, alternatives chart, evidence from 6 systems.',
    },
    {
      path: '/case/IAAS-2026-00012/audit',
      duration: 5,
      title: '\u{1F4DC} Audit Trail',
      narration: '18 events permanently recorded. Full compliance. Every action traceable.',
    },
    {
      path: '/',
      duration: 3,
      title: '\u{1F464} Citizen Journey...',
      narration: 'Now the citizen experience — applying for debt advice online.',
    },

    // Apply form interaction (steps 7-16)
    {
      path: '/apply',
      duration: 8,
      title: '\u{1F4DD} Step 1: Personal Details',
      narration: `Filling personal details: ${app.personal.firstName} ${app.personal.lastName}, DOB ${app.personal.dateOfBirth}, NI ${app.personal.nationalInsuranceNumber}`,
      actions: [
        { delay: 1000, action: { type: 'FILL_PERSONAL', data: app.personal } },
        { delay: 6500, action: { type: 'NEXT_STEP' } },
      ],
    },
    {
      path: '/apply',
      duration: 7,
      title: '\u{1F3E0} Step 2: Address',
      narration: `Address: ${app.address.line1}, ${app.address.city} ${app.address.postcode}. Resident since ${app.address.residentSince}.`,
      actions: [
        { delay: 1000, action: { type: 'FILL_ADDRESS', data: app.address } },
        { delay: 5500, action: { type: 'NEXT_STEP' } },
      ],
    },
    {
      path: '/apply',
      duration: 10,
      title: '\u{1F4B3} Step 3: Debts',
      narration: `Adding 3 creditors one by one. Total debt: £${totalDebt.toLocaleString()}.`,
      actions: [
        // Add debts one at a time so viewer sees each row appear
        { delay: 1000, action: { type: 'FILL_DEBTS', data: [app.debts[0] || { creditorName: 'Royal Bank of Scotland', creditorType: 'credit_card', outstandingAmount: 12400, monthlyPayment: 280 }] } },
        { delay: 3000, action: { type: 'FILL_DEBTS', data: [app.debts[0], app.debts[1] || { creditorName: 'Barclays', creditorType: 'personal_loan', outstandingAmount: 8200, monthlyPayment: 195 }] } },
        { delay: 5000, action: { type: 'FILL_DEBTS', data: [app.debts[0], app.debts[1] || { creditorName: 'Barclays', creditorType: 'personal_loan', outstandingAmount: 8200, monthlyPayment: 195 }, app.debts[2] || { creditorName: 'HMRC', creditorType: 'tax', outstandingAmount: 3800, monthlyPayment: 0 }] } },
        { delay: 8500, action: { type: 'NEXT_STEP' } },
      ],
    },
    {
      path: '/apply',
      duration: 7,
      title: '\u{1F4B0} Step 4: Income & Expenditure',
      narration: `Income: £${totalIncome.toLocaleString()}/mo. Expenditure: £${totalExp.toLocaleString()}/mo. Disposable: £${(totalIncome - totalExp).toLocaleString()}/mo.`,
      actions: [
        { delay: 800, action: { type: 'FILL_INCOME', data: app.income } },
        { delay: 2000, action: { type: 'FILL_EXPENDITURE', data: app.expenditure } },
        { delay: 5500, action: { type: 'NEXT_STEP' } },
      ],
    },
    {
      path: '/apply',
      duration: 8,
      title: '\u{1F3E1} Step 5: Assets',
      narration: app.assets.noAssets
        ? 'No assets declared. This opens eligibility for MAP.'
        : `Adding assets: property, vehicle, savings — one by one.`,
      actions: app.assets.noAssets ? [
        { delay: 1000, action: { type: 'FILL_ASSETS', data: app.assets } },
        { delay: 4000, action: { type: 'NEXT_STEP' } },
      ] : [
        // Sequential asset entry
        { delay: 1000, action: { type: 'FILL_ASSETS', data: { ...app.assets, vehicles: [], savings: [] } } },
        { delay: 3000, action: { type: 'FILL_ASSETS', data: { ...app.assets, savings: [] } } },
        { delay: 5000, action: { type: 'FILL_ASSETS', data: app.assets } },
        { delay: 6500, action: { type: 'NEXT_STEP' } },
      ],
    },
    {
      path: '/apply',
      duration: 8,
      title: '\u{1F4C4} Step 6: Documents',
      narration: 'Uploading Payslip and Bank Statement. ClamAV virus scan: Clean ✓',
      actions: [
        { delay: 1000, action: { type: 'UPLOAD_DOCUMENT', data: { filename: 'Payslip-August-2026.pdf', size: 245000 } } },
        { delay: 3500, action: { type: 'UPLOAD_DOCUMENT', data: { filename: 'BankStatement-Q2-2026.pdf', size: 1120000 } } },
        { delay: 6500, action: { type: 'NEXT_STEP' } },
      ],
    },
    {
      path: '/apply',
      duration: 6,
      title: '\u{1F50D} Step 7: System Checks',
      narration: 'BASYS, eDEN, DAS, CFT, Moratorium, RoI — all checked in parallel. All clear.',
      actions: [
        { delay: 1000, action: { type: 'RUN_CHECKS' } },
        { delay: 4500, action: { type: 'NEXT_STEP' } },
      ],
    },
    {
      path: '/apply',
      duration: 9,
      title: '✅ Step 8: Recommendation',
      narration: `Clicking "Get Recommendation"... AI rules engine analysing... Result: ${app.expectedProduct}. Downloading PDF.`,
      actions: [
        { delay: 1000, action: { type: 'CLICK_RECOMMEND' } },
        { delay: 5500, action: { type: 'DOWNLOAD_PDF' } },
        { delay: 7500, action: { type: 'NEXT_STEP' } },
      ],
    },
    {
      path: '/apply',
      duration: 8,
      title: '\u{1F4E8} Step 9: Payment & Submit',
      narration: 'Selecting Apple Pay. Confirming payment. Application submitted!',
      actions: [
        { delay: 500, action: { type: 'SELECT_PAYMENT', method: 'apple_pay' } },
        { delay: 2500, action: { type: 'CONFIRM_PAYMENT' } },
        { delay: 5000, action: { type: 'SUBMIT' } },
      ],
    },

    // Post-submission (steps 17-22)
    {
      path: '/dashboard',
      duration: 5,
      title: '\u{1F4E5} In Staff Queue',
      narration: 'New case appears in dashboard immediately. Priority: High. Assigned to Karen MacLeod.',
      actions: [
        { delay: 1000, action: { type: 'SCROLL_TO', selector: '.applications-table' } },
      ],
    },
    {
      path: '/case/IAAS-2026-00012',
      duration: 5,
      title: '✓ Caseworker Approves',
      narration: 'AI quality check passes (5/6). Karen clicks Approve. Audit event created.',
      actions: [
        { delay: 2000, action: { type: 'APPROVE_CASE' } },
      ],
    },
    {
      path: '/my-application',
      duration: 5,
      title: '\u{1F389} Debtor Notified',
      narration: 'Citizen sees: Status updated to Approved. Decision notification email sent.',
    },
    {
      path: '/search',
      duration: 5,
      title: '\u{1F50D} Cross-System Search',
      narration: '100 applications searchable. Fuzzy matching finds "Jhon Smith" from "John Smith".',
    },
    {
      path: '/admin',
      duration: 5,
      title: '⚙️ Admin: 32 Features',
      narration: 'Rules engine, Digital Mailroom, AI Governance, Policy Simulation, and 28 more.',
    },
    {
      path: '/admin/ai-explainability',
      duration: 5,
      title: '\u{1F9E0} AI Explainability',
      narration: 'Visual decision tree. Full transparency — exactly HOW the AI decided.',
    },
    {
      path: '/',
      duration: 6,
      title: '\u{1F3C1} Demo Complete',
      narration: 'Live API • 57+ pages • 648 tests • 12 AI capabilities • 32 admin features • £0/month. Questions?',
    },
  ];
}

type Speed = 'slow' | 'normal' | 'fast';
const SPEED_MULTIPLIER: Record<Speed, number> = { slow: 1.5, normal: 1, fast: 0.6 };

export default function DemoMode() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>('normal');
  const [progress, setProgress] = useState(0);
  const [demoApp, setDemoApp] = useState<GeneratedApplication | null>(null);
  const [demoSteps, setDemoSteps] = useState<DemoStep[]>([]);
  const actionTimersRef = useRef<NodeJS.Timeout[]>([]);

  const currentStep = demoSteps[step];

  // Clear all pending action timers
  const clearActionTimers = useCallback(() => {
    actionTimersRef.current.forEach(t => clearTimeout(t));
    actionTimersRef.current = [];
  }, []);

  // Execute actions for the current step
  const executeStepActions = useCallback((stepIndex: number, speedMult: number) => {
    clearActionTimers();
    const s = demoSteps[stepIndex];
    if (!s?.actions) return;

    s.actions.forEach(({ delay, action }) => {
      const timer = setTimeout(() => {
        dispatchDemoAction(action);
      }, delay * speedMult);
      actionTimersRef.current.push(timer);
    });
  }, [demoSteps, clearActionTimers]);

  const goToStep = useCallback((idx: number) => {
    if (idx >= 0 && idx < demoSteps.length) {
      clearActionTimers();
      setStep(idx);
      setProgress(0);
      router.push(demoSteps[idx].path);
      if (playing) {
        // Small delay to let page render before dispatching actions
        setTimeout(() => executeStepActions(idx, SPEED_MULTIPLIER[speed]), 300);
      }
    }
  }, [router, demoSteps, playing, speed, clearActionTimers, executeStepActions]);

  const startDemo = () => {
    const app = generateRandomApplication();
    setDemoApp(app);
    const steps = buildDemoSteps(app);
    setDemoSteps(steps);
    setActive(true);
    setStep(0);
    setPlaying(true);
    setProgress(0);
    router.push(steps[0].path);
  };

  const endDemo = () => {
    clearActionTimers();
    setActive(false);
    setPlaying(false);
    setStep(0);
    setProgress(0);
    setDemoApp(null);
    setDemoSteps([]);
  };

  // Auto-advance timer
  useEffect(() => {
    if (!active || !playing || !currentStep) return;

    const speedMult = SPEED_MULTIPLIER[speed];
    const stepDuration = (currentStep.duration * 1000) * speedMult;
    const tick = 100;

    // Execute actions when step begins
    executeStepActions(step, speedMult);

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (tick / stepDuration) * 100;
        if (next >= 100) {
          // Advance to next step
          const nextStep = step + 1;
          if (nextStep < demoSteps.length) {
            clearActionTimers();
            setStep(nextStep);
            router.push(demoSteps[nextStep].path);
            // Actions for next step will fire via the next useEffect cycle
            return 0;
          } else {
            setPlaying(false);
            return 100;
          }
        }
        return next;
      });
    }, tick);

    return () => {
      clearInterval(interval);
      clearActionTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, playing, step, speed]);

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
        <div className="h-full bg-purple-600 transition-all duration-100" style={{ width: `${(step / demoSteps.length) * 100 + (progress / demoSteps.length)}%` }} />
      </div>

      {/* Narration panel */}
      <div className="bg-white dark:bg-gray-900 border-t-2 border-purple-500 shadow-2xl px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          {/* Step info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
                {step + 1} / {demoSteps.length}
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
            <button onClick={() => goToStep(step + 1)} disabled={step >= demoSteps.length - 1} className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800">⏭</button>

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
