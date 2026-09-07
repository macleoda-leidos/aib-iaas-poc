import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { applications, audit } from '../db';
import {
  authenticate,
  isDebtor,
  ownsApplication,
  denyApplicationAccess,
  type AuthenticatedRequest,
} from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { toApplicationInput } from './applicationMapping';
import {
  applicationBodySchema,
  applicationStatusBodySchema,
  caseNoteBodySchema,
} from '@aib-iaas/validation';

export const applicationsRouter = Router();

/**
 * Every application route requires an authenticated caller.
 *
 * This closes GAP-002 for the routes carrying personal data. Until now these were
 * open, and `optionalAuth` meant the ownership checks below only bound a caller who
 * volunteered a token — anyone who simply did not authenticate got everything. Three
 * controls (ownership, per-request permissions, body validation) were real for
 * identified callers and bypassable by staying anonymous, which is worse than no
 * control because it reads as one.
 *
 * Applied on the **router**, not at the mount point: the deployment shim re-mounts
 * routers by hand, and a guard added only at a mount is invisible in the other
 * topology — which is how the one authorised route in the repo shipped
 * unauthenticated. A guard that travels with the router cannot diverge.
 *
 * **This is a deliberate product change**, not just a security fix: the public
 * dashboard and case pages were viewable by anonymous visitors, and now are not. An
 * unauthenticated caller gets 401 and the frontend sends them to log in.
 */
applicationsRouter.use(authenticate);

