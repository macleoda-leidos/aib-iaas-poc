'use client';

import { useState, useCallback } from 'react';

// Section definitions with validation rules
const SECTIONS = [
  { id: 'personal', label: 'Personal Details & Aliases', icon: '👤' },
  { id: 'address', label: 'Address History (5yr)', icon: '🏠' },
  { id: 'debts', label: 'Debts', icon: '💳' },
  { id: 'income', label: 'Income & Expenditure', icon: '💰' },
  { id: 'assets', label: 'Assets', icon: '🏡' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'checks', label: 'System Checks', icon: '🔍' },
  { id: 'recommendation', label: 'Recommendation', icon: '✅' },
  { id: 'payment', label: 'Payment & Submit', icon: '💳' },
];

type SectionStatus = 'not_started' | 'invalid' | 'in_progress' | 'complete';

function getSectionStatusColour(status: SectionStatus): string {
  switch (status) {
    case 'not_started': return 'bg-gray-300 border-gray-400';
    case 'invalid': return 'bg-red-500 border-red-600';
    case 'in_progress': return 'bg-amber-400 border-amber-500';
    case 'complete': return 'bg-green-500 border-green-600';
  }
}

function getSectionStatusLabel(status: SectionStatus): string {
  switch (status) {
    case 'not_started': return 'Not started';
    case 'invalid': return 'Has errors';
    case 'in_progress': return 'In progress';
    case 'complete': return 'Complete';
  }
}

function getSectionStatusRing(status: SectionStatus): string {
  switch (status) {
    case 'not_started': return 'ring-gray-300';
    case 'invalid': return 'ring-red-500';
    case 'in_progress': return 'ring-amber-400';
    case 'complete': return 'ring-green-500';
  }
}

