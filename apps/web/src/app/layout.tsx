import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
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
  icons: {
    icon: `${process.env.GITHUB_PAGES === 'true' ? '/aib-iaas-poc' : ''}/favicon.svg`,
  },
  manifest: `${process.env.GITHUB_PAGES === 'true' ? '/aib-iaas-poc' : ''}/manifest.json`,
};

import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle, LanguageProvider } from './LanguageToggle';
import { Providers } from './Providers';
import { UserNavItem } from './UserNavItem';
import ApiStatusBar, { ApiStatusProvider } from './ApiStatus';

const BASE = process.env.GITHUB_PAGES === 'true' ? '/aib-iaas-poc' : '';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gov-black dark:text-gray-100 transition-colors">
      <Providers>
      <LanguageProvider>
      <ApiStatusProvider>

        {/* Header — AiB brand red */}
        <header className="bg-[#d32205] text-white">
          {/* Top bar: Logo left, dark mode right */}
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 no-underline">
              <img src={`${BASE}/aib-logo.svg`} alt="Accountant in Bankruptcy" className="h-10 md:h-12 brightness-0 invert" width={120} height={48} fetchPriority="high" />
              <div className="hidden sm:block">
                <span className="text-white font-bold text-sm block leading-tight">Accountant in Bankruptcy</span>
                <span className="text-red-200 text-xs">Initial Application Advice Service</span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation bar */}
          <nav aria-label="Main navigation" className="bg-[#a81b03] border-t border-red-400/30">
            <div className="max-w-6xl mx-auto px-4">
              <ul className="flex items-center gap-0 overflow-x-auto text-sm -mb-px">
                <NavItem href="/">Home</NavItem>
                <NavItem href="/my-application">My Application</NavItem>
                <NavItem href="/apply">Apply</NavItem>
                <NavItem href="/dashboard">Dashboard</NavItem>
                <NavItem href="/portal">Portal</NavItem>
                <NavItem href="/statistics">Statistics</NavItem>
                <NavItem href="/security">Security</NavItem>
                <NavItem href="/search">Search</NavItem>
                <NavItem href="/correspondence">Digital Mailroom</NavItem>
                <NavItem href="/admin">Admin</NavItem>
                <NavItem href="/architecture">Architecture</NavItem>
                <NavItem href="/api-docs">API Docs</NavItem>
                <UserNavItem />
                {/* System status indicator */}
                <li className="ml-auto flex-shrink-0 hidden md:flex items-center gap-1.5 px-3 py-2.5 text-xs text-green-200/90 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  All Systems Operational
                </li>
              </ul>
            </div>
          </nav>
        </header>

        {/* Phase banner — GOV.UK BETA pattern */}
        <div className="bg-gov-light-grey dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 py-2">
            <p className="text-sm">
              <strong className="bg-gov-blue text-white px-2 py-0.5 text-xs uppercase tracking-wide mr-2 rounded-sm">BETA</strong>
              This is a new service – your <Link href="/feedback" className="text-blue-700 dark:text-blue-400 underline">feedback</Link> will help us improve it.
            </p>
          </div>
        </div>

        {/* API Connection Status Indicator */}
        <ApiStatusBar />

        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="gov-footer">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Services</h3>
                <ul className="text-sm space-y-1.5">
                  <li><Link href="/apply" className="gov-link">Apply for debt advice</Link></li>
                  <li><Link href="/dashboard" className="gov-link">View your applications</Link></li>
                  <li><a href="https://www.aib.gov.uk/debt-solutions" target="_blank" rel="noopener noreferrer" className="gov-link">Debt solutions overview</a></li>
                  <li><a href="https://www.citizensadvice.org.uk/scotland/" target="_blank" rel="noopener noreferrer" className="gov-link">Citizens Advice Scotland</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-2">About</h3>
                <ul className="text-sm space-y-1.5">
                  <li><Link href="/accessibility" className="gov-link">Accessibility statement</Link></li>
                  <li><Link href="/feedback" className="gov-link">Feedback</Link></li>
                  <li><a href="https://www.aib.gov.uk/privacy-notice" target="_blank" rel="noopener noreferrer" className="gov-link">Privacy notice</a></li>
                  <li><a href="https://www.aib.gov.uk/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="gov-link">Terms and conditions</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-2">Support</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
                  <li>Phone: 0300 200 2600</li>
                  <li>Email: <a href="mailto:aib@aib.gov.uk" className="gov-link">aib@aib.gov.uk</a></li>
                  <li className="text-xs mt-2">Monday to Friday, 8:30am to 5pm</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-gray-300 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">© Crown copyright</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" className="underline" target="_blank" rel="noopener noreferrer">Open Government Licence v3.0</a>
              </p>
            </div>
          </div>
        </footer>
      </ApiStatusProvider>
      </LanguageProvider>
      </Providers>
      </body>
    </html>
  );
}

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="block px-3 py-2.5 text-white/90 hover:text-white hover:bg-white/10 no-underline whitespace-nowrap text-sm transition-colors">
        {children}
      </Link>
    </li>
  );
}
