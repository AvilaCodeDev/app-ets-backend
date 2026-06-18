import { Router } from 'express';
import { authenticateRequest } from '../auth/middleware.ts';
import { requireAdmin } from '../auth/admin_middleware.ts';
import {
    listCarreras,
    getCarreraById,
    createCarrera,
    updateCarrera,
    deleteCarrera,
} from './service.ts';

const carrerasRouter = Router();

carrerasRouter.get('/', async (_req, res) => {
    const data = await listCarreras();
    res.json(data);
});

carrerasRouter.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const row = await getCarreraById(id);
    if (!row) {
        res.status(404).json({ error: 'Carrera not found' });
        return;
    }
    res.json(row);
});

carrerasRouter.post('/', authenticateRequest, requireAdmin, async (req, res) => {
    const { nombre, codigo } = req.body as { nombre?: string; codigo?: string };
    if (!nombre || !codigo) {
        res.status(400).json({ error: 'nombre and codigo are required' });
        return;
    }
    const created = await createCarrera({ nombre, codigo });
    res.status(201).json(created);
});

carrerasRouter.put('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const body = req.body as { nombre?: string; codigo?: string };
    const updated = await updateCarrera(id, body);
    if (!updated) {
        res.status(404).json({ error: 'Carrera not found' });
        return;
    }
    res.json(updated);
});

carrerasRouter.delete('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    try {
        const deleted = await deleteCarrera(id);
        if (!deleted) {
            res.status(404).json({ error: 'Carrera not found' });
            return;
        }
        res.sendStatus(204);
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'FK_VIOLATION') {
            res.status(409).json({ error: 'Carrera is referenced by existing records' });
            return;
        }
        throw err;
    }
});

export { carrerasRouter };