export default function ApplyPage() {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const updateField = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  // Calculate section statuses based on form data
  const getSectionStatus = useCallback((sectionId: string): SectionStatus => {
    const data = formData[sectionId];
    if (!data || Object.keys(data).length === 0) return 'not_started';

    switch (sectionId) {
      case 'personal': {
        const required = ['firstName', 'lastName', 'dateOfBirth', 'maritalStatus', 'employmentStatus'];
        const filled = required.filter(f => data[f] && String(data[f]).trim() !== '');
        if (filled.length === 0) return 'not_started';
        if (filled.length === required.length) return 'complete';
        // Check for invalid entries
        if (data.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) return 'invalid';
        return 'in_progress';
      }
      case 'address': {
        const required = ['line1', 'city', 'postcode', 'email', 'phone'];
        const filled = required.filter(f => data[f] && String(data[f]).trim() !== '');
        if (filled.length === 0) return 'not_started';
        if (filled.length === required.length) return 'complete';
        if (data.email && !data.email.includes('@')) return 'invalid';
        if (data.postcode && data.postcode.length < 5) return 'invalid';
        return 'in_progress';
      }
      case 'debts': {
        const items = data.items || [];
        if (items.length === 0) return 'not_started';
        const allValid = items.every((d: any) => d.creditorName && d.outstandingAmount > 0);
        if (allValid) return 'complete';
        const hasInvalid = items.some((d: any) => d.creditorName && d.outstandingAmount <= 0);
        if (hasInvalid) return 'invalid';
        return 'in_progress';
      }
      case 'income': {
        const hasIncome = data.wages || data.benefits || data.pension || data.other;
        if (!hasIncome && !formData.expenditure) return 'not_started';
        const exp = formData.expenditure || {};
        const hasExp = exp.rent || exp.food || exp.utilities;
        if (hasIncome && hasExp) return 'complete';
        return 'in_progress';
      }
      case 'assets': {
        if (data.noAssets) return 'complete';
        const hasAny = data.properties?.length || data.vehicles?.length || data.savings?.length || data.other?.length;
        if (hasAny) return 'complete';
        return 'not_started';
      }
      case 'documents': {
        if (data.uploaded && data.uploaded > 0) return 'complete';
        return 'not_started'; // Documents are optional
      }
      case 'checks': {
        if (data.completed) return 'complete';
        if (data.started) return 'in_progress';
        return 'not_started';
      }
      case 'recommendation': {
        if (data.received) return 'complete';
        return 'not_started';
      }
      case 'payment': {
        if (data.completed) return 'complete';
        if (data.method) return 'in_progress';
        return 'not_started';
      }
      default: return 'not_started';
    }
  }, [formData]);

  const nextSection = () => setCurrentSection(s => Math.min(s + 1, SECTIONS.length - 1));
  const prevSection = () => setCurrentSection(s => Math.max(s - 1, 0));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Apply for Debt Advice</h1>
      <p className="text-gray-600 mb-6">Complete each section below. You can navigate between sections freely.</p>

      {/* Section navigation — scrollable on mobile, grid on desktop */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-8 md:grid md:grid-cols-5 lg:grid-cols-9 md:overflow-visible">
        {SECTIONS.map((section, i) => {
          const status = getSectionStatus(section.id);
          const isActive = i === currentSection;
          return (
            <button
              key={section.id}
              onClick={() => setCurrentSection(i)}
              className={`relative p-3 rounded border-2 text-center transition-all min-w-[80px] flex-shrink-0 md:min-w-0 ${isActive ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-300' : 'border-gray-200 hover:border-gray-400 bg-white'}`}
            >
              {/* Status dot */}
              <div className={`absolute top-1 right-1 w-3 h-3 rounded-full border ${getSectionStatusColour(status)}`}
                title={getSectionStatusLabel(status)} />
              <div className="text-lg mb-1">{section.icon}</div>
              <div className="text-xs font-medium leading-tight">{section.label}</div>
            </button>
          );
        })}
      </div>

      {/* Status legend */}
      <div className="flex gap-4 mb-6 text-xs text-gray-600 bg-gray-50 p-2 rounded">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span> Not started</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Has errors</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> In progress</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Complete</span>
      </div>

      {/* Current section content */}
      <div className={`border-2 rounded-lg p-6 mb-6 ring-2 ${getSectionStatusRing(getSectionStatus(SECTIONS[currentSection].id))}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{SECTIONS[currentSection].icon}</span>
          <h2 className="text-xl font-bold">{SECTIONS[currentSection].label}</h2>
          <span className={`ml-auto px-2 py-0.5 rounded text-xs font-bold text-white ${getSectionStatusColour(getSectionStatus(SECTIONS[currentSection].id))}`}>
            {getSectionStatusLabel(getSectionStatus(SECTIONS[currentSection].id))}
          </span>
        </div>

        {currentSection === 0 && <PersonalSection formData={formData} updateField={updateField} />}
        {currentSection === 1 && <AddressSection formData={formData} updateField={updateField} />}
        {currentSection === 2 && <DebtsSection formData={formData} updateField={updateField} />}
        {currentSection === 3 && <IncomeSection formData={formData} updateField={updateField} />}
        {currentSection === 4 && <AssetsSection formData={formData} updateField={updateField} />}
        {currentSection === 5 && <DocumentsSection formData={formData} updateField={updateField} />}
        {currentSection === 6 && <ChecksSection formData={formData} updateField={updateField} />}
        {currentSection === 7 && <RecommendationSection formData={formData} updateField={updateField} />}
        {currentSection === 8 && <PaymentSection formData={formData} updateField={updateField} />}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button onClick={prevSection} disabled={currentSection === 0}
          className="bg-gray-200 text-gray-900 font-bold py-3 px-6 border-b-2 border-gray-400 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed">
          ← Previous
        </button>
        <div className="text-sm text-gray-500 self-center">
          Section {currentSection + 1} of {SECTIONS.length}
        </div>
        <button onClick={nextSection} disabled={currentSection === SECTIONS.length - 1}
          className="bg-green-700 text-white font-bold py-3 px-6 border-b-2 border-green-900 hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed">
          Next →
        </button>
      </div>
    </div>
  );
}

// ============ SECTION COMPONENTS ============

function PersonalSection({ formData, updateField }: { formData: any; updateField: any }) {
  const d = formData.personal || {};
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<string | null>(d.verifiedVia || null);

  const startVerification = (provider: string) => {
    setVerifying(true);
    setTimeout(() => {
      // Simulate verified identity returned from ScotAccount/GOV.UK
      updateField('personal', 'title', 'Mr');
      updateField('personal', 'firstName', 'John');
      updateField('personal', 'lastName', 'Testerton');
      updateField('personal', 'dateOfBirth', '1985-03-15');
      updateField('personal', 'nationalInsuranceNumber', 'AB123456C');
      updateField('personal', 'maritalStatus', 'married');
      updateField('personal', 'employmentStatus', 'employed');
      updateField('personal', 'verifiedVia', provider);
      setVerified(provider);
      setVerifying(false);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Identity Verification Panel */}
      <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 mb-6">
        <h3 className="font-bold text-sm mb-2">🔐 Verify Your Identity</h3>
        <p className="text-xs text-gray-600 mb-3">Verify your identity using a government service to pre-fill your details securely. This provides a higher assurance level for your application.</p>

        {!verified && !verifying && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button onClick={() => startVerification('scotaccount')} className="p-3 border-2 border-blue-300 rounded bg-white hover:border-blue-600 hover:bg-blue-50 text-left transition-all">
              <p className="font-bold text-sm">🏴󠁧󠁢󠁳󠁣󠁴󠁿 ScotAccount</p>
              <p className="text-xs text-gray-500">Scottish Government ID</p>
              <p className="text-xs text-blue-600 mt-1">LOA2 — Medium confidence</p>
            </button>
            <button onClick={() => startVerification('govuk')} className="p-3 border-2 border-blue-300 rounded bg-white hover:border-blue-600 hover:bg-blue-50 text-left transition-all">
              <p className="font-bold text-sm">🇬🇧 GOV.UK One Login</p>
              <p className="text-xs text-gray-500">UK Government ID</p>
              <p className="text-xs text-blue-600 mt-1">LOA2 — Medium confidence</p>
            </button>
            <button onClick={() => setVerified('manual')} className="p-3 border-2 border-gray-300 rounded bg-white hover:border-gray-500 text-left transition-all">
              <p className="font-bold text-sm">✏️ Manual Entry</p>
              <p className="text-xs text-gray-500">Enter details yourself</p>
              <p className="text-xs text-gray-400 mt-1">LOA1 — Basic</p>
            </button>
          </div>
        )}

        {verifying && (
          <div className="flex items-center gap-3 p-4 bg-white rounded border">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <div>
              <p className="text-sm font-bold">Redirecting to identity provider...</p>
              <p className="text-xs text-gray-500">You would normally be redirected to sign in. Simulating verification...</p>
            </div>
          </div>
        )}

        {verified && verified !== 'manual' && (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-sm font-bold text-green-800">Identity Verified via {verified === 'scotaccount' ? 'ScotAccount' : 'GOV.UK One Login'}</p>
              <p className="text-xs text-green-600">Assurance Level: LOA2 (Medium confidence) — Details pre-filled from verified source</p>
            </div>
          </div>
        )}

        {verified === 'manual' && (
          <div className="flex items-center gap-2 p-2 bg-gray-100 border border-gray-200 rounded">
            <span>✏️</span>
            <p className="text-xs text-gray-600">Manual entry — LOA1 (Basic). Additional document verification may be required.</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold mb-1 text-sm">Title</label>
          <select value={d.title || ''} onChange={e => updateField('personal', 'title', e.target.value)}
            className="border-2 border-gray-900 p-2 w-full">
            <option value="">Select</option>
            {['Mr', 'Mrs', 'Ms', 'Miss', 'Dr'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div></div>
        <Input label="First name *" value={d.firstName} onChange={v => updateField('personal', 'firstName', v)} error={d.firstName === '' ? 'Required' : undefined} />
        <Input label="Last name *" value={d.lastName} onChange={v => updateField('personal', 'lastName', v)} />
      </div>
      <Input label="Date of birth *" type="date" value={d.dateOfBirth} onChange={v => updateField('personal', 'dateOfBirth', v)} hint="YYYY-MM-DD format" />
      <Input label="National Insurance number" value={d.nationalInsuranceNumber} onChange={v => updateField('personal', 'nationalInsuranceNumber', v)} hint="e.g. QQ 12 34 56 C" />
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold mb-1 text-sm">Marital status *</label>
          <select value={d.maritalStatus || ''} onChange={e => updateField('personal', 'maritalStatus', e.target.value)}
            className="border-2 border-gray-900 p-2 w-full">
            <option value="">Select</option>
            {['Single','Married','Civil Partnership','Divorced','Widowed','Separated'].map(s => <option key={s} value={s.toLowerCase().replace(' ','_')}>{s}</option>)}
          </select>
        </div>
        <Input label="Number of dependants" type="number" value={d.dependants} onChange={v => updateField('personal', 'dependants', parseInt(v) || 0)} />
      </div>
      <div>
        <label className="block font-bold mb-1 text-sm">Employment status *</label>
        <select value={d.employmentStatus || ''} onChange={e => updateField('personal', 'employmentStatus', e.target.value)}
          className="border-2 border-gray-900 p-2 w-full md:w-1/2">
          <option value="">Select</option>
          {['Employed','Self-employed','Unemployed','Retired','Student','Other'].map(s => <option key={s} value={s.toLowerCase().replace('-','_')}>{s}</option>)}
        </select>
      </div>

      {/* Aliases / Other Names */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="font-bold text-sm mb-2">Other Names / Aliases</h3>
        <p className="text-xs text-gray-500 mb-3">Include any other names you are or have been known by (maiden name, previous married name, etc.)</p>
        {(d.aliases || []).map((alias: any, i: number) => (
          <div key={i} className="flex gap-2 items-end mb-2">
            <div className="flex-1"><input value={alias.firstName || ''} onChange={e => { const a = [...(d.aliases||[])]; a[i]={...a[i],firstName:e.target.value}; updateField('personal','aliases',a); }} placeholder="First name" className="border-2 border-gray-900 p-2 w-full text-sm" /></div>
            <div className="flex-1"><input value={alias.lastName || ''} onChange={e => { const a = [...(d.aliases||[])]; a[i]={...a[i],lastName:e.target.value}; updateField('personal','aliases',a); }} placeholder="Last name" className="border-2 border-gray-900 p-2 w-full text-sm" /></div>
            <select value={alias.type || ''} onChange={e => { const a = [...(d.aliases||[])]; a[i]={...a[i],type:e.target.value}; updateField('personal','aliases',a); }} className="border-2 border-gray-900 p-2 text-sm">
              <option value="">Type</option><option value="maiden">Maiden name</option><option value="previous_married">Previous married</option><option value="other">Other</option>
            </select>
            <button onClick={() => { const a = (d.aliases||[]).filter((_:any,idx:number)=>idx!==i); updateField('personal','aliases',a); }} className="text-red-600 text-xs px-2 py-2 hover:bg-red-50 rounded">✕</button>
          </div>
        ))}
        <button onClick={() => updateField('personal','aliases',[...(d.aliases||[]),{firstName:'',lastName:'',type:''}])} className="text-sm bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300">+ Add other name</button>
      </div>
    </div>
  );
}

function AddressSection({ formData, updateField }: { formData: any; updateField: any }) {
  const a = formData.address || {};
  const prevAddresses = a.previousAddresses || [];
  const [lookupResults, setLookupResults] = useState<any[]>([]);

  const lookupPostcode = async () => {
    if (!a.postcode) return;
    setLookupResults([
      { line1: '1 Sample Street', city: 'Edinburgh' },
      { line1: '2 Sample Street', city: 'Edinburgh' },
      { line1: '3 Sample Street, Flat A', city: 'Edinburgh' },
    ]);
  };

  const addPreviousAddress = () => updateField('address', 'previousAddresses', [...prevAddresses, { line1: '', city: '', postcode: '', dateFrom: '', dateTo: '' }]);
  const updatePrevAddr = (i: number, field: string, value: string) => {
    const updated = [...prevAddresses]; updated[i] = { ...updated[i], [field]: value }; updateField('address', 'previousAddresses', updated);
  };
  const removePrevAddr = (i: number) => updateField('address', 'previousAddresses', prevAddresses.filter((_: any, idx: number) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
        <p className="text-sm"><strong>5-Year Address History Required:</strong> Please provide all addresses you have lived at during the last 5 years. This is needed for credit checks and cross-system verification.</p>
      </div>

      <h3 className="font-bold">Current Address</h3>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input label="Postcode *" value={a.postcode} onChange={v => updateField('address', 'postcode', v)} hint="Enter postcode to look up" />
        </div>
        <button onClick={lookupPostcode} type="button" className="bg-blue-700 text-white py-2 px-4 mb-4 text-sm hover:bg-blue-800">Find address</button>
      </div>
      {lookupResults.length > 0 && (
        <div className="p-3 bg-gray-50 border border-gray-300 rounded mb-4">
          <p className="text-sm font-bold mb-2">Select an address:</p>
          {lookupResults.map((addr, i) => (
            <button key={i} type="button" className="block text-sm text-blue-700 underline mb-1"
              onClick={() => { updateField('address', 'line1', addr.line1); updateField('address', 'city', addr.city); setLookupResults([]); }}>
              {addr.line1}, {addr.city}
            </button>
          ))}
        </div>
      )}
      <Input label="Address line 1 *" value={a.line1} onChange={v => updateField('address', 'line1', v)} />
      <Input label="Address line 2" value={a.line2} onChange={v => updateField('address', 'line2', v)} />
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="City *" value={a.city} onChange={v => updateField('address', 'city', v)} />
        <Input label="County" value={a.county} onChange={v => updateField('address', 'county', v)} />
      </div>
      <Input label="Resident since *" type="date" value={a.residentSince} onChange={v => updateField('address', 'residentSince', v)} />

      {/* Previous Addresses */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="font-bold mb-2">Previous Addresses (last 5 years)</h3>
        {prevAddresses.length === 0 && <p className="text-sm text-gray-500 mb-3">No previous addresses added. If you have lived at your current address for less than 5 years, please add your previous address(es).</p>}
        {prevAddresses.map((prev: any, i: number) => (
          <div key={i} className="border border-gray-300 rounded p-4 mb-3 relative">
            <button onClick={() => removePrevAddr(i)} className="absolute top-2 right-2 text-red-600 text-xs hover:underline">Remove</button>
            <p className="font-bold text-sm mb-2">Previous Address {i + 1}</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1"><Input label="Postcode" value={prev.postcode} onChange={v => updatePrevAddr(i, 'postcode', v)} /></div>
                <button type="button" onClick={() => { updatePrevAddr(i, 'line1', '12 Sample Road'); updatePrevAddr(i, 'city', 'Glasgow'); }}
                  className="bg-blue-700 text-white text-xs py-2.5 px-3 mb-1 hover:bg-blue-800 rounded min-h-[44px]">Find</button>
              </div>
              <div></div>
              <Input label="Address line 1" value={prev.line1} onChange={v => updatePrevAddr(i, 'line1', v)} />
              <Input label="City" value={prev.city} onChange={v => updatePrevAddr(i, 'city', v)} />
              <Input label="Date from" type="date" value={prev.dateFrom} onChange={v => updatePrevAddr(i, 'dateFrom', v)} />
              <Input label="Date to" type="date" value={prev.dateTo} onChange={v => updatePrevAddr(i, 'dateTo', v)} />
            </div>
          </div>
        ))}
        <button onClick={addPreviousAddress} className="text-sm bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300">+ Add previous address</button>
      </div>

      <h3 className="font-bold mt-6">Contact Details</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Email address *" type="email" value={a.email} onChange={v => updateField('address', 'email', v)} error={a.email && !a.email.includes('@') ? 'Invalid email' : undefined} />
        <Input label="Phone number *" type="tel" value={a.phone} onChange={v => updateField('address', 'phone', v)} />
      </div>
    </div>
  );
}

function DebtsSection({ formData, updateField }: { formData: any; updateField: any }) {
  const debts = formData.debts?.items || [];
  const totalDebt = debts.reduce((s: number, d: any) => s + (parseFloat(d.outstandingAmount) || 0), 0);

  const addDebt = () => updateField('debts', 'items', [...debts, { creditorName: '', creditorType: 'other', outstandingAmount: 0, monthlyPayment: 0 }]);
  const updateDebt = (i: number, field: string, value: any) => {
    const items = [...debts]; items[i] = { ...items[i], [field]: value }; updateField('debts', 'items', items);
  };
  const removeDebt = (i: number) => updateField('debts', 'items', debts.filter((_: any, idx: number) => idx !== i));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Enter all debts you currently owe. Include credit cards, loans, overdrafts, council tax arrears, etc.</p>
      {totalDebt > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-600 p-3">
          <p className="font-bold">Total debt entered: £{totalDebt.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{debts.length} creditor{debts.length !== 1 ? 's' : ''}</p>
        </div>
      )}
      {debts.map((debt: any, i: number) => (
        <div key={i} className="border border-gray-300 p-4 rounded relative">
          <button onClick={() => removeDebt(i)} className="absolute top-2 right-2 text-red-600 text-xs hover:underline">Remove</button>
          <p className="font-bold text-sm mb-2">Debt {i + 1}</p>
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="Creditor name *" value={debt.creditorName} onChange={v => updateDebt(i, 'creditorName', v)} />
            <div>
              <label className="block font-bold mb-1 text-sm">Type</label>
              <select value={debt.creditorType} onChange={e => updateDebt(i, 'creditorType', e.target.value)} className="border-2 border-gray-900 p-2 w-full">
                {[['bank','Bank'],['credit_card','Credit Card'],['loan_company','Loan'],['utility','Utility'],['council_tax','Council Tax'],['hmrc','HMRC'],['other','Other']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <Input label="Outstanding amount (£) *" type="number" value={debt.outstandingAmount} onChange={v => updateDebt(i, 'outstandingAmount', v)}
              error={debt.creditorName && parseFloat(debt.outstandingAmount) <= 0 ? 'Must be > 0' : undefined} />
            <Input label="Monthly payment (£)" type="number" value={debt.monthlyPayment} onChange={v => updateDebt(i, 'monthlyPayment', v)} />
          </div>
        </div>
      ))}
      <button onClick={addDebt} className="bg-gray-200 text-gray-900 font-bold py-2 px-4 border-b-2 border-gray-400 hover:bg-gray-300 text-sm">+ Add a debt</button>
    </div>
  );
}

function IncomeSection({ formData, updateField }: { formData: any; updateField: any }) {
  const inc = formData.income || {};
  const exp = formData.expenditure || {};
  const totalIncome = (parseFloat(inc.wages)||0) + (parseFloat(inc.benefits)||0) + (parseFloat(inc.pension)||0) + (parseFloat(inc.other)||0);
  const totalExp = (parseFloat(exp.rent)||0) + (parseFloat(exp.councilTax)||0) + (parseFloat(exp.utilities)||0) + (parseFloat(exp.food)||0) + (parseFloat(exp.transport)||0) + (parseFloat(exp.insurance)||0) + (parseFloat(exp.childcare)||0) + (parseFloat(exp.other)||0);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
        <p className="text-xs"><strong>📋 Common Financial Tool (CFT):</strong> Income and expenditure categories below are aligned with the <a href="https://www.aib.gov.uk/common-financial-tool" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Common Financial Tool</a> used across all Scottish debt solutions for affordability assessment.</p>
      </div>
      <h3 className="font-bold">Monthly Income</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <Input label="Wages/Salary (£)" type="number" value={inc.wages} onChange={v => updateField('income', 'wages', v)} />
        <Input label="Benefits (£)" type="number" value={inc.benefits} onChange={v => updateField('income', 'benefits', v)} />
        <Input label="Pension (£)" type="number" value={inc.pension} onChange={v => updateField('income', 'pension', v)} />
        <Input label="Other income (£)" type="number" value={inc.other} onChange={v => updateField('income', 'other', v)} />
      </div>
      <div className="bg-blue-50 p-3 rounded"><strong>Total income: £{totalIncome.toLocaleString()}/month</strong></div>

      <h3 className="font-bold mt-6">Monthly Expenditure</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <Input label="Rent/Mortgage (£)" type="number" value={exp.rent} onChange={v => updateField('expenditure', 'rent', v)} />
        <Input label="Council Tax (£)" type="number" value={exp.councilTax} onChange={v => updateField('expenditure', 'councilTax', v)} />
        <Input label="Utilities (£)" type="number" value={exp.utilities} onChange={v => updateField('expenditure', 'utilities', v)} />
        <Input label="Food (£)" type="number" value={exp.food} onChange={v => updateField('expenditure', 'food', v)} />
        <Input label="Transport (£)" type="number" value={exp.transport} onChange={v => updateField('expenditure', 'transport', v)} />
        <Input label="Insurance (£)" type="number" value={exp.insurance} onChange={v => updateField('expenditure', 'insurance', v)} />
        <Input label="Childcare (£)" type="number" value={exp.childcare} onChange={v => updateField('expenditure', 'childcare', v)} />
        <Input label="Other (£)" type="number" value={exp.other} onChange={v => updateField('expenditure', 'other', v)} />
      </div>
      <div className="bg-blue-50 p-3 rounded">
        <p><strong>Total expenditure: £{totalExp.toLocaleString()}/month</strong></p>
        <p className={`font-bold mt-1 ${totalIncome - totalExp >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          Disposable income: £{(totalIncome - totalExp).toLocaleString()}/month
        </p>
      </div>
    </div>
  );
}

function AssetsSection({ formData, updateField }: { formData: any; updateField: any }) {
  const assets = formData.assets || {};
  const properties = assets.properties || [];
  const vehicles = assets.vehicles || [];
  const savings = assets.savings || [];
  const otherAssets = assets.other || [];

  const totalValue = [...properties, ...vehicles, ...savings, ...otherAssets].reduce((s: number, a: any) => s + (parseFloat(a.value) || 0), 0);

  const addItem = (category: string, item: any) => updateField('assets', category, [...(assets[category] || []), item]);
  const updateItem = (category: string, i: number, field: string, value: any) => {
    const items = [...(assets[category] || [])]; items[i] = { ...items[i], [field]: value }; updateField('assets', category, items);
  };
  const removeItem = (category: string, i: number) => updateField('assets', category, (assets[category] || []).filter((_: any, idx: number) => idx !== i));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Declare all assets you own or have an interest in. This is essential for determining which debt solution is most appropriate.</p>

      {assets.noAssets ? (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p className="font-bold text-green-800">✓ No assets declared</p>
          <button onClick={() => updateField('assets', 'noAssets', false)} className="text-sm text-blue-700 underline mt-2">I do have assets to declare</button>
        </div>
      ) : (
        <>
          {totalValue > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-3">
              <p className="font-bold">Total declared asset value: £{totalValue.toLocaleString()}</p>
            </div>
          )}

          {/* Property */}
          <div className="border border-gray-200 rounded p-4">
            <h4 className="font-bold text-sm mb-2">🏠 Property</h4>
            {properties.map((p: any, i: number) => (
              <div key={i} className="grid md:grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100">
                <Input label="Property address" value={p.address} onChange={v => updateItem('properties', i, 'address', v)} />
                <Input label="Estimated value (£)" type="number" value={p.value} onChange={v => updateItem('properties', i, 'value', v)} />
                <Input label="Outstanding mortgage (£)" type="number" value={p.mortgage} onChange={v => updateItem('properties', i, 'mortgage', v)} />
                <div><label className="block font-bold mb-1 text-sm">Ownership</label>
                  <select value={p.ownership||''} onChange={e => updateItem('properties', i, 'ownership', e.target.value)} className="border-2 border-gray-900 p-2 w-full text-sm">
                    <option value="">Select</option><option value="sole">Sole owner</option><option value="joint">Joint owner</option><option value="rented">Rented (not owned)</option>
                  </select>
                </div>
                <button onClick={() => removeItem('properties', i)} className="text-red-600 text-xs self-end">Remove</button>
              </div>
            ))}
            <button onClick={() => addItem('properties', { address: '', value: '', mortgage: '', ownership: '' })} className="text-sm bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200">+ Add property</button>
          </div>

          {/* Vehicles */}
          <div className="border border-gray-200 rounded p-4">
            <h4 className="font-bold text-sm mb-2">🚗 Vehicles</h4>
            {vehicles.map((v: any, i: number) => (
              <div key={i} className="grid md:grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100">
                <Input label="Description" value={v.description} onChange={val => updateItem('vehicles', i, 'description', val)} hint="e.g. 2018 Ford Focus" />
                <Input label="Estimated value (£)" type="number" value={v.value} onChange={val => updateItem('vehicles', i, 'value', val)} />
                <Input label="Finance outstanding (£)" type="number" value={v.finance} onChange={val => updateItem('vehicles', i, 'finance', val)} />
                <div><label className="block font-bold mb-1 text-sm">Essential for work?</label>
                  <select value={v.essential||''} onChange={e => updateItem('vehicles', i, 'essential', e.target.value)} className="border-2 border-gray-900 p-2 w-full text-sm">
                    <option value="">Select</option><option value="yes">Yes — needed for employment</option><option value="no">No</option>
                  </select>
                </div>
                <button onClick={() => removeItem('vehicles', i)} className="text-red-600 text-xs self-end">Remove</button>
              </div>
            ))}
            <button onClick={() => addItem('vehicles', { description: '', value: '', finance: '', essential: '' })} className="text-sm bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200">+ Add vehicle</button>
          </div>

          {/* Savings & Investments */}
          <div className="border border-gray-200 rounded p-4">
            <h4 className="font-bold text-sm mb-2">💰 Savings & Investments</h4>
            {savings.map((s: any, i: number) => (
              <div key={i} className="grid md:grid-cols-3 gap-3 mb-2">
                <div><label className="block font-bold mb-1 text-sm">Type</label>
                  <select value={s.type||''} onChange={e => updateItem('savings', i, 'type', e.target.value)} className="border-2 border-gray-900 p-2 w-full text-sm">
                    <option value="">Select</option><option value="bank_savings">Bank savings</option><option value="isa">ISA</option><option value="stocks">Stocks/shares</option><option value="pension_pot">Pension pot</option><option value="crypto">Cryptocurrency</option><option value="other">Other</option>
                  </select>
                </div>
                <Input label="Provider" value={s.provider} onChange={val => updateItem('savings', i, 'provider', val)} />
                <div className="flex gap-2 items-end">
                  <div className="flex-1"><Input label="Balance (£)" type="number" value={s.value} onChange={val => updateItem('savings', i, 'value', val)} /></div>
                  <button onClick={() => removeItem('savings', i)} className="text-red-600 text-xs pb-2">✕</button>
                </div>
              </div>
            ))}
            <button onClick={() => addItem('savings', { type: '', provider: '', value: '' })} className="text-sm bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200">+ Add savings/investment</button>
          </div>

          {/* Other Assets */}
          <div className="border border-gray-200 rounded p-4">
            <h4 className="font-bold text-sm mb-2">📦 Other Assets</h4>
            <p className="text-xs text-gray-500 mb-2">Include valuables, collections, equipment, business assets, etc.</p>
            {otherAssets.map((o: any, i: number) => (
              <div key={i} className="grid md:grid-cols-3 gap-3 mb-2">
                <div className="md:col-span-2"><Input label="Description" value={o.description} onChange={val => updateItem('other', i, 'description', val)} /></div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1"><Input label="Value (£)" type="number" value={o.value} onChange={val => updateItem('other', i, 'value', val)} /></div>
                  <button onClick={() => removeItem('other', i)} className="text-red-600 text-xs pb-2">✕</button>
                </div>
              </div>
            ))}
            <button onClick={() => addItem('other', { description: '', value: '' })} className="text-sm bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200">+ Add other asset</button>
          </div>

          {/* No assets option */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!assets.noAssets} onChange={e => updateField('assets', 'noAssets', e.target.checked)} />
              <span className="text-sm">I confirm I have no assets to declare</span>
            </label>
          </div>
        </>
      )}
    </div>
  );
}

