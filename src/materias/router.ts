import { Router } from 'express';
import { authenticateRequest } from '../auth/middleware.ts';
import { requireAdmin } from '../auth/admin_middleware.ts';
import {
    listMaterias,
    getMateriaById,
    createMateria,
    updateMateria,
    deleteMateria,
} from './service.ts';

const materiasRouter = Router();

materiasRouter.get('/', async (_req, res) => {
    const data = await listMaterias();
    res.json(data);
});

materiasRouter.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const row = await getMateriaById(id);
    if (!row) {
        res.status(404).json({ error: 'Materia not found' });
        return;
    }
    res.json(row);
});

materiasRouter.post('/', authenticateRequest, requireAdmin, async (req, res) => {
    const { nombre, semestre, carreraId, areaId } = req.body as {
        nombre?: string;
        semestre?: number;
        carreraId?: number;
        areaId?: number;
    };
    if (!nombre || semestre == null || carreraId == null || areaId == null) {
        res.status(400).json({ error: 'nombre, semestre, carreraId and areaId are required' });
        return;
    }
    const created = await createMateria({ nombre, semestre: Number(semestre), carreraId: Number(carreraId), areaId: Number(areaId) });
    res.status(201).json(created);
});

materiasRouter.put('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const { nombre, semestre, carreraId, areaId } = req.body as {
        nombre?: string;
        semestre?: number;
        carreraId?: number;
        areaId?: number;
    };
    const input: Partial<{ nombre: string; semestre: number; carreraId: number; areaId: number }> = {};
    if (nombre !== undefined) input.nombre = nombre;
    if (semestre !== undefined) input.semestre = Number(semestre);
    if (carreraId !== undefined) input.carreraId = Number(carreraId);
    if (areaId !== undefined) input.areaId = Number(areaId);
    const updated = await updateMateria(id, input);
    if (!updated) {
        res.status(404).json({ error: 'Materia not found' });
        return;
    }
    res.json(updated);
});

materiasRouter.delete('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    try {
        const deleted = await deleteMateria(id);
        if (!deleted) {
            res.status(404).json({ error: 'Materia not found' });
            return;
        }
        res.sendStatus(204);
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'FK_VIOLATION') {
            res.status(409).json({ error: 'Materia is referenced by existing records' });
            return;
        }
        throw err;
    }
});

export { materiasRouter };
