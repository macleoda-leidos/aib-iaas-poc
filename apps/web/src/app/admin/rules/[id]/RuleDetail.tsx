'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RuleDefinition } from '../data/rules-data';

interface TestInputs {
  totalDebt: number;
  disposableIncome: number;
  employmentStatus: string;
  totalAssets: number;
  hasExistingCase: boolean;
  hasMoratorium: boolean;
}

interface ConditionResult {
  condition: string;
  passed: boolean;
}

interface TestResult {
  matches: boolean;
  results: ConditionResult[];
}

function testRule(rule: RuleDefinition, inputs: TestInputs): TestResult {
  const results: ConditionResult[] = [];

  for (const condition of rule.conditions) {
    let passed = false;
    const { field, operator, value } = condition;

    let fieldValue: number | string | boolean;

    switch (field) {
      case 'totalDebt':
        fieldValue = inputs.totalDebt;
        break;
      case 'disposableIncome':
        fieldValue = inputs.disposableIncome;
        break;
      case 'totalAssets':
      case 'hasAssets':
        fieldValue = inputs.totalAssets;
        break;
      case 'existingCases':
        fieldValue = inputs.hasExistingCase ? 'found' : 'none';
        break;
      case 'hasMoratorium':
        fieldValue = inputs.hasMoratorium ? 'true' : 'false';
        break;
      case 'employmentStatus':
        fieldValue = inputs.employmentStatus;
        break;
      default:
        fieldValue = 0;
    }

    if (value === 'totalDebt/48') {
      const requiredMonthly = inputs.totalDebt / 48;
      passed = inputs.disposableIncome >= requiredMonthly;
    } else {
      const numericValue = parseFloat(value);
      const numericField = typeof fieldValue === 'number' ? fieldValue : NaN;

      switch (operator) {
        case '<':
          passed = numericField < numericValue;
          break;
        case '>':
          passed = numericField > numericValue;
          break;
        case '>=':
          passed = numericField >= numericValue;
          break;
        case '<=':
          passed = numericField <= numericValue;
          break;
        case '==':
          if (isNaN(numericValue)) {
            passed = String(fieldValue) === value;
          } else {
            passed = numericField === numericValue;
          }
          break;
        case 'between': {
          const parts = value.split('-').map(Number);
          if (parts.length === 2) {
            passed = numericField >= parts[0] && numericField <= parts[1];
          }
          break;
        }
        default:
          passed = false;
      }
    }

    results.push({ condition: condition.displayText, passed });
  }

  const matches = results.every(r => r.passed);
  return { matches, results };
}

