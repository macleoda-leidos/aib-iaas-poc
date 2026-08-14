/**
 * Demo Seed Script — populates the API gateway database with realistic applications
 * across different statuses for demonstration purposes.
 *
 * Usage: npx tsx scripts/seed-demo-data.ts
 *
 * Requires the API gateway to be running on port 3001.
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

interface SeedApplication {
  debtorDetails: {
    title: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationalInsuranceNumber: string;
    maritalStatus: string;
    employmentStatus: string;
    dependants: number;
  };
  addressHistory: {
    current: { line1: string; city: string; postcode: string; };
  };
  contactDetails: { email: string; phone: string; };
  debtSummary: { totalDebtAmount: number; creditorsCount: number; debts: any[]; };
  incomeExpenditure: {
    income: { wages: number; benefits: number; };
    expenditure: { rent: number; food: number; utilities: number; transport: number; };
    totalIncome: number;
    totalExpenditure: number;
  };
  assets: { noAssets?: boolean; properties?: any[]; vehicles?: any[]; };
}

const SEED_APPLICATIONS: { data: SeedApplication; targetStatus: string }[] = [
  {
    targetStatus: 'submitted',
    data: {
      debtorDetails: { title: 'Mrs', firstName: 'Eleanor', lastName: 'MacPherson', dateOfBirth: '1978-11-23', nationalInsuranceNumber: 'QQ123456C', maritalStatus: 'married', employmentStatus: 'employed', dependants: 2 },
      addressHistory: { current: { line1: '14 Morningside Road', city: 'Edinburgh', postcode: 'EH10 4BF' } },
      contactDetails: { email: 'eleanor.macpherson@email.com', phone: '07700 900123' },
      debtSummary: { totalDebtAmount: 14200, creditorsCount: 4, debts: [
        { creditorName: 'Barclays', creditorType: 'credit_card', outstandingAmount: 4800, monthlyPayment: 120 },
        { creditorName: 'HSBC', creditorType: 'loan_company', outstandingAmount: 6200, monthlyPayment: 200 },
        { creditorName: 'Scottish Power', creditorType: 'utility', outstandingAmount: 1800, monthlyPayment: 50 },
        { creditorName: 'City of Edinburgh Council', creditorType: 'council_tax', outstandingAmount: 1400, monthlyPayment: 0 },
      ]},
      incomeExpenditure: { income: { wages: 2400, benefits: 0 }, expenditure: { rent: 850, food: 400, utilities: 150, transport: 120 }, totalIncome: 2400, totalExpenditure: 1520 },
      assets: { noAssets: true },
    }
  },
  {
    targetStatus: 'submitted',
    data: {
      debtorDetails: { title: 'Mr', firstName: 'Craig', lastName: 'Henderson', dateOfBirth: '1990-05-12', nationalInsuranceNumber: 'AB654321D', maritalStatus: 'single', employmentStatus: 'self_employed', dependants: 0 },
      addressHistory: { current: { line1: '42 Sauchiehall Street', city: 'Glasgow', postcode: 'G2 3AH' } },
      contactDetails: { email: 'craig.henderson@gmail.com', phone: '07700 900456' },
      debtSummary: { totalDebtAmount: 28500, creditorsCount: 6, debts: [
        { creditorName: 'RBS', creditorType: 'bank', outstandingAmount: 8000, monthlyPayment: 250 },
        { creditorName: 'Virgin Money', creditorType: 'credit_card', outstandingAmount: 5500, monthlyPayment: 150 },
        { creditorName: 'Provident', creditorType: 'loan_company', outstandingAmount: 7000, monthlyPayment: 300 },
        { creditorName: 'HMRC', creditorType: 'hmrc', outstandingAmount: 4500, monthlyPayment: 0 },
        { creditorName: 'Scottish Gas', creditorType: 'utility', outstandingAmount: 2200, monthlyPayment: 60 },
        { creditorName: 'Klarna', creditorType: 'other', outstandingAmount: 1300, monthlyPayment: 80 },
      ]},
      incomeExpenditure: { income: { wages: 1800, benefits: 200 }, expenditure: { rent: 700, food: 350, utilities: 120, transport: 180 }, totalIncome: 2000, totalExpenditure: 1350 },
      assets: { vehicles: [{ description: '2016 Vauxhall Corsa', value: 3500, finance: 0, essential: 'yes' }] },
    }
  },
  {
    targetStatus: 'under_review',
    data: {
      debtorDetails: { title: 'Ms', firstName: 'Fiona', lastName: 'MacDonald', dateOfBirth: '1965-02-18', nationalInsuranceNumber: 'CD789012E', maritalStatus: 'divorced', employmentStatus: 'unemployed', dependants: 1 },
      addressHistory: { current: { line1: '7 Union Street', city: 'Aberdeen', postcode: 'AB10 1BB' } },
      contactDetails: { email: 'fiona.mac@outlook.com', phone: '07700 900789' },
      debtSummary: { totalDebtAmount: 8900, creditorsCount: 3, debts: [
        { creditorName: 'TSB', creditorType: 'bank', outstandingAmount: 4200, monthlyPayment: 100 },
        { creditorName: 'Capital One', creditorType: 'credit_card', outstandingAmount: 3200, monthlyPayment: 90 },
        { creditorName: 'Aberdeen City Council', creditorType: 'council_tax', outstandingAmount: 1500, monthlyPayment: 0 },
      ]},
      incomeExpenditure: { income: { wages: 0, benefits: 1200 }, expenditure: { rent: 600, food: 280, utilities: 100, transport: 80 }, totalIncome: 1200, totalExpenditure: 1060 },
      assets: { noAssets: true },
    }
  },
  {
    targetStatus: 'approved',
    data: {
      debtorDetails: { title: 'Mr', firstName: 'Alistair', lastName: 'Robertson', dateOfBirth: '1982-08-30', nationalInsuranceNumber: 'EF345678F', maritalStatus: 'married', employmentStatus: 'employed', dependants: 3 },
      addressHistory: { current: { line1: '23 Perth Road', city: 'Dundee', postcode: 'DD1 4LN' } },
      contactDetails: { email: 'alistair.r@work.co.uk', phone: '07700 900234' },
      debtSummary: { totalDebtAmount: 19800, creditorsCount: 5, debts: [
        { creditorName: 'Halifax', creditorType: 'bank', outstandingAmount: 6000, monthlyPayment: 180 },
        { creditorName: 'Santander', creditorType: 'credit_card', outstandingAmount: 4800, monthlyPayment: 130 },
        { creditorName: 'Wonga', creditorType: 'loan_company', outstandingAmount: 3000, monthlyPayment: 200 },
        { creditorName: 'SSE', creditorType: 'utility', outstandingAmount: 3000, monthlyPayment: 80 },
        { creditorName: 'Dundee City Council', creditorType: 'council_tax', outstandingAmount: 3000, monthlyPayment: 0 },
      ]},
      incomeExpenditure: { income: { wages: 2800, benefits: 400 }, expenditure: { rent: 950, food: 500, utilities: 180, transport: 200 }, totalIncome: 3200, totalExpenditure: 1830 },
      assets: { properties: [{ address: '23 Perth Road, Dundee', value: 145000, mortgage: 120000, ownership: 'joint' }] },
    }
  },
  {
    targetStatus: 'rejected',
    data: {
      debtorDetails: { title: 'Mr', firstName: 'Derek', lastName: 'Smith', dateOfBirth: '1975-12-01', nationalInsuranceNumber: 'GH901234A', maritalStatus: 'single', employmentStatus: 'unemployed', dependants: 0 },
      addressHistory: { current: { line1: '88 High Street', city: 'Stirling', postcode: 'FK8 1NE' } },
      contactDetails: { email: 'derek.smith99@hotmail.com', phone: '07700 900567' },
      debtSummary: { totalDebtAmount: 3200, creditorsCount: 2, debts: [
        { creditorName: 'Lloyds', creditorType: 'bank', outstandingAmount: 2000, monthlyPayment: 50 },
        { creditorName: 'BrightHouse', creditorType: 'other', outstandingAmount: 1200, monthlyPayment: 40 },
      ]},
      incomeExpenditure: { income: { wages: 0, benefits: 800 }, expenditure: { rent: 500, food: 200, utilities: 80, transport: 40 }, totalIncome: 800, totalExpenditure: 820 },
      assets: { noAssets: true },
    }
  },
];

async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function apiPatch(path: string, body: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function apiPut(path: string, body: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function seed() {
  console.log('🌱 Seeding demo data...\n');
  console.log(`   API: ${API_URL}`);
  console.log(`   Applications: ${SEED_APPLICATIONS.length}\n`);

  for (const { data, targetStatus } of SEED_APPLICATIONS) {
    try {
      // 1. Create draft
      const created = await apiPost('/api/applications', data);
      const id = created.data.id;
      const ref = created.data.referenceNumber;

      // 2. Update with full data
      await apiPut(`/api/applications/${id}`, data);

      // 3. Submit
      await apiPost(`/api/applications/${id}/submit`, {});

      // 4. Transition to target status if needed
      if (targetStatus === 'under_review') {
        await apiPatch(`/api/applications/${id}/status`, { status: 'under_review', notes: 'Assigned for review' });
      } else if (targetStatus === 'approved') {
        await apiPatch(`/api/applications/${id}/status`, { status: 'under_review', notes: 'Review started' });
        await apiPatch(`/api/applications/${id}/status`, { status: 'approved', notes: 'DAS recommended and approved' });
      } else if (targetStatus === 'rejected') {
        await apiPatch(`/api/applications/${id}/status`, { status: 'under_review', notes: 'Review started' });
        await apiPatch(`/api/applications/${id}/status`, { status: 'rejected', notes: 'Below minimum debt threshold' });
      }

      console.log(`   ✓ ${ref} — ${data.debtorDetails.firstName} ${data.debtorDetails.lastName} [${targetStatus}]`);
    } catch (err: any) {
      console.error(`   ✗ Failed: ${data.debtorDetails.firstName} ${data.debtorDetails.lastName} — ${err.message}`);
    }
  }

  console.log('\n✅ Seed complete. Applications are now visible in the Dashboard.');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  console.error('   Is the API gateway running on', API_URL, '?');
  process.exit(1);
});
