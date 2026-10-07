import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { applications, audit } from '../db';
import { optionalAuth, type AuthenticatedRequest } from '../middleware/rbac';
import { signToken, verifyToken } from '@aib-iaas/auth';
import { validate, applicationNotesSchema } from '@aib-iaas/validation';

// A read capability for a single application. Issued (signed) at create time and
// returned to the creator; required to read an application back anonymously, so a
// guessed/enumerated id is no longer sufficient on its own. This closes the read
// half of the applicant IDOR (H1 / GAP-005) without forcing login into the
// anonymous /apply journey — the capability travels with whoever created the record.
const CAPABILITY_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

function issueCapabilityToken(applicationId: string): string {
  return signToken({ purpose: 'application-capability', applicationId }, { expiresInSeconds: CAPABILITY_TTL_SECONDS });
}

function hasValidCapability(req: AuthenticatedRequest, applicationId: string): boolean {
  const header = req.headers['x-application-capability'];
  const token = Array.isArray(header) ? header[0] : header;
  if (!token) return false;
  try {
    const claims = verifyToken<{ purpose?: string; applicationId?: string }>(token);
    return claims.purpose === 'application-capability' && claims.applicationId === applicationId;
  } catch {
    return false;
  }
}

export const applicationsRouter = Router();

// Populate req.user when a token is present, without requiring one. The public
// intake routes (create / get / update / submit) are allow-listed, so the global
// gate skips authentication for them — but when a logged-in applicant uses them
// we still want their identity, to stamp ownership and to scope reads. The
// staff-only routes are already behind the global gate; this is idempotent there.
applicationsRouter.use(optionalAuth);

// Ownership + attribution helpers (Stage 3 / H1, H3).
//
// The POC has no applicant identity yet, so an application created through the
// public /apply journey has no owner (owner_user_id is null) and its id is the
// capability to read it back — anonymous and staff reads are both allowed. Once
// a debtor IS authenticated, they may only touch their own records; a mismatch
// returns 404, not 403, so the endpoint never confirms that an id it will not
// show you exists.

function isDebtor(req: AuthenticatedRequest): boolean {
  return req.user?.role === 'debtor';
}

/**
 * Enforce ownership for an authenticated debtor. Returns true when access is
 * allowed; otherwise sends a 404 and returns false. Anonymous callers and staff
 * are allowed (see note above).
 */
function enforceOwnership(req: AuthenticatedRequest, res: Response, ownerUserId: string | null): boolean {
  if (isDebtor(req) && ownerUserId !== req.user!.userId) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
    return false;
  }
  return true;
}

/** Derive the audit actor from the verified token, never from the request body. */
function auditActor(req: AuthenticatedRequest): { actorId?: string; actorName: string; actorType: string } {
  if (req.user) {
    return {
      actorId: req.user.userId,
      actorName: req.user.email,
      actorType: req.user.role === 'debtor' ? 'applicant' : 'staff',
    };
  }
  return { actorName: 'applicant', actorType: 'applicant' };
}

// Validation helpers
function validateNINumber(ni: string): string | null {
  if (!ni) return null; // NI is only validated if provided
  const cleaned = ni.replace(/\s/g, '').toUpperCase();
  const niRegex = /^[A-Z]{2}\d{6}[A-Z]$/;
  const invalidPrefixes = ['BG', 'GB', 'NK', 'KN', 'TN', 'NT', 'ZZ'];

  if (!niRegex.test(cleaned)) {
    return 'NI number must be in format AB123456C (2 letters, 6 digits, 1 letter)';
  }
  if (invalidPrefixes.includes(cleaned.substring(0, 2))) {
    return 'NI number cannot start with BG, GB, NK, KN, TN, NT, or ZZ';
  }
  return null;
}

