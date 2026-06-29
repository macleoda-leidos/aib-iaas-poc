export type OrganisationType = 'aib' | 'money_adviser' | 'creditor' | 'supplier' | 'trustee' | 'payment_distributor' | 'government';
export type OrganisationStatus = 'active' | 'suspended' | 'deregistered' | 'pending_approval';

export interface Organisation {
  id: string;
  name: string;
  type: OrganisationType;
  parentId?: string;
  status: OrganisationStatus;
  registrationNumber?: string;
  regulatedBy?: string;
  addressLine1?: string;
  addressCity?: string;
  addressPostcode?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  children?: Organisation[];
}

export type RelationshipType = 'subsidiary' | 'branch' | 'franchise' | 'partner' | 'contracted_supplier' | 'delegated_authority';

export interface OrganisationRelationship {
  id: string;
  parentOrgId: string;
  childOrgId: string;
  relationshipType: RelationshipType;
  status: 'active' | 'inactive';
  effectiveFrom: string;
  effectiveTo?: string;
}
