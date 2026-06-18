import { Router } from 'express';
import { authenticateRequest } from '../auth/middleware.ts';
import { requireAdmin } from '../auth/admin_middleware.ts';
import {
    listSalones,
    getSalonById,
    createSalon,
    updateSalon,
    deleteSalon,
} from './service.ts';

const salonesRouter = Router();

salonesRouter.get('/', async (req, res) => {
    const edificioId = req.query.edificio_id ? Number(req.query.edificio_id) : undefined;
    const data = await listSalones(edificioId);
    res.json(data);
});

salonesRouter.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const row = await getSalonById(id);
    if (!row) {
        res.status(404).json({ error: 'Salon not found' });
        return;
    }
    res.json(row);
});

salonesRouter.post('/', authenticateRequest, requireAdmin, async (req, res) => {
    const { nombre, edificioId } = req.body as { nombre?: string; edificioId?: number };
    if (!nombre || !edificioId) {
        res.status(400).json({ error: 'nombre and edificioId are required' });
        return;
    }
    try {
        const created = await createSalon({ nombre, edificioId });
        res.status(201).json(created);
    } catch (err: unknown) {
        if ((err as Record<string, unknown>)?.code === '23503') {
            res.status(400).json({ error: 'Invalid edificioId' });
            return;
        }
        throw err;
    }
});

salonesRouter.put('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const body = req.body as { nombre?: string; edificioId?: number };
    const updated = await updateSalon(id, body);
    if (!updated) {
        res.status(404).json({ error: 'Salon not found' });
        return;
    }
    res.json(updated);
});

salonesRouter.delete('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    try {
        const deleted = await deleteSalon(id);
        if (!deleted) {
            res.status(404).json({ error: 'Salon not found' });
            return;
        }
        res.sendStatus(204);
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'FK_VIOLATION') {
            res.status(409).json({ error: 'Salon is used by existing ETS' });
            return;
        }
        throw err;
    }
});

export { salonesRouter };
