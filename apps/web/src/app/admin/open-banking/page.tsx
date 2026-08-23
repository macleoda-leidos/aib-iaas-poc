'use client';

import Link from 'next/link';

const connectedAccounts = [
  { bank: 'NatWest', type: 'Current Account', sortCode: '83-21-04', accountEnd: '****7821', balance: '£1,245.60' },
  { bank: 'Halifax', type: 'Savings Account', sortCode: '11-05-39', accountEnd: '****3456', balance: '£3,890.00' },
];

const transactions = [
  { date: '15 Aug 2026', description: 'Salary - ABC Ltd', amount: '+£2,600.00', category: 'Income' },
  { date: '16 Aug 2026', description: 'Rent - Letting Agency', amount: '-£850.00', category: 'Housing' },
  { date: '16 Aug 2026', description: 'Council Tax', amount: '-£145.00', category: 'Bills' },
  { date: '17 Aug 2026', description: 'Tesco Groceries', amount: '-£380.00', category: 'Groceries' },
  { date: '17 Aug 2026', description: 'Scottish Power', amount: '-£89.00', category: 'Utilities' },
  { date: '18 Aug 2026', description: 'Netflix', amount: '-£15.99', category: 'Entertainment' },
  { date: '18 Aug 2026', description: 'Shell Petrol', amount: '-£65.00', category: 'Transport' },
  { date: '18 Aug 2026', description: 'Transfer to Savings', amount: '-£200.00', category: 'Savings' },
  { date: '19 Aug 2026', description: 'Amazon Purchase', amount: '-£34.99', category: 'Shopping' },
  { date: '19 Aug 2026', description: 'Costa Coffee', amount: '-£4.50', category: 'Food & Drink' },
];

export default function OpenBankingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            ← Back to Admin
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Open Banking Integration</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Automated income and expenditure verification via bank data</p>

        {/* Consent Status */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
            <div>
              <p className="text-green-800 dark:text-green-300 font-medium">Consent Active</p>
              <p className="text-green-700 dark:text-green-400 text-sm">Consent granted: 15 Aug 2026 | Expires: 15 Nov 2026</p>
            </div>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Connected Accounts</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {connectedAccounts.map((acc) => (
              <div key={acc.accountEnd} className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">{acc.bank} — {acc.type}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Sort: {acc.sortCode} | Account: {acc.accountEnd}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 dark:text-white font-semibold">{acc.balance}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Connected
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Income Verification */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Income Verification</h2>
          <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <span className="text-2xl">✓</span>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Verified monthly income: £2,600</p>
              <p className="text-green-700 dark:text-green-400 text-sm">Matches declaration ✓ — consistent salary payments from ABC Ltd over 3 months</p>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.date}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{t.description}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {t.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      t.amount.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {t.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
