import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'AiB - Initial Application Advice Service',
  description: 'Accountant in Bankruptcy - Find the right debt solution for your situation',
};

import { ThemeToggle } from './ThemeToggle';
import { Providers } from './Providers';
import { CookieBanner } from '../components/CookieBanner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gov-black dark:text-gray-100 transition-colors">
      <Providers>
        {/* Cookie Consent Banner */}
        <CookieBanner />

        {/* GOV.UK-style header */}
        <header className="gov-header">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="text-lg font-bold no-underline">
                <span className="text-white">AiB</span>
                <span className="text-gray-300 text-sm ml-2">Accountant in Bankruptcy</span>
              </a>
            </div>
            <div className="flex items-center gap-2">
            <ThemeToggle />
            <nav aria-label="Main navigation">
              <ul className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm">
                <li><a href="/" className="text-white hover:underline no-underline">Home</a></li>
                <li><a href="/portal" className="text-white hover:underline no-underline">Portal</a></li>
                <li><a href="/apply" className="text-white hover:underline no-underline">Apply</a></li>
                <li><a href="/dashboard" className="text-white hover:underline no-underline">Dashboard</a></li>
                <li><a href="/statistics" className="text-white hover:underline no-underline">Statistics</a></li>
                <li><a href="/security" className="text-white hover:underline no-underline">Security</a></li>
                <li><a href="/architecture" className="text-white hover:underline no-underline">Architecture</a></li>
                <li><a href="/login" className="text-white hover:underline no-underline">Sign In</a></li>
              </ul>
            </nav>
            </div>
          </div>
        </header>

        {/* Phase banner — GOV.UK BETA pattern */}
        <div className="bg-gov-light-grey dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 py-2">
            <p className="text-sm">
              <strong className="bg-gov-blue text-white px-2 py-0.5 text-xs uppercase tracking-wide mr-2 rounded-sm">BETA</strong>
              This is a new service – your <a href="/feedback" className="text-blue-700 dark:text-blue-400 underline">feedback</a> will help us improve it.
            </p>
          </div>
        </div>

        <main className="flex-1">
          {children}
        </main>

        {/* GOV.UK-style Footer */}
        <footer className="gov-footer">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Services</h3>
                <ul className="text-sm space-y-1.5">
                  <li><a href="/apply" className="gov-link">Apply for debt advice</a></li>
                  <li><a href="/dashboard" className="gov-link">View your applications</a></li>
                  <li><a href="https://www.aib.gov.uk/debt-solutions" target="_blank" rel="noopener noreferrer" className="gov-link">Debt solutions overview</a></li>
                  <li><a href="https://www.citizensadvice.org.uk/scotland/" target="_blank" rel="noopener noreferrer" className="gov-link">Citizens Advice Scotland</a></li>
                  <li><a href="https://www.aib.gov.uk/contact-us" target="_blank" rel="noopener noreferrer" className="gov-link">Contact AiB</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-2">About</h3>
                <ul className="text-sm space-y-1.5">
                  <li><a href="/accessibility" className="gov-link">Accessibility statement</a></li>
                  <li><a href="/feedback" className="gov-link">Feedback</a></li>
                  <li><a href="https://www.aib.gov.uk/privacy-notice" target="_blank" rel="noopener noreferrer" className="gov-link">Privacy notice</a></li>
                  <li><a href="https://www.aib.gov.uk/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="gov-link">Terms and conditions</a></li>
                  <li><a href="https://www.aib.gov.uk/statistics-and-reporting" target="_blank" rel="noopener noreferrer" className="gov-link">Statistics & Reporting</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-2">Support</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
                  <li>Phone: 0300 200 2600</li>
                  <li>Email: <a href="mailto:aib@aib.gov.uk" className="gov-link">aib@aib.gov.uk</a></li>
                  <li className="text-xs mt-2">Monday to Friday, 8:30am to 5pm</li>
                </ul>
                <div className="mt-4">
                  <a href="/feedback" className="text-xs text-blue-700 dark:text-blue-400 underline">Is this page not working properly? Report a problem</a>
                </div>
              </div>
            </div>

            {/* Crown copyright + OGL */}
            <div className="mt-8 pt-4 border-t border-gray-300 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-gray-500" viewBox="0 0 132 97" fill="currentColor" aria-hidden="true">
                  <path d="M25 30.2c3.5 1.5 7.7-.2 9.1-3.7 1.5-3.6-.2-7.8-3.9-9.2-3.6-1.4-7.6.3-9.1 3.9-1.4 3.5.3 7.5 3.9 9zM9 39.5c3.6 1.5 7.8-.2 9.2-3.7 1.5-3.6-.2-7.8-3.9-9.1-3.6-1.5-7.6.2-9.1 3.8-1.4 3.5.3 7.5 3.8 9z"/>
                </svg>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  © Crown copyright
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                All content is available under the{' '}
                <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" className="underline" target="_blank" rel="noopener noreferrer">
                  Open Government Licence v3.0
                </a>, except where otherwise stated
              </p>
            </div>
          </div>
        </footer>
      </Providers>
      </body>
    </html>
  );
}
