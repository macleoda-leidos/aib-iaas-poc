import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AiB Admin - IAAS Administration Portal',
  description: 'Internal administration portal for AiB IAAS applications',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-gov-dark-blue text-white py-3">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div>
              <span className="font-bold text-lg">AiB Administration</span>
              <span className="text-blue-200 text-sm ml-3">IAAS Portal</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-blue-200">Karen MacLeod (Senior Officer)</span>
              <a href="/" className="text-white underline">Sign out</a>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <ul className="flex gap-1 text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
              {[
                { href: '/', label: 'Dashboard' },
                { href: '/organisations', label: 'Organisations' },
                { href: '/users', label: 'Users & Roles' },
                { href: '/rules', label: 'Rules Engine' },
                { href: '/digital-mailroom', label: '🤖 Digital Mailroom' },
                { href: '/ai-governance', label: '🛡️ AI Governance' },
                { href: '/knowledge-hub', label: '📚 Knowledge Hub' },
                { href: '/policy-simulation', label: '🔬 Policy Simulation' },
              ].map(link => (
                <li key={link.href}>
                  <a href={link.href} className="inline-block px-4 py-3 text-gray-700 hover:text-gov-blue hover:border-b-2 hover:border-gov-blue no-underline font-medium">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
