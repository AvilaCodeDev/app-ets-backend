import bcrypt from 'bcryptjs';
import { eq, and, lt, gt } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users, refreshTokens } from '../db/schema.ts';
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    refreshTokenExpiresAt,
    hashToken,
    type TokenPayload,
} from './token.ts';

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export async function validateUser(
    correo: string,
    pass: string,
): Promise<typeof users.$inferSelect | null> {
    try{
        const [user] = await db.select().from(users).where(eq(users.correo, correo));
        console.log(correo, pass);
        if (!user) return null;
        const valid = await bcrypt.compare(pass, user.pass);
        return valid ? user : null;
    }catch(e){
        console.log( e);
        return null;
    }
}

export async function issueTokens(userId: number): Promise<TokenPair> {
    const payload: TokenPayload = { userId };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await db.insert(refreshTokens).values({
        token: hashToken(refreshToken),
        userId,
        expiresAt: refreshTokenExpiresAt(),
    });
    return { accessToken, refreshToken };
}

export async function rotateRefreshToken(oldToken: string): Promise<TokenPair> {
    const payload = verifyRefreshToken(oldToken);
    const now = new Date();
    const hashedOld = hashToken(oldToken);

    // Atomically consume the old token — only one concurrent request can succeed
    const [deleted] = await db
        .delete(refreshTokens)
        .where(and(eq(refreshTokens.token, hashedOld), gt(refreshTokens.expiresAt, now)))
        .returning();

    if (!deleted) throw new Error('INVALID_REFRESH_TOKEN');

    const newRefreshToken = signRefreshToken({ userId: payload.userId });
    const newAccessToken = signAccessToken({ userId: payload.userId });

    await db.insert(refreshTokens).values({
        token: hashToken(newRefreshToken),
        userId: payload.userId,
        expiresAt: refreshTokenExpiresAt(),
    });

    // Lazy cleanup: purge other expired tokens for this user (now captured before delete above)
    await db
        .delete(refreshTokens)
        .where(and(eq(refreshTokens.userId, payload.userId), lt(refreshTokens.expiresAt, now)));

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function revokeRefreshToken(token: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, hashToken(token)));
}
