import { Router } from 'express';
import { authenticateRequest } from '../auth/middleware.ts';
import { requireAdmin } from '../auth/admin_middleware.ts';
import { getDashboardStats } from './service.ts';

const statsRouter = Router();

statsRouter.get('/dashboard', authenticateRequest, requireAdmin, async (_req, res) => {
    const stats = await getDashboardStats();
    res.json(stats);
});

export { statsRouter };
