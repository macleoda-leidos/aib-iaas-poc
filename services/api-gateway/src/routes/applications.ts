import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { applications, audit } from '../db';

export const applicationsRouter = Router();

// Create new application
applicationsRouter.post('/', (req: Request, res: Response) => {
  try {
    const app = applications.create({
      status: 'draft',
      ...req.body,
    });

    audit.create({
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
applicationsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const app = applications.getWithRelations(id);

    if (!app) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    res.json({ success: true, data: app });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Update application
applicationsRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = applications.findById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    if (existing.status !== 'draft' && existing.status !== 'additional_info_required') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Application cannot be edited in current status' } });
      return;
    }

    const updated = applications.update(id, req.body);

    audit.create({
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
applicationsRouter.post('/:id/submit', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = applications.findById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    applications.updateStatus(id, 'submitted');
    applications.update(id, { submittedAt: new Date().toISOString() });

    audit.create({
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
applicationsRouter.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

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
applicationsRouter.get('/', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string | undefined;
    const assignedTo = req.query.assignedTo as string | undefined;

    const result = applications.list({ status, assignedTo, page, pageSize });

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
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Add staff note
applicationsRouter.post('/:id/notes', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, noteType, authorName } = req.body;

    const existing = applications.findById(id);
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

    audit.create({
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
