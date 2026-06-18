import { Router } from 'express';
import { authenticateRequest } from '../auth/middleware.ts';
import { requireAdmin } from '../auth/admin_middleware.ts';
import {
    listAreas,
    getAreaById,
    createArea,
    updateArea,
    deleteArea,
} from './service.ts';

const areasRouter = Router();

areasRouter.get('/', async (_req, res) => {
    const data = await listAreas();
    res.json(data);
});

areasRouter.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const row = await getAreaById(id);
    if (!row) {
        res.status(404).json({ error: 'Area not found' });
        return;
    }
    res.json(row);
});

areasRouter.post('/', authenticateRequest, requireAdmin, async (req, res) => {
    const { nombre } = req.body as { nombre?: string };
    if (!nombre) {
        res.status(400).json({ error: 'nombre is required' });
        return;
    }
    const created = await createArea({ nombre });
    res.status(201).json(created);
});

areasRouter.put('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const { nombre } = req.body as { nombre?: string };
    const updated = await updateArea(id, { nombre });
    if (!updated) {
        res.status(404).json({ error: 'Area not found' });
        return;
    }
    res.json(updated);
});

areasRouter.delete('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    try {
        const deleted = await deleteArea(id);
        if (!deleted) {
            res.status(404).json({ error: 'Area not found' });
            return;
        }
        res.sendStatus(204);
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'FK_VIOLATION') {
            res.status(409).json({ error: 'Area is referenced by existing records' });
            return;
        }
        throw err;
    }
});

export { areasRouter };