// Create new application
applicationsRouter.post('/', validateBody(applicationBodySchema), async (req: Request, res: Response) => {
  try {
    // Ownership is taken from the verified token, never from the request body: a
    // client that could nominate the owner could hand its own application to
    // someone else, or claim someone else's. Staff creating a case on a debtor's
    // behalf may still pass `debtorUserId`, since they are not the owner.
    const debtorUserId = isDebtor(req as AuthenticatedRequest)
      ? (req as AuthenticatedRequest).user!.userId
      : req.body?.debtorUserId ?? null;

    // Translated rather than spread. The body speaks the form's vocabulary
    // (`debtorDetails`, `debtSummary`, `addressHistory`); the repository speaks the
    // persistence model's (`applicant`, `debts`, `addresses`). Spreading meant the
    // unrecognised keys were silently discarded — see applicationMapping.ts.
    const app = await applications.create({
      status: 'draft',
      ...toApplicationInput(req.body),
      debtorUserId,
    });

    await audit.create({
      applicationId: app.id,
      action: 'application_created',
      actorName: 'system',
      actorType: 'system',
      details: { referenceNumber: app.referenceNumber },
    });

    res.status(201).json({
      success: true,
      data: app,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Get application by ID
applicationsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const app = await applications.getWithRelations(id);

    if (!app) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    // The IDOR fix. Without it a debtor could read any other debtor's full case —
    // applicant, address, NI number, debts, assets, income — by changing the id.
    if (!ownsApplication(req as AuthenticatedRequest, app)) {
      denyApplicationAccess(res);
      return;
    }

    res.json({ success: true, data: app });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Update application
applicationsRouter.put('/:id', validateBody(applicationBodySchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await applications.findById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    if (!ownsApplication(req as AuthenticatedRequest, existing)) {
      denyApplicationAccess(res);
      return;
    }

    if (existing.status !== 'draft' && existing.status !== 'additional_info_required') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Application cannot be edited in current status' } });
      return;
    }

    // Translated, and `debtorUserId` never survives the translation — ownership
    // comes from the token, so a debtor cannot hand their application to another
    // user or claim one that had no owner. Reassignment is a staff action and has no
    // route yet.
    const updated = await applications.update(id, toApplicationInput(req.body));

    await audit.create({
      applicationId: id,
      action: 'application_updated',
      actorName: 'applicant',
      actorType: 'applicant',
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Submit application
applicationsRouter.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await applications.findById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    if (!ownsApplication(req as AuthenticatedRequest, existing)) {
      denyApplicationAccess(res);
      return;
    }

    await applications.updateStatus(id, 'submitted');
    await applications.update(id, { submittedAt: new Date().toISOString() });

    await audit.create({
      applicationId: id,
      action: 'application_submitted',
      actorName: 'applicant',
      actorType: 'applicant',
    });

    res.json({
      success: true,
      data: { id, status: 'submitted', submittedAt: new Date().toISOString(), referenceNumber: existing.referenceNumber },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Update application status (staff action: approve/reject/request-info)
applicationsRouter.patch('/:id/status', validateBody(applicationStatusBodySchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validTransitions: Record<string, string[]> = {
      submitted: ['under_review', 'additional_info_required', 'rejected'],
      under_review: ['recommendation_issued', 'additional_info_required', 'rejected', 'approved'],
      additional_info_required: ['under_review', 'submitted'],
      recommendation_issued: ['approved', 'rejected', 'additional_info_required'],
    };

    // A staff decision, so ownership is the wrong test — owning the case is
    // precisely what must *not* grant it. A debtor able to move their own
    // application to `approved` would be deciding their own sequestration.
    if (isDebtor(req as AuthenticatedRequest)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only AiB staff can change an application status.' },
      });
      return;
    }

    const existing = await applications.findById(id);
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

    await applications.updateStatus(id, status);

    await audit.create({
      applicationId: id,
      action: `status_changed_to_${status}`,
      actorName: 'aib_staff',
      actorType: 'staff',
      details: { previousStatus: existing.status, notes },
    });

    res.json({ success: true, data: { id, status, updatedAt: new Date().toISOString() } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// List applications (admin)
applicationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string | undefined;
    const assignedTo = req.query.assignedTo as string | undefined;

    // A debtor's list is narrowed to their own applications, and the value comes
    // from the verified token rather than the query string — so it cannot be widened
    // by asking for someone else's id, or dropped by omitting the parameter.
    const debtorUserId = isDebtor(req as AuthenticatedRequest)
      ? (req as AuthenticatedRequest).user!.userId
      : undefined;

    const result = await applications.list({ status, assignedTo, debtorUserId, page, pageSize });

    // Enrich with applicant summary where possible. Promise.all rather than a
    // sequential loop: one page is up to `pageSize` lookups, and against Neon each
    // is a network round trip, so serialising them would make the admin list
    // pageSize times slower than it needs to be.
    const enrichedData = await Promise.all(result.data.map(async app => {
      const withRelations = await applications.getWithRelations(app.id);
      const applicant = withRelations?.applicant;
      return {
        ...app,
        summary: {
          applicantName: applicant ? `${applicant.firstName} ${applicant.lastName}` : 'Unknown',
          totalDebt: withRelations?.debts?.reduce((sum, d) => sum + d.amount, 0) || 0,
        },
      };
    }));

    res.json({
      success: true,
      data: enrichedData,
      meta: { page, pageSize, totalCount: result.total, totalPages: Math.ceil(result.total / pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Add staff note
applicationsRouter.post('/:id/notes', validateBody(caseNoteBodySchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, noteType, authorName } = req.body;

    // Staff casework, like the status change above: notes are the reviewer's record
    // and are shown to reviewers as such, so a debtor writing one would be putting
    // words in a caseworker's mouth.
    if (isDebtor(req as AuthenticatedRequest)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only AiB staff can add a case note.' },
      });
      return;
    }

    const existing = await applications.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    const noteId = randomUUID();
    const note = {
      id: noteId,
      authorId: 'USR-ADMIN-001',
      authorName: authorName || 'AiB Staff',
      content,
      createdAt: new Date().toISOString(),
      noteType: noteType || 'general',
    };

    await audit.create({
      applicationId: id,
      action: 'note_added',
      actorName: authorName || 'AiB Staff',
      actorType: 'staff',
      details: { noteType, noteId, content },
    });

    res.status(201).json({ success: true, data: note });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});
