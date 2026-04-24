import { Router } from 'express';
import { validateUser, issueTokens, rotateRefreshToken, revokeRefreshToken } from './service';

const authRouter = Router();

authRouter.post('/login', async (req, res) => {
    const { correo, pass } = req.body as { correo?: string; pass?: string };
    if (!correo || !pass) {
        res.status(400).json({ error: 'correo and pass are required' });
        return;
    }
    const user = await validateUser(correo, pass);
    if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    const tokens = await issueTokens(user.id);
    res.json(tokens);
});

authRouter.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
        res.status(400).json({ error: 'refreshToken is required' });
        return;
    }
    try {
        const tokens = await rotateRefreshToken(refreshToken);
        res.json(tokens);
    } catch {
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

authRouter.post('/logout', async (req, res) => {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken) await revokeRefreshToken(refreshToken);
    res.sendStatus(204);
});

export { authRouter };
