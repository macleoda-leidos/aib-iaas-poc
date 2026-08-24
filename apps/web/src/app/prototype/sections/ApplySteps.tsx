import { Section } from '../Section';
import { DEMO_FORM_DATA, DEMO_TOTALS } from '../data/demo-form-data';

/** Navigation bar shown at top of each wizard step */
function StepNav({ currentStep }: { currentStep: number }) {
  const SECTIONS = [
    { id: 'personal', label: 'Personal Details', icon: '👤' },
    { id: 'address', label: 'Address History', icon: '🏠' },
    { id: 'debts', label: 'Debts', icon: '💳' },
    { id: 'income', label: 'Income & Expenditure', icon: '💰' },
    { id: 'assets', label: 'Assets', icon: '🏡' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'checks', label: 'System Checks', icon: '🔍' },
    { id: 'recommendation', label: 'Recommendation', icon: '✅' },
    { id: 'payment', label: 'Payment & Submit', icon: '💳' },
  ];

  return (
    <div className="flex flex-wrap gap-1 mb-6">
      {SECTIONS.map((section, i) => {
        const isActive = i === currentStep;
        const isComplete = i < currentStep;
        return (
          <a
            key={section.id}
            href={`#apply-step-${i + 1}`}
            className={`relative p-2 rounded border text-center text-xs no-underline min-w-[70px] ${
              isActive
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-300 font-bold'
                : 'border-gray-200 bg-white hover:border-gray-400'
            }`}
          >
            <div className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border ${
              isComplete ? 'bg-green-500 border-green-600' : isActive ? 'bg-amber-400 border-amber-500' : 'bg-gray-300 border-gray-400'
            }`} />
            <div className="text-sm mb-0.5">{section.icon}</div>
            <div className="leading-tight">{section.label}</div>
          </a>
        );
      })}
    </div>
  );
}

/** Navigation buttons at bottom of each step */
function StepButtons({ step, total = 9 }: { step: number; total?: number }) {
  return (
    <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
      {step > 1 ? (
        <a href={`#apply-step-${step - 1}`} className="bg-gray-200 text-gray-900 font-bold py-2 px-4 border-b-2 border-gray-400 no-underline text-sm">← Previous</a>
      ) : <span />}
      <span className="text-sm text-gray-500 self-center">Section {step} of {total}</span>
      {step < total ? (
        <a href={`#apply-step-${step + 1}`} className="bg-green-700 text-white font-bold py-2 px-4 border-b-2 border-green-900 no-underline text-sm">Next →</a>
      ) : <span />}
    </div>
  );
}

function FormField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <label className="block font-bold mb-1 text-sm">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-1">{hint}</p>}
      <div className="border-2 border-gray-900 p-2.5 min-h-[44px] bg-gray-50 text-sm">{value}</div>
    </div>
  );
}

