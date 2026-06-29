export interface CreditCheckInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationalInsuranceNumber?: string;
  currentAddress: { line1: string; postcode: string; city: string };
  previousAddresses?: Array<{ line1: string; postcode: string; city: string }>;
}

export interface CreditCheckOutput {
  creditScore: number;
  scoreRange: { min: number; max: number };
  scoreBand: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
  defaults: number;
  ccjs: number;
  bankruptcyFlag: boolean;
  ivaFlag: boolean;
  trustDeedFlag: boolean;
  activeCreditAccounts: number;
  totalCreditLimit: number;
  totalOutstanding: number;
  utilisationRate: number;
  recentSearches: number;
  accountSummary: AccountSummary[];
  addressLinks: AddressLink[];
  status: 'clear' | 'issues_found' | 'unable_to_check';
  riskIndicators: RiskIndicator[];
}

export interface AccountSummary {
  type: 'mortgage' | 'credit_card' | 'personal_loan' | 'overdraft' | 'hire_purchase' | 'utility' | 'other';
  provider: string;
  status: 'active' | 'settled' | 'defaulted' | 'in_arrears';
  limit?: number;
  balance: number;
  monthlyPayment: number;
  startDate: string;
  lastUpdated: string;
}

export interface AddressLink {
  address: string;
  postcode: string;
  dateFrom: string;
  dateTo?: string;
  confirmedResident: boolean;
}

export interface RiskIndicator {
  category: 'payment_history' | 'credit_utilisation' | 'search_frequency' | 'public_records' | 'account_age';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface CreditCheckProvider {
  id: string;
  name: string;
  displayName: string;
  features: string[];
  runCheck(input: CreditCheckInput): Promise<CreditCheckOutput>;
}
