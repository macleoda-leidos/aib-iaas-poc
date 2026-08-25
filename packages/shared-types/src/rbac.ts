/**
 * Must stay in step with `packages/database/src/seed-data/roles.json`, which is
 * the source both database backends seed from. An RBAC test in that package
 * fails if the two lists diverge.
 */
export type UserRole =
  | 'system_admin'
  | 'aib_senior_officer'
  | 'cyberops_analyst'
  | 'aib_officer'
  | 'money_adviser'
  | 'statistician'
  | 'supplier'
  | 'creditor'
  | 'aib_readonly'
  | 'debtor';

export type UserStatus = 'active' | 'suspended' | 'pending_approval' | 'deactivated';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: UserRole;
  roleDisplayName: string;
  organisationId?: string;
  status: UserStatus;
  lastLoginAt?: string;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
}

export interface Role {
  id: string;
  name: UserRole;
  displayName: string;
  description: string;
  level: number;
  permissions: Permission[];
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'submit' | 'approve' | 'reject' | 'assign' | 'export' | 'admin';

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  resource: string;
  action: PermissionAction;
}

export interface AuthToken {
  userId: string;
  email: string;
  role: UserRole;
  roleDisplayName: string;
  roleLevel: number;
  organisationId?: string;
  permissions: string[];
  exp: number;
}

/**
 * Permission check helper — determines if a user's permissions include a specific code.
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has ANY of the required permissions.
 */
export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some(p => userPermissions.includes(p));
}

/**
 * Check if user has ALL of the required permissions.
 */
export function hasAllPermissions(userPermissions: string[], required: string[]): boolean {
  return required.every(p => userPermissions.includes(p));
}
