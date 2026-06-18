import type { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';

export async function requireTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const [user] = await db
        .select({ usuarioRol: users.usuarioRol })
        .from(users)
        .where(eq(users.id, req.user.userId));
    if (!user || user.usuarioRol !== 2) {
        res.status(403).json({ error: 'Teacher access required' });
        return;
    }
    next();
}
