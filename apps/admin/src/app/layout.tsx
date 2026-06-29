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
              <span className="text-blue-200 text-sm ml-3">IAAS Application Review</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-blue-200">Admin User (POC)</span>
              <a href="/" className="text-white underline">Sign out</a>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
