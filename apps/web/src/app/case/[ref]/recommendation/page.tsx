import RecommendationContent from './RecommendationContent';

// Required for static export (output: 'export') — tells Next.js which dynamic pages to pre-render
export function generateStaticParams() {
  return [
    { ref: 'IAAS-2026-00012' },
    { ref: 'IAAS-2026-00011' },
    { ref: 'IAAS-2026-00010' },
    { ref: 'IAAS-2026-00009' },
  ];
}

export default function RecommendationPage() {
  return <RecommendationContent />;
}
