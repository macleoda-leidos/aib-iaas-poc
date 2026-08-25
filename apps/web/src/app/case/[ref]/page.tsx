import CaseDetail from './CaseDetail';
import { caseStaticParams } from './caseParams';

// Required for static export (output: 'export') — tells Next.js which dynamic pages to pre-render
export function generateStaticParams() {
  return caseStaticParams();
}

export default function CasePage() {
  return <CaseDetail />;
}
