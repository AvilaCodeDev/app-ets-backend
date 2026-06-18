import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { areas } from '../db/schema.ts';

export type AreaRow = typeof areas.$inferSelect;

export async function listAreas(): Promise<AreaRow[]> {
    return db.select().from(areas);
}

export async function getAreaById(id: number): Promise<AreaRow | null> {
    const [row] = await db.select().from(areas).where(eq(areas.id, id));
    return row ?? null;
}

export async function createArea(input: { nombre: string }): Promise<AreaRow> {
    const [created] = await db.insert(areas).values(input).returning();
    if (!created) throw new Error('Insert did not return a row');
    return created;
}

export async function updateArea(
    id: number,
    input: Partial<{ nombre: string }>,
): Promise<AreaRow | null> {
    const [updated] = await db.update(areas).set(input).where(eq(areas.id, id)).returning();
    return updated ?? null;
}

export async function deleteArea(id: number): Promise<boolean> {
    try {
        const [deleted] = await db
            .delete(areas)
            .where(eq(areas.id, id))
            .returning({ id: areas.id });
        return !!deleted;
    } catch (err: unknown) {
        if ((err as Record<string, unknown>)?.code === '23503') {
            throw new Error('FK_VIOLATION');
        }
        throw err;
    }
}
