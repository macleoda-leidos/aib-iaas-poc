import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const federationRouter = Router();

/**
 * Identity Federation Service
 *
 * Demonstrates how a consolidated identity service (Keycloak) would
 * provide cross-system user lookup and account linking across all AiB systems.
 *
 * In production: Keycloak federation with LDAP/AD for internal users,
 * SAML/OIDC for external identity providers (ScotAccount, GOV.UK).
 */

// List federated systems
federationRouter.get('/systems', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      systems: [
        { id: 'BASYS', name: 'Bankruptcy Administration System', userCount: 85, protocol: 'LDAP', realm: 'aib-internal', status: 'federated' },
        { id: 'ASTRA', name: 'AiB Strategy & Administration', userCount: 120, protocol: 'LDAP', realm: 'aib-internal', status: 'federated' },
        { id: 'eDEN', name: 'DAS Electronic System', userCount: 340, protocol: 'SAML', realm: 'external-advisers', status: 'federated' },
        { id: 'CFT', name: 'Creditor/Trustee Facing', userCount: 180, protocol: 'OIDC', realm: 'creditors', status: 'federated' },
        { id: 'RoI', name: 'Register of Insolvencies', userCount: 45, protocol: 'LDAP', realm: 'aib-internal', status: 'federated' },
        { id: 'IAAS', name: 'Initial Application Advice Service', userCount: 500, protocol: 'OIDC', realm: 'public-debtors', status: 'active' },
      ],
      totalUsers: 500,
      realms: [
        { name: 'aib-internal', description: 'AiB staff (AD-federated)', users: 120, idp: 'Active Directory' },
        { name: 'external-advisers', description: 'Money advisers, trustees', users: 220, idp: 'ScotAccount / organisation SSO' },
        { name: 'public-debtors', description: 'Public applicants', users: 150, idp: 'ScotAccount / GOV.UK One Login' },
        { name: 'creditors', description: 'Creditor organisations', users: 80, idp: 'Organisation SSO' },
      ],
      keycloak: {
        version: '24.x (target)',
        deployment: 'HA cluster on Azure Container Apps',
        note: 'POC demonstrates the consolidation architecture. See docs/identity-architecture.md for full design.',
      },
    },
  });
});

// Cross-system identity lookup
federationRouter.post('/lookup', (req: Request, res: Response) => {
  const { email, nationalInsuranceNumber, firstName, lastName } = req.body;

  // Mock cross-system lookup results
  const results = [];

  if (nationalInsuranceNumber?.endsWith('A') || lastName?.toUpperCase() === 'SMITH') {
    results.push({ system: 'BASYS', userId: 'BASYS-USR-4521', username: 'john.smith@example.com', role: 'debtor', lastActive: '2020-08-14', status: 'discharged' });
  }
  if (lastName?.toUpperCase().startsWith('M')) {
    results.push({ system: 'eDEN', userId: 'EDEN-USR-7834', username: email || 'user@cas.example.org', role: 'debtor_via_adviser', lastActive: '2024-03-01', status: 'active_dpp' });
  }
  if (email?.includes('adviser') || email?.includes('cas')) {
    results.push({ system: 'eDEN', userId: 'EDEN-ADV-0042', username: email, role: 'money_adviser', lastActive: '2024-03-29', status: 'active' });
    results.push({ system: 'CFT', userId: 'CFT-USR-0042', username: email, role: 'approved_adviser', lastActive: '2024-03-29', status: 'active' });
  }

  res.json({
    success: true,
    data: {
      requestId: uuid(),
      searchCriteria: { email, nationalInsuranceNumber, firstName, lastName },
      results,
      linkedAccountsFound: results.length,
      note: results.length > 0
        ? 'Existing accounts found. In production, Keycloak would link these via federation protocol.'
        : 'No existing accounts found across federated systems.',
    },
  });
});

// Get linked accounts for a user
federationRouter.get('/user/:id/linked-accounts', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      userId: req.params.id,
      primaryRealm: 'public-debtors',
      linkedAccounts: [
        { system: 'IAAS', accountId: 'IAAS-USR-009', role: 'debtor', linked: true, linkedAt: '2024-03-15' },
        { system: 'eDEN', accountId: null, role: null, linked: false, reason: 'No eDEN account found' },
        { system: 'BASYS', accountId: null, role: null, linked: false, reason: 'No BASYS record' },
      ],
      federationStatus: 'partial',
      keycloakId: `kc-${uuid().slice(0, 8)}`,
      note: 'MOCK: In production, Keycloak manages account linking and SSO across all systems.',
    },
  });
});
