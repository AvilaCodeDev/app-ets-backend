import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

export interface TokenPayload {
    userId: number;
}

export function signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
}

export function signRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof payload === 'string' || typeof payload.userId !== 'number') {
        throw new Error('Invalid token payload');
    }
    return { userId: payload.userId };
}

export function verifyRefreshToken(token: string): TokenPayload {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    if (typeof payload === 'string' || typeof payload.userId !== 'number') {
        throw new Error('Invalid token payload');
    }
    return { userId: payload.userId };
}

export function refreshTokenExpiresAt(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}
