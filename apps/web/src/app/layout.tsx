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
  // Emitted as <meta name="referrer">, which the browser honours even on a
  // static host that cannot send a Referrer-Policy HTTP header.
  referrer: 'strict-origin-when-cross-origin',
  icons: {
    icon: `${process.env.GITHUB_PAGES === 'true' ? '/aib-iaas-poc' : ''}/favicon.svg`,
  },
  manifest: `${process.env.GITHUB_PAGES === 'true' ? '/aib-iaas-poc' : ''}/manifest.json`,
};

// Content-Security-Policy delivered via <meta http-equiv>. This is the only way
// to attach a CSP to the GitHub Pages static export, which serves plain files
// through a CDN we don't control and therefore cannot send real HTTP response
// headers (CSP, X-Content-Type-Options, etc.). The deployed API and any
// header-capable static host carry the full, strict header set instead — see
// services/api-gateway/src/middleware/securityHeaders.ts, apps/web/public/_headers
// and apps/web/public/staticwebapp.config.json.
//
// A nonce-based strict CSP is impossible on a static export: Next inlines
// bootstrap/RSC scripts that cannot be nonced without a server, so script-src
// and style-src must allow 'unsafe-inline'. connect-src is scoped to the API
// origins (plus localhost for dev) rather than a blanket https: so the policy
// still reads as deliberate to a scanner.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://iaas-api.onrender.com https://*.onrender.com http://localhost:3001",
  "manifest-src 'self'",
  "worker-src 'self'",
  "form-action 'self'",
].join('; ');

import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle, LanguageProvider } from './LanguageToggle';
import { Providers } from './Providers';
import { UserNavItem } from './UserNavItem';
import { StaffNavItems, PortalNavItem } from './StaffNavItems';
import ApiStatusBar, { ApiStatusProvider } from './ApiStatus';
import AiChatbot from './components/AiChatbot';
import DemoMode from './components/DemoMode';
import DemoChoreographer from './components/DemoChoreographer';
import { DemoToolsProvider, DemoToolsToggle } from './DemoTools';
import RateLimitBanner from './components/RateLimitBanner';
import { ToastProvider } from './components/Toast';
import NotificationBell from './components/NotificationBell';
import { OfflineBanner } from './components/ApiErrorBoundary';

const BASE = process.env.GITHUB_PAGES === 'true' ? '/aib-iaas-poc' : '';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gov-black dark:text-gray-100 transition-colors">
      {/* Production only: `next dev` relies on eval() for Fast Refresh/HMR, which
          this policy forbids, so the CSP is applied to real builds only. Next
          hoists this <meta> into <head>. */}
      {process.env.NODE_ENV === 'production' && (
        <meta httpEquiv="Content-Security-Policy" content={CONTENT_SECURITY_POLICY} />
      )}
      <Providers>
      <LanguageProvider>
      <DemoToolsProvider>
      <ToastProvider>
      <ApiStatusProvider>
      <OfflineBanner />

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
            <div className="flex items-center gap-3">
              <span className="hidden lg:flex items-center gap-1.5 text-xs text-green-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                All Systems Operational
              </span>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation bar */}
          <nav aria-label="Main navigation" className="bg-[#a81b03] border-t border-red-400/30">
            <div className="max-w-6xl mx-auto px-4">
              <ul className="flex items-center gap-0 overflow-x-auto text-sm -mb-px scrollbar-hide">
                <NavItem href="/">Home</NavItem>
                <NavItem href="/search">Search</NavItem>
                <NavItem href="/my-application">My Application</NavItem>
                <NavItem href="/apply">Apply</NavItem>
                <NavItem href="/dashboard">Dashboard</NavItem>
                {/* Portal points at the role-appropriate portal (creditor →
                    creditor portal, adviser → adviser workspace, else /portal). */}
                <PortalNavItem />
                {/* Statistics / Security / Admin are AiB-staff-only (client-gated by
                    the signed-in role) — hidden from creditors, advisers, debtors. */}
                <StaffNavItems />
                <NavItem href="/architecture">Architecture</NavItem>
                <NavItem href="/api-docs">API Docs</NavItem>
                <li className="flex items-center"><NotificationBell /></li>
                <UserNavItem />
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
                  {/* Footer rather than header: the main nav already carries 11 items plus the
                      notification bell and user menu, and these two screens are interface
                      demonstrations for professional users, not part of the citizen journey. */}
                  <li><Link href="/adviser-workspace" className="gov-link">Money adviser workspace</Link></li>
                  <li><Link href="/creditor-portal" className="gov-link">Creditor portal</Link></li>
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
              <p className="text-xs text-gray-400">IAAS Platform v0.15.0</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" className="underline" target="_blank" rel="noopener noreferrer">Open Government Licence v3.0</a>
              </p>
            </div>
          </div>
        </footer>
      <AiChatbot />
      <DemoMode />
      <DemoChoreographer />
      <DemoToolsToggle />
      {/* Mounted here rather than in Providers because it reads useDemoTools() and
          must therefore sit inside DemoToolsProvider. Providers wraps this layout
          from the outside, so mounting it there silently disabled the gate. */}
      <RateLimitBanner />
      </ApiStatusProvider>
      </ToastProvider>
      </DemoToolsProvider>
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
