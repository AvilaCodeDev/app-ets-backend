import express from 'express';
import cors from 'cors';
import { createServer, type Server as HttpServer } from 'http';
import { authRouter } from '../auth/router.ts';
import { usersRouter } from '../users/router.ts';
import { carrerasRouter } from '../carreras/router.ts';
import { areasRouter } from '../areas/router.ts';
import { edificiosRouter } from '../edificios/router.ts';
import { salonesRouter } from '../salones/router.ts';
import { materiasRouter } from '../materias/router.ts';
import { etsRouter } from '../ets/router.ts';
import { statsRouter } from '../stats/router.ts';

interface Server {
    app: express.Application;
    port: number;
    server: HttpServer;
    apiPath: string;
}

class Server {
    constructor() {
        this.validateEnv();
        this.app = express();
        this.port = 3000;
        this.server = createServer(this.app);
        this.apiPath = '/api';

        this.middlewares();
        this.routes();
    }

    private validateEnv() {
        for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL']) {
            if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
        }
    }

    middlewares() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    routes() {
        this.app.use(`${this.apiPath}/auth`, authRouter);
        this.app.use(`${this.apiPath}/users`, usersRouter);
        this.app.use(`${this.apiPath}/carreras`, carrerasRouter);
        this.app.use(`${this.apiPath}/areas`, areasRouter);
        this.app.use(`${this.apiPath}/edificios`, edificiosRouter);
        this.app.use(`${this.apiPath}/salones`, salonesRouter);
        this.app.use(`${this.apiPath}/materias`, materiasRouter);
        this.app.use(`${this.apiPath}/ets`, etsRouter);
        this.app.use(`${this.apiPath}/stats`, statsRouter);

        // Global error handler — returns full DB error details for debugging
        this.app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
            const e = err as Record<string, unknown>;
            const cause = e['cause'] as Record<string, unknown> | undefined;
            res.status(500).json({
                error: String(e['message'] ?? 'Internal server error'),
                code: e['code'] ?? cause?.['code'],
                severity: e['severity'] ?? cause?.['severity'],
                detail: e['detail'] ?? cause?.['detail'],
                routine: e['routine'] ?? cause?.['routine'],
                causeMessage: cause?.['message'],
                causeCode: cause?.['code'],
            });
        });
    }

    listen() {
        this.server.listen(this.port, () => {
            console.log(`Server running on port: ${this.port}`);
        });
    }
}

export { Server };
