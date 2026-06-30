import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const verifyRouter = Router();

/**
 * Identity Verification Service
 *
 * Simulates ScotAccount and GOV.UK Verify identity verification flows.
 * In production, these would be SAML/OIDC integrations:
 * - ScotAccount: SAML 2.0 federation via Scottish Government Identity Service
 * - GOV.UK Verify: OIDC via GOV.UK One Login (successor to Verify)
 */

const MOCK_VERIFIED_IDENTITIES: Record<string, any> = {
  scotaccount_default: {
    firstName: 'John',
    lastName: 'Testerton',
    dateOfBirth: '1985-03-15',
    address: { line1: '42 Example Street', city: 'Edinburgh', postcode: 'EH1 1AA', country: 'Scotland' },
    verificationLevel: 'LOA2',
    levelDescription: 'Medium confidence — identity verified against government records',
  },
  govuk_default: {
    firstName: 'John',
    lastName: 'Testerton',
    dateOfBirth: '1985-03-15',
    address: { line1: '42 Example Street', city: 'Edinburgh', postcode: 'EH1 1AA', country: 'Scotland' },
    verificationLevel: 'LOA2',
    levelDescription: 'Medium confidence — verified via GOV.UK One Login',
  },
};

// List available identity providers
verifyRouter.get('/providers', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      providers: [
        {
          id: 'scotaccount',
          name: 'ScotAccount',
          description: 'Scottish Government digital identity service. Used by eDEN, Revenue Scotland, and other Scottish public services.',
          verificationLevel: 'LOA2',
          levelDescription: 'Medium confidence',
          protocol: 'SAML 2.0',
          status: 'available',
          icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
          features: ['name_verification', 'address_verification', 'date_of_birth', 'nino_match'],
        },
        {
          id: 'govuk_verify',
          name: 'GOV.UK One Login',
          description: 'UK Government digital identity service. Successor to GOV.UK Verify.',
          verificationLevel: 'LOA2',
          levelDescription: 'Medium confidence',
          protocol: 'OIDC',
          status: 'available',
          icon: '🇬🇧',
          features: ['name_verification', 'address_verification', 'date_of_birth', 'fraud_check'],
        },
        {
          id: 'manual',
          name: 'Manual Entry',
          description: 'Self-declared information. Lower assurance level. May require additional document verification.',
          verificationLevel: 'LOA1',
          levelDescription: 'Basic — self-declared',
          protocol: 'none',
          status: 'available',
          icon: '✏️',
          features: [],
        },
      ],
    },
  });
});

// Verify via ScotAccount (mock)
verifyRouter.post('/verify/scotaccount', (req: Request, res: Response) => {
  const verificationId = uuid();

  // Simulate verification delay would happen via redirect in real flow
  res.json({
    success: true,
    data: {
      verificationId,
      provider: 'scotaccount',
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      assuranceLevel: 'LOA2',
      identity: MOCK_VERIFIED_IDENTITIES.scotaccount_default,
      attributes: {
        nameVerified: true,
        dobVerified: true,
        addressVerified: true,
        ninoMatched: true,
      },
      session: {
        token: `sa_${uuid()}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      audit: {
        requestedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        ipAddress: req.ip,
        note: 'MOCK: In production, user would be redirected to ScotAccount login, then back via SAML assertion.',
      },
    },
  });
});

// Verify via GOV.UK Verify/One Login (mock)
verifyRouter.post('/verify/govuk', (req: Request, res: Response) => {
  const verificationId = uuid();

  res.json({
    success: true,
    data: {
      verificationId,
      provider: 'govuk_verify',
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      assuranceLevel: 'LOA2',
      identity: MOCK_VERIFIED_IDENTITIES.govuk_default,
      attributes: {
        nameVerified: true,
        dobVerified: true,
        addressVerified: true,
        fraudCheckPassed: true,
      },
      session: {
        token: `gv_${uuid()}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      audit: {
        requestedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        ipAddress: req.ip,
        note: 'MOCK: In production, user would be redirected to GOV.UK One Login, then back via OIDC token.',
      },
    },
  });
});

// Get verification status
verifyRouter.get('/verification/:id', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      verificationId: req.params.id,
      status: 'verified',
      provider: 'scotaccount',
      verifiedAt: new Date().toISOString(),
      assuranceLevel: 'LOA2',
    },
  });
});
