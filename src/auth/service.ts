import bcrypt from 'bcryptjs';
import { eq, and, lt } from 'drizzle-orm';
import { db } from '../db/index';
import { users, refreshTokens } from '../db/schema';
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    refreshTokenExpiresAt,
    type TokenPayload,
} from './token';

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export async function validateUser(
    correo: string,
    pass: string,
): Promise<typeof users.$inferSelect | null> {
    const [user] = await db.select().from(users).where(eq(users.correo, correo));
    if (!user) return null;
    const valid = await bcrypt.compare(pass, user.pass);
    return valid ? user : null;
}

export async function issueTokens(userId: number): Promise<TokenPair> {
    const payload: TokenPayload = { userId };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await db.insert(refreshTokens).values({
        token: refreshToken,
        userId,
        expiresAt: refreshTokenExpiresAt(),
    });
    return { accessToken, refreshToken };
}

export async function rotateRefreshToken(oldToken: string): Promise<TokenPair> {
    const payload = verifyRefreshToken(oldToken);
    const now = new Date();

    const [stored] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, oldToken));

    if (!stored || stored.expiresAt < now) {
        if (stored) {
            await db.delete(refreshTokens).where(eq(refreshTokens.token, oldToken));
        }
        throw new Error('INVALID_REFRESH_TOKEN');
    }

    const newRefreshToken = signRefreshToken({ userId: payload.userId });
    const newAccessToken = signAccessToken({ userId: payload.userId });

    await db.transaction(async (tx) => {
        await tx.delete(refreshTokens).where(eq(refreshTokens.token, oldToken));
        await tx.insert(refreshTokens).values({
            token: newRefreshToken,
            userId: payload.userId,
            expiresAt: refreshTokenExpiresAt(),
        });
    });

    // Lazy cleanup: purge other expired tokens for this user
    await db
        .delete(refreshTokens)
        .where(and(eq(refreshTokens.userId, payload.userId), lt(refreshTokens.expiresAt, now)));

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function revokeRefreshToken(token: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
}
