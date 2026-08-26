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
  // Narration lists only the asset classes this persona actually holds, so the
  // talk track never promises a property the Assets page won't show.
  const assetSummary = [
    app.assets.vehicles.length ? 'vehicle' : null,
    app.assets.savings.length ? 'savings' : null,
    app.assets.properties.length ? 'property' : null,
  ].filter(Boolean).join(', ');

  return [
    // Staff demo
    {
      path: '/',
      duration: 13,
      title: '\u{1F3E0} Welcome',
      narration: 'Welcome to IAAS — AiB\'s digital front door. Service status shows all systems operational. Scrolling down: all six Scottish debt solutions, each linking to aib.gov.uk, and one green Start Application button.',
      actions: [
        // The solutions grid and the start button are below the fold, so the
        // opening beat walks down to them rather than leaving the audience
        // looking at the status banner for the whole step.
        { delay: 3000, action: { type: 'SCROLL_TO', selector: '[data-demo="home-solutions"]', block: 'start' } },
        { delay: 8500, action: { type: 'HIGHLIGHT', selector: '[data-demo="home-start"]', durationMs: 3500 } },
      ],
    },
    {
      path: '/login',
      duration: 22,
      title: '\u{1F510} Staff Login',
      narration: 'Signing in as the Case Officer demo account against the live API, then the enforced second factor: choose delivery — authenticator app, text or email — and enter the 6-digit code. Five demo accounts are available, all with the password "demo".',
      actions: [
        // Drive the real controls rather than writing state: Sign In is a genuine
        // POST to the API, so the audience sees the actual round trip. The delays
        // after it are deliberately loose — on a cold free-tier instance the
        // response can take seconds, and waitForElement absorbs the rest.
        { delay: 1500, action: { type: 'CLICK', selector: '[data-demo="login-account-case-officer"]' } },
        { delay: 4000, action: { type: 'CLICK', selector: '[data-demo="login-submit"]' } },
        { delay: 9000, action: { type: 'CLICK', selector: '[data-demo="login-otp-sms"]' } },
        { delay: 11500, action: { type: 'CLICK', selector: '[data-demo="login-send-code"]' } },
        { delay: 14500, action: { type: 'FILL_MFA_CODE', code: '123456' } },
        { delay: 17000, action: { type: 'CLICK', selector: '[data-demo="login-verify"]' } },
      ],
    },
    {
      path: '/dashboard',
      duration: 14,
      title: '\u{1F4CA} Staff Dashboard',
      narration: 'AI prioritisation, anomaly alerts, live notifications. Cases sorted by urgency — scrolling the full dashboard so every panel gets seen.',
      actions: [
        { delay: 1500, action: { type: 'SLOW_SCROLL', durationMs: 10000 } },
      ],
    },
    {
      path: '/case/IAAS-2026-00012',
      duration: 18,
      title: '\u{1F4CB} Case Detail',
      narration: 'AI Summary auto-generated. Risk score: Low. Quality check: 5/6 passed. Predicted: 92% approved. Live statutory deadlines too — the 21-day DAS creditor objection window under reg.23(5), and with 4 debts in this programme non-responding creditors are deemed to consent when it expires.',
      actions: [
        { delay: 1500, action: { type: 'SLOW_SCROLL', durationMs: 14000 } },
        // Fires after the slow scroll settles at 15500ms and finishes at 18000ms,
        // exactly on the step boundary. Pushing this to the duration would make it
        // a beat nobody sees, and outliving the step leaves a torn-down highlight
        // ring — DemoChoreographer clears highlight timers on unmount.
        { delay: 16000, action: { type: 'HIGHLIGHT', selector: '[data-demo="case-statutory-deadlines"]', durationMs: 2000 } },
      ],
    },
    {
      path: '/case/IAAS-2026-00012/recommendation',
      duration: 19,
      title: '✅ Recommendation',
      narration: 'DAS at 94% confidence. Scrolling through the decision factors, alternatives chart and evidence from 6 systems — then back up to the Download PDF Report button, which produces the formal recommendation document.',
      actions: [
        { delay: 1500, action: { type: 'SLOW_SCROLL', durationMs: 11000 } },
        // HIGHLIGHT, not CLICK: the export opens a popup and calls print(), and a
        // modal print dialog would stall the player. Ringing the button makes the
        // point without leaving the page.
        { delay: 14000, action: { type: 'HIGHLIGHT', selector: '[data-demo="recommendation-pdf"]', durationMs: 4000 } },
      ],
    },
    {
      path: '/case/IAAS-2026-00012/audit',
      duration: 28,
      title: '\u{1F4DC} Audit Trail',
      narration: '18 events permanently recorded — 9 application, 5 checks, 2 decisions, 1 communication, 1 review. Every action traceable, and the whole trail filters by category.',
      actions: [
        { delay: 1500, action: { type: 'SLOW_SCROLL', durationMs: 10000 } },
        // Each CLICK scrolls its pill into view first, so working through the
        // filters walks the page back up to the top on its own.
        { delay: 13000, action: { type: 'CLICK', selector: '[data-demo="audit-filter-check"]' } },
        { delay: 16000, action: { type: 'CLICK', selector: '[data-demo="audit-filter-decision"]' } },
        { delay: 19000, action: { type: 'CLICK', selector: '[data-demo="audit-filter-communication"]' } },
        { delay: 22000, action: { type: 'CLICK', selector: '[data-demo="audit-filter-review"]' } },
        // Leave the trail unfiltered so the page is in its default state.
        { delay: 25000, action: { type: 'CLICK', selector: '[data-demo="audit-filter-all"]' } },
      ],
    },
    {
      path: '/',
      duration: 8,
      title: '\u{1F464} Citizen Journey...',
      narration: 'Now the citizen experience. Back at the front door: six Scottish debt solutions to choose from, and the Start Application button that begins the journey.',
      actions: [
        // Opens framed on the solutions grid *and* the green call to action, rather
        // than at the top of the page — this beat is the pivot into /apply, so the
        // button the citizen presses should already be on screen. 'center' fits the
        // whole block on a presenter's display and degrades to top-aligned if the
        // viewport is too short for it.
        { delay: 1200, action: { type: 'SCROLL_TO', selector: '[data-demo="home-solutions-cta"]', block: 'center' } },
      ],
    },

    // Apply form interaction
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
      narration: `Declaring assets one by one: ${assetSummary}.`,
      actions: [
        // Sequential asset entry. The demo persona always declares assets (see
        // startDemo), so vehicle and savings are revealed first and property
        // last — property only exists on the PTD profile, and revealing it last
        // means the earlier beats still show a row appearing either way.
        { delay: 1000, action: { type: 'FILL_ASSETS', data: { ...app.assets, savings: [], properties: [] } } },
        { delay: 3000, action: { type: 'FILL_ASSETS', data: { ...app.assets, properties: [] } } },
        { delay: 5000, action: { type: 'FILL_ASSETS', data: app.assets } },
        { delay: 6500, action: { type: 'NEXT_STEP' } },
      ],
    },
    {
      path: '/apply',
      duration: 11,
      title: '\u{1F4C4} Step 6: Documents',
      narration: 'Uploading 4 documents: payslip, bank statement, council tax bill, creditor letter. ClamAV virus scan: Clean ✓',
      actions: [
        // Each upload runs a 2s progress bar then a 1s virus scan, so the last
        // file has to be injected ~3.5s before NEXT_STEP or the step advances
        // while it still reads "Scanning...".
        { delay: 800, action: { type: 'UPLOAD_DOCUMENT', data: { filename: 'Payslip-August-2026.pdf', size: 245000 } } },
        { delay: 2400, action: { type: 'UPLOAD_DOCUMENT', data: { filename: 'BankStatement-Q2-2026.pdf', size: 1120000 } } },
        { delay: 4000, action: { type: 'UPLOAD_DOCUMENT', data: { filename: 'CouncilTaxBill-2026-27.pdf', size: 186000 } } },
        { delay: 5600, action: { type: 'UPLOAD_DOCUMENT', data: { filename: 'CreditorLetter-RBS.pdf', size: 92000 } } },
        { delay: 9500, action: { type: 'NEXT_STEP' } },
      ],
    },
    {
      path: '/apply',
      duration: 10,
      title: '\u{1F50D} Step 7: System Checks',
      narration: 'BASYS, eDEN, DAS, CFT, Moratorium, RoI — all checked in parallel, then the credit check. All clear.',
      actions: [
        // RUN_CHECKS presses the real button, so this beat has to allow for the
        // six systems plus the credit check resolving one at a time (~3.5s
        // offline, longer against a cold API) before it moves on.
        { delay: 800, action: { type: 'RUN_CHECKS' } },
        { delay: 8000, action: { type: 'NEXT_STEP' } },
      ],
    },
    {
      path: '/apply',
      duration: 11,
      title: '✅ Step 8: Recommendation',
      narration: `Clicking "Get my recommendation"... rules engine analysing... Result: ${app.expectedProduct}, with the decision factors that produced it.`,
      actions: [
        // The real handler spins for 2–3s before calling the rules engine, so
        // give the result several seconds on screen before advancing. No
        // DOWNLOAD_PDF beat: the print dialog is modal and would stall the tour.
        { delay: 800, action: { type: 'CLICK_RECOMMEND' } },
        { delay: 9500, action: { type: 'NEXT_STEP' } },
      ],
    },
    {
      path: '/apply',
      duration: 9,
      title: '\u{1F4E8} Step 9: Payment & Submit',
      narration: 'Selecting Apple Pay. Confirming payment. Application submitted!',
      actions: [
        { delay: 500, action: { type: 'SELECT_PAYMENT', method: 'apple_pay' } },
        { delay: 3000, action: { type: 'CONFIRM_PAYMENT' } },
      ],
    },

    // Post-submission, then the stakeholder-facing portals
    {
      path: '/dashboard',
      duration: 5,
      title: '\u{1F4E5} In Staff Queue',
      narration: 'New case appears in dashboard immediately. Priority: High. Assigned to Karen MacLeod.',
      actions: [
        { delay: 1000, action: { type: 'SCROLL_TO', selector: '[data-demo="applications-table"]' } },
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
      duration: 19,
      title: '\u{1F50D} Cross-System Search',
      narration: '110 applications searchable. Searching "John Smith" returns four records held across BASYS, eDEN, DAS and IAAS — scored 100%, 93.8%, 92.5% and 87.5%, each with the reason it differs: letters transposed, letter substituted, letter missing. Turning fuzzy matching off leaves the one exact match and hides the other three.',
      actions: [
        { delay: 1500, action: { type: 'CLICK', selector: '[data-demo="search-tile-john-smith"]' } },
        // The search debounces for 300 ms and then waits on the API, which is
        // capped at a 2.5 s deadline — so the cluster is on screen by ~4.3 s even
        // on a cold instance.
        { delay: 5000, action: { type: 'HIGHLIGHT', selector: '[data-demo="search-results"]', durationMs: 4000 } },
        { delay: 9500, action: { type: 'CLICK', selector: '[data-demo="search-fuzzy-toggle"]' } },
        // Re-filtering is derived from the stored candidates, so both toggles are
        // instant — no second round trip to wait out.
        { delay: 10200, action: { type: 'HIGHLIGHT', selector: '[data-demo="search-results"]', durationMs: 3000 } },
        { delay: 13500, action: { type: 'CLICK', selector: '[data-demo="search-fuzzy-toggle"]' } },
        { delay: 14200, action: { type: 'HIGHLIGHT', selector: '[data-demo="search-results"]', durationMs: 3000 } },
      ],
    },
    {
      path: '/adviser-workspace',
      duration: 26,
      title: '\u{1F91D} Money Adviser Workspace',
      narration: 'The intermediary view — Fiona MacRae of Citizens Advice Scotland, eight client records, two awaiting a decision, three appointments this week. This screen is an interface demonstration on synthetic data and says so on the page: "Submit on Behalf" opens the standard wizard but carries no client context or declaration of authority yet, and "New Client" is deliberately disabled with the reason on the control.',
      actions: [
        { delay: 1000, action: { type: 'HIGHLIGHT', selector: '[data-demo="adviser-notice"]', durationMs: 4000 } },
        { delay: 5500, action: { type: 'HIGHLIGHT', selector: '[data-demo="adviser-kpis"]', durationMs: 3000 } },
        // Highlight, never click: the control is disabled on purpose, and the
        // point of the beat is to show that caveat rather than paper over it.
        { delay: 9000, action: { type: 'HIGHLIGHT', selector: '[data-demo="adviser-new-client"]', durationMs: 3000 } },
        { delay: 12500, action: { type: 'HIGHLIGHT', selector: '[data-demo="adviser-clients"]', durationMs: 3500 } },
        { delay: 16500, action: { type: 'SLOW_SCROLL', durationMs: 5000 } },
      ],
    },
    {
      path: '/creditor-portal',
      duration: 26,
      title: '\u{1F3E6} Creditor Portal',
      narration: 'The same treatment for creditors: Royal Bank of Scotland sees its own cases with the debt owed and the dividend rate on each, plus two proposals awaiting a vote. Also an interface demonstration — the claim form labels itself a placeholder, and Accept and Reject are disabled because no voting service sits behind them. Dividend schedule: £4,230 due on 15 September 2026, quarterly.',
      actions: [
        { delay: 1000, action: { type: 'HIGHLIGHT', selector: '[data-demo="creditor-notice"]', durationMs: 4000 } },
        { delay: 5500, action: { type: 'HIGHLIGHT', selector: '[data-demo="creditor-kpis"]', durationMs: 3000 } },
        // The claim form is an inline toggle rather than a modal, but the same
        // control still closes it before the step ends so nothing is left
        // expanded behind the rest of the tour.
        { delay: 9000, action: { type: 'CLICK', selector: '[data-demo="creditor-claim-toggle"]' } },
        { delay: 11500, action: { type: 'HIGHLIGHT', selector: '[data-demo="creditor-claim-placeholder"]', durationMs: 3000 } },
        { delay: 15000, action: { type: 'CLICK', selector: '[data-demo="creditor-claim-toggle"]' } },
        { delay: 17000, action: { type: 'HIGHLIGHT', selector: '[data-demo="creditor-proposals"]', durationMs: 3500 } },
        { delay: 21000, action: { type: 'SCROLL_TO', selector: '[data-demo="creditor-dividends"]', block: 'start' } },
      ],
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

    // Admin deep dive
    {
      path: '/admin/rules',
      duration: 16,
      title: '⚖️ Rules Engine',
      narration: 'Nine recommendation rules on engine v2.3 — seven active, two in draft — evaluated in priority order. 96% average test coverage across the active set. Today a policy change is a code change; in production these are editable by policy officers through a Draft, Review, Active workflow with regression testing.',
      actions: [
        { delay: 1000, action: { type: 'HIGHLIGHT', selector: '[data-demo="rules-kpis"]', durationMs: 3000 } },
        { delay: 4500, action: { type: 'HIGHLIGHT', selector: '[data-demo="rules-table"]', durationMs: 4000 } },
        { delay: 9000, action: { type: 'HIGHLIGHT', selector: '[data-demo="rules-poc-notice"]', durationMs: 3000 } },
      ],
    },
    {
      // The list page cannot simulate a threshold — only the rule detail page
      // can — so the tester gets its own beat rather than a mid-step click
      // through that the audience would miss.
      path: '/admin/rules/rule-das-eligibility',
      duration: 22,
      title: '\u{1F9EA} Rule Detail & Tester',
      narration: 'DAS Eligibility v3.4: three conditions — debt of at least £5,000, no more than £25,000, disposable income above £100 — and the IF/THEN they compile to. The tester runs a synthetic applicant against the live rule: £18,000 of debt on £230 disposable, condition by condition, match. Every threshold move is versioned with its author and reason, back to the original £150 income floor.',
      actions: [
        { delay: 1000, action: { type: 'HIGHLIGHT', selector: '[data-demo="rule-conditions"]', durationMs: 3500 } },
        { delay: 5000, action: { type: 'HIGHLIGHT', selector: '[data-demo="rule-actions"]', durationMs: 2500 } },
        { delay: 8000, action: { type: 'SCROLL_TO', selector: '[data-demo="rule-tester"]', block: 'start' } },
        { delay: 10000, action: { type: 'CLICK', selector: '[data-demo="rule-test-run"]' } },
        // The result panel only mounts once the test has run; waitForElement
        // covers the gap.
        { delay: 12500, action: { type: 'HIGHLIGHT', selector: '[data-demo="rule-test-result"]', durationMs: 3500 } },
        { delay: 17000, action: { type: 'SCROLL_TO', selector: '[data-demo="rule-history"]', block: 'start' } },
      ],
    },
    {
      path: '/admin/ai-governance',
      duration: 26,
      title: '\u{1F916} AI Governance',
      narration: '1,247 recommendations over twelve weeks — 89.1% accepted by staff, 8.3% overridden, 2.6% pending review, with every override categorised by reason. Fairness tested across age, gender, region and employment: Highland & Islands is flagged, an 18.2% override rate against 8.7% nationally, p-value 0.003. The model registry names the responsible officer, the approver and the next review date, 14 November 2026.',
      actions: [
        { delay: 1000, action: { type: 'HIGHLIGHT', selector: '[data-demo="governance-alerts"]', durationMs: 3500 } },
        { delay: 5000, action: { type: 'HIGHLIGHT', selector: '[data-demo="governance-kpis"]', durationMs: 3000 } },
        { delay: 8500, action: { type: 'HIGHLIGHT', selector: '[data-demo="governance-bias-metrics"]', durationMs: 4000 } },
        { delay: 13000, action: { type: 'HIGHLIGHT', selector: '[data-demo="governance-registry"]', durationMs: 3000 } },
        // Closes on the decision audit log, which sits below the registry.
        { delay: 16500, action: { type: 'SLOW_SCROLL', durationMs: 5500 } },
      ],
    },
    {
      // Five tabs to walk, each with a scroll to the bottom, so this is the
      // longest step in the script by a wide margin.
      path: '/admin/digital-mailroom',
      duration: 34,
      title: '\u{1F4EC} Digital Mailroom',
      narration: 'Post, email and scans ingested automatically: OCR, classification, NER extraction, then rules-based routing. Five tabs — dashboard, queue, workflows, stats, outbound.',
      actions: [
        { delay: 1000, action: { type: 'CLICK', selector: '[data-demo="mailroom-tab-dashboard"]' } },
        { delay: 2500, action: { type: 'SLOW_SCROLL', durationMs: 4000 } },
        { delay: 7500, action: { type: 'CLICK', selector: '[data-demo="mailroom-tab-queue"]' } },
        { delay: 9000, action: { type: 'SLOW_SCROLL', durationMs: 4000 } },
        { delay: 14000, action: { type: 'CLICK', selector: '[data-demo="mailroom-tab-workflows"]' } },
        { delay: 15500, action: { type: 'SLOW_SCROLL', durationMs: 4000 } },
        { delay: 20500, action: { type: 'CLICK', selector: '[data-demo="mailroom-tab-stats"]' } },
        { delay: 22000, action: { type: 'SLOW_SCROLL', durationMs: 4000 } },
        { delay: 27000, action: { type: 'CLICK', selector: '[data-demo="mailroom-tab-outbound"]' } },
        { delay: 28500, action: { type: 'SLOW_SCROLL', durationMs: 4500 } },
      ],
    },
    {
      path: '/admin/policy-simulation',
      duration: 14,
      title: '\u{1F39A}️ Policy Simulation',
      narration: 'Four rule thresholds — DAS disposable income, MAP debt ceiling, PTD assets, DPP term. Move one and the before/after product mix is re-run against 100 historical cases.',
      actions: [
        { delay: 1000, action: { type: 'HIGHLIGHT', selector: '[data-demo="policy-parameters"]', durationMs: 3500 } },
        { delay: 5000, action: { type: 'SCROLL_TO', selector: '[data-demo="policy-distributions"]', block: 'start' } },
        { delay: 7500, action: { type: 'SLOW_SCROLL', durationMs: 5500 } },
      ],
    },
    {
      path: '/admin/data-retention',
      duration: 12,
      title: '\u{1F5C4}️ Data Retention',
      narration: 'Retention policy per record type — applications 6 years, audit events 7. Auto-archival with a due-for-archival queue. 2.3GB of 10GB in use.',
      actions: [
        { delay: 1000, action: { type: 'HIGHLIGHT', selector: '[data-demo="retention-storage"]', durationMs: 3000 } },
        { delay: 4500, action: { type: 'HIGHLIGHT', selector: '[data-demo="retention-policies"]', durationMs: 3000 } },
        { delay: 8000, action: { type: 'SLOW_SCROLL', durationMs: 3500 } },
      ],
    },
    {
      path: '/admin/carbon-tracker',
      duration: 12,
      title: '\u{1F331} Carbon Tracker',
      narration: '1,247 digital applications instead of paper — 6,235 fewer printed pages, 0.74 tonnes of CO2 saved. £4.20 per paper application against £0.08 digital: a 98% reduction.',
      actions: [
        { delay: 1000, action: { type: 'SLOW_SCROLL', durationMs: 7000 } },
        { delay: 8500, action: { type: 'HIGHLIGHT', selector: '[data-demo="carbon-cost-comparison"]', durationMs: 3000 } },
      ],
    },
    {
      path: '/admin/users',
      duration: 18,
      title: '\u{1F465} User Management',
      narration: '500 users across 14 external organisations. 9 role levels from System Administrator down to Debtor, with an 11-permission RBAC matrix. Add User writes through to the live API.',
      actions: [
        { delay: 1000, action: { type: 'HIGHLIGHT', selector: '[data-demo="users-table"]', durationMs: 3000 } },
        { delay: 4500, action: { type: 'SCROLL_TO', selector: '[data-demo="users-rbac-matrix"]', block: 'start' } },
        { delay: 7000, action: { type: 'HIGHLIGHT', selector: '[data-demo="users-rbac-matrix"]', durationMs: 3000 } },
        { delay: 11000, action: { type: 'CLICK', selector: '[data-demo="users-add"]' } },
        // Close the modal within this step — leaving it open would sit over
        // every page that follows.
        { delay: 15000, action: { type: 'CLICK', selector: '[data-demo="users-add-cancel"]' } },
      ],
    },
    {
      path: '/admin/reports',
      duration: 16,
      title: '\u{1F4CA} Report Builder',
      narration: 'Six one-click report tiles over 110 applications, or filter by product, status, region and debt. Generate renders the table and status breakdown; CSV downloads it.',
      actions: [
        { delay: 1000, action: { type: 'CLICK', selector: '[data-demo="report-tile-approved"]' } },
        { delay: 3500, action: { type: 'CLICK', selector: '[data-demo="report-tile-high-debt"]' } },
        { delay: 6000, action: { type: 'CLICK', selector: '[data-demo="report-generate"]' } },
        { delay: 8500, action: { type: 'SLOW_SCROLL', durationMs: 4000 } },
        { delay: 13000, action: { type: 'CLICK', selector: '[data-demo="report-export-csv"]' } },
      ],
    },
    {
      // CSV rather than PDF: exportPDF opens a print dialog, which is a modal
      // the demo player cannot dismiss and would stall an unattended run.
      path: '/admin/mi-reports',
      duration: 18,
      title: '\u{1F4C8} Management Information',
      narration: 'Senior management MI by period — week through year. Volumes, SLA compliance, per-product and per-officer performance, and the SLA breach list, all re-based per period. Exports to CSV.',
      actions: [
        { delay: 1000, action: { type: 'CLICK', selector: '[data-demo="mi-period-week"]' } },
        { delay: 3500, action: { type: 'CLICK', selector: '[data-demo="mi-period-month"]' } },
        { delay: 6000, action: { type: 'CLICK', selector: '[data-demo="mi-period-quarter"]' } },
        { delay: 8500, action: { type: 'CLICK', selector: '[data-demo="mi-period-year"]' } },
        { delay: 11000, action: { type: 'SLOW_SCROLL', durationMs: 4500 } },
        { delay: 16000, action: { type: 'CLICK', selector: '[data-demo="mi-export-csv"]' } },
      ],
    },
    {
      path: '/admin/integration-monitor',
      duration: 12,
      title: '\u{1F517} Integration Health',
      narration: 'All 6 AiB systems connected — BASYS, eDEN, DAS Register, CFT, Moratorium, RoI. 137ms average latency, 0.01% error rate, and the one eDEN timeout auto-retried and resolved.',
      actions: [
        { delay: 1000, action: { type: 'HIGHLIGHT', selector: '[data-demo="integration-cards"]', durationMs: 3500 } },
        { delay: 5000, action: { type: 'SLOW_SCROLL', durationMs: 5500 } },
      ],
    },
    {
      path: '/admin/system-health',
      duration: 16,
      title: '\u{1F49A} System Health',
      narration: 'All twelve logical services healthy — 0.02% error rate, 104ms average response. Latency and uptime per service, from the API Gateway at 45ms to the Integration Orchestrator at 245ms. Three incidents in the last 72 hours, all resolved: an RoI check timeout, a ClamAV connection reset and a credit provider latency spike.',
      actions: [
        { delay: 1000, action: { type: 'HIGHLIGHT', selector: '[data-demo="health-summary"]', durationMs: 3000 } },
        { delay: 4500, action: { type: 'HIGHLIGHT', selector: '[data-demo="health-services"]', durationMs: 3500 } },
        { delay: 8500, action: { type: 'HIGHLIGHT', selector: '[data-demo="health-incidents"]', durationMs: 3000 } },
      ],
    },

    // Platform-wide views and the closing architecture beat
    {
      path: '/statistics',
      duration: 22,
      title: '\u{1F4C9} Statistics & Analytics',
      narration: 'Volume, status and product mix, SLA performance, adviser activity, debt distribution and regional spread — selectable across 7 days to 12 months.',
      actions: [
        { delay: 1000, action: { type: 'HIGHLIGHT', selector: '[data-demo="statistics-kpis"]', durationMs: 3000 } },
        { delay: 4500, action: { type: 'SLOW_SCROLL', durationMs: 16000 } },
      ],
    },
    {
      path: '/security',
      duration: 22,
      title: '\u{1F6E1}️ Security Operations',
      narration: 'SOC view: 24-hour attack timeline, Sophos endpoint state, Tenable vulnerability summary, active incidents, access anomalies and Sysmon process alerts. 47 attempts blocked today.',
      actions: [
        { delay: 1000, action: { type: 'HIGHLIGHT', selector: '[data-demo="security-threat-banner"]', durationMs: 3000 } },
        { delay: 4500, action: { type: 'SLOW_SCROLL', durationMs: 16000 } },
      ],
    },
    {
      // Final content beat — the presenter closes on cost and the AWS target.
      path: '/architecture',
      duration: 30,
      title: '\u{1F3D7}️ Architecture & Production Path',
      narration: 'Twelve logical services, deployed as one container on a free tier — that is a deliberate cost choice, not a compromise on the decomposition. Everything you have seen runs for £0/month. The table maps all 19 layers to the production target: .NET on ECS Fargate, RDS Multi-AZ, S3 and CloudFront in Scottish Government AWS, eu-west-2. The second table is why AWS over Azure.',
      actions: [
        { delay: 1000, action: { type: 'SCROLL_TO', selector: '[data-demo="logical-vs-physical"]', block: 'start' } },
        { delay: 4000, action: { type: 'SCROLL_TO', selector: '[data-demo="cost-story"]', block: 'start' } },
        { delay: 7000, action: { type: 'SCROLL_TO', selector: '[data-demo="production-stack"]', block: 'start' } },
        { delay: 9500, action: { type: 'SLOW_SCROLL', durationMs: 8000 } },
        { delay: 18500, action: { type: 'SCROLL_TO', selector: '[data-demo="aws-comparison"]', block: 'start' } },
        { delay: 21000, action: { type: 'SLOW_SCROLL', durationMs: 7000 } },
      ],
    },
    {
      path: '/',
      duration: 6,
      title: '\u{1F3C1} Demo Complete',
      narration: 'Live API • 57+ pages • 904 tests • 12 AI capabilities • 32 admin features • £0/month. Questions?',
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
  const barRef = useRef<HTMLDivElement>(null);

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
    // Force assets so the Assets page has rows to show — the script walks every
    // page of the form and an empty "no assets declared" panel reads as a gap.
    const app = generateRandomApplication({ alwaysDeclareAssets: true });
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

  // Publish the narration bar's height as a CSS variable so the other fixed
  // bottom chrome (the Ask AiB launcher) can sit clear of it. Measured rather
  // than hardcoded: the narration line-clamps to two lines and the controls
  // reflow on narrow viewports, so the height is not a constant.
  useEffect(() => {
    const root = document.documentElement;
    const clear = () => root.style.removeProperty('--demo-bar-height');
    const el = barRef.current;
    if (!active || !el) {
      clear();
      return;
    }

    const publish = () => root.style.setProperty('--demo-bar-height', `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);

    return () => {
      observer.disconnect();
      clear();
    };
  }, [active]);

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
    <div ref={barRef} className="fixed bottom-0 left-0 right-0 z-50 print:hidden">
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