export function ApplySteps() {
  const d = DEMO_FORM_DATA;
  return (
    <>
      {/* Step 1: Personal Details */}
      <Section id="apply-step-1" title="Apply — Personal Details" screenNumber={12}>
        <h1 className="text-2xl font-bold mb-2">Apply for Debt Advice</h1>
        <p className="text-gray-600 mb-4 text-sm">Complete each section below. You can navigate between sections freely.</p>
        <StepNav currentStep={0} />

        <div className="border-2 rounded-lg p-4 ring-2 ring-green-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">👤</span>
            <h2 className="text-lg font-bold">Personal Details & Aliases</h2>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold text-white bg-green-500">Complete</span>
          </div>

          {/* Identity verification */}
          <div className="border-2 border-blue-200 rounded p-3 bg-blue-50 mb-4">
            <h3 className="font-bold text-sm mb-2">🔐 Verify Your Identity</h3>
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-sm font-bold text-green-800">Identity Verified via ScotAccount</p>
                <p className="text-xs text-green-600">Assurance Level: LOA2 (Medium confidence) — Details pre-filled</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Title" value={d.personal.title} />
            <div />
            <FormField label="First name *" value={d.personal.firstName} />
            <FormField label="Last name *" value={d.personal.lastName} />
          </div>
          <div className="mt-3 space-y-3">
            <FormField label="Date of birth *" value={d.personal.dateOfBirth} hint="YYYY-MM-DD format" />
            <FormField label="National Insurance number" value={d.personal.nationalInsuranceNumber} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Marital status *" value="Married" />
              <FormField label="Number of dependants" value={String(d.personal.dependants)} />
            </div>
            <FormField label="Employment status *" value="Employed" />
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200">
            <h3 className="font-bold text-sm mb-2">Other Names / Aliases</h3>
            <div className="bg-gray-50 p-2 rounded text-sm">
              <span className="font-medium">Johnny Testerton</span> <span className="text-gray-500">(Other)</span>
            </div>
          </div>
        </div>
        <StepButtons step={1} />
      </Section>

      {/* Step 2: Address History */}
      <Section id="apply-step-2" title="Apply — Address History" screenNumber={13}>
        <StepNav currentStep={1} />
        <div className="border-2 rounded-lg p-4 ring-2 ring-green-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏠</span>
            <h2 className="text-lg font-bold">Address History (5yr)</h2>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold text-white bg-green-500">Complete</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <p className="text-sm"><strong>5-Year Address History Required:</strong> Please provide all addresses from the last 5 years.</p>
          </div>

          <h3 className="font-bold text-sm mb-2">Current Address</h3>
          <div className="space-y-3">
            <FormField label="Address line 1 *" value={d.address.line1} />
            <FormField label="Address line 2" value={d.address.line2 || ''} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="City *" value={d.address.city} />
              <FormField label="County" value={d.address.county || ''} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Postcode *" value={d.address.postcode} />
              <FormField label="Resident since *" value={d.address.residentSince} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200">
            <h3 className="font-bold text-sm mb-2">Previous Addresses</h3>
            <div className="border border-gray-300 rounded p-3">
              <p className="font-bold text-sm mb-1">Previous Address 1</p>
              <p className="text-sm">{d.address.previousAddresses[0].line1}, {d.address.previousAddresses[0].city}, {d.address.previousAddresses[0].postcode}</p>
              <p className="text-xs text-gray-500">{d.address.previousAddresses[0].dateFrom} to {d.address.previousAddresses[0].dateTo}</p>
            </div>
          </div>

          <h3 className="font-bold text-sm mt-4 mb-2">Contact Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email address *" value={d.address.email} />
            <FormField label="Phone number *" value={d.address.phone} />
          </div>
        </div>
        <StepButtons step={2} />
      </Section>

      {/* Step 3: Debts */}
      <Section id="apply-step-3" title="Apply — Debts" screenNumber={14}>
        <StepNav currentStep={2} />
        <div className="border-2 rounded-lg p-4 ring-2 ring-green-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💳</span>
            <h2 className="text-lg font-bold">Debts</h2>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold text-white bg-green-500">Complete</span>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-3 mb-4">
            <p className="font-bold">Total debt entered: £{DEMO_TOTALS.totalDebt.toLocaleString()}</p>
            <p className="text-sm text-gray-600">{DEMO_TOTALS.creditorCount} creditors</p>
          </div>

          {d.debts.items.map((debt, i) => (
            <div key={i} className="border border-gray-300 p-3 rounded mb-3">
              <p className="font-bold text-sm mb-2">Debt {i + 1}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Creditor:</span> {debt.creditorName}</div>
                <div><span className="font-medium">Type:</span> {debt.creditorType}</div>
                <div><span className="font-medium">Outstanding:</span> £{debt.outstandingAmount.toLocaleString()}</div>
                <div><span className="font-medium">Monthly payment:</span> £{debt.monthlyPayment}</div>
              </div>
            </div>
          ))}
        </div>
        <StepButtons step={3} />
      </Section>

      {/* Step 4: Income & Expenditure */}
      <Section id="apply-step-4" title="Apply — Income & Expenditure" screenNumber={15}>
        <StepNav currentStep={3} />
        <div className="border-2 rounded-lg p-4 ring-2 ring-green-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💰</span>
            <h2 className="text-lg font-bold">Income & Expenditure</h2>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold text-white bg-green-500">Complete</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <p className="text-xs"><strong>📋 Common Financial Tool (CFT):</strong> Categories aligned with the Common Financial Tool used across all Scottish debt solutions.</p>
          </div>

          <h3 className="font-bold text-sm mb-2">Monthly Income</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <FormField label="Wages/Salary (£)" value={String(d.income.wages)} />
            <FormField label="Benefits (£)" value={String(d.income.benefits)} />
            <FormField label="Pension (£)" value={String(d.income.pension)} />
            <FormField label="Other income (£)" value={String(d.income.other)} />
          </div>
          <div className="bg-blue-50 p-3 rounded mb-4"><strong>Total income: £{DEMO_TOTALS.totalIncome.toLocaleString()}/month</strong></div>

          <h3 className="font-bold text-sm mb-2">Monthly Expenditure</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <FormField label="Rent/Mortgage (£)" value={String(d.expenditure.rent)} />
            <FormField label="Council Tax (£)" value={String(d.expenditure.councilTax)} />
            <FormField label="Utilities (£)" value={String(d.expenditure.utilities)} />
            <FormField label="Food (£)" value={String(d.expenditure.food)} />
            <FormField label="Transport (£)" value={String(d.expenditure.transport)} />
            <FormField label="Insurance (£)" value={String(d.expenditure.insurance)} />
            <FormField label="Childcare (£)" value={String(d.expenditure.childcare)} />
            <FormField label="Other (£)" value={String(d.expenditure.other)} />
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <p><strong>Total expenditure: £{DEMO_TOTALS.totalExpenditure.toLocaleString()}/month</strong></p>
            <p className="font-bold mt-1 text-green-700">Disposable income: £{DEMO_TOTALS.disposableIncome.toLocaleString()}/month</p>
          </div>
        </div>
        <StepButtons step={4} />
      </Section>

      {/* Step 5: Assets */}
      <Section id="apply-step-5" title="Apply — Assets" screenNumber={16}>
        <StepNav currentStep={4} />
        <div className="border-2 rounded-lg p-4 ring-2 ring-green-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏡</span>
            <h2 className="text-lg font-bold">Assets</h2>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold text-white bg-green-500">Complete</span>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-3 mb-4">
            <p className="font-bold">Total declared asset value: £{DEMO_TOTALS.totalAssetValue.toLocaleString()}</p>
          </div>

          <div className="border border-gray-200 rounded p-3 mb-3">
            <h4 className="font-bold text-sm mb-2">🏠 Property</h4>
            <p className="text-sm text-gray-500">No properties declared</p>
          </div>

          <div className="border border-gray-200 rounded p-3 mb-3">
            <h4 className="font-bold text-sm mb-2">🚗 Vehicles</h4>
            <div className="text-sm">
              <p><strong>{d.assets.vehicles[0].description}</strong></p>
              <p className="text-gray-600">Value: £{d.assets.vehicles[0].value.toLocaleString()} • Finance: £{d.assets.vehicles[0].finance} • Essential for work: Yes</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded p-3 mb-3">
            <h4 className="font-bold text-sm mb-2">💰 Savings & Investments</h4>
            <div className="text-sm">
              <p><strong>{d.assets.savings[0].provider}</strong> ({d.assets.savings[0].type.replace('_', ' ')})</p>
              <p className="text-gray-600">Balance: £{d.assets.savings[0].value}</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded p-3">
            <h4 className="font-bold text-sm mb-2">📦 Other Assets</h4>
            <p className="text-sm text-gray-500">None declared</p>
          </div>
        </div>
        <StepButtons step={5} />
      </Section>

      {/* Step 6: Documents */}
      <Section id="apply-step-6" title="Apply — Documents" screenNumber={17}>
        <StepNav currentStep={5} />
        <div className="border-2 rounded-lg p-4 ring-2 ring-green-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📄</span>
            <h2 className="text-lg font-bold">Documents</h2>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold text-white bg-green-500">Complete</span>
          </div>

          <p className="text-sm text-gray-600 mb-4">Upload supporting documents. This is <strong>optional</strong> but may speed up processing.</p>

          <div className="border-2 border-dashed border-gray-400 p-6 text-center bg-gray-50 mb-4">
            <p className="text-gray-700 mb-1">Drag & drop files here, or click to browse</p>
            <p className="text-sm text-gray-500">PDF, JPG, PNG • Max 10MB per file</p>
          </div>

          <div className="space-y-2">
            {d.documents.files.map((file, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                <div>
                  <span className="text-sm font-medium">📄 {file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({file.size})</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">✓ Uploaded</span>
              </div>
            ))}
          </div>
        </div>
        <StepButtons step={6} />
      </Section>

      {/* Step 7: System Checks */}
      <Section id="apply-step-7" title="Apply — System Checks" screenNumber={18}>
        <StepNav currentStep={6} />
        <div className="border-2 rounded-lg p-4 ring-2 ring-green-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔍</span>
            <h2 className="text-lg font-bold">System Checks</h2>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold text-white bg-green-500">Complete</span>
          </div>

          <p className="text-sm text-gray-600 mb-4">Cross-system checks verify you have no existing active cases with AiB.</p>

          <div className="space-y-2 mb-4">
            {d.checks.results.map((check, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                <div>
                  <span className="font-bold text-sm">{check.system}</span>
                  <span className="text-xs text-gray-500 ml-2">{check.detail}</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">✓ Clear</span>
              </div>
            ))}
          </div>

          <div className="border rounded p-3 bg-gray-50">
            <p className="text-sm font-bold">Credit Check: Score {d.checks.creditCheck.score} ({d.checks.creditCheck.band})</p>
            <p className="text-xs text-gray-500">Provider: {d.checks.creditCheck.provider}</p>
            <p className="text-xs text-gray-500">Defaults: {d.checks.creditCheck.defaults} • CCJs: {d.checks.creditCheck.ccjs}</p>
          </div>
        </div>
        <StepButtons step={7} />
      </Section>

      {/* Step 8: Recommendation */}
      <Section id="apply-step-8" title="Apply — Recommendation" screenNumber={19}>
        <StepNav currentStep={7} />
        <div className="border-2 rounded-lg p-4 ring-2 ring-green-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">✅</span>
            <h2 className="text-lg font-bold">Recommendation</h2>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold text-white bg-green-500">Complete</span>
          </div>

          <div className="bg-green-700 text-white p-6 rounded text-center mb-4">
            <p className="text-sm uppercase tracking-wide mb-1">Recommended Debt Solution</p>
            <p className="text-2xl font-bold">{d.recommendation.product}</p>
            <p className="text-sm mt-2 opacity-90">Confidence: {d.recommendation.confidence}%</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
            <h3 className="font-bold text-sm mb-2">Why this recommendation?</h3>
            <p className="text-sm text-gray-700">{d.recommendation.reason}</p>
          </div>

          <div className="border border-gray-200 rounded p-3">
            <h4 className="font-bold text-sm mb-2">Alternative considered</h4>
            <p className="text-sm"><strong>{d.recommendation.alternatives[0].product}:</strong> {d.recommendation.alternatives[0].reason}</p>
          </div>
        </div>
        <StepButtons step={8} />
      </Section>

      {/* Step 9: Payment & Submit */}
      <Section id="apply-step-9" title="Apply — Payment & Submit" screenNumber={20}>
        <StepNav currentStep={8} />
        <div className="border-2 rounded-lg p-4 ring-2 ring-green-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💳</span>
            <h2 className="text-lg font-bold">Payment & Submit</h2>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold text-white bg-green-500">Complete</span>
          </div>

          <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-bold text-green-800">Payment Successful</p>
                <p className="text-sm text-green-700">Reference: {d.payment.reference}</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded p-4 mb-4">
            <h3 className="font-bold text-sm mb-3">Payment Summary</h3>
            <div className="flex justify-between text-sm mb-2">
              <span>Application fee</span>
              <span className="font-bold">£{d.payment.amount}.00</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span>Payment method</span>
              <span>Debit/Credit Card</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-bold text-sm mb-2">What happens next?</h3>
            <ol className="text-sm space-y-1 list-decimal pl-4">
              <li>Your application will be reviewed by an AiB case officer</li>
              <li>A money adviser will be assigned to support you</li>
              <li>You'll receive confirmation within 5 working days</li>
              <li>You can track progress on your <a href="#dashboard-debtor" className="text-gov-blue">dashboard</a></li>
            </ol>
          </div>

          <div className="mt-4 text-center">
            <a href="#dashboard-debtor" className="inline-block bg-gov-green text-white font-bold py-3 px-8 no-underline hover:bg-green-800">
              Go to My Dashboard →
            </a>
          </div>
        </div>
        <StepButtons step={9} />
      </Section>
    </>
  );
}
