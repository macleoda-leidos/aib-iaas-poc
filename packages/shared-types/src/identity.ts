export type VerificationProvider = 'scotaccount' | 'govuk_verify' | 'manual';
export type VerificationLevel = 'LOA1' | 'LOA2' | 'LOA3';

export interface VerifiedIdentity {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address?: { line1: string; city: string; postcode: string; country: string };
  verificationLevel: VerificationLevel;
  levelDescription: string;
}

export interface IdentityVerification {
  verificationId: string;
  provider: VerificationProvider;
  status: 'pending' | 'verified' | 'failed';
  verifiedAt?: string;
  assuranceLevel: VerificationLevel;
  identity?: VerifiedIdentity;
}

export interface LinkedAccount {
  system: string;
  accountId: string | null;
  role: string | null;
  linked: boolean;
  linkedAt?: string;
  reason?: string;
}

export interface FederatedIdentityLookup {
  requestId: string;
  searchCriteria: Record<string, string>;
  results: Array<{
    system: string;
    userId: string;
    username: string;
    role: string;
    lastActive: string;
    status: string;
  }>;
  linkedAccountsFound: number;
}
