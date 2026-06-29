'use client';

import { useState } from 'react';

const STEPS = [
  { id: 'personal', label: 'Personal Details' },
  { id: 'address', label: 'Address & Contact' },
  { id: 'debts', label: 'Debts' },
  { id: 'income', label: 'Income & Expenditure' },
  { id: 'documents', label: 'Documents' },
  { id: 'checks', label: 'System Checks' },
  { id: 'recommendation', label: 'Recommendation' },
  { id: 'payment', label: 'Payment' },
];

export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const updateField = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const nextStep = () => setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 0));

  return (
    <div className="gov-main">
      {/* Step indicator */}
      <nav aria-label="Application progress" className="mb-8">
        <ol className="flex flex-wrap gap-1">
          {STEPS.map((step, i) => (
            <li key={step.id} className="flex items-center text-sm">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-1
                ${i < currentStep ? 'bg-gov-green text-white' : i === currentStep ? 'bg-gov-blue text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < currentStep ? '✓' : i + 1}
              </span>
              <span className={`hidden md:inline text-xs ${i === currentStep ? 'font-bold' : 'text-gray-500'}`}>
                {step.label}
              </span>
              {i < STEPS.length - 1 && <span className="mx-1 text-gray-300">›</span>}
            </li>
          ))}
        </ol>
      </nav>

      <h1>{STEPS[currentStep].label}</h1>

      {/* Step content */}
      {currentStep === 0 && <PersonalDetailsStep formData={formData} updateField={updateField} />}
      {currentStep === 1 && <AddressStep formData={formData} updateField={updateField} />}
      {currentStep === 2 && <DebtsStep formData={formData} updateField={updateField} />}
      {currentStep === 3 && <IncomeStep formData={formData} updateField={updateField} />}
      {currentStep === 4 && <DocumentsStep />}
      {currentStep === 5 && <SystemChecksStep formData={formData} />}
      {currentStep === 6 && <RecommendationStep formData={formData} />}
      {currentStep === 7 && <PaymentStep />}

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-300">
        {currentStep > 0 && (
          <button onClick={prevStep} className="bg-gray-200 text-gray-900 font-bold py-3 px-6 border-b-2 border-gray-400 hover:bg-gray-300">
            Back
          </button>
        )}
        {currentStep < STEPS.length - 1 && (
          <button onClick={nextStep} className="bg-gov-green text-white font-bold py-3 px-6 border-b-2 border-green-900 hover:bg-green-800 ml-auto">
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

function PersonalDetailsStep({ formData, updateField }: { formData: any; updateField: any }) {
  const d = formData.personal || {};
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <label htmlFor="title" className="block font-bold mb-1">Title</label>
        <select id="title" value={d.title || ''} onChange={e => updateField('personal', 'title', e.target.value)}
          className="border-2 border-gray-900 p-2 w-32">
          <option value="">Select</option>
          {['Mr', 'Mrs', 'Ms', 'Miss', 'Dr'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <InputField id="firstName" label="First name" required value={d.firstName}
        onChange={v => updateField('personal', 'firstName', v)} />
      <InputField id="middleName" label="Middle name (optional)" value={d.middleName}
        onChange={v => updateField('personal', 'middleName', v)} />
      <InputField id="lastName" label="Last name" required value={d.lastName}
        onChange={v => updateField('personal', 'lastName', v)} />
      <InputField id="dob" label="Date of birth" type="date" required value={d.dateOfBirth}
        onChange={v => updateField('personal', 'dateOfBirth', v)} hint="For example, 1985-03-15" />
      <InputField id="nino" label="National Insurance number" value={d.nationalInsuranceNumber}
        onChange={v => updateField('personal', 'nationalInsuranceNumber', v)}
        hint="For example, QQ 12 34 56 C" />

      <div className="mb-6">
        <label htmlFor="maritalStatus" className="block font-bold mb-1">Marital status</label>
        <select id="maritalStatus" value={d.maritalStatus || ''} onChange={e => updateField('personal', 'maritalStatus', e.target.value)}
          className="border-2 border-gray-900 p-2 w-full max-w-md">
          <option value="">Select</option>
          {[['single','Single'],['married','Married'],['civil_partnership','Civil Partnership'],['divorced','Divorced'],['widowed','Widowed'],['separated','Separated']].map(([v,l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <InputField id="dependants" label="Number of dependants" type="number" value={d.dependants}
        onChange={v => updateField('personal', 'dependants', parseInt(v) || 0)} />

      <div className="mb-6">
        <label htmlFor="employment" className="block font-bold mb-1">Employment status</label>
        <select id="employment" value={d.employmentStatus || ''} onChange={e => updateField('personal', 'employmentStatus', e.target.value)}
          className="border-2 border-gray-900 p-2 w-full max-w-md">
          <option value="">Select</option>
          {[['employed','Employed'],['self_employed','Self-employed'],['unemployed','Unemployed'],['retired','Retired'],['student','Student'],['other','Other']].map(([v,l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function AddressStep({ formData, updateField }: { formData: any; updateField: any }) {
  const a = formData.address || {};
  const [postcodeLookupResult, setPostcodeLookupResult] = useState<any[]>([]);

  const lookupPostcode = async () => {
    if (!a.postcode) return;
    try {
      const res = await fetch(`/api/postcode/${a.postcode}`);
      const data = await res.json();
      if (data.success) setPostcodeLookupResult(data.data.addresses);
    } catch { /* ignore in POC */ }
  };

  return (
    <div className="space-y-6">
      <h2>Current address</h2>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <InputField id="postcode" label="Postcode" value={a.postcode}
            onChange={v => updateField('address', 'postcode', v)} hint="Enter postcode to look up address" />
        </div>
        <button onClick={lookupPostcode} type="button"
          className="bg-gov-blue text-white py-2 px-4 mb-6 hover:bg-gov-dark-blue">
          Find address
        </button>
      </div>

      {postcodeLookupResult.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-300">
          <p className="font-bold mb-2">Select an address:</p>
          {postcodeLookupResult.map((addr: any, i: number) => (
            <button key={i} type="button" className="block text-left text-gov-blue underline mb-1 hover:text-gov-dark-blue"
              onClick={() => {
                updateField('address', 'line1', addr.line1);
                updateField('address', 'line2', addr.line2 || '');
                updateField('address', 'city', addr.city);
                setPostcodeLookupResult([]);
              }}>
              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}
            </button>
          ))}
        </div>
      )}

      <InputField id="line1" label="Address line 1" required value={a.line1}
        onChange={v => updateField('address', 'line1', v)} />
      <InputField id="line2" label="Address line 2 (optional)" value={a.line2}
        onChange={v => updateField('address', 'line2', v)} />
      <InputField id="city" label="City or town" required value={a.city}
        onChange={v => updateField('address', 'city', v)} />
      <InputField id="county" label="County (optional)" value={a.county}
        onChange={v => updateField('address', 'county', v)} />

      <h2 className="mt-8">Contact details</h2>
      <InputField id="email" label="Email address" type="email" required value={a.email}
        onChange={v => updateField('address', 'email', v)} />
      <InputField id="phone" label="Phone number" type="tel" required value={a.phone}
        onChange={v => updateField('address', 'phone', v)} />
    </div>
  );
}

function DebtsStep({ formData, updateField }: { formData: any; updateField: any }) {
  const debts = formData.debts?.items || [];

  const addDebt = () => {
    const items = [...debts, { creditorName: '', outstandingAmount: 0, creditorType: 'other', monthlyPayment: 0 }];
    updateField('debts', 'items', items);
  };

  const updateDebt = (index: number, field: string, value: any) => {
    const items = [...debts];
    items[index] = { ...items[index], [field]: value };
    updateField('debts', 'items', items);
  };

  const totalDebt = debts.reduce((sum: number, d: any) => sum + (parseFloat(d.outstandingAmount) || 0), 0);

  return (
    <div className="space-y-6">
      <p>Enter details of all your debts. Include all creditors you owe money to.</p>

      <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 mb-4">
        <p className="text-sm"><strong>Total debt so far: £{totalDebt.toLocaleString()}</strong></p>
      </div>

      {debts.map((debt: any, i: number) => (
        <div key={i} className="border border-gray-300 p-4 mb-4">
          <h3 className="text-base font-bold mb-3">Debt {i + 1}</h3>
          <InputField id={`cred-${i}`} label="Creditor name" value={debt.creditorName}
            onChange={v => updateDebt(i, 'creditorName', v)} />
          <div className="mb-4">
            <label className="block font-bold mb-1">Debt type</label>
            <select value={debt.creditorType} onChange={e => updateDebt(i, 'creditorType', e.target.value)}
              className="border-2 border-gray-900 p-2 w-full max-w-sm">
              {[['bank','Bank/Building Society'],['credit_card','Credit Card'],['loan_company','Loan Company'],['utility','Utility'],['council_tax','Council Tax'],['hmrc','HMRC'],['other','Other']].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <InputField id={`amount-${i}`} label="Outstanding amount (£)" type="number" value={debt.outstandingAmount}
            onChange={v => updateDebt(i, 'outstandingAmount', v)} />
          <InputField id={`payment-${i}`} label="Monthly payment (£)" type="number" value={debt.monthlyPayment}
            onChange={v => updateDebt(i, 'monthlyPayment', v)} />
        </div>
      ))}

      <button onClick={addDebt} type="button"
        className="bg-gray-200 text-gray-900 font-bold py-2 px-4 border-b-2 border-gray-400 hover:bg-gray-300">
        + Add another debt
      </button>
    </div>
  );
}

function IncomeStep({ formData, updateField }: { formData: any; updateField: any }) {
  const inc = formData.income || {};
  const exp = formData.expenditure || {};

  const totalIncome = (parseFloat(inc.wages) || 0) + (parseFloat(inc.benefits) || 0) +
    (parseFloat(inc.pension) || 0) + (parseFloat(inc.other) || 0);
  const totalExpenditure = (parseFloat(exp.rent) || 0) + (parseFloat(exp.councilTax) || 0) +
    (parseFloat(exp.utilities) || 0) + (parseFloat(exp.food) || 0) + (parseFloat(exp.transport) || 0) +
    (parseFloat(exp.insurance) || 0) + (parseFloat(exp.childcare) || 0) + (parseFloat(exp.other) || 0);

  return (
    <div className="space-y-6">
      <h2>Monthly Income</h2>
      <InputField id="wages" label="Wages/Salary (£)" type="number" value={inc.wages} onChange={v => updateField('income', 'wages', v)} />
      <InputField id="benefits" label="Benefits (£)" type="number" value={inc.benefits} onChange={v => updateField('income', 'benefits', v)} />
      <InputField id="pension" label="Pension (£)" type="number" value={inc.pension} onChange={v => updateField('income', 'pension', v)} />
      <InputField id="otherIncome" label="Other income (£)" type="number" value={inc.other} onChange={v => updateField('income', 'other', v)} />

      <div className="bg-blue-50 p-4 border-l-4 border-gov-blue">
        <p className="font-bold">Total monthly income: £{totalIncome.toLocaleString()}</p>
      </div>

      <h2 className="mt-8">Monthly Expenditure</h2>
      <InputField id="rent" label="Rent/Mortgage (£)" type="number" value={exp.rent} onChange={v => updateField('expenditure', 'rent', v)} />
      <InputField id="councilTax" label="Council Tax (£)" type="number" value={exp.councilTax} onChange={v => updateField('expenditure', 'councilTax', v)} />
      <InputField id="utilities" label="Utilities (£)" type="number" value={exp.utilities} onChange={v => updateField('expenditure', 'utilities', v)} />
      <InputField id="food" label="Food & housekeeping (£)" type="number" value={exp.food} onChange={v => updateField('expenditure', 'food', v)} />
      <InputField id="transport" label="Transport (£)" type="number" value={exp.transport} onChange={v => updateField('expenditure', 'transport', v)} />
      <InputField id="insurance" label="Insurance (£)" type="number" value={exp.insurance} onChange={v => updateField('expenditure', 'insurance', v)} />
      <InputField id="childcare" label="Childcare (£)" type="number" value={exp.childcare} onChange={v => updateField('expenditure', 'childcare', v)} />
      <InputField id="otherExp" label="Other expenditure (£)" type="number" value={exp.other} onChange={v => updateField('expenditure', 'other', v)} />

      <div className="bg-blue-50 p-4 border-l-4 border-gov-blue">
        <p className="font-bold">Total monthly expenditure: £{totalExpenditure.toLocaleString()}</p>
        <p className="font-bold mt-2">Disposable income: £{(totalIncome - totalExpenditure).toLocaleString()}/month</p>
      </div>
    </div>
  );
}

function DocumentsStep() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="space-y-6">
      <p>Upload supporting documents to help with your application. This is optional but may speed up processing.</p>

      <div className="border-2 border-dashed border-gray-400 p-8 text-center bg-gray-50 hover:border-gray-600 cursor-pointer"
        onClick={() => document.getElementById('file-input')?.click()}>
        <p className="text-gray-700 mb-2">Drag and drop files here or click to browse</p>
        <p className="text-sm text-gray-500">Accepted: PDF, JPG, PNG, DOC/DOCX (max 10MB each)</p>
        <input id="file-input" type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={e => e.target.files && setFiles(prev => [...prev, ...Array.from(e.target.files!)])} />
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">Uploaded files:</h3>
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between bg-gray-50 p-3 border border-gray-200">
                <span className="text-sm">📄 {f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-600 text-sm hover:underline">Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="gov-inset mt-6">
        <p className="text-sm">Useful documents include: recent payslips, bank statements, creditor letters, proof of benefits.</p>
      </div>
    </div>
  );
}

function SystemChecksStep({ formData }: { formData: any }) {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runChecks = async () => {
    setChecking(true);
    // Simulate calling the integration orchestrator
    await new Promise(r => setTimeout(r, 2000));
    setResults({
      checks: [
        { system: 'BASYS', found: false, status: 'No existing sequestration found' },
        { system: 'eDEN/DASH', found: false, status: 'No DAS arrangement found' },
        { system: 'DAS', found: false, status: 'No active Debt Payment Programme' },
        { system: 'CFT', found: true, status: '3 registered providers available in your area' },
        { system: 'Moratorium', found: false, status: 'No active moratorium' },
        { system: 'RoI', found: false, status: 'No entry on Register of Insolvencies' },
      ],
      creditCheck: { score: 520, status: 'issues_found', defaults: 1, provider: 'SyntheticCredit Ltd (PLACEHOLDER)' },
    });
    setChecking(false);
  };

  return (
    <div className="space-y-6">
      <p>We need to check existing AiB systems to see if you have any current or previous cases.</p>

      <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
        <p className="text-sm"><strong>Note:</strong> These are placeholder integration checks. In the live service, these would connect to actual AiB systems (BASYS, eDEN/DASH, DAS, CFT, Moratorium, RoI).</p>
      </div>

      {!results && (
        <button onClick={runChecks} disabled={checking}
          className="bg-gov-blue text-white font-bold py-3 px-6 border-b-2 border-blue-900 hover:bg-gov-dark-blue disabled:opacity-50">
          {checking ? 'Running checks...' : 'Run system checks'}
        </button>
      )}

      {checking && (
        <div className="flex items-center gap-3 p-4 bg-blue-50">
          <div className="animate-spin w-5 h-5 border-2 border-gov-blue border-t-transparent rounded-full"></div>
          <span>Checking existing AiB systems...</span>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <h2>System check results</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-2">System</th>
                <th className="text-left py-2">Result</th>
                <th className="text-left py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {results.checks.map((check: any) => (
                <tr key={check.system} className="border-b border-gray-300">
                  <td className="py-2 font-bold">{check.system}</td>
                  <td className="py-2">
                    <span className={`inline-block px-2 py-0.5 text-xs font-bold uppercase ${check.found ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {check.found ? 'Found' : 'Clear'}
                    </span>
                  </td>
                  <td className="py-2 text-sm text-gray-600">{check.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 p-4 border border-gray-300">
            <h3 className="font-bold mb-2">Credit Check (Placeholder)</h3>
            <p className="text-sm">Provider: {results.creditCheck.provider}</p>
            <p className="text-sm">Score: {results.creditCheck.score}/999</p>
            <p className="text-sm">Defaults: {results.creditCheck.defaults}</p>
            <p className="text-xs text-gray-500 mt-2 italic">This is a simulated credit check. No real credit data has been accessed.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationStep({ formData }: { formData: any }) {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);

  const getRecommendation = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setRecommendation({
      product: 'Debt Arrangement Scheme (DAS)',
      productKey: 'debt_arrangement_scheme',
      confidence: 'high',
      reasoning: [
        'Your total debt falls within the DAS eligibility range',
        'You have sufficient disposable income for structured repayment',
        'No existing insolvency proceedings found',
        'DAS provides statutory protection while repaying in full',
      ],
      explanation: 'Based on your financial circumstances, the Debt Arrangement Scheme appears to be the most suitable solution. DAS allows you to repay your debts in full over an extended period through a single affordable monthly payment. While in the scheme, your creditors cannot take enforcement action against you, and interest/charges are frozen.',
    });
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {!recommendation && (
        <>
          <p>Based on the information you have provided, we can now generate a recommendation for the most suitable debt solution.</p>
          <button onClick={getRecommendation} disabled={loading}
            className="bg-gov-green text-white font-bold py-3 px-6 border-b-2 border-green-900 hover:bg-green-800 disabled:opacity-50">
            {loading ? 'Generating recommendation...' : 'Get my recommendation'}
          </button>
        </>
      )}

      {loading && (
        <div className="flex items-center gap-3 p-4 bg-green-50">
          <div className="animate-spin w-5 h-5 border-2 border-gov-green border-t-transparent rounded-full"></div>
          <span>Analysing your financial situation...</span>
        </div>
      )}

      {recommendation && (
        <div>
          <div className="bg-gov-green text-white p-8 text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Our Recommendation</h2>
            <p className="text-3xl font-bold text-white">{recommendation.product}</p>
            <p className="mt-2 text-green-100">Confidence: {recommendation.confidence}</p>
          </div>

          <div className="bg-blue-50 border-l-4 border-gov-blue p-6 mb-6">
            <h3 className="font-bold mb-3">Why we recommend this</h3>
            <ul className="list-disc pl-6 space-y-2">
              {recommendation.reasoning.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="border border-gray-300 p-6 mb-6">
            <h3 className="font-bold mb-3">AI-Assisted Explanation</h3>
            <p className="text-sm text-gray-600 mb-2 italic">(Generated by placeholder AI service — not real AI advice)</p>
            <p className="whitespace-pre-line">{recommendation.explanation}</p>
          </div>

          <div className="gov-warning">
            <p className="text-sm"><strong>Important:</strong> This is an automated recommendation for information only.
            It does not constitute financial or legal advice. We strongly recommend speaking with a qualified
            money adviser before making any decisions.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentStep() {
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const simulatePayment = () => {
    setTimeout(() => setPaymentComplete(true), 1500);
  };

  if (paymentComplete) {
    return (
      <div className="bg-gov-green text-white p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Application submitted successfully</h2>
        <p className="text-xl text-white mb-2">Reference: IAAS-2024-00001</p>
        <p className="text-green-100">Payment of £90.00 received (SANDBOX)</p>
        <p className="text-green-200 text-sm mt-4">This is a placeholder payment — no real transaction has occurred.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p>An application fee of <strong>£90.00</strong> is required to proceed.</p>

      <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 mb-4">
        <p className="text-sm"><strong>Sandbox Mode:</strong> No real payments will be processed. This demonstrates the payment journey only.</p>
      </div>

      <h2>Choose payment method</h2>

      <div className="grid md:grid-cols-3 gap-4">
        <button onClick={() => setPaymentMethod('apple_pay')}
          className={`p-6 border-2 text-center ${paymentMethod === 'apple_pay' ? 'border-gov-blue bg-blue-50' : 'border-gray-300 hover:border-gray-500'}`}>
          <div className="text-2xl mb-2">🍎</div>
          <p className="font-bold">Apple Pay</p>
        </button>
        <button onClick={() => setPaymentMethod('google_pay')}
          className={`p-6 border-2 text-center ${paymentMethod === 'google_pay' ? 'border-gov-blue bg-blue-50' : 'border-gray-300 hover:border-gray-500'}`}>
          <div className="text-2xl mb-2">G</div>
          <p className="font-bold">Google Pay</p>
        </button>
        <button onClick={() => setPaymentMethod('card')}
          className={`p-6 border-2 text-center ${paymentMethod === 'card' ? 'border-gov-blue bg-blue-50' : 'border-gray-300 hover:border-gray-500'}`}>
          <div className="text-2xl mb-2">💳</div>
          <p className="font-bold">Card Payment</p>
        </button>
      </div>

      {paymentMethod === 'card' && (
        <div className="border border-gray-300 p-6 mt-4">
          <h3 className="font-bold mb-4">Card Details (Sandbox)</h3>
          <InputField id="cardName" label="Name on card" onChange={() => {}} />
          <InputField id="cardNumber" label="Card number" onChange={() => {}} hint="Enter any 16 digits for sandbox" />
          <div className="grid grid-cols-2 gap-4">
            <InputField id="expiry" label="Expiry date" onChange={() => {}} hint="MM/YY" />
            <InputField id="cvv" label="CVV" onChange={() => {}} hint="3 digits" />
          </div>
        </div>
      )}

      {paymentMethod === 'apple_pay' && (
        <div className="border border-gray-300 p-6 mt-4 text-center">
          <p className="text-lg mb-4">Apple Pay</p>
          <p className="text-gray-500 text-sm mb-4">In a real implementation, the Apple Pay sheet would appear here.</p>
          <div className="bg-black text-white py-3 px-6 inline-block rounded-lg">Pay with  Pay</div>
        </div>
      )}

      {paymentMethod === 'google_pay' && (
        <div className="border border-gray-300 p-6 mt-4 text-center">
          <p className="text-lg mb-4">Google Pay</p>
          <p className="text-gray-500 text-sm mb-4">In a real implementation, the Google Pay button and flow would appear here.</p>
          <div className="bg-white border-2 border-gray-300 py-3 px-6 inline-block rounded-lg font-bold">G Pay</div>
        </div>
      )}

      {paymentMethod && (
        <button onClick={simulatePayment}
          className="bg-gov-green text-white font-bold py-3 px-8 border-b-2 border-green-900 hover:bg-green-800 mt-4">
          Complete payment (Sandbox) — £90.00
        </button>
      )}
    </div>
  );
}

// Reusable input component
function InputField({ id, label, type = 'text', value, onChange, required, hint }: {
  id: string; label: string; type?: string; value?: any; onChange: (v: string) => void; required?: boolean; hint?: string;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block font-bold mb-1">
        {label} {required && <span className="text-red-700">*</span>}
      </label>
      {hint && <p className="text-sm text-gray-600 mb-1">{hint}</p>}
      <input id={id} type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        required={required}
        className="border-2 border-gray-900 p-2 w-full max-w-md focus:outline-3 focus:outline-yellow-400" />
    </div>
  );
}
