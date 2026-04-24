import { Router } from 'express';
import { authenticateRequest } from '../auth/middleware.ts';
import {
    listUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from './service.ts';

const usersRouter = Router();

usersRouter.use(authenticateRequest);

usersRouter.get('/', async (_req, res) => {
    const data = await listUsers();
    res.json(data);
});

usersRouter.get('/:id', async (req, res) => {
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

usersRouter.post('/', async (req, res) => {
    const { nombre, apPaterno, apMaterno, correo, pass, usuarioRol } =
        req.body as {
            nombre?: string;
            apPaterno?: string;
            apMaterno?: string;
            correo?: string;
            pass?: string;
            usuarioRol?: number;
        };
    if (!nombre || !apPaterno || !apMaterno || !correo || !pass) {
        res.status(400).json({
            error: 'nombre, apPaterno, apMaterno, correo, and pass are required',
        });
        return;
    }
    try {
        const user = await createUser({ nombre, apPaterno, apMaterno, correo, pass, usuarioRol });
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

usersRouter.put('/:id', async (req, res) => {
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
    };
    const user = await updateUser(id, body);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.json(user);
});

usersRouter.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const deleted = await deleteUser(id);
    if (!deleted) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.sendStatus(204);
});

export { usersRouter };
