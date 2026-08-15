import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AiB IAAS - Interactive Prototype',
  description: 'Clickable walkthrough of the Initial Application Advice Service',
};

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="prototype-root bg-white text-gov-black print:bg-white" data-theme="light">
      {children}

      {/* Print-specific styles for PDF generation */}
      <style>{`
        @media print {
          .prototype-root {
            background: white !important;
            color: #000 !important;
          }
          .prototype-section {
            page-break-before: always;
            page-break-inside: avoid;
          }
          .prototype-section:first-of-type {
            page-break-before: auto;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          a[href^="#"] {
            text-decoration: underline;
            color: #1d70b8;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* Force light mode for prototype */
        .prototype-root,
        .prototype-root * {
          color-scheme: light;
        }
        .prototype-root .dark\\:bg-gray-900 { background-color: transparent !important; }
        .prototype-root .dark\\:text-gray-100 { color: inherit !important; }

        /* A4 page simulation in browser */
        @media screen {
          .prototype-section {
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto 2rem;
            padding: 20mm 15mm;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border: 1px solid #e5e5e5;
            background: white;
            position: relative;
          }
        }
      `}</style>
    </div>
  );
}
