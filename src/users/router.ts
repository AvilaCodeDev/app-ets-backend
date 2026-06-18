import { Router } from 'express';
import { authenticateRequest } from '../auth/middleware.ts';
import { requireAdmin } from '../auth/admin_middleware.ts';
import {
    listUsers,
    listTeachers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from './service.ts';

const usersRouter = Router();

usersRouter.get('/', authenticateRequest, requireAdmin, async (_req, res) => {
    const data = await listUsers();
    res.json(data);
});

// Must come before /:id to avoid Express treating "teachers" as an id param
usersRouter.get('/teachers', authenticateRequest, requireAdmin, async (_req, res) => {
    const data = await listTeachers();
    res.json(data);
});

usersRouter.get('/:id', authenticateRequest, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const user = await getUserById(id);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.json(user);
});

usersRouter.post('/', authenticateRequest, requireAdmin, async (req, res) => {
    const { nombre, apPaterno, apMaterno, correo, pass, usuarioRol, carreraId, areaId } =
        req.body as {
            nombre?: string;
            apPaterno?: string;
            apMaterno?: string;
            correo?: string;
            pass?: string;
            usuarioRol?: number;
            carreraId?: number;
            areaId?: number;
        };
    if (!nombre || !apPaterno || !apMaterno || !correo || !pass) {
        res.status(400).json({
            error: 'nombre, apPaterno, apMaterno, correo, and pass are required',
        });
        return;
    }
    try {
        const user = await createUser({
            nombre,
            apPaterno,
            apMaterno,
            correo,
            pass,
            usuarioRol,
            carreraId,
            areaId,
        });
        res.status(201).json(user);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('unique') || msg.includes('duplicate')) {
            res.status(409).json({ error: 'correo already in use' });
            return;
        }
        throw err;
    }
});

usersRouter.put('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const body = req.body as {
        nombre?: string;
        apPaterno?: string;
        apMaterno?: string;
        correo?: string;
        pass?: string;
        usuarioRol?: number;
        carreraId?: number | null;
        areaId?: number | null;
    };
    try {
        const user = await updateUser(id, body);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('unique') || msg.includes('duplicate')) {
            res.status(409).json({ error: 'correo already in use' });
            return;
        }
        throw err;
    }
});

usersRouter.delete('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    try {
        const deleted = await deleteUser(id);
        if (!deleted) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.sendStatus(204);
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'FK_VIOLATION') {
            res.status(409).json({ error: 'User is referenced by existing records' });
            return;
        }
        throw err;
    }
});

export { usersRouter };