function StatusBadge({ status }: { status: RuleDefinition['status'] }) {
  const styles = {
    active: 'bg-green-900/50 text-green-300 border border-green-600',
    draft: 'bg-amber-900/50 text-amber-300 border border-amber-600',
    archived: 'bg-gray-700 text-gray-300 border border-gray-500',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function RuleDetail({ rule }: { rule: RuleDefinition }) {
  const [inputs, setInputs] = useState<TestInputs>({
    totalDebt: 18000,
    disposableIncome: 230,
    employmentStatus: 'employed',
    totalAssets: 5000,
    hasExistingCase: false,
    hasMoratorium: false,
  });

  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleTest = () => {
    const result = testRule(rule, inputs);
    setTestResult(result);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link href="/admin/rules" className="text-blue-400 hover:underline text-sm mb-6 inline-block">
        &larr; Back to Rules
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{rule.name}</h1>
          <StatusBadge status={rule.status} />
          <span className="inline-block px-2 py-0.5 text-xs font-mono font-medium rounded bg-blue-900/50 text-blue-300 border border-blue-600">
            v{rule.version}
          </span>
        </div>
        <p className="mt-2 text-gray-400">{rule.description}</p>
      </div>

      {/* Metadata Grid */}
      <div className="bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</p>
            <p className="text-sm font-semibold text-gray-200 mt-1">{formatDate(rule.lastUpdated)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Updated By</p>
            <p className="text-sm font-semibold text-gray-200 mt-1">{rule.updatedBy}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</p>
            <p className="text-sm font-semibold text-gray-200 mt-1">{rule.priority}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Target Product</p>
            <p className="text-sm font-semibold text-gray-200 mt-1">{rule.product}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Engine Version</p>
            <p className="text-sm font-semibold text-gray-200 mt-1">v2.3</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Test Coverage</p>
            <p className="text-sm font-semibold text-gray-200 mt-1">{rule.testResults.coverage}%</p>
          </div>
        </div>
      </div>

      {/* Conditions Panel */}
      <div data-demo="rule-conditions" className="bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border-l-4 border-blue-500 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Rule Conditions (IF)</h2>
        <div className="space-y-3">
          {rule.conditions.map((condition, index) => (
            <div key={index}>
              {index > 0 && (
                <div className="flex items-center my-2">
                  <span className="text-xs font-bold text-gray-400 bg-gray-700 px-2 py-0.5 rounded">AND</span>
                </div>
              )}
              <div className="bg-gray-900 border border-gray-600 rounded p-3">
                <code className="text-sm font-mono text-gray-200">
                  IF <span className="text-blue-400">{condition.field}</span>{' '}
                  <span className="text-red-400">{condition.operator}</span>{' '}
                  <span className="text-green-400">{condition.value}</span>
                </code>
                <p className="text-xs text-gray-500 mt-1">{condition.displayText}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Panel */}
      <div data-demo="rule-actions" className="bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border-l-4 border-green-500 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Actions (THEN)</h2>
        <div className="space-y-3">
          {rule.actions.map((action, index) => (
            <div key={index} className="bg-green-900/30 border border-green-700 rounded p-3">
              <p className="text-sm font-medium text-green-300">
                THEN Recommend <span className="font-bold">{action.target}</span>
              </p>
              <p className="text-xs text-green-400 mt-1">{action.displayText}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Rule Tester */}
      <div data-demo="rule-tester" className="bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-2">Test This Rule</h2>
        <p className="text-sm text-gray-400 mb-4">Enter sample applicant data to see if this rule would trigger.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Total Debt (£)</label>
            <input
              type="number"
              value={inputs.totalDebt}
              onChange={(e) => setInputs({ ...inputs, totalDebt: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Disposable Income (£)</label>
            <input
              type="number"
              value={inputs.disposableIncome}
              onChange={(e) => setInputs({ ...inputs, disposableIncome: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Employment Status</label>
            <select
              value={inputs.employmentStatus}
              onChange={(e) => setInputs({ ...inputs, employmentStatus: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="employed">Employed</option>
              <option value="self-employed">Self-employed</option>
              <option value="unemployed">Unemployed</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Total Assets (£)</label>
            <input
              type="number"
              value={inputs.totalAssets}
              onChange={(e) => setInputs({ ...inputs, totalAssets: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="hasExistingCase"
              checked={inputs.hasExistingCase}
              onChange={(e) => setInputs({ ...inputs, hasExistingCase: e.target.checked })}
              className="h-4 w-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="hasExistingCase" className="text-sm text-gray-300">Has active case in another system</label>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="hasMoratorium"
              checked={inputs.hasMoratorium}
              onChange={(e) => setInputs({ ...inputs, hasMoratorium: e.target.checked })}
              className="h-4 w-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="hasMoratorium" className="text-sm text-gray-300">Active Moratorium</label>
          </div>
        </div>

        <button
          data-demo="rule-test-run"
          onClick={handleTest}
          className="bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-2 rounded text-sm transition-colors"
        >
          Test Rule
        </button>

        {testResult && (
          <div data-demo="rule-test-result" className="mt-6">
            {testResult.matches ? (
              <div className="bg-green-900/30 border border-green-600 rounded p-4 mb-4">
                <p className="text-green-300 font-semibold">✓ RULE MATCHES — Would recommend: {rule.product}</p>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-600 rounded p-4 mb-4">
                <p className="text-gray-300 font-semibold">✗ RULE DOES NOT MATCH</p>
              </div>
            )}
            <div className="space-y-2">
              {testResult.results.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={r.passed ? 'text-green-400' : 'text-red-400'}>
                    {r.passed ? '✓' : '✗'}
                  </span>
                  <span className={r.passed ? 'text-gray-300' : 'text-red-300'}>
                    {r.condition}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Version History */}
      <div data-demo="rule-history" className="bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Version History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-600">
                <th className="text-left px-4 py-3 font-semibold text-gray-300">Version</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-300">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-300">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-300">Summary</th>
              </tr>
            </thead>
            <tbody>
              {rule.changeHistory.map((entry, index) => (
                <tr key={index} className={`border-b border-gray-700 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'}`}>
                  <td className="px-4 py-3 font-mono text-gray-400">v{entry.version}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3 text-gray-300">{entry.author}</td>
                  <td className="px-4 py-3 text-gray-300">{entry.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
