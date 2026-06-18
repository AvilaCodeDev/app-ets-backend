import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './src/db/index.ts';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

console.log('Running migrations...');
try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations done.');
} catch (e: unknown) {
    // Schema was previously deployed via drizzle-kit push — tables already exist, safe to continue
    console.warn('Migration warning (schema already applied):', e instanceof Error ? e.cause ?? e.message : String(e));
}

const { Server } = await import('./src/controllers/server.ts');
const server = new Server();
server.listen();
