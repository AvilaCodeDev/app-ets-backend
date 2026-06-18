import { Router } from 'express';
import { authenticateRequest } from '../auth/middleware.ts';
import { requireAdmin } from '../auth/admin_middleware.ts';
import {
    listEdificios,
    getEdificioById,
    createEdificio,
    updateEdificio,
    deleteEdificio,
} from './service.ts';

const edificiosRouter = Router();

edificiosRouter.get('/', async (_req, res) => {
    const data = await listEdificios();
    res.json(data);
});

edificiosRouter.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const row = await getEdificioById(id);
    if (!row) {
        res.status(404).json({ error: 'Edificio not found' });
        return;
    }
    res.json(row);
});

edificiosRouter.post('/', authenticateRequest, requireAdmin, async (req, res) => {
    const { nombre, direccion } = req.body as { nombre?: string; direccion?: string };
    if (!nombre || !direccion) {
        res.status(400).json({ error: 'nombre and direccion are required' });
        return;
    }
    const created = await createEdificio({ nombre, direccion });
    res.status(201).json(created);
});

edificiosRouter.put('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const body = req.body as { nombre?: string; direccion?: string };
    const updated = await updateEdificio(id, body);
    if (!updated) {
        res.status(404).json({ error: 'Edificio not found' });
        return;
    }
    res.json(updated);
});

edificiosRouter.delete('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    try {
        const deleted = await deleteEdificio(id);
        if (!deleted) {
            res.status(404).json({ error: 'Edificio not found' });
            return;
        }
        res.sendStatus(204);
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'FK_VIOLATION') {
            res.status(409).json({ error: 'Edificio has associated salones' });
            return;
        }
        throw err;
    }
});

export { edificiosRouter };
