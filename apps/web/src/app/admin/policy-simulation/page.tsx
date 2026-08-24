'use client';
import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '../../components/Toast';

const CHART_COLORS = ['#1d70b8', '#00703c', '#f47738', '#d4351c', '#4c2c92', '#5694ca', '#28a197'];

interface SimParam {
  id: string;
  label: string;
  description: string;
  currentValue: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  product: string;
}

const PARAMETERS: SimParam[] = [
  { id: 'das_disposable', label: 'DAS Minimum Disposable Income', description: 'Monthly disposable income threshold for DAS eligibility', currentValue: 100, min: 50, max: 250, step: 10, unit: '£', product: 'DAS' },
  { id: 'map_ceiling', label: 'MAP Debt Ceiling', description: 'Maximum total debt for Minimal Asset Process eligibility', currentValue: 25000, min: 15000, max: 40000, step: 1000, unit: '£', product: 'MAP' },
  { id: 'ptd_assets', label: 'PTD Asset Threshold', description: 'Minimum assets for Protected Trust Deed recommendation', currentValue: 5000, min: 2000, max: 15000, step: 500, unit: '£', product: 'PTD' },
  { id: 'dpp_months', label: 'DPP Repayment Period', description: 'Maximum repayment period for Debt Payment Programme', currentValue: 48, min: 24, max: 72, step: 6, unit: 'months', product: 'DPP' },
];

const APPROVERS = [
  { id: 'robert_anderson', name: 'Robert Anderson - Head of Digital' },
  { id: 'karen_macleod', name: 'Karen MacLeod - Senior Officer' },
];

interface HistoricalCase {
  id: string;
  debt: number;
  disposable: number;
  assets: number;
  employment: 'employed' | 'unemployed' | 'self_employed' | 'retired';
  hasExistingCase: boolean;
  originalProduct: string;
}

