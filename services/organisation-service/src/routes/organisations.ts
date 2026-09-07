import { Router, Request, Response } from 'express';
import { organisations } from '../db';
import { authenticate, requirePermission } from '../middleware/rbac';

export const organisationRouter = Router();

/**
 * Organisation reference data is readable by any authenticated caller; creating and
 * updating an organisation requires `organisations.admin`. Both were open.
 */
organisationRouter.use(authenticate);

// Get organisations by type (convenience endpoint) — must be before /:id to avoid conflict
organisationRouter.get('/type/:type', async (req: Request, res: Response) => {
  try {
    const result = await organisations.list({ type: req.params.type, status: 'active' });
    res.json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// List organisations with filtering
organisationRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { type, status, parentId } = req.query;

    const result = await organisations.list({
      type: type as string | undefined,
      status: status as string | undefined,
      parentId: parentId as string | undefined,
    });

    res.json({ success: true, data: result.data, meta: { totalCount: result.total } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Get single organisation with children
organisationRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const org = await organisations.findById(id);

    if (!org) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organisation not found' } });
      return;
    }

    const children = await organisations.getChildren(id);
    res.json({ success: true, data: { ...org, children } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Get organisation hierarchy (tree view)
organisationRouter.get('/:id/hierarchy', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const org = await organisations.findById(id);

    if (!org) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organisation not found' } });
      return;
    }

    // Recurses one level per generation, fanning out across siblings at each. The
    // map callback must return the promise for Promise.all to await it — mapping to
    // a bare buildTree() call would put unresolved promises in the response body.
    async function buildTree(parentId: string): Promise<any[]> {
      const children = await organisations.getChildren(parentId);
      return Promise.all(children.map(async child => ({
        ...child,
        children: await buildTree(child.id),
      })));
    }

    const tree = { ...org, children: await buildTree(id) };
    res.json({ success: true, data: tree });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Create organisation
organisationRouter.post('/', requirePermission('organisations.admin'), async (req: Request, res: Response) => {
  try {
    const { name, type, parentId, registrationNumber, contactEmail, contactPhone, addressLine1, addressCity, addressPostcode, metadata } = req.body;

    const org = await organisations.create({
      name,
      type,
      parentId,
      registrationNumber,
      contactEmail,
      contactPhone,
      addressLine1,
      addressCity,
      addressPostcode,
      metadata,
    });

    res.status(201).json({ success: true, data: org });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Update organisation
organisationRouter.put('/:id', requirePermission('organisations.admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await organisations.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organisation not found' } });
      return;
    }

    const { name, status, contactEmail, contactPhone, addressLine1, addressCity, addressPostcode, metadata } = req.body;

    const updated = await organisations.update(id, {
      name,
      status,
      contactEmail,
      contactPhone,
      addressLine1,
      addressCity,
      addressPostcode,
      metadata,
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});
