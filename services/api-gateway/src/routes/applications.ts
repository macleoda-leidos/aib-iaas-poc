import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDatabase } from '../db';

export const applicationsRouter = Router();

function generateReference(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `IAAS-${year}-${seq}`;
}

// Create new application
applicationsRouter.post('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const id = uuid();
  const referenceNumber = generateReference();

  const stmt = db.prepare(`
    INSERT INTO applications (id, reference_number, status, data)
    VALUES (?, ?, 'draft', ?)
  `);

  stmt.run(id, referenceNumber, JSON.stringify(req.body));

  // Record audit event
  db.prepare(`
    INSERT INTO audit_events (id, application_id, action, actor, actor_type, details)
    VALUES (?, ?, 'application_created', 'system', 'system', ?)
  `).run(uuid(), id, JSON.stringify({ referenceNumber }));

  res.status(201).json({
    success: true,
    data: { id, referenceNumber, status: 'draft', createdAt: new Date().toISOString() },
  });
});

// Get application by ID
applicationsRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as any;

  if (!row) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
    return;
  }

  res.json({
    success: true,
    data: {
      id: row.id,
      referenceNumber: row.reference_number,
      status: row.status,
      ...JSON.parse(row.data),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      submittedAt: row.submitted_at,
    },
  });
});

// Update application
applicationsRouter.put('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  const existing = db.prepare('SELECT id, status FROM applications WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
    return;
  }

  if (existing.status !== 'draft' && existing.status !== 'additional_info_required') {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Application cannot be edited in current status' } });
    return;
  }

  db.prepare(`
    UPDATE applications SET data = ?, updated_at = datetime('now') WHERE id = ?
  `).run(JSON.stringify(req.body), id);

  db.prepare(`
    INSERT INTO audit_events (id, application_id, action, actor, actor_type)
    VALUES (?, ?, 'application_updated', 'applicant', 'applicant')
  `).run(uuid(), id);

  res.json({ success: true, data: { id, status: existing.status, updatedAt: new Date().toISOString() } });
});

// Submit application
applicationsRouter.post('/:id/submit', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
    return;
  }

  db.prepare(`
    UPDATE applications SET status = 'submitted', submitted_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(id);

  db.prepare(`
    INSERT INTO audit_events (id, application_id, action, actor, actor_type)
    VALUES (?, ?, 'application_submitted', 'applicant', 'applicant')
  `).run(uuid(), id);

  res.json({
    success: true,
    data: { id, status: 'submitted', submittedAt: new Date().toISOString(), referenceNumber: existing.reference_number },
  });
});

// List applications (admin)
applicationsRouter.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string;
  const offset = (page - 1) * pageSize;

  let whereClause = '';
  const params: any[] = [];

  if (status) {
    whereClause = 'WHERE status = ?';
    params.push(status);
  }

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM applications ${whereClause}`).get(...params) as any;
  const totalCount = countRow.count;

  const rows = db.prepare(`
    SELECT id, reference_number, status, created_at, updated_at, submitted_at, data
    FROM applications ${whereClause}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as any[];

  res.json({
    success: true,
    data: rows.map(row => ({
      id: row.id,
      referenceNumber: row.reference_number,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      submittedAt: row.submitted_at,
      summary: (() => {
        const d = JSON.parse(row.data);
        return {
          applicantName: d.debtorDetails ? `${d.debtorDetails.firstName} ${d.debtorDetails.lastName}` : 'Unknown',
          totalDebt: d.debtSummary?.totalDebtAmount,
        };
      })(),
    })),
    meta: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
  });
});

// Add staff note
applicationsRouter.post('/:id/notes', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { content, noteType, authorName } = req.body;

  const existing = db.prepare('SELECT id, data FROM applications WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
    return;
  }

  const data = JSON.parse(existing.data);
  const note = {
    id: uuid(),
    authorId: 'USR-ADMIN-001',
    authorName: authorName || 'AiB Staff',
    content,
    createdAt: new Date().toISOString(),
    noteType: noteType || 'general',
  };

  data.staffNotes = [...(data.staffNotes || []), note];
  db.prepare('UPDATE applications SET data = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(JSON.stringify(data), id);

  db.prepare(`
    INSERT INTO audit_events (id, application_id, action, actor, actor_type, details)
    VALUES (?, ?, 'note_added', ?, 'staff', ?)
  `).run(uuid(), id, authorName || 'AiB Staff', JSON.stringify({ noteType }));

  res.status(201).json({ success: true, data: note });
});
