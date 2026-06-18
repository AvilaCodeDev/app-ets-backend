import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { edificios } from '../db/schema.ts';

export type EdificioRow = typeof edificios.$inferSelect;

export async function listEdificios(): Promise<EdificioRow[]> {
    return db.select().from(edificios);
}

export async function getEdificioById(id: number): Promise<EdificioRow | null> {
    const [row] = await db.select().from(edificios).where(eq(edificios.id, id));
    return row ?? null;
}

export async function createEdificio(input: { nombre: string; direccion: string }): Promise<EdificioRow> {
    const [created] = await db.insert(edificios).values(input).returning();
    if (!created) throw new Error('Insert did not return a row');
    return created;
}

export async function updateEdificio(
    id: number,
    input: Partial<{ nombre: string; direccion: string }>,
): Promise<EdificioRow | null> {
    const [updated] = await db.update(edificios).set(input).where(eq(edificios.id, id)).returning();
    return updated ?? null;
}

export async function deleteEdificio(id: number): Promise<boolean> {
    try {
        const [deleted] = await db
            .delete(edificios)
            .where(eq(edificios.id, id))
            .returning({ id: edificios.id });
        return !!deleted;
    } catch (err: unknown) {
        if ((err as Record<string, unknown>)?.code === '23503') {
            throw new Error('FK_VIOLATION');
        }
        throw err;
    }
}
