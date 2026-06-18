import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { carreras } from '../db/schema.ts';

export type CarreraRow = typeof carreras.$inferSelect;

export async function listCarreras(): Promise<CarreraRow[]> {
    return db.select().from(carreras);
}

export async function getCarreraById(id: number): Promise<CarreraRow | null> {
    const [row] = await db.select().from(carreras).where(eq(carreras.id, id));
    return row ?? null;
}

export async function createCarrera(input: { nombre: string; codigo: string }): Promise<CarreraRow> {
    const [created] = await db.insert(carreras).values(input).returning();
    if (!created) throw new Error('Insert did not return a row');
    return created;
}

export async function updateCarrera(
    id: number,
    input: Partial<{ nombre: string; codigo: string }>,
): Promise<CarreraRow | null> {
    const [updated] = await db.update(carreras).set(input).where(eq(carreras.id, id)).returning();
    return updated ?? null;
}

export async function deleteCarrera(id: number): Promise<boolean> {
    try {
        const [deleted] = await db
            .delete(carreras)
            .where(eq(carreras.id, id))
            .returning({ id: carreras.id });
        return !!deleted;
    } catch (err: unknown) {
        if ((err as Record<string, unknown>)?.code === '23503') {
            throw new Error('FK_VIOLATION');
        }
        throw err;
    }
}
