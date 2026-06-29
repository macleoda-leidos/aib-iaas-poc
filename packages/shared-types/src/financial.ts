export interface DebtSummary {
  totalDebtAmount: number;
  numberOfCreditors: number;
  debts: Debt[];
}

export interface Debt {
  id?: string;
  creditorName: string;
  creditorType: 'bank' | 'credit_card' | 'loan_company' | 'utility' | 'council_tax' | 'hmrc' | 'other';
  originalAmount: number;
  outstandingAmount: number;
  monthlyPayment: number;
  isSecured: boolean;
  accountReference?: string;
  inArrears: boolean;
  arrearsAmount?: number;
}

export interface Income {
  wages: number;
  benefits: number;
  pension: number;
  otherIncome: number;
  totalMonthlyIncome: number;
}

export interface Expenditure {
  mortgage: number;
  rent: number;
  councilTax: number;
  utilities: number;
  food: number;
  transport: number;
  insurance: number;
  childcare: number;
  otherExpenditure: number;
  totalMonthlyExpenditure: number;
}

export interface HouseholdComposition {
  numberOfAdults: number;
  numberOfChildren: number;
  childrenAges?: number[];
}

export interface Asset {
  type: 'property' | 'vehicle' | 'savings' | 'investments' | 'other';
  description: string;
  estimatedValue: number;
  outstandingFinance?: number;
  isEssential: boolean;
}
