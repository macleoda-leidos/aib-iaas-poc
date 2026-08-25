import RecommendationContent from './RecommendationContent';
import { caseStaticParams } from '../caseParams';

// Required for static export (output: 'export') — tells Next.js which dynamic pages to pre-render.
// Must match the parent route: case detail links here for every case, so a
// shorter list here means dead links rather than a smaller build.
export function generateStaticParams() {
  return caseStaticParams();
}

export default function RecommendationPage() {
  return <RecommendationContent />;
}
