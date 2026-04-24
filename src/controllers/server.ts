import express from 'express';
import cors from 'cors';
import { createServer, type Server as HttpServer } from 'http';
import { authRouter } from '../auth/router';

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
    }

    listen() {
        this.server.listen(this.port, () => {
            console.log(`Server running on port: ${this.port}`);
        });
    }
}

export { Server };
