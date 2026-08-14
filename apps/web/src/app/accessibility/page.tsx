export default function AccessibilityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Accessibility statement for AiB Initial Application Advice Service</h1>

      <div className="prose prose-sm max-w-none space-y-6">
        <p className="text-gray-700 dark:text-gray-300">
          This accessibility statement applies to the AiB Initial Application Advice Service (IAAS) at{' '}
          <strong>iaas.aib.gov.uk</strong>.
        </p>

        <p className="text-gray-700 dark:text-gray-300">
          This service is run by the Accountant in Bankruptcy, an executive agency of the Scottish Government.
          We want as many people as possible to be able to use this service. For example, that means you should be able to:
        </p>

        <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
          <li>change colours, contrast levels and fonts</li>
          <li>zoom in up to 300% without the text spilling off the screen</li>
          <li>navigate most of the service using just a keyboard</li>
          <li>navigate most of the service using speech recognition software</li>
          <li>listen to most of the service using a screen reader (including the most recent versions of JAWS, NVDA and VoiceOver)</li>
        </ul>

        <p className="text-gray-700 dark:text-gray-300">
          We've also made the text as simple as possible to understand.
        </p>

        <p className="text-gray-700 dark:text-gray-300">
          <a href="https://mcmw.abilitynet.org.uk/" className="text-blue-700 underline" target="_blank" rel="noopener noreferrer">AbilityNet</a>{' '}
          has advice on making your device easier to use if you have a disability.
        </p>

        <h2 className="text-xl font-bold mt-8">How accessible this service is</h2>
        <p className="text-gray-700 dark:text-gray-300">
          This service is designed to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA.
          It uses the GOV.UK Design System components and patterns which are tested to meet accessibility standards.
        </p>

        <h2 className="text-xl font-bold mt-8">Feedback and contact information</h2>
        <p className="text-gray-700 dark:text-gray-300">
          If you need information on this service in a different format like accessible PDF, large print, easy read,
          audio recording or braille:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
          <li>email: <a href="mailto:aib@aib.gov.uk" className="text-blue-700 underline">aib@aib.gov.uk</a></li>
          <li>phone: 0300 200 2600</li>
        </ul>
        <p className="text-gray-700 dark:text-gray-300">
          We'll consider your request and get back to you within 10 working days.
        </p>

        <h2 className="text-xl font-bold mt-8">Reporting accessibility problems</h2>
        <p className="text-gray-700 dark:text-gray-300">
          We're always looking to improve the accessibility of this service. If you find any problems not listed on this page
          or think we're not meeting accessibility requirements, contact us at{' '}
          <a href="mailto:aib@aib.gov.uk" className="text-blue-700 underline">aib@aib.gov.uk</a>.
        </p>

        <h2 className="text-xl font-bold mt-8">Enforcement procedure</h2>
        <p className="text-gray-700 dark:text-gray-300">
          The Equality and Human Rights Commission (EHRC) is responsible for enforcing the Public Sector Bodies
          (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018. If you're not happy with how
          we respond to your complaint,{' '}
          <a href="https://www.equalityadvisoryservice.com/" className="text-blue-700 underline" target="_blank" rel="noopener noreferrer">
            contact the Equality Advisory and Support Service (EASS)
          </a>.
        </p>

        <h2 className="text-xl font-bold mt-8">Technical information about this service's accessibility</h2>
        <p className="text-gray-700 dark:text-gray-300">
          The Accountant in Bankruptcy is committed to making this service accessible, in accordance with the
          Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018.
        </p>

        <h3 className="text-lg font-bold mt-6">Compliance status</h3>
        <p className="text-gray-700 dark:text-gray-300">
          This service is partially compliant with the{' '}
          <a href="https://www.w3.org/TR/WCAG21/" className="text-blue-700 underline" target="_blank" rel="noopener noreferrer">
            Web Content Accessibility Guidelines version 2.1 AA standard
          </a>.
        </p>

        <h2 className="text-xl font-bold mt-8">Preparation of this accessibility statement</h2>
        <p className="text-gray-700 dark:text-gray-300">
          This statement was prepared on 14 August 2026. It was last reviewed on 14 August 2026.
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          This service was last tested on 12 August 2026. The test was carried out internally using
          automated tools (axe DevTools, Lighthouse) and manual testing with screen readers.
        </p>
      </div>
    </div>
  );
}
