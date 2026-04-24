import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './token';

declare global {
    namespace Express {
        interface Request {
            user?: { userId: number };
        }
    }
}

export function authenticateRequest(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or malformed Authorization header' });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const payload = verifyAccessToken(token);
        req.user = { userId: payload.userId };
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired access token' });
    }
}