function validateApplicationBody(body: any): string[] {
  const errors: string[] = [];

  // If body has debtorDetails, validate them
  const debtor = body.debtorDetails;
  if (debtor) {
    if (debtor.firstName !== undefined && (!debtor.firstName || debtor.firstName.trim().length < 2)) {
      errors.push('First name must be at least 2 characters');
    }
    if (debtor.lastName !== undefined && (!debtor.lastName || debtor.lastName.trim().length < 2)) {
      errors.push('Last name must be at least 2 characters');
    }
    if (debtor.nationalInsuranceNumber) {
      const niError = validateNINumber(debtor.nationalInsuranceNumber);
      if (niError) errors.push(niError);
    }
    if (debtor.dateOfBirth) {
      const dob = new Date(debtor.dateOfBirth);
      if (isNaN(dob.getTime())) {
        errors.push('Date of birth must be a valid date');
      } else if (dob > new Date()) {
        errors.push('Date of birth cannot be in the future');
      }
    }
    if (debtor.employmentStatus) {
      const validStatuses = ['employed', 'self_employed', 'unemployed', 'retired', 'student', 'other'];
      if (!validStatuses.includes(debtor.employmentStatus)) {
        errors.push('Employment status must be one of: ' + validStatuses.join(', '));
      }
    }
    if (debtor.dependants !== undefined) {
      const dep = parseInt(debtor.dependants);
      if (isNaN(dep) || dep < 0 || dep > 20) {
        errors.push('Dependants must be between 0 and 20');
      }
    }
  }

  // Validate debt summary if present
  const debtSummary = body.debtSummary;
  if (debtSummary && debtSummary.debts && Array.isArray(debtSummary.debts)) {
    debtSummary.debts.forEach((debt: any, i: number) => {
      if (debt.creditorName !== undefined && (!debt.creditorName || debt.creditorName.trim().length < 2)) {
        errors.push(`Debt ${i + 1}: Creditor name must be at least 2 characters`);
      }
      const amount = parseFloat(debt.outstandingAmount);
      if (!isNaN(amount) && amount <= 0) {
        errors.push(`Debt ${i + 1}: Outstanding amount must be greater than 0`);
      }
      if (!isNaN(amount) && amount > 10000000) {
        errors.push(`Debt ${i + 1}: Outstanding amount cannot exceed 10,000,000`);
      }
    });
  }

  // Validate income/expenditure if present
  const ie = body.incomeExpenditure;
  if (ie) {
    if (ie.income) {
      Object.entries(ie.income).forEach(([key, val]) => {
        const num = parseFloat(val as string);
        if (!isNaN(num) && num < 0) errors.push(`Income ${key}: amount must be 0 or more`);
        if (!isNaN(num) && num > 99999) errors.push(`Income ${key}: amount cannot exceed 99,999`);
      });
    }
    if (ie.expenditure) {
      Object.entries(ie.expenditure).forEach(([key, val]) => {
        const num = parseFloat(val as string);
        if (!isNaN(num) && num < 0) errors.push(`Expenditure ${key}: amount must be 0 or more`);
        if (!isNaN(num) && num > 99999) errors.push(`Expenditure ${key}: amount cannot exceed 99,999`);
      });
    }
  }

  return errors;
}

// Create new application
applicationsRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate input if body contains structured data
    const validationErrors = validateApplicationBody(req.body);
    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validationErrors,
        },
      });
      return;
    }

    const app = applications.create({
      status: 'draft',
      ...req.body,
      // Stamp ownership from the verified token when present. Anonymous intake
      // (the public /apply journey) leaves it null, by design.
      ownerUserId: req.user?.userId ?? null,
    });

    const actor = auditActor(req);
    audit.create({
      applicationId: app.id,
      action: 'application_created',
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorType: actor.actorType,
      details: { referenceNumber: app.referenceNumber },
    });

    // Return the read capability so the creator can retrieve this application
    // later without staff credentials (sent as the X-Application-Capability header).
    res.status(201).json({
      success: true,
      data: { ...app, capabilityToken: issueCapabilityToken(app.id) },
    });
  } catch (error: any) {
    console.error('[Applications]', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message } });
  }
});

// Get application by ID
applicationsRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const app = applications.getWithRelations(id);

    if (!app) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    if (req.user) {
      // Authenticated: a debtor sees only their own record; staff may read any.
      if (!enforceOwnership(req, res, app.ownerUserId)) return;
    } else if (!hasValidCapability(req, id)) {
      // Anonymous: a valid, application-scoped capability token is required.
      // 404 (not 403) so a bad/absent capability never confirms the id exists.
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    res.json({ success: true, data: app });
  } catch (error: any) {
    console.error('[Applications]', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message } });
  }
});