const HISTORICAL_CASES: HistoricalCase[] = [
  // DAS cases (~25) - debt £5k-£25k, disposable £100-£400, assets <£5k
  { id: 'HC-001', debt: 8500, disposable: 150, assets: 1200, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-002', debt: 12000, disposable: 200, assets: 800, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-003', debt: 15000, disposable: 180, assets: 2500, employment: 'self_employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-004', debt: 9200, disposable: 120, assets: 400, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-005', debt: 22000, disposable: 350, assets: 3200, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-006', debt: 7500, disposable: 110, assets: 900, employment: 'self_employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-007', debt: 18000, disposable: 250, assets: 1800, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-008', debt: 11000, disposable: 130, assets: 600, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-009', debt: 6500, disposable: 160, assets: 200, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-010', debt: 14000, disposable: 220, assets: 4500, employment: 'self_employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-011', debt: 20000, disposable: 300, assets: 1500, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-012', debt: 8000, disposable: 140, assets: 700, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-013', debt: 16500, disposable: 270, assets: 3800, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-014', debt: 10500, disposable: 190, assets: 1100, employment: 'self_employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-015', debt: 24000, disposable: 400, assets: 2800, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-016', debt: 7000, disposable: 105, assets: 300, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-017', debt: 13000, disposable: 210, assets: 1900, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-018', debt: 19000, disposable: 280, assets: 4200, employment: 'self_employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-019', debt: 5500, disposable: 115, assets: 500, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-020', debt: 21000, disposable: 320, assets: 2100, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-021', debt: 9800, disposable: 145, assets: 1400, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-022', debt: 17000, disposable: 240, assets: 3500, employment: 'self_employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-023', debt: 6000, disposable: 125, assets: 800, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-024', debt: 23000, disposable: 380, assets: 4800, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  { id: 'HC-025', debt: 11500, disposable: 175, assets: 1600, employment: 'employed', hasExistingCase: false, originalProduct: 'DAS' },
  // MAP cases (~20) - debt £1.5k-£25k, disposable £0-£50, assets <£2k, mostly unemployed
  { id: 'HC-026', debt: 4500, disposable: 10, assets: 500, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-027', debt: 8000, disposable: 0, assets: 800, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-028', debt: 15000, disposable: 30, assets: 1200, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-029', debt: 3200, disposable: 20, assets: 300, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-030', debt: 22000, disposable: 45, assets: 1800, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-031', debt: 6700, disposable: 0, assets: 600, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-032', debt: 18000, disposable: 25, assets: 1500, employment: 'retired', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-033', debt: 2500, disposable: 15, assets: 200, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-034', debt: 12000, disposable: 40, assets: 900, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-035', debt: 9500, disposable: 5, assets: 1100, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-036', debt: 24000, disposable: 35, assets: 1900, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-037', debt: 5000, disposable: 0, assets: 400, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-038', debt: 16000, disposable: 20, assets: 1300, employment: 'retired', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-039', debt: 7200, disposable: 10, assets: 700, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-040', debt: 20000, disposable: 45, assets: 1600, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-041', debt: 1800, disposable: 0, assets: 100, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-042', debt: 14000, disposable: 30, assets: 1400, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-043', debt: 10000, disposable: 15, assets: 800, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-044', debt: 19000, disposable: 40, assets: 1700, employment: 'retired', hasExistingCase: false, originalProduct: 'MAP' },
  { id: 'HC-045', debt: 3800, disposable: 5, assets: 250, employment: 'unemployed', hasExistingCase: false, originalProduct: 'MAP' },
  // PTD cases (~15) - debt £5k-£50k, disposable £100-£300, assets £5k-£50k
  { id: 'HC-046', debt: 15000, disposable: 200, assets: 8000, employment: 'employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-047', debt: 30000, disposable: 250, assets: 15000, employment: 'self_employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-048', debt: 22000, disposable: 180, assets: 12000, employment: 'employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-049', debt: 8000, disposable: 150, assets: 6500, employment: 'employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-050', debt: 45000, disposable: 300, assets: 25000, employment: 'self_employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-051', debt: 18000, disposable: 220, assets: 9500, employment: 'employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-052', debt: 35000, disposable: 270, assets: 18000, employment: 'employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-053', debt: 12000, disposable: 160, assets: 7200, employment: 'self_employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-054', debt: 28000, disposable: 240, assets: 14000, employment: 'employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-055', debt: 40000, disposable: 290, assets: 22000, employment: 'employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-056', debt: 10000, disposable: 130, assets: 5500, employment: 'employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-057', debt: 25000, disposable: 210, assets: 11000, employment: 'self_employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-058', debt: 50000, disposable: 280, assets: 30000, employment: 'employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-059', debt: 20000, disposable: 190, assets: 10000, employment: 'employed', hasExistingCase: false, originalProduct: 'PTD' },
  { id: 'HC-060', debt: 33000, disposable: 260, assets: 48000, employment: 'self_employed', hasExistingCase: false, originalProduct: 'PTD' },
  // Sequestration cases (~10) - debt £25k+, disposable ≤£0, or debt £10k+ with no disposable
  { id: 'HC-061', debt: 45000, disposable: -50, assets: 3000, employment: 'unemployed', hasExistingCase: false, originalProduct: 'Sequestration' },
  { id: 'HC-062', debt: 80000, disposable: 0, assets: 1500, employment: 'unemployed', hasExistingCase: false, originalProduct: 'Sequestration' },
  { id: 'HC-063', debt: 35000, disposable: -100, assets: 4000, employment: 'retired', hasExistingCase: false, originalProduct: 'Sequestration' },
  { id: 'HC-064', debt: 60000, disposable: -30, assets: 2200, employment: 'unemployed', hasExistingCase: false, originalProduct: 'Sequestration' },
  { id: 'HC-065', debt: 150000, disposable: 0, assets: 800, employment: 'unemployed', hasExistingCase: false, originalProduct: 'Sequestration' },
  { id: 'HC-066', debt: 28000, disposable: -80, assets: 3500, employment: 'retired', hasExistingCase: false, originalProduct: 'Sequestration' },
  { id: 'HC-067', debt: 55000, disposable: 0, assets: 2800, employment: 'unemployed', hasExistingCase: false, originalProduct: 'Sequestration' },
  { id: 'HC-068', debt: 42000, disposable: -20, assets: 1800, employment: 'unemployed', hasExistingCase: false, originalProduct: 'Sequestration' },
  { id: 'HC-069', debt: 95000, disposable: -150, assets: 4500, employment: 'retired', hasExistingCase: false, originalProduct: 'Sequestration' },
  { id: 'HC-070', debt: 32000, disposable: 0, assets: 900, employment: 'unemployed', hasExistingCase: false, originalProduct: 'Sequestration' },
  // DPP cases (~15) - debt £1.5k-£5k, disposable enough to repay in 48 months
  { id: 'HC-071', debt: 2000, disposable: 80, assets: 300, employment: 'employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-072', debt: 3500, disposable: 100, assets: 500, employment: 'employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-073', debt: 4800, disposable: 120, assets: 800, employment: 'self_employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-074', debt: 1800, disposable: 60, assets: 200, employment: 'employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-075', debt: 4200, disposable: 110, assets: 600, employment: 'employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-076', debt: 2800, disposable: 90, assets: 400, employment: 'employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-077', debt: 5000, disposable: 130, assets: 900, employment: 'self_employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-078', debt: 1600, disposable: 55, assets: 150, employment: 'employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-079', debt: 3800, disposable: 95, assets: 700, employment: 'employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-080', debt: 4500, disposable: 115, assets: 450, employment: 'employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-081', debt: 2200, disposable: 70, assets: 250, employment: 'self_employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-082', debt: 3000, disposable: 85, assets: 350, employment: 'employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-083', debt: 4000, disposable: 105, assets: 550, employment: 'employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-084', debt: 2500, disposable: 75, assets: 280, employment: 'employed', hasExistingCase: false, originalProduct: 'DPP' },
  { id: 'HC-085', debt: 3200, disposable: 88, assets: 420, employment: 'self_employed', hasExistingCase: false, originalProduct: 'DPP' },
  // Signposting cases (~15) - debt <£1.5k or has existing case
  { id: 'HC-086', debt: 800, disposable: 200, assets: 1000, employment: 'employed', hasExistingCase: false, originalProduct: 'Signposting' },
  { id: 'HC-087', debt: 1200, disposable: 150, assets: 500, employment: 'employed', hasExistingCase: false, originalProduct: 'Signposting' },
  { id: 'HC-088', debt: 500, disposable: 300, assets: 2000, employment: 'self_employed', hasExistingCase: false, originalProduct: 'Signposting' },
  { id: 'HC-089', debt: 1400, disposable: 180, assets: 800, employment: 'employed', hasExistingCase: false, originalProduct: 'Signposting' },
  { id: 'HC-090', debt: 300, disposable: 250, assets: 3000, employment: 'employed', hasExistingCase: false, originalProduct: 'Signposting' },
  { id: 'HC-091', debt: 900, disposable: 120, assets: 400, employment: 'retired', hasExistingCase: false, originalProduct: 'Signposting' },
  { id: 'HC-092', debt: 1100, disposable: 90, assets: 600, employment: 'employed', hasExistingCase: false, originalProduct: 'Signposting' },
  { id: 'HC-093', debt: 700, disposable: 220, assets: 1500, employment: 'employed', hasExistingCase: false, originalProduct: 'Signposting' },
  { id: 'HC-094', debt: 1300, disposable: 160, assets: 700, employment: 'self_employed', hasExistingCase: false, originalProduct: 'Signposting' },
  { id: 'HC-095', debt: 400, disposable: 280, assets: 2500, employment: 'employed', hasExistingCase: false, originalProduct: 'Signposting' },
  { id: 'HC-096', debt: 15000, disposable: 200, assets: 5000, employment: 'employed', hasExistingCase: true, originalProduct: 'Signposting' },
  { id: 'HC-097', debt: 8000, disposable: 150, assets: 3000, employment: 'employed', hasExistingCase: true, originalProduct: 'Signposting' },
  { id: 'HC-098', debt: 25000, disposable: 300, assets: 10000, employment: 'self_employed', hasExistingCase: true, originalProduct: 'Signposting' },
  { id: 'HC-099', debt: 6000, disposable: 100, assets: 2000, employment: 'employed', hasExistingCase: true, originalProduct: 'Signposting' },
  { id: 'HC-100', debt: 12000, disposable: 180, assets: 4000, employment: 'employed', hasExistingCase: true, originalProduct: 'Signposting' },
];

function simulateRecommendation(c: HistoricalCase, p: { das_disposable: number; map_ceiling: number; ptd_assets: number; dpp_months: number }): string {
  if (c.hasExistingCase) return 'Signposting';
  if (c.debt < 1500) return 'Signposting';
  if (c.debt >= 1500 && c.debt <= 5000 && c.disposable >= c.debt / p.dpp_months) return 'DPP';
  if (c.debt >= 5000 && c.debt <= p.map_ceiling && c.disposable > p.das_disposable && c.assets < p.ptd_assets) return 'DAS';
  if (c.assets >= p.ptd_assets && c.debt > 5000) return 'PTD';
  if (c.debt >= 1500 && c.debt <= p.map_ceiling && c.assets < 2000 && c.disposable < 50) return 'MAP';
  if (c.debt > p.map_ceiling || (c.debt > 10000 && c.disposable <= 0)) return 'Sequestration';
  return 'Signposting';
}

function getChangeReason(c: HistoricalCase, newProduct: string, p: { das_disposable: number; map_ceiling: number; ptd_assets: number; dpp_months: number }): string {
  const defaults = { das_disposable: 100, map_ceiling: 25000, ptd_assets: 5000, dpp_months: 48 };

  if (p.das_disposable !== defaults.das_disposable && c.disposable <= p.das_disposable && c.disposable > defaults.das_disposable) {
    return `Disposable income £${c.disposable} now below new DAS threshold of £${p.das_disposable}`;
  }
  if (p.das_disposable !== defaults.das_disposable && c.disposable > p.das_disposable && c.disposable <= defaults.das_disposable) {
    return `Disposable income £${c.disposable} now meets lowered DAS threshold of £${p.das_disposable}`;
  }
  if (p.map_ceiling !== defaults.map_ceiling && c.debt > defaults.map_ceiling && c.debt <= p.map_ceiling) {
    return `Debt £${c.debt.toLocaleString()} now within raised MAP ceiling of £${p.map_ceiling.toLocaleString()}`;
  }
  if (p.map_ceiling !== defaults.map_ceiling && c.debt <= defaults.map_ceiling && c.debt > p.map_ceiling) {
    return `Debt £${c.debt.toLocaleString()} now exceeds lowered MAP ceiling of £${p.map_ceiling.toLocaleString()}`;
  }
  if (p.ptd_assets !== defaults.ptd_assets && c.assets >= p.ptd_assets && c.assets < defaults.ptd_assets) {
    return `Assets £${c.assets.toLocaleString()} now meet lowered PTD threshold of £${p.ptd_assets.toLocaleString()}`;
  }
  if (p.ptd_assets !== defaults.ptd_assets && c.assets < p.ptd_assets && c.assets >= defaults.ptd_assets) {
    return `Assets £${c.assets.toLocaleString()} now below raised PTD threshold of £${p.ptd_assets.toLocaleString()}`;
  }
  if (p.dpp_months !== defaults.dpp_months) {
    const oldMonthly = c.debt / defaults.dpp_months;
    const newMonthly = c.debt / p.dpp_months;
    if (c.disposable >= newMonthly && c.disposable < oldMonthly) {
      return `Extended repayment period (${p.dpp_months} months) makes DPP affordable at £${Math.round(newMonthly)}/month`;
    }
    if (c.disposable < newMonthly && c.disposable >= oldMonthly) {
      return `Shortened repayment period (${p.dpp_months} months) requires £${Math.round(newMonthly)}/month, exceeds disposable income`;
    }
  }
  return `Reclassified from ${c.originalProduct} to ${newProduct} due to threshold changes`;
}

const PRODUCT_COLOR_MAP: Record<string, string> = {
  DAS: CHART_COLORS[0],
  MAP: CHART_COLORS[1],
  PTD: CHART_COLORS[2],
  Sequestration: CHART_COLORS[3],
  DPP: CHART_COLORS[4],
  Signposting: CHART_COLORS[5],
};

interface SubmittedChange {
  changes: { label: string; from: string; to: string }[];
  effectiveDate: string;
  approver: string;
  justification: string;
  submittedAt: string;
}

export default function PolicySimulationPage() {
  const { showToast } = useToast();

  const [params, setParams] = useState({
    das_disposable: 100,
    map_ceiling: 25000,
    ptd_assets: 5000,
    dpp_months: 48,
  });

  // Approval form state
  const [justification, setJustification] = useState('Raising DAS disposable income threshold to better align with cost of living increases...');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [approver, setApprover] = useState('');
  const [submitted, setSubmitted] = useState<SubmittedChange | null>(null);

  const hasChanges = params.das_disposable !== 100 || params.map_ceiling !== 25000 || params.ptd_assets !== 5000 || params.dpp_months !== 48;

  const simulation = useMemo(() => {
    const results = HISTORICAL_CASES.map(c => ({
      ...c,
      newProduct: simulateRecommendation(c, params),
      changed: simulateRecommendation(c, params) !== c.originalProduct,
    }));

    const affectedCases = results.filter(r => r.changed);
    const affectedCount = affectedCases.length;

    // Product distribution counts
    const originalCounts: Record<string, number> = {};
    const newCounts: Record<string, number> = {};
    results.forEach(r => {
      originalCounts[r.originalProduct] = (originalCounts[r.originalProduct] || 0) + 1;
      newCounts[r.newProduct] = (newCounts[r.newProduct] || 0) + 1;
    });

    const originalChartData = Object.entries(originalCounts).map(([name, value]) => ({ name, value }));
    const newChartData = Object.entries(newCounts).map(([name, value]) => ({ name, value }));

    // Movement table
    const movements: Record<string, number> = {};
    affectedCases.forEach(c => {
      const key = `${c.originalProduct}→${c.newProduct}`;
      movements[key] = (movements[key] || 0) + 1;
    });
    const movementTable = Object.entries(movements).map(([key, count]) => {
      const [from, to] = key.split('→');
      return { from, to, count };
    }).sort((a, b) => b.count - a.count);

    return { results, affectedCases, affectedCount, originalChartData, newChartData, movementTable };
  }, [params]);

  const handleParamChange = (id: string, value: number) => {
    setParams(prev => ({ ...prev, [id]: value }));
    setSubmitted(null);
  };

  const formatValue = (p: SimParam, value: number) =>
    p.unit === '£' ? `£${value.toLocaleString()}` : `${value} ${p.unit}`;

  const handleSubmitForApproval = () => {
    if (!hasChanges) {
      showToast('Adjust at least one parameter before submitting', 'warning');
      return;
    }
    if (!justification.trim()) {
      showToast('Justification is required', 'error');
      return;
    }
    if (!approver) {
      showToast('Select an approver', 'error');
      return;
    }

    const changes = PARAMETERS.filter(p => params[p.id as keyof typeof params] !== p.currentValue).map(p => ({
      label: p.label,
      from: formatValue(p, p.currentValue),
      to: formatValue(p, params[p.id as keyof typeof params]),
    }));

    setSubmitted({
      changes,
      effectiveDate: effectiveDate || 'Not specified',
      approver: APPROVERS.find(a => a.id === approver)?.name || approver,
      justification: justification.trim(),
      submittedAt: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
    });
    showToast('✓ Policy change submitted for approval');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Policy Simulation Tool</h1>
          <p className="mt-2 text-gray-600">What-if analysis — adjust rule thresholds and see the impact on historical cases</p>
        </div>

        {/* Section 1: Parameter Controls */}
        <div data-demo="policy-parameters" className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rule Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PARAMETERS.map(param => {
              const value = params[param.id as keyof typeof params];
              const isChanged = value !== param.currentValue;
              return (
                <div key={param.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{param.label}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {param.product}
                    </span>
                    {isChanged && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        Changed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{param.description}</p>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={value}
                    onChange={e => handleParamChange(param.id, Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      System: {param.unit === '£' ? `£${param.currentValue.toLocaleString()}` : `${param.currentValue} ${param.unit}`}
                    </span>
                    <span className={`text-sm ${isChanged ? 'text-blue-700 font-bold' : 'text-blue-600'}`}>
                      Test: {param.unit === '£' ? `£${value.toLocaleString()}` : `${value} ${param.unit}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Impact Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Impact Summary</h2>
          {!hasChanges ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">Move a slider to see the impact of policy changes</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-gray-900">
                <span className="text-4xl">{simulation.affectedCount}</span> of 100 cases affected ({simulation.affectedCount}%)
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  simulation.affectedCount <= 5
                    ? 'bg-green-100 text-green-800'
                    : simulation.affectedCount <= 15
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {simulation.affectedCount <= 5 ? 'Low Risk' : simulation.affectedCount <= 15 ? 'Medium Risk' : 'High Risk'}
              </span>
            </div>
          )}
        </div>

        {/* Section 5: Before/After Comparison */}
        <div data-demo="policy-distributions" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Current Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={simulation.originalChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {simulation.originalChartData.map((entry, index) => (
                    <Cell key={`cell-orig-${index}`} fill={PRODUCT_COLOR_MAP[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Simulated Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={simulation.newChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {simulation.newChartData.map((entry, index) => (
                    <Cell key={`cell-new-${index}`} fill={PRODUCT_COLOR_MAP[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 6: Movement Table */}
        {simulation.affectedCount > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Movements</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 font-semibold text-gray-700">From</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">To</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Cases Affected</th>
                </tr>
              </thead>
              <tbody>
                {simulation.movementTable.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium bg-gray-100 text-gray-800">{row.from}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium bg-blue-100 text-blue-800">{row.to}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section 7: Affected Cases List */}
        {simulation.affectedCount > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Affected Cases</h2>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="py-2 px-3 font-semibold text-gray-700">Case</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Debt</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Disposable</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Assets</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Previous</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">New</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {simulation.affectedCases.map(c => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono text-xs">{c.id}</td>
                      <td className="py-2 px-3">£{c.debt.toLocaleString()}</td>
                      <td className="py-2 px-3">£{c.disposable}</td>
                      <td className="py-2 px-3">£{c.assets.toLocaleString()}</td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{c.originalProduct}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{c.newProduct}</span>
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600">{getChangeReason(c, c.newProduct, params)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 8: Approval Workflow Mock */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 border-yellow-400">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Policy Change for Approval</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Justification for change</label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-3 text-sm"
                rows={3}
                value={justification}
                onChange={e => setJustification(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposed effective date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={effectiveDate}
                  onChange={e => setEffectiveDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approver</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={approver}
                  onChange={e => setApprover(e.target.value)}
                >
                  <option value="">Select an approver...</option>
                  {APPROVERS.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              className="px-6 py-2 bg-green-700 text-white font-medium rounded-md hover:bg-green-800 transition-colors"
              onClick={handleSubmitForApproval}
            >
              Submit for Approval
            </button>

            {/* Inline confirmation — records the submission client-side, no backend workflow exists yet */}
            {submitted && (
              <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-md">
                <p className="font-semibold text-green-800 mb-2">✓ Submitted for approval</p>
                <dl className="text-sm text-green-900 space-y-1">
                  <div className="flex gap-2">
                    <dt className="font-medium">Approver:</dt>
                    <dd>{submitted.approver}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium">Effective date:</dt>
                    <dd>{submitted.effectiveDate}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium">Submitted:</dt>
                    <dd>{submitted.submittedAt}</dd>
                  </div>
                </dl>
                <p className="text-sm font-medium text-green-900 mt-3 mb-1">Parameters changed ({submitted.changes.length}):</p>
                <ul className="text-sm text-green-900 space-y-0.5">
                  {submitted.changes.map(c => (
                    <li key={c.label}>
                      {c.label}: <span className="font-mono">{c.from}</span> → <span className="font-mono font-bold">{c.to}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-medium text-green-900 mt-3 mb-1">Justification:</p>
                <p className="text-sm text-green-900 italic">{submitted.justification}</p>
              </div>
            )}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>POC Notice:</strong> In production, submitted changes would enter an approval workflow with impact assessment, stakeholder sign-off, and scheduled deployment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
