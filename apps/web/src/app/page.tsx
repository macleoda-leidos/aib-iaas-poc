import Link from 'next/link';

function AnimatedCounter({ target, label }: { target: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-bold tabular-nums">{target.toLocaleString()}</span>
      <span>{label}</span>
    </span>
  );
}

export default function Home() {
  return (
    <div className="gov-main">
      {/* Service Status Banner */}
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded px-4 py-2.5 mb-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-300">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="font-medium">All services operational</span>
          <span className="text-green-600 dark:text-green-400 text-xs">• Last checked: 2 minutes ago</span>
        </div>
        <div className="text-xs text-green-700 dark:text-green-400">
          <AnimatedCounter target={1247} label="applications processed this month" />
        </div>
      </div>

      <h1>Find the right debt solution for your situation</h1>

      <p className="text-lg mb-6">
        The Initial Application Advice Service helps you understand which debt solution
        may be most suitable based on your financial circumstances.
      </p>

      <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-gov-blue p-6 mb-8">
        <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">Before you start</h2>
        <p className="mb-4 text-gray-800 dark:text-gray-200">You will need:</p>
        <ul className="list-disc pl-6 space-y-2 text-gray-800 dark:text-gray-200">
          <li>Your personal details and address</li>
          <li>Details of all your debts (amounts, creditor names)</li>
          <li>Your monthly income and regular expenditure</li>
          <li>Information about any assets you own</li>
          <li>Supporting documents (payslips, bank statements) — optional but helpful</li>
        </ul>
      </div>

      <div className="mb-8">
        <h2>What this service does</h2>
        <ol className="list-decimal pl-6 space-y-3 mb-6">
          <li>Collects information about your financial situation</li>
          <li>Checks whether you may already have an active case with AiB</li>
          <li>Runs a preliminary credit check (placeholder)</li>
          <li>Recommends the most suitable debt solution for your circumstances</li>
          <li>Provides an explanation of the recommendation</li>
          <li>Allows you to proceed with an application if appropriate</li>
        </ol>
      </div>

      <div className="mb-8">
        <h2>Available Scottish debt solutions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: 'Debt Arrangement Scheme (DAS)', desc: 'Repay debts in full over an extended period with statutory protection', url: 'https://www.aib.gov.uk/debt-solutions/debt-arrangement-scheme' },
            { name: 'Minimal Asset Process (MAP)', desc: 'Simplified bankruptcy for people with low income and few assets', url: 'https://www.aib.gov.uk/debt-solutions/minimal-asset-process' },
            { name: 'Sequestration (Bankruptcy)', desc: 'Formal debt relief for people who cannot repay their debts', url: 'https://www.aib.gov.uk/debt-solutions/sequestration' },
            { name: 'Protected Trust Deed', desc: 'Voluntary agreement with creditors to repay over 4 years', url: 'https://www.aib.gov.uk/debt-solutions/protected-trust-deeds' },
            { name: 'Moratorium', desc: '6-week breathing space from creditor action while you seek advice', url: 'https://www.aib.gov.uk/debt-solutions/moratorium' },
            { name: 'Debt Payment Programme', desc: 'Structured repayment plan for manageable debt levels', url: 'https://www.aib.gov.uk/debt-solutions/debt-arrangement-scheme' },
          ].map(product => (
            <a key={product.name} href={product.url} target="_blank" rel="noopener noreferrer" className="border border-gray-300 dark:border-gray-600 p-4 no-underline hover:border-gov-blue hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors block rounded">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{product.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{product.desc}</p>
              <p className="text-xs text-gov-blue dark:text-blue-400 mt-2">Learn more on aib.gov.uk →</p>
            </a>
          ))}
        </div>
      </div>

      <Link
        href="/apply"
        className="inline-block bg-gov-green text-white font-bold py-3 px-8 no-underline hover:bg-green-800 focus:outline-2 focus:outline-gov-yellow"
        role="button"
      >
        Start your application
      </Link>

      <div className="mt-8 gov-inset">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <strong>Free advice:</strong> Before using this service, you may wish to speak with a free money adviser.
          Call Citizens Advice Scotland on 0800 028 1456 or visit your local advice centre.
        </p>
      </div>
    </div>
  );
}
