import { Router, Request, Response } from 'express';
import { users } from '../db';

export const usersRouter = Router();

// List users with filtering
usersRouter.get('/', (req: Request, res: Response) => {
  try {
    const { role, organisationId, status } = req.query;

    const result = users.list({
      role: role as string | undefined,
      organisationId: organisationId as string | undefined,
      status: status as string | undefined,
    });

    res.json({ success: true, data: result.data, meta: { totalCount: result.total } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Get user by ID
usersRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const userWithRole = users.findByIdWithRole(req.params.id);

    if (!userWithRole) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    // Get permissions
    const permissions = users.getPermissionsForRole(userWithRole.roleId);

    res.json({ success: true, data: { ...userWithRole, permissions } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Create user
usersRouter.post('/', (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, roleId, organisationId } = req.body;

    const user = users.create({
      email,
      firstName,
      lastName,
      roleId,
      organisationId,
    });

    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Email already exists' } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  }
});

// Update user
usersRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = users.findById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const { firstName, lastName, roleId, organisationId, status } = req.body;

    const updated = users.update(id, {
      firstName,
      lastName,
      displayName: firstName && lastName ? `${firstName} ${lastName}` : undefined,
      roleId,
      organisationId,
      status,
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Deactivate user
usersRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const existing = users.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    users.update(req.params.id, { status: 'deactivated' });
    res.json({ success: true, data: { deactivated: true } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});
