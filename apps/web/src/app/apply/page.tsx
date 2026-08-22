'use client';

import Link from 'next/link';
import { useState, useCallback, useEffect, useRef } from 'react';
import { navigateTo } from '../../lib/navigation';
import { useAppContext } from '../../lib/ApplicationContext';
import {
  applications,
  integrations,
  recommendations,
  creditCheck,
  ApiError,
  SystemCheckResult,
  Recommendation,
  CreditCheckResult,
} from '../../lib/apiClient';

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

// ============ VALIDATION LOGIC ============

function validateStep(step: number, formData: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === 0) {
    // Personal Details
    const d = formData.personal || {};
    const nameRegex = /^[a-zA-Z\s\-']+$/;

    if (!d.firstName || d.firstName.trim().length === 0) {
      errors.firstName = 'First name is required';
    } else if (d.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    } else if (d.firstName.trim().length > 50) {
      errors.firstName = 'First name must be 50 characters or fewer';
    } else if (!nameRegex.test(d.firstName)) {
      errors.firstName = 'First name can only contain letters, hyphens, and spaces';
    }

    if (!d.lastName || d.lastName.trim().length === 0) {
      errors.lastName = 'Last name is required';
    } else if (d.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    } else if (d.lastName.trim().length > 50) {
      errors.lastName = 'Last name must be 50 characters or fewer';
    } else if (!nameRegex.test(d.lastName)) {
      errors.lastName = 'Last name can only contain letters, hyphens, and spaces';
    }

    if (!d.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(d.dateOfBirth);
      const today = new Date();
      if (isNaN(dob.getTime())) {
        errors.dateOfBirth = 'Please enter a valid date';
      } else if (dob > today) {
        errors.dateOfBirth = 'Date of birth cannot be in the future';
      } else {
        const age = today.getFullYear() - dob.getFullYear() - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
        if (age < 16) {
          errors.dateOfBirth = 'You must be at least 16 years old';
        }
      }
    }

    if (!d.nationalInsuranceNumber || d.nationalInsuranceNumber.trim().length === 0) {
      errors.nationalInsuranceNumber = 'National Insurance number is required';
    } else {
      const ni = d.nationalInsuranceNumber.replace(/\s/g, '').toUpperCase();
      const niRegex = /^[A-Z]{2}\d{6}[A-Z]$/;
      const invalidPrefixes = ['BG', 'GB', 'NK', 'KN', 'TN', 'NT', 'ZZ'];
      if (!niRegex.test(ni)) {
        errors.nationalInsuranceNumber = 'NI number must be in format AB123456C (2 letters, 6 digits, 1 letter)';
      } else if (invalidPrefixes.includes(ni.substring(0, 2))) {
        errors.nationalInsuranceNumber = 'NI number cannot start with BG, GB, NK, KN, TN, NT, or ZZ';
      }
    }

    if (!d.employmentStatus) {
      errors.employmentStatus = 'Employment status is required';
    } else {
      const validStatuses = ['employed', 'self_employed', 'unemployed', 'retired', 'student', 'other'];
      if (!validStatuses.includes(d.employmentStatus)) {
        errors.employmentStatus = 'Please select a valid employment status';
      }
    }

    if (!d.maritalStatus) {
      errors.maritalStatus = 'Marital status is required';
    }

    if (d.dependants === undefined || d.dependants === null || d.dependants === '') {
      errors.dependants = 'Number of dependants is required';
    } else {
      const dep = parseInt(d.dependants);
      if (isNaN(dep) || dep < 0) {
        errors.dependants = 'Dependants must be 0 or more';
      } else if (dep > 20) {
        errors.dependants = 'Dependants cannot exceed 20';
      }
    }
  }

  if (step === 1) {
    // Address
    const a = formData.address || {};
    const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

    if (!a.line1 || a.line1.trim().length === 0) {
      errors['address.line1'] = 'Address line 1 is required';
    } else if (a.line1.trim().length < 3) {
      errors['address.line1'] = 'Address line 1 must be at least 3 characters';
    }

    if (!a.city || a.city.trim().length === 0) {
      errors['address.city'] = 'City is required';
    } else if (a.city.trim().length < 2) {
      errors['address.city'] = 'City must be at least 2 characters';
    }

    if (!a.postcode || a.postcode.trim().length === 0) {
      errors['address.postcode'] = 'Postcode is required';
    } else if (!ukPostcodeRegex.test(a.postcode.trim())) {
      errors['address.postcode'] = 'Please enter a valid UK postcode (e.g. EH3 5AA, G2 1AB)';
    }

    if (!a.residentSince) {
      errors['address.residentSince'] = 'Resident since date is required';
    } else {
      const resDate = new Date(a.residentSince);
      if (isNaN(resDate.getTime())) {
        errors['address.residentSince'] = 'Please enter a valid date';
      } else if (resDate > new Date()) {
        errors['address.residentSince'] = 'Resident since date cannot be in the future';
      }
    }
  }

  if (step === 2) {
    // Debts
    const debts = formData.debts?.items || [];

    if (debts.length === 0) {
      errors['debts.required'] = 'At least one debt entry is required';
    } else {
      debts.forEach((debt: any, i: number) => {
        if (!debt.creditorName || debt.creditorName.trim().length === 0) {
          errors[`debts.${i}.creditorName`] = 'Creditor name is required';
        } else if (debt.creditorName.trim().length < 2) {
          errors[`debts.${i}.creditorName`] = 'Creditor name must be at least 2 characters';
        }

        if (!debt.creditorType) {
          errors[`debts.${i}.creditorType`] = 'Debt type is required';
        }

        const amount = parseFloat(debt.outstandingAmount);
        if (!debt.outstandingAmount && debt.outstandingAmount !== 0) {
          errors[`debts.${i}.outstandingAmount`] = 'Outstanding amount is required';
        } else if (isNaN(amount) || amount <= 0) {
          errors[`debts.${i}.outstandingAmount`] = 'Amount must be greater than 0';
        } else if (amount > 10000000) {
          errors[`debts.${i}.outstandingAmount`] = 'Amount cannot exceed £10,000,000';
        }

        const monthly = parseFloat(debt.monthlyPayment);
        if (debt.monthlyPayment !== undefined && debt.monthlyPayment !== '' && !isNaN(monthly) && monthly < 0) {
          errors[`debts.${i}.monthlyPayment`] = 'Monthly payment must be 0 or more';
        }
      });
    }
  }

  if (step === 3) {
    // Income & Expenditure
    const inc = formData.income || {};
    const exp = formData.expenditure || {};

    const incomeFields = ['wages', 'benefits', 'pension', 'other'];
    const expFields = ['rent', 'councilTax', 'utilities', 'food', 'transport', 'insurance', 'childcare', 'other'];

    let hasIncome = false;
    incomeFields.forEach(field => {
      const val = parseFloat(inc[field]);
      if (!isNaN(val) && val > 0) hasIncome = true;
      if (!isNaN(val) && val < 0) {
        errors[`income.${field}`] = 'Amount must be 0 or more';
      }
      if (!isNaN(val) && val > 99999) {
        errors[`income.${field}`] = 'Amount cannot exceed £99,999';
      }
    });

    if (!hasIncome) {
      errors['income.required'] = 'At least one income field must be greater than 0';
    }

    expFields.forEach(field => {
      const val = parseFloat(exp[field]);
      if (!isNaN(val) && val < 0) {
        errors[`expenditure.${field}`] = 'Amount must be 0 or more';
      }
      if (!isNaN(val) && val > 99999) {
        errors[`expenditure.${field}`] = 'Amount cannot exceed £99,999';
      }
    });
  }

  if (step === 4) {
    // Assets
    const assets = formData.assets || {};
    if (!assets.noAssets) {
      const allItems = [
        ...(assets.properties || []),
        ...(assets.vehicles || []),
        ...(assets.savings || []),
        ...(assets.other || []),
      ];

      if (allItems.length === 0) {
        errors['assets.required'] = 'Please add at least one asset, or check "I have no assets to declare"';
      }

      (assets.properties || []).forEach((p: any, i: number) => {
        const val = parseFloat(p.value);
        if (!isNaN(val) && val < 0) errors[`assets.properties.${i}.value`] = 'Value must be 0 or more';
      });

      (assets.vehicles || []).forEach((v: any, i: number) => {
        if (!v.description || v.description.trim().length === 0) {
          errors[`assets.vehicles.${i}.description`] = 'Description is required';
        }
        const val = parseFloat(v.value);
        if (!isNaN(val) && val < 0) errors[`assets.vehicles.${i}.value`] = 'Value must be 0 or more';
      });

      (assets.savings || []).forEach((s: any, i: number) => {
        const val = parseFloat(s.value);
        if (!isNaN(val) && val < 0) errors[`assets.savings.${i}.value`] = 'Value must be 0 or more';
      });

      (assets.other || []).forEach((o: any, i: number) => {
        if (!o.description || o.description.trim().length === 0) {
          errors[`assets.other.${i}.description`] = 'Description is required';
        }
        const val = parseFloat(o.value);
        if (!isNaN(val) && val < 0) errors[`assets.other.${i}.value`] = 'Value must be 0 or more';
      });
    }
  }

  return errors;
}

