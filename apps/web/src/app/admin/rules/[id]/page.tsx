import { RULES } from '../data/rules-data';
import RuleDetail from './RuleDetail';

export function generateStaticParams() {
  return [
    { id: 'rule-existing-case' },
    { id: 'rule-active-moratorium' },
    { id: 'rule-low-debt-signpost' },
    { id: 'rule-dpp-eligibility' },
    { id: 'rule-das-eligibility' },
    { id: 'rule-ptd-assets' },
    { id: 'rule-map-eligibility' },
    { id: 'rule-sequestration' },
    { id: 'rule-digital-das-fast-track' },
  ];
}

export default async function RuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rule = RULES.find(r => r.id === id);
  if (!rule) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Rule Not Found</h1>
          <a href="/admin/rules" className="text-blue-400 hover:underline">&larr; Back to Rules</a>
        </div>
      </div>
    );
  }
  return <RuleDetail rule={rule} />;
}
