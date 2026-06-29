export interface DebtorDetails {
  id?: string;
  title: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  nationalInsuranceNumber?: string;
  maritalStatus: 'single' | 'married' | 'civil_partnership' | 'divorced' | 'widowed' | 'separated';
  dependants: number;
  employmentStatus: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student' | 'other';
  employerName?: string;
}

export interface ApplicantDetails {
  relationship: 'self' | 'representative' | 'executor' | 'trustee' | 'adviser';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organisationName?: string;
  referenceNumber?: string;
}
