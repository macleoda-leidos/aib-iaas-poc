'use client';

import { useState, useEffect } from 'react';
import { integrations, applications as applicationsApi } from '../../lib/apiClient';

const SCENARIOS = [
  {
    id: 'happy-path',
    label: '✅ Happy Path (DAS)',
    description: 'Standard debtor, all checks clear, DAS recommended',
    data: {
      personal: {
        title: 'Mr', firstName: 'John', lastName: 'Testerton',
        dateOfBirth: '1985-03-15', nationalInsuranceNumber: 'AB123456C',
        maritalStatus: 'married', employmentStatus: 'employed', dependants: 1,
      },
      address: { line1: '14 Royal Mile', city: 'Edinburgh', postcode: 'EH1 1BB', email: 'john.testerton@email.com', phone: '07700 900100' },
      debts: { items: [
        { creditorName: 'Royal Bank of Scotland', creditorType: 'bank', outstandingAmount: 8000, monthlyPayment: 200 },
        { creditorName: 'Tesco Bank', creditorType: 'credit_card', outstandingAmount: 3500, monthlyPayment: 90 },
        { creditorName: 'Scottish Power', creditorType: 'utility', outstandingAmount: 1200, monthlyPayment: 40 },
      ]},
      income: { wages: 2600, benefits: 0, pension: 0, other: 0 },
      expenditure: { rent: 750, councilTax: 120, utilities: 140, food: 350, transport: 100, insurance: 50, childcare: 200, other: 50 },
    }
  },
  {
    id: 'existing-case',
    label: '⚠️ Existing Case Found',
    description: 'NI ends in A — triggers BASYS match (previous bankruptcy)',
    data: {
      personal: {
        title: 'Mr', firstName: 'James', lastName: 'Smith',
        dateOfBirth: '1972-09-20', nationalInsuranceNumber: 'CD987654A',
        maritalStatus: 'divorced', employmentStatus: 'employed', dependants: 0,
      },
      address: { line1: '55 Buchanan Street', city: 'Glasgow', postcode: 'G1 2JJ', email: 'j.smith72@gmail.com', phone: '07700 900200' },
      debts: { items: [
        { creditorName: 'Halifax', creditorType: 'bank', outstandingAmount: 15000, monthlyPayment: 350 },
        { creditorName: 'Vanquis', creditorType: 'credit_card', outstandingAmount: 4200, monthlyPayment: 110 },
      ]},
      income: { wages: 1900, benefits: 0, pension: 0, other: 0 },
      expenditure: { rent: 650, councilTax: 100, utilities: 120, food: 300, transport: 150, insurance: 40, childcare: 0, other: 30 },
    }
  },
  {
    id: 'moratorium',
    label: '🏠 Active Moratorium',
    description: 'Postcode starts EH — triggers moratorium detection',
    data: {
      personal: {
        title: 'Ms', firstName: 'Margaret', lastName: 'Murray',
        dateOfBirth: '1980-04-11', nationalInsuranceNumber: 'EF456789B',
        maritalStatus: 'single', employmentStatus: 'unemployed', dependants: 2,
      },
      address: { line1: '8 Princes Street', city: 'Edinburgh', postcode: 'EH2 2AN', email: 'margaret.m@outlook.com', phone: '07700 900300' },
      debts: { items: [
        { creditorName: 'Nationwide', creditorType: 'bank', outstandingAmount: 6500, monthlyPayment: 150 },
        { creditorName: 'Capital One', creditorType: 'credit_card', outstandingAmount: 2800, monthlyPayment: 70 },
        { creditorName: 'City of Edinburgh Council', creditorType: 'council_tax', outstandingAmount: 2200, monthlyPayment: 0 },
      ]},
      income: { wages: 0, benefits: 1400, pension: 0, other: 0 },
      expenditure: { rent: 700, councilTax: 0, utilities: 110, food: 320, transport: 60, insurance: 30, childcare: 150, other: 20 },
    }
  },
];