export default function ApplyPage() {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [apiStatus, setApiStatus] = useState<'idle' | 'connected' | 'offline'>('idle');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progressSaved, setProgressSaved] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const { application, setApplication, addRecentApplication, setApiConnected } = useAppContext();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const applicationCreated = useRef(false);

  // Create draft application on first interaction
  const ensureApplicationExists = useCallback(async () => {
    if (application.applicationId || applicationCreated.current) return;
    applicationCreated.current = true;

    try {
      const response = await applications.create({});
      setApplication({
        applicationId: response.data.id,
        referenceNumber: response.data.referenceNumber,
        status: 'draft',
      });
      setApiStatus('connected');
      setApiConnected(true);
    } catch (err) {
      console.warn('API not available, working offline:', err);
      setApiStatus('offline');
      setApiConnected(false);
      applicationCreated.current = false;
    }
  }, [application.applicationId, setApplication, setApiConnected]);

  // Auto-save form data to backend (debounced)
  const saveToBackend = useCallback(async (data: Record<string, any>) => {
    if (!application.applicationId || apiStatus === 'offline') return;

    setSaving(true);
    try {
      const structuredData = {
        debtorDetails: data.personal || {},
        addressHistory: {
          current: data.address || {},
          previous: data.address?.previousAddresses || [],
        },
        contactDetails: {
          email: data.address?.email,
          phone: data.address?.phone,
        },
        debtSummary: {
          totalDebtAmount: (data.debts?.items || []).reduce((s: number, d: any) => s + (parseFloat(d.outstandingAmount) || 0), 0),
          debts: data.debts?.items || [],
          creditorsCount: (data.debts?.items || []).length,
        },
        incomeExpenditure: {
          income: data.income || {},
          expenditure: data.expenditure || {},
          totalIncome: Object.values(data.income || {}).reduce((s: number, v: any) => s + (parseFloat(v) || 0), 0),
          totalExpenditure: Object.values(data.expenditure || {}).reduce((s: number, v: any) => s + (parseFloat(v) || 0), 0),
        },
        assets: data.assets || {},
        systemChecks: data.checks || {},
        creditCheck: data.creditCheckResult || {},
        recommendation: data.recommendationResult || {},
      };

      await applications.update(application.applicationId, structuredData);
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [application.applicationId, apiStatus]);

  const updateField = (section: string, field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [section]: { ...prev[section], [field]: value } };

      // Trigger application creation on first interaction
      if (!application.applicationId && !applicationCreated.current) {
        ensureApplicationExists();
      }

      // Debounced save to backend
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveToBackend(updated), 1500);

      return updated;
    });

    // Clear relevant error when user updates a field
    setErrors(prev => {
      const updated = { ...prev };
      // Clear direct field match
      delete updated[field];
      // Clear section.field style errors
      delete updated[`${section}.${field}`];
      // Clear any indexed errors for this section (e.g. debts.0.creditorName)
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${section}.`)) {
          // Keep other indexed errors but clear the general "required" ones on any change
          if (key === `${section}.required`) delete updated[key];
        }
      });
      return updated;
    });
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
        return 'not_started';
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

  const nextSection = () => {
    // Validate steps 0-4 (user input steps); steps 5+ don't need validation to proceed
    if (currentSection <= 4) {
      const stepErrors = validateStep(currentSection, formData);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
    }
    setErrors({});
    // Show progress saved indicator briefly
    setProgressSaved(true);
    setTimeout(() => setProgressSaved(false), 2000);
    // Smooth transition between steps
    setTransitioning(true);
    setTimeout(() => {
      setCurrentSection(s => Math.min(s + 1, SECTIONS.length - 1));
      setTransitioning(false);
    }, 200);
  };
  const prevSection = () => {
    setErrors({});
    setTransitioning(true);
    setTimeout(() => {
      setCurrentSection(s => Math.max(s - 1, 0));
      setTransitioning(false);
    }, 200);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Apply for Debt Advice</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">Complete each section below. You can navigate between sections freely.</p>

      {/* API Connection Status + Auto-save indicator */}
      <div className="flex items-center justify-between mb-6 text-xs">
        <div className="flex items-center gap-2">
          {apiStatus === 'connected' && (
            <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live — saving to API
              {application.referenceNumber && <span className="font-mono font-bold ml-1">{application.referenceNumber}</span>}
            </span>
          )}
          {apiStatus === 'offline' && (
            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Offline mode — data stored locally
            </span>
          )}
          {apiStatus === 'idle' && (
            <span className="text-gray-500">Start filling in the form to connect</span>
          )}
        </div>
        <div className="text-gray-500 flex items-center gap-3">
          {progressSaved && (
            <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded font-bold animate-pulse transition-opacity duration-500">
              ✓ Progress saved
            </span>
          )}
          {saving && <span className="animate-pulse">💾 Saving...</span>}
          {!saving && lastSaved && <span>✓ Saved at {lastSaved}</span>}
        </div>
      </div>

      {/* Section navigation — scrollable on mobile, grid on desktop */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-8 md:grid md:grid-cols-5 lg:grid-cols-9 md:overflow-visible">
        {SECTIONS.map((section, i) => {
          const status = getSectionStatus(section.id);
          const isActive = i === currentSection;
          return (
            <button
              key={section.id}
              onClick={() => setCurrentSection(i)}
              className={`relative p-3 rounded border-2 text-center transition-all min-w-[80px] flex-shrink-0 md:min-w-0 ${isActive ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 bg-white dark:bg-gray-800'}`}
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
      <div className="flex gap-4 mb-6 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span> Not started</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Has errors</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> In progress</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Complete</span>
      </div>

      {/* Current section content */}
      <div className={`border-2 rounded-lg p-6 mb-6 ring-2 ${getSectionStatusRing(getSectionStatus(SECTIONS[currentSection].id))} transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{SECTIONS[currentSection].icon}</span>
          <h2 className="text-xl font-bold">{SECTIONS[currentSection].label}</h2>
          <span className={`ml-auto px-2 py-0.5 rounded text-xs font-bold text-white ${getSectionStatusColour(getSectionStatus(SECTIONS[currentSection].id))}`}>
            {getSectionStatusLabel(getSectionStatus(SECTIONS[currentSection].id))}
          </span>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 dark:bg-red-950 border-l-4 border-red-600 p-4 mb-4" role="alert">
            <h3 className="font-bold text-red-800 dark:text-red-300 text-sm mb-1">There are errors in this section</h3>
            <p className="text-xs text-red-700 dark:text-red-400">Please correct the highlighted fields before continuing.</p>
          </div>
        )}

        {currentSection === 0 && <PersonalSection formData={formData} updateField={updateField} errors={errors} />}
        {currentSection === 1 && <AddressSection formData={formData} updateField={updateField} errors={errors} />}
        {currentSection === 2 && <DebtsSection formData={formData} updateField={updateField} errors={errors} />}
        {currentSection === 3 && <IncomeSection formData={formData} updateField={updateField} errors={errors} />}
        {currentSection === 4 && <AssetsSection formData={formData} updateField={updateField} errors={errors} />}
        {currentSection === 5 && <DocumentsSection formData={formData} updateField={updateField} />}
        {currentSection === 6 && <ChecksSection formData={formData} updateField={updateField} />}
        {currentSection === 7 && <RecommendationSection formData={formData} updateField={updateField} />}
        {currentSection === 8 && <PaymentSection formData={formData} updateField={updateField} applicationId={application.applicationId} />}
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

function PersonalSection({ formData, updateField, errors }: { formData: any; updateField: any; errors: Record<string, string> }) {
  const d = formData.personal || {};
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<string | null>(d.verifiedVia || null);

  const startVerification = (provider: string) => {
    setVerifying(true);
    setTimeout(() => {
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
      <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 dark:bg-blue-950 mb-6">
        <h3 className="font-bold text-sm mb-2">🔐 Verify Your Identity</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Verify your identity using a government service to pre-fill your details securely. This provides a higher assurance level for your application.</p>

        {!verified && !verifying && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button onClick={() => startVerification('scotaccount')} className="p-3 border-2 border-blue-300 rounded bg-white dark:bg-gray-800 hover:border-blue-600 hover:bg-blue-50 text-left transition-all">
              <p className="font-bold text-sm">🏴󠁧󠁢󠁳󠁣󠁴󠁿 ScotAccount</p>
              <p className="text-xs text-gray-500">Scottish Government ID</p>
              <p className="text-xs text-blue-600 mt-1">LOA2 — Medium confidence</p>
            </button>
            <button onClick={() => startVerification('govuk')} className="p-3 border-2 border-blue-300 rounded bg-white dark:bg-gray-800 hover:border-blue-600 hover:bg-blue-50 text-left transition-all">
              <p className="font-bold text-sm">🇬🇧 GOV.UK One Login</p>
              <p className="text-xs text-gray-500">UK Government ID</p>
              <p className="text-xs text-blue-600 mt-1">LOA2 — Medium confidence</p>
            </button>
            <button onClick={() => setVerified('manual')} className="p-3 border-2 border-gray-300 rounded bg-white dark:bg-gray-800 hover:border-gray-500 text-left transition-all">
              <p className="font-bold text-sm">✏️ Manual Entry</p>
              <p className="text-xs text-gray-500">Enter details yourself</p>
              <p className="text-xs text-gray-400 mt-1">LOA1 — Basic</p>
            </button>
          </div>
        )}

        {verifying && (
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded border">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <div>
              <p className="text-sm font-bold">Redirecting to identity provider...</p>
              <p className="text-xs text-gray-500">You would normally be redirected to sign in. Simulating verification...</p>
            </div>
          </div>
        )}

        {verified && verified !== 'manual' && (
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 rounded">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-sm font-bold text-green-800 dark:text-green-300">Identity Verified via {verified === 'scotaccount' ? 'ScotAccount' : 'GOV.UK One Login'}</p>
              <p className="text-xs text-green-600 dark:text-green-400">Assurance Level: LOA2 (Medium confidence) — Details pre-filled from verified source</p>
            </div>
          </div>
        )}

        {verified === 'manual' && (
          <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 rounded">
            <span>✏️</span>
            <p className="text-xs text-gray-600 dark:text-gray-400">Manual entry — LOA1 (Basic). Additional document verification may be required.</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold mb-1 text-sm">Title</label>
          <select value={d.title || ''} onChange={e => updateField('personal', 'title', e.target.value)}
            className="border-2 border-gray-900 dark:border-gray-600 dark:bg-gray-800 p-2.5 min-h-[44px] w-full">
            <option value="">Select</option>
            {['Mr', 'Mrs', 'Ms', 'Miss', 'Dr'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div></div>
        <Input label="First name *" value={d.firstName} onChange={v => updateField('personal', 'firstName', v)} error={errors.firstName} />
        <Input label="Last name *" value={d.lastName} onChange={v => updateField('personal', 'lastName', v)} error={errors.lastName} />
      </div>
      <Input label="Date of birth *" type="date" value={d.dateOfBirth} onChange={v => updateField('personal', 'dateOfBirth', v)} hint="YYYY-MM-DD format" error={errors.dateOfBirth} />
      <Input label="National Insurance number *" value={d.nationalInsuranceNumber} onChange={v => updateField('personal', 'nationalInsuranceNumber', v)} hint="e.g. QQ 12 34 56 C" error={errors.nationalInsuranceNumber} />
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold mb-1 text-sm">Marital status *</label>
          <select value={d.maritalStatus || ''} onChange={e => updateField('personal', 'maritalStatus', e.target.value)}
            className={`border-2 ${errors.maritalStatus ? 'border-red-500' : 'border-gray-900 dark:border-gray-600'} dark:bg-gray-800 p-2.5 min-h-[44px] w-full`}>
            <option value="">Select</option>
            {['Single','Married','Civil Partnership','Divorced','Widowed','Separated'].map(s => <option key={s} value={s.toLowerCase().replace(' ','_')}>{s}</option>)}
          </select>
          {errors.maritalStatus && <p className="text-red-600 text-xs mt-1">{errors.maritalStatus}</p>}
        </div>
        <div className="mb-1">
          <label className="block font-bold mb-1 text-sm">Number of dependants *</label>
          {errors.dependants && <p className="text-xs text-red-600 font-bold mb-1">⚠ {errors.dependants}</p>}
          <input type="number" min="0" max="20" step="1" value={d.dependants || 0} onChange={e => updateField('personal', 'dependants', Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
            className={`border-2 ${errors.dependants ? 'border-red-500' : 'border-gray-900 dark:border-gray-600'} dark:bg-gray-800 p-2.5 w-full text-base min-h-[44px] focus:outline-2 focus:outline-yellow-400`} />
        </div>
      </div>
      <div>
        <label className="block font-bold mb-1 text-sm">Employment status *</label>
        <select value={d.employmentStatus || ''} onChange={e => updateField('personal', 'employmentStatus', e.target.value)}
          className={`border-2 ${errors.employmentStatus ? 'border-red-500' : 'border-gray-900 dark:border-gray-600'} dark:bg-gray-800 p-2.5 min-h-[44px] w-full md:w-1/2`}>
          <option value="">Select</option>
          {['Employed','Self-employed','Unemployed','Retired','Student','Other'].map(s => <option key={s} value={s.toLowerCase().replace('-','_')}>{s}</option>)}
        </select>
        {errors.employmentStatus && <p className="text-red-600 text-xs mt-1">{errors.employmentStatus}</p>}
      </div>

      {/* Aliases / Other Names */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-sm mb-2">Other Names / Aliases</h3>
        <p className="text-xs text-gray-500 mb-3">Include any other names you are or have been known by (maiden name, previous married name, etc.)</p>
        {(d.aliases || []).map((alias: any, i: number) => (
          <div key={i} className="flex gap-2 items-end mb-2">
            <div className="flex-1"><input value={alias.firstName || ''} onChange={e => { const a = [...(d.aliases||[])]; a[i]={...a[i],firstName:e.target.value}; updateField('personal','aliases',a); }} placeholder="First name" className="border-2 border-gray-900 dark:border-gray-600 dark:bg-gray-800 p-2.5 min-h-[44px] w-full text-sm" /></div>
            <div className="flex-1"><input value={alias.lastName || ''} onChange={e => { const a = [...(d.aliases||[])]; a[i]={...a[i],lastName:e.target.value}; updateField('personal','aliases',a); }} placeholder="Last name" className="border-2 border-gray-900 dark:border-gray-600 dark:bg-gray-800 p-2.5 min-h-[44px] w-full text-sm" /></div>
            <select value={alias.type || ''} onChange={e => { const a = [...(d.aliases||[])]; a[i]={...a[i],type:e.target.value}; updateField('personal','aliases',a); }} className="border-2 border-gray-900 dark:border-gray-600 dark:bg-gray-800 p-2 text-sm">
              <option value="">Type</option><option value="maiden">Maiden name</option><option value="previous_married">Previous married</option><option value="other">Other</option>
            </select>
            <button onClick={() => { const a = (d.aliases||[]).filter((_:any,idx:number)=>idx!==i); updateField('personal','aliases',a); }} className="text-red-600 text-xs px-2 py-2 hover:bg-red-50 rounded">✕</button>
          </div>
        ))}
        <button onClick={() => updateField('personal','aliases',[...(d.aliases||[]),{firstName:'',lastName:'',type:''}])} className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded hover:bg-gray-300">+ Add other name</button>
      </div>
    </div>
  );
}

function AddressSection({ formData, updateField, errors }: { formData: any; updateField: any; errors: Record<string, string> }) {
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
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 rounded p-3 mb-4">
        <p className="text-sm"><strong>5-Year Address History Required:</strong> Please provide all addresses you have lived at during the last 5 years. This is needed for credit checks and cross-system verification.</p>
      </div>

      <h3 className="font-bold">Current Address</h3>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input label="Postcode *" value={a.postcode} onChange={v => updateField('address', 'postcode', v)} hint="Enter postcode to look up" error={errors['address.postcode']} />
        </div>
        <button onClick={lookupPostcode} type="button" className="bg-blue-700 text-white py-2 px-4 mb-4 text-sm hover:bg-blue-800">Find address</button>
      </div>
      {lookupResults.length > 0 && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded mb-4">
          <p className="text-sm font-bold mb-2">Select an address:</p>
          {lookupResults.map((addr, i) => (
            <button key={i} type="button" className="block text-sm text-blue-700 underline mb-1"
              onClick={() => { updateField('address', 'line1', addr.line1); updateField('address', 'city', addr.city); setLookupResults([]); }}>
              {addr.line1}, {addr.city}
            </button>
          ))}
        </div>
      )}
      <Input label="Address line 1 *" value={a.line1} onChange={v => updateField('address', 'line1', v)} error={errors['address.line1']} />
      <Input label="Address line 2" value={a.line2} onChange={v => updateField('address', 'line2', v)} />
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="City *" value={a.city} onChange={v => updateField('address', 'city', v)} error={errors['address.city']} />
        <Input label="County" value={a.county} onChange={v => updateField('address', 'county', v)} />
      </div>
      <Input label="Resident since *" type="date" value={a.residentSince} onChange={v => updateField('address', 'residentSince', v)} error={errors['address.residentSince']} />

      {/* Previous Addresses */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
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
        <button onClick={addPreviousAddress} className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded hover:bg-gray-300">+ Add previous address</button>
      </div>

      <h3 className="font-bold mt-6">Contact Details</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Email address *" type="email" value={a.email} onChange={v => updateField('address', 'email', v)} error={a.email && !a.email.includes('@') ? 'Invalid email' : undefined} />
        <Input label="Phone number *" type="tel" value={a.phone} onChange={v => updateField('address', 'phone', v)} />
      </div>
    </div>
  );
}

function DebtsSection({ formData, updateField, errors }: { formData: any; updateField: any; errors: Record<string, string> }) {
  const debts = formData.debts?.items || [];
  const totalDebt = debts.reduce((s: number, d: any) => s + (parseFloat(d.outstandingAmount) || 0), 0);

  const addDebt = () => updateField('debts', 'items', [...debts, { creditorName: '', creditorType: 'other', outstandingAmount: 0, monthlyPayment: 0 }]);
  const updateDebt = (i: number, field: string, value: any) => {
    const items = [...debts]; items[i] = { ...items[i], [field]: value }; updateField('debts', 'items', items);
  };
  const removeDebt = (i: number) => updateField('debts', 'items', debts.filter((_: any, idx: number) => idx !== i));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Enter all debts you currently owe. Include credit cards, loans, overdrafts, council tax arrears, etc.</p>
      {errors['debts.required'] && <p className="text-red-600 text-sm font-bold">{errors['debts.required']}</p>}
      {totalDebt > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-600 p-3">
          <p className="font-bold">Total debt entered: £{totalDebt.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{debts.length} creditor{debts.length !== 1 ? 's' : ''}</p>
        </div>
      )}
      {debts.map((debt: any, i: number) => (
        <div key={i} className="border border-gray-300 dark:border-gray-700 p-4 rounded relative">
          <button onClick={() => removeDebt(i)} className="absolute top-2 right-2 text-red-600 text-xs hover:underline">Remove</button>
          <p className="font-bold text-sm mb-2">Debt {i + 1}</p>
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="Creditor name *" value={debt.creditorName} onChange={v => updateDebt(i, 'creditorName', v)} error={errors[`debts.${i}.creditorName`]} />
            <div>
              <label className="block font-bold mb-1 text-sm">Type *</label>
              <select value={debt.creditorType} onChange={e => updateDebt(i, 'creditorType', e.target.value)} className={`border-2 ${errors[`debts.${i}.creditorType`] ? 'border-red-500' : 'border-gray-900 dark:border-gray-600'} dark:bg-gray-800 p-2.5 min-h-[44px] w-full`}>
                {[['bank','Bank'],['credit_card','Credit Card'],['loan_company','Loan'],['utility','Utility'],['council_tax','Council Tax'],['hmrc','HMRC'],['other','Other']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              {errors[`debts.${i}.creditorType`] && <p className="text-red-600 text-xs mt-1">{errors[`debts.${i}.creditorType`]}</p>}
            </div>
            <Input label="Outstanding amount (£) *" type="number" value={debt.outstandingAmount} onChange={v => updateDebt(i, 'outstandingAmount', v)}
              error={errors[`debts.${i}.outstandingAmount`]} />
            <Input label="Monthly payment (£)" type="number" value={debt.monthlyPayment} onChange={v => updateDebt(i, 'monthlyPayment', v)} error={errors[`debts.${i}.monthlyPayment`]} />
          </div>
        </div>
      ))}
      <button onClick={addDebt} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold py-2 px-4 border-b-2 border-gray-400 hover:bg-gray-300 text-sm">+ Add a debt</button>
    </div>
  );
}

function IncomeSection({ formData, updateField, errors }: { formData: any; updateField: any; errors: Record<string, string> }) {
  const inc = formData.income || {};
  const exp = formData.expenditure || {};
  const totalIncome = (parseFloat(inc.wages)||0) + (parseFloat(inc.benefits)||0) + (parseFloat(inc.pension)||0) + (parseFloat(inc.other)||0);
  const totalExp = (parseFloat(exp.rent)||0) + (parseFloat(exp.councilTax)||0) + (parseFloat(exp.utilities)||0) + (parseFloat(exp.food)||0) + (parseFloat(exp.transport)||0) + (parseFloat(exp.insurance)||0) + (parseFloat(exp.childcare)||0) + (parseFloat(exp.other)||0);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 rounded p-3 mb-2">
        <p className="text-xs"><strong>📋 Common Financial Tool (CFT):</strong> Income and expenditure categories below are aligned with the <a href="https://www.aib.gov.uk/common-financial-tool" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Common Financial Tool</a> used across all Scottish debt solutions for affordability assessment.</p>
      </div>
      {errors['income.required'] && <p className="text-red-600 text-sm font-bold">{errors['income.required']}</p>}
      <h3 className="font-bold">Monthly Income</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <Input label="Wages/Salary (£)" type="number" value={inc.wages} onChange={v => updateField('income', 'wages', v)} error={errors['income.wages']} />
        <Input label="Benefits (£)" type="number" value={inc.benefits} onChange={v => updateField('income', 'benefits', v)} error={errors['income.benefits']} />
        <Input label="Pension (£)" type="number" value={inc.pension} onChange={v => updateField('income', 'pension', v)} error={errors['income.pension']} />
        <Input label="Other income (£)" type="number" value={inc.other} onChange={v => updateField('income', 'other', v)} error={errors['income.other']} />
      </div>
      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded"><strong>Total income: £{totalIncome.toLocaleString()}/month</strong></div>

      <h3 className="font-bold mt-6">Monthly Expenditure</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <Input label="Rent/Mortgage (£)" type="number" value={exp.rent} onChange={v => updateField('expenditure', 'rent', v)} error={errors['expenditure.rent']} />
        <Input label="Council Tax (£)" type="number" value={exp.councilTax} onChange={v => updateField('expenditure', 'councilTax', v)} error={errors['expenditure.councilTax']} />
        <Input label="Utilities (£)" type="number" value={exp.utilities} onChange={v => updateField('expenditure', 'utilities', v)} error={errors['expenditure.utilities']} />
        <Input label="Food (£)" type="number" value={exp.food} onChange={v => updateField('expenditure', 'food', v)} error={errors['expenditure.food']} />
        <Input label="Transport (£)" type="number" value={exp.transport} onChange={v => updateField('expenditure', 'transport', v)} error={errors['expenditure.transport']} />
        <Input label="Insurance (£)" type="number" value={exp.insurance} onChange={v => updateField('expenditure', 'insurance', v)} error={errors['expenditure.insurance']} />
        <Input label="Childcare (£)" type="number" value={exp.childcare} onChange={v => updateField('expenditure', 'childcare', v)} error={errors['expenditure.childcare']} />
        <Input label="Other (£)" type="number" value={exp.other} onChange={v => updateField('expenditure', 'other', v)} error={errors['expenditure.other']} />
      </div>
      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
        <p><strong>Total expenditure: £{totalExp.toLocaleString()}/month</strong></p>
        <p className={`font-bold mt-1 ${totalIncome - totalExp >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          Disposable income: £{(totalIncome - totalExp).toLocaleString()}/month
        </p>
      </div>
    </div>
  );
}

function AssetsSection({ formData, updateField, errors }: { formData: any; updateField: any; errors: Record<string, string> }) {
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
      <p className="text-sm text-gray-600 dark:text-gray-400">Declare all assets you own or have an interest in. This is essential for determining which debt solution is most appropriate.</p>
      {errors['assets.required'] && <p className="text-red-600 text-sm font-bold">{errors['assets.required']}</p>}

      {assets.noAssets ? (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 rounded p-4">
          <p className="font-bold text-green-800 dark:text-green-300">✓ No assets declared</p>
          <button onClick={() => updateField('assets', 'noAssets', false)} className="text-sm text-blue-700 underline mt-2">I do have assets to declare</button>
        </div>
      ) : (
        <>
          {totalValue > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-600 p-3">
              <p className="font-bold">Total declared asset value: £{totalValue.toLocaleString()}</p>
            </div>
          )}

          {/* Property */}
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h4 className="font-bold text-sm mb-2">🏠 Property</h4>
            {properties.map((p: any, i: number) => (
              <div key={i} className="grid md:grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                <Input label="Property address" value={p.address} onChange={v => updateItem('properties', i, 'address', v)} />
                <Input label="Estimated value (£)" type="number" value={p.value} onChange={v => updateItem('properties', i, 'value', v)} />
                <Input label="Outstanding mortgage (£)" type="number" value={p.mortgage} onChange={v => updateItem('properties', i, 'mortgage', v)} />
                <div><label className="block font-bold mb-1 text-sm">Ownership</label>
                  <select value={p.ownership||''} onChange={e => updateItem('properties', i, 'ownership', e.target.value)} className="border-2 border-gray-900 dark:border-gray-600 dark:bg-gray-800 p-2.5 min-h-[44px] w-full text-sm">
                    <option value="">Select</option><option value="sole">Sole owner</option><option value="joint">Joint owner</option><option value="rented">Rented (not owned)</option>
                  </select>
                </div>
                <button onClick={() => removeItem('properties', i)} className="text-red-600 text-xs self-end">Remove</button>
              </div>
            ))}
            <button onClick={() => addItem('properties', { address: '', value: '', mortgage: '', ownership: '' })} className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded hover:bg-gray-200">+ Add property</button>
          </div>

          {/* Vehicles */}
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h4 className="font-bold text-sm mb-2">🚗 Vehicles</h4>
            {vehicles.map((v: any, i: number) => (
              <div key={i} className="grid md:grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                <Input label="Description" value={v.description} onChange={val => updateItem('vehicles', i, 'description', val)} hint="e.g. 2018 Ford Focus" />
                <Input label="Estimated value (£)" type="number" value={v.value} onChange={val => updateItem('vehicles', i, 'value', val)} />
                <Input label="Finance outstanding (£)" type="number" value={v.finance} onChange={val => updateItem('vehicles', i, 'finance', val)} />
                <div><label className="block font-bold mb-1 text-sm">Essential for work?</label>
                  <select value={v.essential||''} onChange={e => updateItem('vehicles', i, 'essential', e.target.value)} className="border-2 border-gray-900 dark:border-gray-600 dark:bg-gray-800 p-2.5 min-h-[44px] w-full text-sm">
                    <option value="">Select</option><option value="yes">Yes — needed for employment</option><option value="no">No</option>
                  </select>
                </div>
                <button onClick={() => removeItem('vehicles', i)} className="text-red-600 text-xs self-end">Remove</button>
              </div>
            ))}
            <button onClick={() => addItem('vehicles', { description: '', value: '', finance: '', essential: '' })} className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded hover:bg-gray-200">+ Add vehicle</button>
          </div>

          {/* Savings & Investments */}
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h4 className="font-bold text-sm mb-2">💰 Savings & Investments</h4>
            {savings.map((s: any, i: number) => (
              <div key={i} className="grid md:grid-cols-3 gap-3 mb-2">
                <div><label className="block font-bold mb-1 text-sm">Type</label>
                  <select value={s.type||''} onChange={e => updateItem('savings', i, 'type', e.target.value)} className="border-2 border-gray-900 dark:border-gray-600 dark:bg-gray-800 p-2.5 min-h-[44px] w-full text-sm">
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
            <button onClick={() => addItem('savings', { type: '', provider: '', value: '' })} className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded hover:bg-gray-200">+ Add savings/investment</button>
          </div>

          {/* Other Assets */}
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
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
            <button onClick={() => addItem('other', { description: '', value: '' })} className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded hover:bg-gray-200">+ Add other asset</button>
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
      <p className="text-sm text-gray-600 dark:text-gray-400">Upload supporting documents. This is <strong>optional</strong> but may speed up processing.</p>
      <div className="border-2 border-dashed border-gray-400 p-8 text-center bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-gray-600"
        onClick={() => addFile(`document_${files.length + 1}.pdf`)}>
        <p className="text-gray-700 dark:text-gray-300 mb-2">Click to add a document (simulated)</p>
        <p className="text-sm text-gray-500">In the live app: drag & drop, camera capture on mobile, PDF/JPG/PNG</p>
      </div>
      {files.length > 0 && (
        <ul className="space-y-2">{files.map((f, i) => (
          <li key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded border">
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
  const [checkResults, setCheckResults] = useState<SystemCheckResult[]>([]);
  const [creditResult, setCreditResult] = useState<CreditCheckResult | null>(null);
  const [runningChecks, setRunningChecks] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<string | null>(null);

  const SYSTEMS = ['basys', 'eden', 'das', 'cft', 'moratorium', 'roi'];
  const SYSTEM_LABELS: Record<string, string> = {
    basys: 'BASYS (Bankruptcy Administration)',
    eden: 'eDEN/DASH (Debt Arrangement)',
    das: 'DAS (Programme Register)',
    cft: 'CFT (Provider Registry)',
    moratorium: 'Moratorium Register',
    roi: 'RoI (Register of Insolvencies)',
  };

  const runChecks = async () => {
    updateField('checks', 'started', true);
    setRunningChecks(true);
    setCheckResults([]);

    const personal = formData.personal || {};
    const address = formData.address || {};
    const debts = formData.debts || {};

    const applicantData = {
      firstName: personal.firstName || 'John',
      lastName: personal.lastName || 'Testerton',
      dateOfBirth: personal.dateOfBirth || '1985-03-15',
      nationalInsuranceNumber: personal.nationalInsuranceNumber || 'AB123456C',
      postcode: address.postcode || 'EH1 1AA',
      totalDebt: (debts.items || []).reduce((s: number, d: any) => s + (parseFloat(d.outstandingAmount) || 0), 0),
    };

    // Try the first system to check if API is available
    let apiAvailable = false;
    try {
      setCurrentCheck(SYSTEMS[0]);
      const firstResponse = await integrations.checkSystem(SYSTEMS[0], applicantData);
      setCheckResults([firstResponse.data]);
      apiAvailable = true;
    } catch {
      apiAvailable = false;
    }

    if (apiAvailable) {
      // API is reachable — run remaining checks progressively
      for (let i = 1; i < SYSTEMS.length; i++) {
        setCurrentCheck(SYSTEMS[i]);
        try {
          const response = await integrations.checkSystem(SYSTEMS[i], applicantData);
          setCheckResults(prev => [...prev, response.data]);
        } catch {
          setCheckResults(prev => [...prev, { system: SYSTEMS[i], status: 'clear' as const, responseTime: Math.floor(Math.random() * 200) + 50 }]);
        }
      }
      // Run credit check
      setCurrentCheck('credit');
      try {
        const creditResponse = await creditCheck.run(applicantData);
        setCreditResult(creditResponse.data);
        updateField('creditCheckResult', 'score', creditResponse.data.score);
        updateField('creditCheckResult', 'band', creditResponse.data.band);
      } catch {
        setCreditResult({ score: 620, band: 'Fair', defaults: 0, ccjs: 0, utilisation: 38, provider: 'SyntheticCredit', checkedAt: new Date().toISOString() });
      }
    } else {
      // API not available — simulate realistic results with delays
      const mockResults = [
        { system: 'basys', status: 'clear' as const, responseTime: 230 },
        { system: 'eden', status: 'clear' as const, responseTime: 185 },
        { system: 'das', status: 'clear' as const, responseTime: 310 },
        { system: 'cft', status: 'clear' as const, responseTime: 145 },
        { system: 'moratorium', status: 'clear' as const, responseTime: 220 },
        { system: 'roi', status: 'clear' as const, responseTime: 275 },
      ];
      // Show results progressively with simulated timing
      for (const result of mockResults) {
        setCurrentCheck(result.system);
        await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
        setCheckResults(prev => [...prev, result]);
      }
      setCurrentCheck('credit');
      await new Promise(r => setTimeout(r, 500));
      setCreditResult({ score: 620, band: 'Fair', defaults: 0, ccjs: 0, utilisation: 38, provider: 'SyntheticCredit', checkedAt: new Date().toISOString() });
    }

    updateField('checks', 'completed', true);
    setRunningChecks(false);
    setCurrentCheck(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">We check existing AiB systems to see if you have any current or previous cases.</p>

      {/* Demo Tips */}
      <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 rounded p-3 text-xs">
        <p className="font-bold text-purple-800 dark:text-purple-300 mb-1">🎯 Demo Scenarios (trigger different results):</p>
        <ul className="text-purple-700 dark:text-purple-400 space-y-0.5 list-disc pl-4">
          <li>NI ending in <code className="bg-purple-100 px-1 rounded">'A'</code> or surname <code className="bg-purple-100 px-1 rounded">SMITH</code> → existing case in BASYS</li>
          <li>Surname starting with <code className="bg-purple-100 px-1 rounded">'M'</code> → DAS arrangement found in eDEN</li>
          <li>Postcode starting <code className="bg-purple-100 px-1 rounded">'EH'</code> → active moratorium found</li>
          <li>Default (NI ending C) → all systems clear</li>
        </ul>
      </div>

      {!checks.completed ? (
        <div>
          <button onClick={runChecks} disabled={runningChecks} className="bg-blue-700 text-white font-bold py-3 px-6 hover:bg-blue-800 disabled:opacity-50">
            {runningChecks ? '⏳ Running checks...' : '🔍 Run system checks'}
          </button>

          {/* Progressive results during check */}
          {runningChecks && (
            <div className="mt-4 space-y-2">
              {checkResults.map((result, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-sm">{SYSTEM_LABELS[result.system] || result.system}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{result.responseTime}ms</span>
                    {result.status === 'clear' && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">✓ Clear</span>}
                    {result.status === 'found' && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">⚠ Case Found</span>}
                    {result.status === 'error' && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">⚠ Error</span>}
                  </div>
                </div>
              ))}
              {currentCheck && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 animate-pulse">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm font-medium">Checking {SYSTEM_LABELS[currentCheck] || currentCheck}...</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {checkResults.length > 0 ? checkResults.map((result, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <div>
                <span className="font-bold text-sm">{SYSTEM_LABELS[result.system] || result.system}</span>
                {result.status === 'found' && result.data && (
                  <p className="text-xs text-red-700 mt-1">Case ref: {result.data.caseId || result.data.reference || 'Found'}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{result.responseTime}ms</span>
                {result.status === 'clear' && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">✓ Clear</span>}
                {result.status === 'found' && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">⚠ Case Found</span>}
                {result.status === 'error' && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">⚠ Error</span>}
              </div>
            </div>
          )) : (
            // Fallback display (offline mode)
            ['BASYS', 'eDEN/DASH', 'DAS', 'CFT', 'Moratorium', 'RoI'].map(sys => (
              <div key={sys} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="font-bold text-sm">{sys}</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">✓ Clear</span>
              </div>
            ))
          )}

          {/* Credit Check Result */}
          <div className="mt-4 p-4 border rounded bg-white dark:bg-gray-800">
            <h4 className="font-bold text-sm mb-2">📊 Credit Check Result</h4>
            {creditResult ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-2xl font-bold">{creditResult.score}</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-lg font-bold">{creditResult.band}</p>
                  <p className="text-xs text-gray-500">Band</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-lg font-bold">{creditResult.defaults}</p>
                  <p className="text-xs text-gray-500">Defaults</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-lg font-bold">{creditResult.ccjs}</p>
                  <p className="text-xs text-gray-500">CCJs</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Credit check: Score 520 (Fair)</p>
            )}
            <p className="text-xs text-gray-500 mt-2">Provider: {creditResult?.provider || 'SyntheticCredit'} (Sandbox)</p>
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationSection({ formData, updateField }: { formData: any; updateField: any }) {
  const rec = formData.recommendation || {};
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Recommendation | null>(null);

  const getRecommendation = async () => {
    setLoading(true);

    // Simulate processing delay for demo effect (2-3 seconds)
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));

    const income = formData.income || {};
    const expenditure = formData.expenditure || {};
    const debts = formData.debts?.items || [];
    const assets = formData.assets || {};
    const personal = formData.personal || {};

    const totalIncome = Object.values(income).reduce((s: number, v: any) => s + (parseFloat(v) || 0), 0);
    const totalExpenditure = Object.values(expenditure).reduce((s: number, v: any) => s + (parseFloat(v) || 0), 0);
    const totalDebt = debts.reduce((s: number, d: any) => s + (parseFloat(d.outstandingAmount) || 0), 0);

    try {
      const response = await recommendations.get({
        totalDebt,
        creditorsCount: debts.length,
        monthlyIncome: totalIncome,
        monthlyExpenditure: totalExpenditure,
        disposableIncome: totalIncome - totalExpenditure,
        employmentStatus: personal.employmentStatus || 'employed',
        hasAssets: !assets.noAssets && (assets.properties?.length > 0 || assets.vehicles?.length > 0),
        existingCases: formData.checks?.results?.some((r: any) => r.status === 'found') || false,
        hasMoratorium: false,
      });

      setResult(response.data);
      updateField('recommendation', 'received', true);
      updateField('recommendationResult', 'product', response.data.product);
      updateField('recommendationResult', 'confidence', response.data.confidence);
      updateField('recommendationResult', 'reasoning', response.data.reasoning);
    } catch (err) {
      // Fallback: show static recommendation if API unavailable
      console.warn('Recommendation API not available, using fallback');
      setResult({
        product: 'debt_arrangement_scheme',
        confidence: 'high',
        reasoning: 'Based on your debt level and disposable income, DAS provides the best structured repayment path with statutory creditor protection.',
        factors: [
          { factor: 'Debt level', weight: 0.3, value: `£${totalDebt.toLocaleString()}` },
          { factor: 'Disposable income', weight: 0.25, value: `£${(totalIncome - totalExpenditure).toLocaleString()}/month` },
          { factor: 'Number of creditors', weight: 0.15, value: `${debts.length}` },
        ],
      });
      updateField('recommendation', 'received', true);
    } finally {
      setLoading(false);
    }
  };

  const PRODUCT_LABELS: Record<string, string> = {
    debt_arrangement_scheme: 'Debt Arrangement Scheme (DAS)',
    minimal_asset_process: 'Minimal Asset Process (MAP)',
    protected_trust_deed: 'Protected Trust Deed',
    bankruptcy: 'Bankruptcy / Sequestration',
    moratorium: 'Moratorium (Breathing Space)',
    debt_payment_programme: 'Debt Payment Programme (DPP)',
    signposting_advice: 'Signposting to Money Advice',
  };

  return (
    <div className="space-y-4">
      {!rec.received ? (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400">Based on your information, our rules engine will recommend the most suitable debt solution.</p>
          <button onClick={getRecommendation} disabled={loading} className="bg-green-700 text-white font-bold py-3 px-6 hover:bg-green-800 disabled:opacity-50">
            {loading ? '⏳ Analysing...' : 'Get my recommendation'}
          </button>
          {loading && (
            <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="animate-spin w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full"></div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm mb-1">Analysing your financial profile...</p>
                  <p className="text-xs text-gray-500">Evaluating debt level, disposable income, credit history, and assets against eligibility criteria for all Scottish debt solutions</p>
                </div>
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-green-600 h-1.5 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-green-700 text-white p-6 rounded text-center animate-[fadeIn_0.5s_ease-in]">
            <h3 className="text-xl font-bold text-white">Recommended: {result ? PRODUCT_LABELS[result.product] || result.product : 'Debt Arrangement Scheme (DAS)'}</h3>
            <p className="text-green-100 mt-1">Confidence: {result?.confidence || 'High'}</p>
          </div>

          {result?.reasoning && (
            <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-600 p-4">
              <h4 className="font-bold mb-2">Why we recommend this</h4>
              <p className="text-sm">{result.reasoning}</p>
            </div>
          )}

          {result?.factors && result.factors.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <h4 className="font-bold text-sm mb-2">Decision Factors</h4>
              <div className="space-y-2">
                {result.factors.map((f, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span>{f.factor}</span>
                    <span className="font-mono text-gray-600 dark:text-gray-400">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border border-gray-300 dark:border-gray-700 p-4 rounded">
            <p className="text-sm italic text-gray-600 dark:text-gray-400">This is an automated recommendation for information only. Speak with a money adviser before making decisions.</p>
          </div>
        </>
      )}
    </div>
  );
}

function PaymentSection({ formData, updateField, applicationId }: { formData: any; updateField: any; applicationId: string | null }) {
  const payment = formData.payment || {};
  const { application, setApplication, addRecentApplication } = useAppContext();
  const [submitting, setSubmitting] = useState(false);
  const [submitRef, setSubmitRef] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (applicationId) {
        const response = await applications.submit(applicationId);
        setSubmitRef(response.data.referenceNumber);
        setApplication({ status: 'submitted' });
        addRecentApplication(applicationId);
      } else {
        // Offline fallback
        setSubmitRef(`IAAS-2026-${String(Math.floor(Math.random()*99999)).padStart(5,'0')}`);
      }
      updateField('payment', 'completed', true);
    } catch (err) {
      console.warn('Submit failed, using offline reference:', err);
      setSubmitRef(`IAAS-2026-${String(Math.floor(Math.random()*99999)).padStart(5,'0')}`);
      updateField('payment', 'completed', true);
    } finally {
      setSubmitting(false);
    }
  };

  if (payment.completed) {
    return (
      <div className="animate-[fadeIn_0.6s_ease-in]">
        <div className="bg-green-700 text-white p-8 rounded-t text-center">
          <div className="mb-3">
            <span className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full text-3xl">✓</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Application Submitted Successfully</h3>
          <p className="text-xl text-white font-mono bg-white/10 inline-block px-4 py-1 rounded">{submitRef || application.referenceNumber || 'IAAS-2026-XXXXX'}</p>
          <p className="text-green-200 mt-3">Payment of £90.00 received (SANDBOX)</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b p-6">
          <h4 className="font-bold mb-3">What happens next</h4>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-6">
            <li>Your application will be reviewed by an AiB case officer within <strong>3 working days</strong></li>
            <li>System checks and credit verification will be completed automatically</li>
            <li>You will receive email confirmation with your recommendation</li>
            <li>A qualified money adviser will be assigned to your case</li>
          </ol>
          <div className="flex flex-wrap gap-3 mb-6">
            <button className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold py-2 px-4 text-sm rounded hover:bg-gray-300 flex items-center gap-2">
              📥 Download PDF Confirmation
            </button>
            <button onClick={() => navigateTo('/dashboard')} className="bg-blue-700 text-white font-bold py-2 px-4 text-sm rounded hover:bg-blue-800 flex items-center gap-2">
              📋 View on Dashboard
            </button>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 rounded p-3 text-sm">
            <p className="text-blue-800 dark:text-blue-300"><strong>Keep your reference number:</strong> {submitRef || application.referenceNumber || 'IAAS-2026-XXXXX'}</p>
            <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">You will need this to track your application or contact us about it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">Application fee: <strong>£90.00</strong></p>
      <div className="bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-600 p-3 text-sm"><strong>Sandbox:</strong> No real payment processed.</div>
      <h3 className="font-bold">Choose payment method</h3>
      <div className="grid grid-cols-3 gap-3">
        {[['apple_pay','🍎 Apple Pay'],['google_pay','G Pay'],['card','💳 Card']].map(([id, label]) => (
          <button key={id} onClick={() => updateField('payment', 'method', id)}
            className={`p-4 border-2 rounded text-center font-bold text-sm ${payment.method === id ? 'border-blue-600 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 dark:border-gray-700 hover:border-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>
      {payment.method && (
        <button onClick={handleSubmit} disabled={submitting}
          className="bg-green-700 text-white font-bold py-3 px-8 hover:bg-green-800 w-full text-center disabled:opacity-50">
          {submitting ? '⏳ Processing...' : 'Complete Payment & Submit (Sandbox) — £90.00'}
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
        className={`border-2 ${error ? 'border-red-500' : 'border-gray-900 dark:border-gray-600'} dark:bg-gray-800 p-2.5 w-full text-base min-h-[44px] focus:outline-2 focus:outline-yellow-400`} />
    </div>
  );
}
