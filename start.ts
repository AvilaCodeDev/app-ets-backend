import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './src/db/index.ts';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

console.log('Running migrations...');
await migrate(db, { migrationsFolder: './drizzle' });
console.log('Migrations done.');

const { Server } = await import('./src/controllers/server.ts');
const server = new Server();
server.listen();
