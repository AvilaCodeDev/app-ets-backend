import jwt from 'jsonwebtoken';

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
    if (typeof payload === 'string') throw new Error('Invalid token payload');
    return payload as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    if (typeof payload === 'string') throw new Error('Invalid token payload');
    return payload as TokenPayload;
}

export function refreshTokenExpiresAt(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
}