// Update application
applicationsRouter.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = applications.findById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    if (!enforceOwnership(req, res, existing.ownerUserId)) return;

    if (existing.status !== 'draft' && existing.status !== 'additional_info_required') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Application cannot be edited in current status' } });
      return;
    }

    // Validate input
    const validationErrors = validateApplicationBody(req.body);
    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validationErrors,
        },
      });
      return;
    }

    const updated = applications.update(id, req.body);

    audit.create({
      applicationId: id,
      action: 'application_updated',
      ...auditActor(req),
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[Applications]', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message } });
  }
});

// Submit application
applicationsRouter.post('/:id/submit', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = applications.findById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    if (!enforceOwnership(req, res, existing.ownerUserId)) return;

    applications.updateStatus(id, 'submitted');
    applications.update(id, { submittedAt: new Date().toISOString() });

    audit.create({
      applicationId: id,
      action: 'application_submitted',
      ...auditActor(req),
    });

    res.json({
      success: true,
      data: { id, status: 'submitted', submittedAt: new Date().toISOString(), referenceNumber: existing.referenceNumber },
    });
  } catch (error: any) {
    console.error('[Applications]', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message } });
  }
});

// Update application status (staff action: approve/reject/request-info).
// A statutory decision: gated by the matching permission, and the actor is taken
// from the verified token, never a literal (H3). Only staff who hold the
// permission for the specific transition may make it.
applicationsRouter.patch('/:id/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }
    const needed = status === 'approved'
      ? 'applications.approve'
      : status === 'rejected'
        ? 'applications.reject'
        : 'applications.update';
    if (!req.user.permissions.includes(needed)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to make this decision.', details: { required: [needed] } },
      });
      return;
    }

    const validTransitions: Record<string, string[]> = {
      submitted: ['under_review', 'additional_info_required', 'rejected'],
      under_review: ['recommendation_issued', 'additional_info_required', 'rejected', 'approved'],
      additional_info_required: ['under_review', 'submitted'],
      recommendation_issued: ['approved', 'rejected', 'additional_info_required'],
    };

    const existing = applications.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    const allowed = validTransitions[existing.status] || [];
    if (!allowed.includes(status)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TRANSITION', message: `Cannot transition from '${existing.status}' to '${status}'` },
      });
      return;
    }

    applications.updateStatus(id, status);

    audit.create({
      applicationId: id,
      action: `status_changed_to_${status}`,
      ...auditActor(req),
      details: { previousStatus: existing.status, notes },
    });

    res.json({ success: true, data: { id, status, updatedAt: new Date().toISOString() } });
  } catch (error: any) {
    console.error('[Applications]', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message } });
  }
});

// List applications (staff queue). Default-deny already required a token to get
// here; a debtor only ever sees their own records (H1), everyone else sees all.
applicationsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string | undefined;
    const assignedTo = req.query.assignedTo as string | undefined;
    const ownerUserId = isDebtor(req) ? req.user!.userId : undefined;

    const result = applications.list({ status, assignedTo, ownerUserId, page, pageSize });

    // Enrich with applicant summary where possible
    const enrichedData = result.data.map(app => {
      const withRelations = applications.getWithRelations(app.id);
      const applicant = withRelations?.applicant;
      return {
        ...app,
        summary: {
          applicantName: applicant ? `${applicant.firstName} ${applicant.lastName}` : 'Unknown',
          totalDebt: withRelations?.debts?.reduce((sum, d) => sum + d.amount, 0) || 0,
        },
      };
    });

    res.json({
      success: true,
      data: enrichedData,
      meta: { page, pageSize, totalCount: result.total, totalPages: Math.ceil(result.total / pageSize) },
    });
  } catch (error: any) {
    console.error('[Applications]', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message } });
  }
});

// Add staff note. The author is taken from the verified token, not the body —
// previously any caller could claim to be anyone (H3).
applicationsRouter.post('/:id/notes', validate(applicationNotesSchema), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, noteType } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const existing = applications.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    const noteId = randomUUID();
    const note = {
      id: noteId,
      authorId: req.user.userId,
      authorName: req.user.email,
      content,
      createdAt: new Date().toISOString(),
      noteType: noteType || 'general',
    };

    audit.create({
      applicationId: id,
      action: 'note_added',
      ...auditActor(req),
      details: { noteType, noteId, content },
    });

    res.status(201).json({ success: true, data: note });
  } catch (error: any) {
    console.error('[Applications]', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message } });
  }
});
