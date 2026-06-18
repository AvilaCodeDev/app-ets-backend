
import dotenv from 'dotenv';
import { Server } from './src/controllers/server.ts';

dotenv.config({ path: '.env'});

const server = new Server();
server.listen();