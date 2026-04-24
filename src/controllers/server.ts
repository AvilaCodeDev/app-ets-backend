import express from 'express';
import cors from 'cors';
import { createServer, Server as HttpServer } from 'http';

interface Server{
    app: express.Application
    port: number
    server: HttpServer
    apiPaht: String
}

class Server {
    constructor(){
        this.app = express();
        this.port = 3000;
        this.server = createServer( this.app );
        this.apiPaht = '/api';

        this.middlewares();
        this.routes();
    }

    middlewares(){
        this.app.use(cors());
        this.app.use( express.json());
    }

    routes(){
        
    }

    listen(){
        this.server.listen( this.port, () => {
            console.log(`Server running on port: ${this.port}`);
        })
    }
}

export { Server };