import { DebtorDetails, ApplicantDetails } from './debtor';
import { Address, ContactDetails } from './address';
import { DebtSummary, Income, Expenditure, HouseholdComposition, Asset } from './financial';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'additional_info_required'
  | 'recommendation_issued'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type RecommendedProduct =
  | 'bankruptcy'
  | 'minimal_asset_process'
  | 'protected_trust_deed'
  | 'debt_arrangement_scheme'
  | 'moratorium'
  | 'debt_payment_programme'
  | 'signposting_advice';

export interface Application {
  id: string;
  referenceNumber: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  debtorDetails: DebtorDetails;
  applicantDetails: ApplicantDetails;
  addresses: Address[];
  contactDetails: ContactDetails;
  debtSummary: DebtSummary;
  income: Income;
  expenditure: Expenditure;
  household: HouseholdComposition;
  assets: Asset[];
  documents: DocumentReference[];
  creditCheckResult?: CreditCheckResult;
  existingCaseChecks?: ExistingCaseCheck[];
  recommendation?: ProductRecommendation;
  aiExplanation?: string;
  paymentStatus?: PaymentStatus;
  staffNotes?: StaffNote[];
  auditHistory: AuditEvent[];
}

export interface DocumentReference {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  category: 'identification' | 'proof_of_address' | 'income_evidence' | 'debt_evidence' | 'other';
  status: 'uploaded' | 'scanning' | 'clean' | 'quarantined';
}

export interface CreditCheckResult {
  checkedAt: string;
  provider: string;
  creditScore?: number;
  defaults: number;
  ccjs: number;
  bankruptcyFlag: boolean;
  ivaFlag: boolean;
  status: 'clear' | 'issues_found' | 'unable_to_check';
}

export interface ExistingCaseCheck {
  system: 'BASYS' | 'eDEN' | 'DASH' | 'DAS' | 'CFT' | 'Moratorium' | 'RoI';
  checkedAt: string;
  found: boolean;
  caseReference?: string;
  caseStatus?: string;
  details?: string;
}

export interface ProductRecommendation {
  recommendedProduct: RecommendedProduct;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
  alternativeProducts?: RecommendedProduct[];
  factors: RecommendationFactor[];
}

export interface RecommendationFactor {
  factor: string;
  value: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface PaymentStatus {
  required: boolean;
  amount?: number;
  currency: string;
  method?: 'apple_pay' | 'google_pay' | 'card' | 'none';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_required';
  transactionReference?: string;
  paidAt?: string;
}

export interface StaffNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  noteType: 'general' | 'review' | 'decision' | 'follow_up';
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  actorType: 'applicant' | 'system' | 'staff';
  details?: Record<string, unknown>;
}
