import { Section } from '../page';

export function CaseDetailScreens() {
  return (
    <>
      {/* Case Detail: Credit PASS */}
      <Section id="case-detail-pass" title="Case Detail — Credit PASS" screenNumber={27}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Case Review: IAAS-2024-00012</h1>
          <span className="px-3 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">Submitted</span>
        </div>
        <p className="text-sm text-gray-600 mb-4">Applicant: <strong>John Testerton</strong></p>

        {/* Financials Summary */}
        <div className="border border-gray-200 rounded p-4 mb-4 bg-gray-50">
          <h3 className="font-bold text-sm mb-3">Applicant Financials</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Total Debt:</span> <strong>£12,700</strong> <span className="text-gray-400">(5 creditors)</span></div>
            <div><span className="text-gray-500">Monthly Income:</span> <strong>£2,430</strong></div>
            <div><span className="text-gray-500">Expenditure:</span> <strong>£1,850</strong></div>
            <div><span className="text-gray-500">Disposable Income:</span> <strong className="text-green-700">£580/month</strong></div>
            <div><span className="text-gray-500">Assets:</span> <strong>£3,820</strong></div>
          </div>
        </div>

        {/* Credit Check — PASS */}
        <div className="border-2 border-green-500 rounded p-4 mb-4 bg-green-50">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-sm">Credit Check Result</h3>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-600 text-white">PASS ✓</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-600">Score:</span> <strong>520/999</strong> (Fair)</div>
            <div><span className="text-gray-600">Band:</span> <strong>Fair</strong></div>
            <div><span className="text-gray-600">Defaults:</span> <strong>2</strong></div>
            <div><span className="text-gray-600">CCJs:</span> <strong>0</strong></div>
            <div className="col-span-2 text-xs text-gray-500 mt-1">Provider: SyntheticCredit Ltd</div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="border border-blue-200 rounded p-3 mb-4 bg-blue-50">
          <p className="text-sm"><strong>Recommendation:</strong> Debt Arrangement Scheme (DAS) — <span className="text-blue-700 font-bold">94% confidence</span></p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-4">
          <button className="bg-green-700 text-white font-bold py-2 px-4 text-sm border-b-2 border-green-900 rounded">Approve</button>
          <button className="bg-red-700 text-white font-bold py-2 px-4 text-sm border-b-2 border-red-900 rounded">Reject</button>
          <button className="bg-blue-700 text-white font-bold py-2 px-4 text-sm border-b-2 border-blue-900 rounded">Request More Info</button>
        </div>

        <a href="#admin-app-detail" className="text-sm text-gov-blue hover:underline">View Full Report →</a>
        <div className="mt-4">
          <a href="#dashboard-admin" className="text-sm text-gov-blue hover:underline">← Back to Dashboard</a>
        </div>
      </Section>

      {/* Case Detail: Credit FAIL */}
      <Section id="case-detail-fail" title="Case Detail — Credit FAIL" screenNumber={28}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Case Review: IAAS-2024-00011</h1>
          <span className="px-3 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800">Under Review</span>
        </div>
        <p className="text-sm text-gray-600 mb-4">Applicant: <strong>B. Campbell</strong></p>

        {/* Financials Summary */}
        <div className="border border-gray-200 rounded p-4 mb-4 bg-gray-50">
          <h3 className="font-bold text-sm mb-3">Applicant Financials</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Total Debt:</span> <strong>£8,200</strong> <span className="text-gray-400">(3 creditors)</span></div>
            <div><span className="text-gray-500">Monthly Income:</span> <strong>£1,200</strong></div>
            <div><span className="text-gray-500">Expenditure:</span> <strong>£1,150</strong></div>
            <div><span className="text-gray-500">Disposable Income:</span> <strong className="text-amber-700">£50/month</strong></div>
            <div><span className="text-gray-500">Assets:</span> <strong>£250</strong></div>
          </div>
        </div>

        {/* Credit Check — FAIL */}
        <div className="border-2 border-red-500 rounded p-4 mb-4 bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-sm">Credit Check Result</h3>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">FAIL ✗</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-600">Score:</span> <strong>285/999</strong> (Very Poor)</div>
            <div><span className="text-gray-600">Band:</span> <strong className="text-red-700">Very Poor</strong></div>
            <div><span className="text-gray-600">Defaults:</span> <strong className="text-red-700">6</strong></div>
            <div><span className="text-gray-600">CCJs:</span> <strong className="text-red-700">2</strong></div>
            <div className="col-span-2 text-xs text-gray-500 mt-1">Provider: SyntheticCredit Ltd</div>
            <div className="col-span-2 text-xs text-red-700 font-medium">Multiple defaults and CCJs — manual review required</div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="border border-blue-200 rounded p-3 mb-4 bg-blue-50">
          <p className="text-sm"><strong>Recommendation:</strong> Minimal Asset Process (MAP) — <span className="text-blue-700 font-bold">78% confidence</span></p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-4">
          <button className="bg-green-700 text-white font-bold py-2 px-4 text-sm border-b-2 border-green-900 rounded">Approve</button>
          <button className="bg-red-700 text-white font-bold py-2 px-4 text-sm border-b-2 border-red-900 rounded">Reject</button>
          <button className="bg-blue-700 text-white font-bold py-2 px-4 text-sm border-b-2 border-blue-900 rounded">Request More Info</button>
        </div>

        {/* Warning note */}
        <div className="border border-amber-300 bg-amber-50 rounded p-3 mb-4">
          <p className="text-sm font-medium text-amber-800">⚠️ This case requires senior officer review due to credit check failure</p>
        </div>

        <div>
          <a href="#dashboard-admin" className="text-sm text-gov-blue hover:underline">← Back to Dashboard</a>
        </div>
      </Section>
    </>
  );
}
