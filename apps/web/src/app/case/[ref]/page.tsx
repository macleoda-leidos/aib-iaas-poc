import CaseDetail from './CaseDetail';

// Required for static export (output: 'export') — tells Next.js which dynamic pages to pre-render
export function generateStaticParams() {
  return [
    { ref: 'IAAS-2026-00012' },
    { ref: 'IAAS-2026-00011' },
    { ref: 'IAAS-2026-00010' },
    { ref: 'IAAS-2026-00009' },
    // Generate refs for first 20 seed applications
    ...Array.from({ length: 20 }, (_, i) => ({ ref: `IAAS-2026-${String(i + 1).padStart(5, '0')}` })),
  ];
}

export default function CasePage() {
  return <CaseDetail />;
}
