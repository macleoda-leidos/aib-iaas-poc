import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getOrgDb } from '../db';

export const organisationRouter = Router();

// List organisations with filtering
organisationRouter.get('/', (req: Request, res: Response) => {
  const db = getOrgDb();
  const { type, status, parentId, search } = req.query;

  let sql = 'SELECT * FROM organisations WHERE 1=1';
  const params: any[] = [];

  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (parentId) { sql += ' AND parent_id = ?'; params.push(parentId); }
  if (search) { sql += ' AND (name LIKE ? OR registration_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  sql += ' ORDER BY type, name';

  const orgs = db.prepare(sql).all(...params);
  res.json({ success: true, data: orgs, meta: { totalCount: orgs.length } });
});

// Get single organisation with children and relationships
organisationRouter.get('/:id', (req: Request, res: Response) => {
  const db = getOrgDb();
  const { id } = req.params;

  const org = db.prepare('SELECT * FROM organisations WHERE id = ?').get(id);
  if (!org) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organisation not found' } });
    return;
  }

  const children = db.prepare('SELECT * FROM organisations WHERE parent_id = ?').all(id);
  const relationships = db.prepare(`
    SELECT r.*,
      p.name as parent_name, p.type as parent_type,
      c.name as child_name, c.type as child_type
    FROM organisation_relationships r
    JOIN organisations p ON r.parent_org_id = p.id
    JOIN organisations c ON r.child_org_id = c.id
    WHERE r.parent_org_id = ? OR r.child_org_id = ?
  `).all(id, id);

  res.json({ success: true, data: { ...org, children, relationships } });
});

// Get organisation hierarchy (tree view)
organisationRouter.get('/:id/hierarchy', (req: Request, res: Response) => {
  const db = getOrgDb();
  const { id } = req.params;

  const org = db.prepare('SELECT * FROM organisations WHERE id = ?').get(id) as any;
  if (!org) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organisation not found' } });
    return;
  }

  // Build tree recursively
  function buildTree(parentId: string): any[] {
    const children = db.prepare('SELECT * FROM organisations WHERE parent_id = ?').all(parentId) as any[];
    return children.map(child => ({
      ...child,
      children: buildTree(child.id),
    }));
  }

  const tree = { ...org, children: buildTree(id) };
  res.json({ success: true, data: tree });
});

// Create organisation
organisationRouter.post('/', (req: Request, res: Response) => {
  const db = getOrgDb();
  const { name, type, parentId, registrationNumber, contactEmail, contactPhone, addressLine1, addressCity, addressPostcode, website, metadata } = req.body;
  const id = `ORG-${type?.toUpperCase().slice(0, 3) || 'GEN'}-${uuid().slice(0, 6).toUpperCase()}`;

  db.prepare(`
    INSERT INTO organisations (id, name, type, parent_id, registration_number, contact_email, contact_phone, address_line1, address_city, address_postcode, website, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, type, parentId || null, registrationNumber, contactEmail, contactPhone, addressLine1, addressCity, addressPostcode, website, JSON.stringify(metadata || {}));

  // Auto-create relationship if parentId provided
  if (parentId) {
    db.prepare(`
      INSERT INTO organisation_relationships (id, parent_org_id, child_org_id, relationship_type, status)
      VALUES (?, ?, ?, 'subsidiary', 'active')
    `).run(uuid(), parentId, id);
  }

  const created = db.prepare('SELECT * FROM organisations WHERE id = ?').get(id);
  res.status(201).json({ success: true, data: created });
});

// Update organisation
organisationRouter.put('/:id', (req: Request, res: Response) => {
  const db = getOrgDb();
  const { id } = req.params;
  const { name, status, contactEmail, contactPhone, addressLine1, addressCity, addressPostcode, website, metadata } = req.body;

  const existing = db.prepare('SELECT id FROM organisations WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organisation not found' } });
    return;
  }

  db.prepare(`
    UPDATE organisations SET name = COALESCE(?, name), status = COALESCE(?, status),
    contact_email = COALESCE(?, contact_email), contact_phone = COALESCE(?, contact_phone),
    address_line1 = COALESCE(?, address_line1), address_city = COALESCE(?, address_city),
    address_postcode = COALESCE(?, address_postcode), website = COALESCE(?, website),
    metadata = COALESCE(?, metadata), updated_at = datetime('now')
    WHERE id = ?
  `).run(name, status, contactEmail, contactPhone, addressLine1, addressCity, addressPostcode, website, metadata ? JSON.stringify(metadata) : null, id);

  const updated = db.prepare('SELECT * FROM organisations WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

// Create relationship between organisations
organisationRouter.post('/:id/relationships', (req: Request, res: Response) => {
  const db = getOrgDb();
  const { id: parentId } = req.params;
  const { childOrgId, relationshipType } = req.body;

  const relId = uuid();
  db.prepare(`
    INSERT INTO organisation_relationships (id, parent_org_id, child_org_id, relationship_type)
    VALUES (?, ?, ?, ?)
  `).run(relId, parentId, childOrgId, relationshipType);

  res.status(201).json({ success: true, data: { id: relId, parentOrgId: parentId, childOrgId, relationshipType } });
});

// Get organisations by type (convenience endpoint)
organisationRouter.get('/type/:type', (req: Request, res: Response) => {
  const db = getOrgDb();
  const orgs = db.prepare('SELECT * FROM organisations WHERE type = ? AND status = \'active\' ORDER BY name').all(req.params.type);
  res.json({ success: true, data: orgs });
});
