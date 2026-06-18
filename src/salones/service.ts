import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { salones, edificios } from '../db/schema.ts';

export type SalonRow = typeof salones.$inferSelect;
export type SalonWithEdificio = SalonRow & { edificioNombre: string };

export async function listSalones(edificioId?: number): Promise<SalonWithEdificio[]> {
    const rows = await db
        .select({
            id: salones.id,
            nombre: salones.nombre,
            edificioId: salones.edificioId,
            edificioNombre: edificios.nombre,
        })
        .from(salones)
        .innerJoin(edificios, eq(salones.edificioId, edificios.id))
        .where(edificioId ? eq(salones.edificioId, edificioId) : undefined);
    return rows.map(r => ({ ...r, edificioNombre: r.edificioNombre }));
}

export async function getSalonById(id: number): Promise<SalonWithEdificio | null> {
    const [row] = await db
        .select({
            id: salones.id,
            nombre: salones.nombre,
            edificioId: salones.edificioId,
            edificioNombre: edificios.nombre,
        })
        .from(salones)
        .innerJoin(edificios, eq(salones.edificioId, edificios.id))
        .where(eq(salones.id, id));
    return row ?? null;
}

export async function createSalon(input: { nombre: string; edificioId: number }): Promise<SalonRow> {
    const [created] = await db.insert(salones).values(input).returning();
    if (!created) throw new Error('Insert did not return a row');
    return created;
}

export async function updateSalon(
    id: number,
    input: Partial<{ nombre: string; edificioId: number }>,
): Promise<SalonRow | null> {
    const [updated] = await db.update(salones).set(input).where(eq(salones.id, id)).returning();
    return updated ?? null;
}

export async function deleteSalon(id: number): Promise<boolean> {
    try {
        const [deleted] = await db
            .delete(salones)
            .where(eq(salones.id, id))
            .returning({ id: salones.id });
        return !!deleted;
    } catch (err: unknown) {
        if ((err as Record<string, unknown>)?.code === '23503') {
            throw new Error('FK_VIOLATION');
        }
        throw err;
    }
}
