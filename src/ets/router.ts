import { Router } from 'express';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import multer from 'multer';
import path from 'path';
import { authenticateRequest } from '../auth/middleware.ts';
import { requireAdmin } from '../auth/admin_middleware.ts';
import { requireTeacher } from '../auth/teacher_middleware.ts';
import {
    listEts, getEtsById, createEts, updateEts, deleteEts,
    listAssignedEts,
    listComments, createComment, updateComment, deleteComment,
    listGuides, createGuide, deleteGuide,
} from './service.ts';

const etsRouter = Router();

// ─── File upload setup ────────────────────────────────────────────────────────

const uploadDir = path.resolve('uploads/guides');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// ─── Public ETS list ──────────────────────────────────────────────────────────

etsRouter.get('/', async (req, res) => {
    const { carrera_id, area_id, turno } = req.query as { carrera_id?: string; area_id?: string; turno?: string };
    const filters: Parameters<typeof listEts>[0] = {};
    if (carrera_id) filters.carreraId = Number(carrera_id);
    if (area_id) filters.areaId = Number(area_id);
    if (turno === 'MATUTINO' || turno === 'VESPERTINO') filters.turno = turno;
    const data = await listEts(filters);
    res.json(data);
});

// ─── Teacher: assigned ETS ────────────────────────────────────────────────────

etsRouter.get('/assigned', authenticateRequest, requireTeacher, async (req, res) => {
    const data = await listAssignedEts(req.user!.userId);
    res.json(data);
});

// ─── Public ETS by id ─────────────────────────────────────────────────────────

etsRouter.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const row = await getEtsById(id);
    if (!row) {
        res.status(404).json({ error: 'ETS not found' });
        return;
    }
    res.json(row);
});

// ─── Admin: create ETS ────────────────────────────────────────────────────────

etsRouter.post('/', authenticateRequest, requireAdmin, async (req, res) => {
    const { materiaId, fecha, turno, salonId, profesorId } = req.body as {
        materiaId?: number; fecha?: string; turno?: string;
        salonId?: number; profesorId?: number | null;
    };
    if (!materiaId || !fecha || !turno || !salonId) {
        res.status(400).json({ error: 'materiaId, fecha, turno and salonId are required' });
        return;
    }
    if (turno !== 'MATUTINO' && turno !== 'VESPERTINO') {
        res.status(400).json({ error: 'turno must be MATUTINO or VESPERTINO' });
        return;
    }
    try {
        const created = await createEts({ materiaId: Number(materiaId), fecha, turno, salonId: Number(salonId), profesorId: profesorId ?? null });
        res.status(201).json(created);
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'TEACHER_MISMATCH') {
            res.status(422).json({ error: 'El maestro no pertenece a la misma carrera/área que la materia' });
            return;
        }
        throw err;
    }
});

// ─── Admin: update ETS ────────────────────────────────────────────────────────

etsRouter.put('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const { materiaId, fecha, turno, salonId, profesorId } = req.body as {
        materiaId?: number; fecha?: string; turno?: string;
        salonId?: number; profesorId?: number | null;
    };
    if (turno !== undefined && turno !== 'MATUTINO' && turno !== 'VESPERTINO') {
        res.status(400).json({ error: 'turno must be MATUTINO or VESPERTINO' });
        return;
    }
    const input: Parameters<typeof updateEts>[1] = {};
    if (materiaId !== undefined) input.materiaId = Number(materiaId);
    if (fecha !== undefined) input.fecha = fecha;
    if (turno !== undefined) input.turno = turno as 'MATUTINO' | 'VESPERTINO';
    if (salonId !== undefined) input.salonId = Number(salonId);
    if ('profesorId' in req.body) input.profesorId = profesorId ?? null;
    try {
        const updated = await updateEts(id, input);
        if (!updated) { res.status(404).json({ error: 'ETS not found' }); return; }
        res.json(updated);
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'TEACHER_MISMATCH') {
            res.status(422).json({ error: 'El maestro no pertenece a la misma carrera/área que la materia' });
            return;
        }
        throw err;
    }
});

// ─── Admin: delete ETS ────────────────────────────────────────────────────────

