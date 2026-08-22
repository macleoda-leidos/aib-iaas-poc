import { RULES } from '../data/rules-data';
import RuleDetailClient from './RuleDetailClient';

export function generateStaticParams() {
  return RULES.map(r => ({ id: r.id }));
}

export default async function RuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rule = RULES.find(r => r.id === id);
  if (!rule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Rule Not Found</h1>
          <a href="/rules" className="text-blue-700 hover:underline">&larr; Back to Rules</a>
        </div>
      </div>
    );
  }
  return <RuleDetailClient rule={rule} />;
}