function DocumentsSection({ formData, updateField }: { formData: any; updateField: any }) {
  const [files, setFiles] = useState<string[]>([]);
  const addFile = (name: string) => { const newFiles = [...files, name]; setFiles(newFiles); updateField('documents', 'uploaded', newFiles.length); };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Upload supporting documents. This is <strong>optional</strong> but may speed up processing.</p>
      <div className="border-2 border-dashed border-gray-400 p-8 text-center bg-gray-50 cursor-pointer hover:border-gray-600"
        onClick={() => addFile(`document_${files.length + 1}.pdf`)}>
        <p className="text-gray-700 mb-2">Click to add a document (simulated)</p>
        <p className="text-sm text-gray-500">In the live app: drag & drop, camera capture on mobile, PDF/JPG/PNG</p>
      </div>
      {files.length > 0 && (
        <ul className="space-y-2">{files.map((f, i) => (
          <li key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
            <span className="text-sm">📄 {f}</span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">Uploaded</span>
          </li>
        ))}</ul>
      )}
    </div>
  );
}

function ChecksSection({ formData, updateField }: { formData: any; updateField: any }) {
  const checks = formData.checks || {};
  const runChecks = () => {
    updateField('checks', 'started', true);
    setTimeout(() => updateField('checks', 'completed', true), 2000);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">We check existing AiB systems to see if you have any current or previous cases.</p>
      <div className="bg-yellow-50 border-l-4 border-yellow-600 p-3 text-sm">
        <strong>Note:</strong> These are placeholder integration checks for the POC demonstration.
      </div>
      {!checks.completed ? (
        <button onClick={runChecks} disabled={checks.started} className="bg-blue-700 text-white font-bold py-3 px-6 hover:bg-blue-800 disabled:opacity-50">
          {checks.started ? '⏳ Running checks...' : '🔍 Run system checks'}
        </button>
      ) : (
        <div className="space-y-2">
          {['BASYS', 'eDEN/DASH', 'DAS', 'CFT', 'Moratorium', 'RoI'].map(sys => (
            <div key={sys} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-bold text-sm">{sys}</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">✓ Clear</span>
            </div>
          ))}
          <div className="mt-4 p-3 border rounded">
            <p className="text-sm font-bold">Credit Check: Score 520 (Fair)</p>
            <p className="text-xs text-gray-500">Provider: SyntheticCredit Ltd (PLACEHOLDER)</p>
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationSection({ formData, updateField }: { formData: any; updateField: any }) {
  const rec = formData.recommendation || {};
  const getRecommendation = () => setTimeout(() => updateField('recommendation', 'received', true), 1500);

  return (
    <div className="space-y-4">
      {!rec.received ? (
        <>
          <p className="text-sm text-gray-600">Based on your information, we can recommend the most suitable debt solution.</p>
          <button onClick={getRecommendation} className="bg-green-700 text-white font-bold py-3 px-6 hover:bg-green-800">
            Get my recommendation
          </button>
        </>
      ) : (
        <>
          <div className="bg-green-700 text-white p-6 rounded text-center">
            <h3 className="text-xl font-bold text-white">Recommended: Debt Arrangement Scheme (DAS)</h3>
            <p className="text-green-100 mt-1">Confidence: High</p>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
            <h4 className="font-bold mb-2">Why we recommend this</h4>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Your debt level is within the DAS eligibility range</li>
              <li>You have disposable income for structured repayment</li>
              <li>No existing insolvency proceedings found</li>
              <li>DAS provides statutory creditor protection</li>
            </ul>
          </div>
          <div className="border border-gray-300 p-4 rounded">
            <p className="text-sm italic text-gray-600">This is an automated recommendation for information only. Speak with a money adviser before making decisions.</p>
          </div>
        </>
      )}
    </div>
  );
}

function PaymentSection({ formData, updateField }: { formData: any; updateField: any }) {
  const payment = formData.payment || {};

  if (payment.completed) {
    return (
      <div className="bg-green-700 text-white p-8 rounded text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Application Submitted ✓</h3>
        <p className="text-xl text-white">Reference: IAAS-2026-{String(Math.floor(Math.random()*99999)).padStart(5,'0')}</p>
        <p className="text-green-200 mt-2">Payment of £90.00 received (SANDBOX)</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">Application fee: <strong>£90.00</strong></p>
      <div className="bg-yellow-50 border-l-4 border-yellow-600 p-3 text-sm"><strong>Sandbox:</strong> No real payment processed.</div>
      <h3 className="font-bold">Choose payment method</h3>
      <div className="grid grid-cols-3 gap-3">
        {[['apple_pay','🍎 Apple Pay'],['google_pay','G Pay'],['card','💳 Card']].map(([id, label]) => (
          <button key={id} onClick={() => updateField('payment', 'method', id)}
            className={`p-4 border-2 rounded text-center font-bold text-sm ${payment.method === id ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>
      {payment.method && (
        <button onClick={() => updateField('payment', 'completed', true)}
          className="bg-green-700 text-white font-bold py-3 px-8 hover:bg-green-800 w-full text-center">
          Complete Payment & Submit (Sandbox) — £90.00
        </button>
      )}
    </div>
  );
}

// ============ SHARED INPUT COMPONENT ============

function Input({ label, type = 'text', value, onChange, hint, error }: {
  label: string; type?: string; value?: any; onChange: (v: string) => void; hint?: string; error?: string;
}) {
  return (
    <div className="mb-1">
      <label className="block font-bold mb-1 text-sm">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 font-bold mb-1">⚠ {error}</p>}
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        className={`border-2 ${error ? 'border-red-500' : 'border-gray-900'} p-2.5 w-full text-base min-h-[44px] focus:outline-2 focus:outline-yellow-400`} />
    </div>
  );
}
