import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './src/db/index.ts';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

console.log('Running migrations...');
try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations done.');
} catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Tables already exist from a prior drizzle-kit push — safe to continue
    if (msg.includes('already exists')) {
        console.warn('Skipping migrations — schema already applied.');
    } else {
        throw e;
    }
}

const { Server } = await import('./src/controllers/server.ts');
const server = new Server();
server.listen();
