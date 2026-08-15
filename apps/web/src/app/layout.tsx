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

// basePath for GitHub Pages (set at build time)
const basePath = process.env.GITHUB_PAGES === 'true' ? '/aib-iaas-poc' : '';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gov-black dark:text-gray-100 transition-colors">
      <Providers>

        {/* Header — clean two-row layout like gov.scot */}
        <header className="bg-[#0065bd] text-white">
          {/* Top bar: Logo left, dark mode right */}
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href={`${basePath}/`} className="flex items-center gap-3 no-underline">
              <img src={`${basePath}/aib-logo.svg`} alt="Accountant in Bankruptcy" className="h-10 md:h-12 brightness-0 invert" />
              <div className="hidden sm:block">
                <span className="text-white font-bold text-sm block leading-tight">Accountant in Bankruptcy</span>
                <span className="text-blue-200 text-xs">Initial Application Advice Service</span>
              </div>
            </a>
            <ThemeToggle />
          </div>

          {/* Navigation bar */}
          <nav aria-label="Main navigation" className="bg-[#004d99] border-t border-blue-400/30">
            <div className="max-w-6xl mx-auto px-4">
              <ul className="flex items-center gap-0 overflow-x-auto text-sm -mb-px">
                <NavLink href={`${basePath}/`} label="Home" />
                <NavLink href={`${basePath}/apply`} label="Apply" />
                <NavLink href={`${basePath}/dashboard`} label="Dashboard" />
                <NavLink href={`${basePath}/portal`} label="Portal" />
                <NavLink href={`${basePath}/statistics`} label="Statistics" />
                <NavLink href={`${basePath}/security`} label="Security" />
                <NavLink href={`${basePath}/search`} label="Search" />
                <NavLink href={`${basePath}/correspondence`} label="Letters" />
                <NavLink href={`${basePath}/architecture`} label="Architecture" />
                <NavLink href={`${basePath}/login`} label="Sign In" />
              </ul>
            </div>
          </nav>
        </header>

        {/* Phase banner — GOV.UK BETA pattern */}
        <div className="bg-gov-light-grey dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 py-2">
            <p className="text-sm">
              <strong className="bg-gov-blue text-white px-2 py-0.5 text-xs uppercase tracking-wide mr-2 rounded-sm">BETA</strong>
              This is a new service – your <a href={`${basePath}/feedback`} className="text-blue-700 dark:text-blue-400 underline">feedback</a> will help us improve it.
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
                  <li><a href={`${basePath}/apply`} className="gov-link">Apply for debt advice</a></li>
                  <li><a href={`${basePath}/dashboard`} className="gov-link">View your applications</a></li>
                  <li><a href="https://www.aib.gov.uk/debt-solutions" target="_blank" rel="noopener noreferrer" className="gov-link">Debt solutions overview</a></li>
                  <li><a href="https://www.citizensadvice.org.uk/scotland/" target="_blank" rel="noopener noreferrer" className="gov-link">Citizens Advice Scotland</a></li>
                  <li><a href="https://www.aib.gov.uk/contact-us" target="_blank" rel="noopener noreferrer" className="gov-link">Contact AiB</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-2">About</h3>
                <ul className="text-sm space-y-1.5">
                  <li><a href={`${basePath}/accessibility`} className="gov-link">Accessibility statement</a></li>
                  <li><a href={`${basePath}/feedback`} className="gov-link">Feedback</a></li>
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
                  <a href={`${basePath}/feedback`} className="text-xs text-blue-700 dark:text-blue-400 underline">Is this page not working properly? Report a problem</a>
                </div>
              </div>
            </div>

            {/* Crown copyright + OGL */}
            <div className="mt-8 pt-4 border-t border-gray-300 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">© Crown copyright</p>
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

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a href={href} className="block px-3 py-2.5 text-white/90 hover:text-white hover:bg-white/10 no-underline whitespace-nowrap text-sm transition-colors">
        {label}
      </a>
    </li>
  );
}