etsRouter.delete('/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: 'Invalid id' }); return; }
    try {
        const deleted = await deleteEts(id);
        if (!deleted) { res.status(404).json({ error: 'ETS not found' }); return; }
        res.sendStatus(204);
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'FK_VIOLATION') {
            res.status(409).json({ error: 'ETS is referenced by existing records' });
            return;
        }
        throw err;
    }
});

// ─── Comments ─────────────────────────────────────────────────────────────────

etsRouter.get('/:id/comments', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: 'Invalid id' }); return; }
    const data = await listComments(id);
    res.json(data);
});

etsRouter.post('/:id/comments', authenticateRequest, requireTeacher, async (req, res) => {
    const etsId = Number(req.params.id);
    if (!Number.isInteger(etsId) || etsId < 1) { res.status(400).json({ error: 'Invalid id' }); return; }
    const { texto } = req.body as { texto?: string };
    if (!texto?.trim()) { res.status(400).json({ error: 'texto is required' }); return; }
    const created = await createComment(etsId, req.user!.userId, texto.trim());
    res.status(201).json(created);
});

etsRouter.put('/:id/comments/:cid', authenticateRequest, requireTeacher, async (req, res) => {
    const cid = Number(req.params.cid);
    const { texto } = req.body as { texto?: string };
    if (!texto?.trim()) { res.status(400).json({ error: 'texto is required' }); return; }
    try {
        const updated = await updateComment(cid, req.user!.userId, texto.trim());
        if (!updated) { res.status(404).json({ error: 'Comment not found' }); return; }
        res.json(updated);
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'FORBIDDEN') {
            res.status(403).json({ error: 'Not your comment' }); return;
        }
        throw err;
    }
});

etsRouter.delete('/:id/comments/:cid', authenticateRequest, requireTeacher, async (req, res) => {
    const cid = Number(req.params.cid);
    try {
        const deleted = await deleteComment(cid, req.user!.userId);
        if (!deleted) { res.status(404).json({ error: 'Comment not found' }); return; }
        res.sendStatus(204);
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'FORBIDDEN') {
            res.status(403).json({ error: 'Not your comment' }); return;
        }
        throw err;
    }
});

// ─── Guides ───────────────────────────────────────────────────────────────────

etsRouter.get('/:id/guides', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: 'Invalid id' }); return; }
    const guides = await listGuides(id);
    const withUrls = guides.map((g) => ({
        ...g,
        downloadUrl: `/api/ets/${id}/guides/${g.id}/download`,
    }));
    res.json(withUrls);
});

etsRouter.post('/:id/guides', authenticateRequest, requireTeacher, upload.single('file'), async (req, res) => {
    const etsId = Number(req.params.id);
    if (!Number.isInteger(etsId) || etsId < 1) { res.status(400).json({ error: 'Invalid id' }); return; }
    if (!req.file) { res.status(400).json({ error: 'file is required' }); return; }
    const { titulo } = req.body as { titulo?: string };
    if (!titulo?.trim()) { res.status(400).json({ error: 'titulo is required' }); return; }
    const guide = await createGuide(etsId, req.user!.userId, titulo.trim(), req.file.path);
    res.status(201).json({ ...guide, downloadUrl: `/api/ets/${etsId}/guides/${guide.id}/download` });
});

etsRouter.get('/:id/guides/:gid/download', async (req, res) => {
    const gid = Number(req.params.gid);
    if (!Number.isInteger(gid) || gid < 1) { res.status(400).json({ error: 'Invalid id' }); return; }
    const [guide] = await listGuides(Number(req.params.id));
    const all = await listGuides(Number(req.params.id));
    const target = all.find((g) => g.id === gid);
    if (!target || !existsSync(target.filePath)) {
        res.status(404).json({ error: 'Guide not found' }); return;
    }
    res.download(target.filePath, path.basename(target.filePath));
});

etsRouter.delete('/:id/guides/:gid', authenticateRequest, requireTeacher, async (req, res) => {
    const gid = Number(req.params.gid);
    try {
        const result = await deleteGuide(gid, req.user!.userId);
        if (!result) { res.status(404).json({ error: 'Guide not found' }); return; }
        if (existsSync(result.filePath)) unlinkSync(result.filePath);
        res.sendStatus(204);
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'FORBIDDEN') {
            res.status(403).json({ error: 'Not your guide' }); return;
        }
        throw err;
    }
});

export { etsRouter };
