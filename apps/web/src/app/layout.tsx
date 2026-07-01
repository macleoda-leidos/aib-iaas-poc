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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gov-black dark:text-gray-100 transition-colors">
        {/* GOV.UK-style header */}
        <header className="gov-header">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold">
                <span className="text-white">AiB</span>
                <span className="text-gray-300 text-sm ml-2">Accountant in Bankruptcy</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
            <ThemeToggle />
            <nav aria-label="Main navigation">
              <ul className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm">
                <li><a href="/" className="text-white hover:underline no-underline">Home</a></li>
                <li><a href="/portal" className="text-white hover:underline no-underline">Portal</a></li>
                <li><a href="/apply" className="text-white hover:underline no-underline">Apply</a></li>
                <li><a href="/dashboard" className="text-white hover:underline no-underline">Dashboard</a></li>
                <li><a href="/architecture" className="text-white hover:underline no-underline">Architecture</a></li>
                <li><a href="/login" className="text-white hover:underline no-underline">Sign In</a></li>
              </ul>
            </nav>
            </div>
          </div>
        </header>

        {/* Phase banner */}
        <div className="bg-gov-light-grey border-b border-gray-300">
          <div className="max-w-6xl mx-auto px-4 py-2">
            <p className="text-sm">
              <strong className="bg-gov-blue text-white px-2 py-0.5 text-xs uppercase tracking-wide mr-2">POC</strong>
              This is a Proof of Concept demonstration — not a live service. All data is synthetic.
            </p>
          </div>
        </div>

        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="gov-footer">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">About this service</h3>
                <p className="text-sm text-gray-600">
                  This is a Proof of Concept for the AiB Initial Application Advice Service.
                  It demonstrates the Applications Gateway approach for Schedule 19 SOW delivery.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-2">Support</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Email: poc-support@example.com</li>
                  <li>Phone: 0800 000 0000 (placeholder)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-2">Related services</h3>
                <ul className="text-sm space-y-1">
                  <li><a href="https://www.citizensadvice.org.uk/scotland/" target="_blank" rel="noopener noreferrer" className="gov-link">Citizens Advice Scotland</a></li>
                  <li><a href="https://www.aib.gov.uk/" target="_blank" rel="noopener noreferrer" className="gov-link">AiB Main Website</a></li>
                  <li><a href="https://www.aib.gov.uk/debt-solutions/debt-arrangement-scheme" target="_blank" rel="noopener noreferrer" className="gov-link">DAS Information</a></li>
                  <li><a href="https://www.aib.gov.uk/contact-us" target="_blank" rel="noopener noreferrer" className="gov-link">Contact AiB</a></li>
                  <li><a href="https://www.aib.gov.uk/statistics-and-reporting" target="_blank" rel="noopener noreferrer" className="gov-link">Statistics & Reporting</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-500">
                © Crown copyright. Contains synthetic data only. POC demonstration — not connected to live systems.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
