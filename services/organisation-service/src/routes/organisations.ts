import { Router, Request, Response } from 'express';
import { organisations } from '../db';

export const organisationRouter = Router();

// Get organisations by type (convenience endpoint) — must be before /:id to avoid conflict
organisationRouter.get('/type/:type', (req: Request, res: Response) => {
  try {
    const result = organisations.list({ type: req.params.type, status: 'active' });
    res.json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// List organisations with filtering
organisationRouter.get('/', (req: Request, res: Response) => {
  try {
    const { type, status, parentId } = req.query;

    const result = organisations.list({
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
organisationRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const org = organisations.findById(id);

    if (!org) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organisation not found' } });
      return;
    }

    const children = organisations.getChildren(id);
    res.json({ success: true, data: { ...org, children } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Get organisation hierarchy (tree view)
organisationRouter.get('/:id/hierarchy', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const org = organisations.findById(id);

    if (!org) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organisation not found' } });
      return;
    }

    function buildTree(parentId: string): any[] {
      const children = organisations.getChildren(parentId);
      return children.map(child => ({
        ...child,
        children: buildTree(child.id),
      }));
    }

    const tree = { ...org, children: buildTree(id) };
    res.json({ success: true, data: tree });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Create organisation
organisationRouter.post('/', (req: Request, res: Response) => {
  try {
    const { name, type, parentId, registrationNumber, contactEmail, contactPhone, addressLine1, addressCity, addressPostcode, metadata } = req.body;

    const org = organisations.create({
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
organisationRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = organisations.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organisation not found' } });
      return;
    }

    const { name, status, contactEmail, contactPhone, addressLine1, addressCity, addressPostcode, metadata } = req.body;

    const updated = organisations.update(id, {
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
