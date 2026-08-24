import { Section } from '../Section';

/**
 * HomeScreen — Static render of the public-facing home page for the interactive PDF prototype.
 * Matches the real app's home page content and GOV.UK design patterns.
 */
export function HomeScreen() {
  return (
    <Section id="home" title="Home Page" screenNumber={4}>
      <div className="gov-main">
        <h1>Find the right debt solution for your situation</h1>

        <p className="text-lg mb-6">
          The Initial Application Advice Service helps you understand which debt solution
          may be most suitable based on your financial circumstances.
        </p>

        {/* Before you start info box */}
        <div className="bg-blue-50 border-l-4 border-gov-blue p-6 mb-8">
          <h2 className="text-lg font-bold mb-2">Before you start</h2>
          <p className="mb-4">You will need:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your personal details and address</li>
            <li>Details of all your debts (amounts, creditor names)</li>
            <li>Your monthly income and regular expenditure</li>
            <li>Information about any assets you own</li>
            <li>Supporting documents (payslips, bank statements) — optional but helpful</li>
          </ul>
        </div>

        {/* What this service does */}
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

        {/* Available Scottish debt solutions */}
        <div className="mb-8">
          <h2>Available Scottish debt solutions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Debt Arrangement Scheme (DAS)', desc: 'Repay debts in full over an extended period with statutory protection' },
              { name: 'Minimal Asset Process (MAP)', desc: 'Simplified bankruptcy for people with low income and few assets' },
              { name: 'Sequestration (Bankruptcy)', desc: 'Formal debt relief for people who cannot repay their debts' },
              { name: 'Protected Trust Deed', desc: 'Voluntary agreement with creditors to repay over 4 years' },
              { name: 'Moratorium', desc: '6-week breathing space from creditor action while you seek advice' },
              { name: 'Debt Payment Programme', desc: 'Structured repayment plan for manageable debt levels' },
            ].map(product => (
              <div key={product.name} className="border border-gray-300 p-4 hover:border-gov-blue hover:bg-blue-50 transition-colors">
                <h3 className="text-base font-bold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{product.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Start button */}
        <a
          href="#apply-step-1"
          className="inline-block bg-gov-green text-white font-bold py-3 px-8 no-underline hover:bg-green-800 focus:outline-2 focus:outline-gov-yellow"
          role="button"
        >
          Start your application
        </a>

        {/* Free advice inset */}
        <div className="mt-8 gov-inset">
          <p className="text-sm text-gray-600">
            <strong>Free advice:</strong> Before using this service, you may wish to speak with a free money adviser.
            Call Citizens Advice Scotland on 0800 028 1456 or visit your local advice centre.
          </p>
        </div>
      </div>
    </Section>
  );
}