export default function DemoControlsPage() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [appCount, setAppCount] = useState<number | null>(null);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const response = await integrations.health();
      setHealthStatus(response.data);
    } catch (err) {
      setHealthStatus({ error: 'API Gateway not reachable' });
    }
    setChecking(false);
  };

  const checkApplications = async () => {
    try {
      const response = await applicationsApi.list({ pageSize: 1 });
      setAppCount(response.meta?.totalCount || 0);
    } catch {
      setAppCount(null);
    }
  };

  useEffect(() => {
    checkHealth();
    checkApplications();
  }, []);

  const copyScenario = (scenario: typeof SCENARIOS[0]) => {
    navigator.clipboard.writeText(JSON.stringify(scenario.data, null, 2));
    alert(`Copied "${scenario.label}" data to clipboard. Paste into browser console or use the Apply page.`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-purple-50 dark:bg-purple-950 border-2 border-purple-300 rounded-lg p-4 mb-6">
        <h1 className="text-2xl font-bold mb-1">🎛️ Demo Controls</h1>
        <p className="text-sm text-purple-700 dark:text-purple-300">Internal page for demo preparation. Not visible to end users.</p>
      </div>

      {/* Service Health */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">🏥 Service Health</h2>
          <button onClick={checkHealth} disabled={checking}
            className="text-sm bg-blue-700 text-white px-3 py-1.5 rounded hover:bg-blue-800 disabled:opacity-50">
            {checking ? 'Checking...' : 'Refresh'}
          </button>
        </div>

        {healthStatus ? (
          healthStatus.error ? (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 p-3 rounded text-sm text-red-800 dark:text-red-300">
              ❌ {healthStatus.error} — Start services with <code className="bg-red-100 px-1 rounded">docker compose up</code>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(healthStatus).map(([service, status]: [string, any]) => (
                <div key={service} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  <span className={`w-2 h-2 rounded-full ${status === 'healthy' || status?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">{service}</span>
                </div>
              ))}
            </div>
          )
        ) : (
          <p className="text-sm text-gray-500">Checking services...</p>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-sm">
          <span>📊 Applications in database: <strong>{appCount !== null ? appCount : '—'}</strong></span>
        </div>
      </div>

      {/* Seed Data */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold mb-2">🌱 Seed Demo Data</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Populate the database with sample applications in various states for a full demo.
        </p>
        <div className="flex gap-3">
          <button onClick={async () => {
            setSeedStatus('Running...');
            try {
              const res = await fetch('/api/seed', { method: 'POST' });
              if (!res.ok) throw new Error('Seed endpoint not available');
              setSeedStatus('✅ Seeded successfully');
            } catch {
              setSeedStatus('Run manually: npx tsx scripts/seed-demo-data.ts');
            }
            checkApplications();
          }} className="bg-green-700 text-white text-sm font-bold px-4 py-2 rounded hover:bg-green-800">
            Seed Database
          </button>
          {seedStatus && <span className="self-center text-sm text-gray-600 dark:text-gray-400">{seedStatus}</span>}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Or run from terminal: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">npx tsx scripts/seed-demo-data.ts</code>
        </p>
      </div>

      {/* Demo Scenarios */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold mb-2">🎬 Demo Scenarios</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Pre-configured form data for different demo paths. Use the Apply page's identity verification to auto-fill the Happy Path, or use these for other scenarios.
        </p>

        <div className="space-y-3">
          {SCENARIOS.map(scenario => (
            <div key={scenario.id} className="border border-gray-200 dark:border-gray-700 rounded p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">{scenario.label}</p>
                <p className="text-xs text-gray-500">{scenario.description}</p>
                <p className="text-xs font-mono text-gray-400 mt-1">
                  NI: {scenario.data.personal.nationalInsuranceNumber} | Postcode: {scenario.data.address.postcode}
                </p>
              </div>
              <button onClick={() => copyScenario(scenario)}
                className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 flex-shrink-0">
                📋 Copy
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Trigger Reference */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-bold mb-2">📖 Mock Integration Triggers</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          The mock services return different results based on input data. Use these in the Apply form:
        </p>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="text-left p-2 font-bold">System</th>
              <th className="text-left p-2 font-bold">Trigger</th>
              <th className="text-left p-2 font-bold">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            <tr><td className="p-2">BASYS</td><td className="p-2 font-mono text-xs">NI ends in 'A' or surname = 'SMITH'</td><td className="p-2 text-red-700">Existing case found</td></tr>
            <tr><td className="p-2">eDEN/DASH</td><td className="p-2 font-mono text-xs">Surname starts with 'M'</td><td className="p-2 text-red-700">DAS arrangement found</td></tr>
            <tr><td className="p-2">DAS</td><td className="p-2 font-mono text-xs">Total debt £5,000–£20,000</td><td className="p-2 text-red-700">Existing DAS application</td></tr>
            <tr><td className="p-2">Moratorium</td><td className="p-2 font-mono text-xs">Postcode starts with 'EH'</td><td className="p-2 text-red-700">Active moratorium</td></tr>
            <tr><td className="p-2">RoI</td><td className="p-2 font-mono text-xs">Surname contains 'TEST'</td><td className="p-2 text-red-700">Register entry found</td></tr>
            <tr><td className="p-2">CFT</td><td className="p-2 font-mono text-xs">Always returns providers</td><td className="p-2 text-green-700">Provider list</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
