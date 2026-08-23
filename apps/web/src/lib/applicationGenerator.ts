const SCOTTISH_FIRST_NAMES = ['Alistair', 'Brenda', 'Craig', 'Diana', 'Eleanor', 'Fiona', 'Graeme', 'Heather', 'Iain', 'Janet', 'Kenneth', 'Linda', 'Malcolm', 'Nicola', 'Owen', 'Patricia', 'Robert', 'Sheila', 'Thomas', 'Ursula', 'William', 'Morag', 'Hamish', 'Eileen', 'Douglas', 'Catriona', 'Angus', 'Mhairi', 'Callum', 'Isla'];
const SCOTTISH_LAST_NAMES = ['Morrison', 'Campbell', 'Stewart', 'Murray', 'MacDonald', 'Henderson', 'Robertson', 'Wilson', 'Thomson', 'Anderson', 'MacLeod', 'Fraser', 'Ross', 'Grant', 'Hamilton', 'Wallace', 'Douglas', 'Burns', 'Scott', 'MacKenzie', 'Sinclair', 'Reid', 'Patterson', 'Young', 'Mitchell', 'Clark', 'Brown', 'Duncan', 'Kerr', 'Johnston'];
const CITIES = ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Stirling', 'Perth', 'Inverness', 'Kilmarnock', 'Falkirk', 'Paisley', 'Livingston', 'Dunfermline'];
const POSTCODES = ['EH1 2AB', 'EH3 5AA', 'EH6 8PA', 'G1 1AB', 'G2 4JR', 'G12 8QQ', 'AB10 1HW', 'AB25 2ZR', 'DD1 4DG', 'DD2 1NH', 'FK1 1RE', 'PH1 5AA', 'IV2 3BL', 'KA1 2BB', 'PA1 1QN', 'KY1 1JE'];
const CREDITORS_BANK = ['Royal Bank of Scotland', 'Bank of Scotland', 'NatWest', 'Barclays', 'Lloyds Bank', 'Halifax', 'Virgin Money', 'TSB', 'Santander'];
const CREDITORS_OTHER = ['HM Revenue & Customs', 'Glasgow City Council', 'Edinburgh City Council', 'Scottish Power', 'British Gas', 'Scottish Water', 'BT', 'Capital One', 'Vanquis Bank', 'American Express'];
const DEBT_TYPES = ['Personal Loan', 'Credit Card', 'Overdraft', 'Council Tax', 'Utility', 'Tax', 'Catalogue', 'Store Card'];
const EMPLOYMENT = ['employed', 'self_employed', 'unemployed', 'retired'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

export interface GeneratedApplication {
  personal: {
    firstName: string;
    lastName: string;
    title: string;
    dateOfBirth: string;
    nationalInsuranceNumber: string;
    maritalStatus: string;
    dependants: number;
    employmentStatus: string;
  };
  address: {
    line1: string;
    city: string;
    postcode: string;
    residentSince: string;
  };
  debts: Array<{
    creditorName: string;
    creditorType: string;
    outstandingAmount: number;
    monthlyPayment: number;
  }>;
  income: {
    wages: number;
    benefits: number;
    pension: number;
    other: number;
  };
  expenditure: {
    rent: number;
    councilTax: number;
    utilities: number;
    food: number;
    transport: number;
    insurance: number;
    childcare: number;
    other: number;
  };
  assets: {
    noAssets: boolean;
    vehicles: Array<{ description: string; value: number }>;
    savings: Array<{ provider: string; value: number }>;
    properties: Array<{ address: string; value: number; mortgage: number }>;
  };
  expectedProduct: string;
}

export function generateRandomApplication(): GeneratedApplication {
  // Randomly select target product (weighted)
  const r = Math.random();
  let targetProduct: string;
  if (r < 0.40) targetProduct = 'DAS';
  else if (r < 0.65) targetProduct = 'MAP';
  else if (r < 0.85) targetProduct = 'PTD';
  else if (r < 0.95) targetProduct = 'Sequestration';
  else targetProduct = 'DPP';

  const firstName = pick(SCOTTISH_FIRST_NAMES);
  const lastName = pick(SCOTTISH_LAST_NAMES);
  const city = pick(CITIES);
  const postcode = pick(POSTCODES);

  // Generate NI number
  const niLetters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const ni = pick(niLetters.split('')) + pick(niLetters.split('')) + rand(100000, 999999) + pick('ABCD'.split(''));

  // DOB (25-65 years old)
  const age = rand(25, 65);
  const dob = `${1960 + (65 - age)}-${String(rand(1,12)).padStart(2,'0')}-${String(rand(1,28)).padStart(2,'0')}`;

  let wages = 0, benefits = 0, pension = 0;
  let employment = '';
  let totalDebt = 0;
  let rent = rand(400, 1100);
  let numCreditors = rand(2, 6);
  let hasAssets = false;
  let propertyValue = 0;

  // Set financial profile based on target product
  switch (targetProduct) {
    case 'DAS':
      employment = 'employed';
      wages = rand(2000, 3500);
      totalDebt = rand(5000, 25000);
      break;
    case 'MAP':
      employment = pick(['unemployed', 'retired']);
      wages = 0;
      benefits = rand(800, 1200);
      pension = employment === 'retired' ? rand(400, 800) : 0;
      totalDebt = rand(1500, 25000);
      rent = rand(300, 600);
      break;
    case 'PTD':
      employment = pick(['employed', 'self_employed']);
      wages = rand(2000, 3000);
      totalDebt = rand(8000, 50000);
      hasAssets = true;
      propertyValue = rand(120000, 250000);
      break;
    case 'Sequestration':
      employment = pick(['unemployed', 'employed']);
      wages = employment === 'employed' ? rand(1200, 1800) : 0;
      benefits = employment === 'unemployed' ? rand(900, 1100) : 0;
      totalDebt = rand(25000, 60000);
      break;
    case 'DPP':
      employment = 'employed';
      wages = rand(1800, 2800);
      totalDebt = rand(1500, 5000);
      numCreditors = rand(1, 3);
      break;
  }

  // Generate debts
  const debts = [];
  let remaining = totalDebt;
  for (let i = 0; i < numCreditors; i++) {
    const isLast = i === numCreditors - 1;
    const amount = isLast ? remaining : rand(Math.floor(remaining * 0.2), Math.floor(remaining * 0.6));
    remaining -= amount;
    debts.push({
      creditorName: pick([...CREDITORS_BANK, ...CREDITORS_OTHER]),
      creditorType: pick(DEBT_TYPES),
      outstandingAmount: Math.max(amount, 200),
      monthlyPayment: rand(0, Math.floor(amount / 48)),
    });
  }

  const totalIncome = wages + benefits + pension;
  const councilTax = rand(80, 180);
  const utilities = rand(80, 200);
  const food = rand(200, 450);
  const transport = rand(40, 200);
  const insurance = rand(0, 80);
  const childcare = rand(0, 300);
  const otherExp = rand(20, 100);

  return {
    personal: {
      firstName,
      lastName,
      title: pick(['Mr', 'Mrs', 'Ms', 'Miss']),
      dateOfBirth: dob,
      nationalInsuranceNumber: ni,
      maritalStatus: pick(['Single', 'Married', 'Divorced', 'Widowed']),
      dependants: rand(0, 4),
      employmentStatus: employment,
    },
    address: {
      line1: `${rand(1, 120)} ${pick(['High Street', 'Castle Road', 'George Street', 'Queen Street', 'Victoria Road', 'Union Street', 'Princes Street', 'Argyle Street', 'Buchanan Drive', 'Royal Mile'])}`,
      city,
      postcode,
      residentSince: `${rand(2018, 2024)}-${String(rand(1,12)).padStart(2,'0')}-01`,
    },
    debts,
    income: { wages, benefits, pension, other: rand(0, 200) },
    expenditure: { rent, councilTax, utilities, food, transport, insurance, childcare, other: otherExp },
    assets: {
      noAssets: !hasAssets,
      vehicles: hasAssets || Math.random() > 0.5 ? [{ description: pick(['2019 Volkswagen Golf', '2020 Ford Focus', '2018 Vauxhall Corsa', '2021 Nissan Qashqai']), value: rand(3000, 15000) }] : [],
      savings: Math.random() > 0.6 ? [{ provider: pick(['Nationwide', 'Scottish Widows', 'NS&I']), value: rand(200, 3000) }] : [],
      properties: hasAssets ? [{ address: `${rand(1,50)} ${pick(['Oak Drive', 'Elm Road', 'Pine Avenue'])}`, value: propertyValue, mortgage: rand(Math.floor(propertyValue * 0.5), Math.floor(propertyValue * 0.85)) }] : [],
    },
    expectedProduct: targetProduct,
  };
}
