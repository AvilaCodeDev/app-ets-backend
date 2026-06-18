
import dotenv from 'dotenv';

dotenv.config({ path: '.env', override: true });

const { Server } = await import('./src/controllers/server.ts');
const server = new Server();
server.listen();