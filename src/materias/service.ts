import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { materias, carreras, areas } from '../db/schema.ts';

export type MateriaRow = typeof materias.$inferSelect;
export type MateriaWithRefs = MateriaRow & { carreraNombre: string; areaNombre: string };

export async function listMaterias(): Promise<MateriaWithRefs[]> {
    return db
        .select({
            id: materias.id,
            nombre: materias.nombre,
            semestre: materias.semestre,
            carreraId: materias.carreraId,
            carreraNombre: carreras.nombre,
            areaId: materias.areaId,
            areaNombre: areas.nombre,
        })
        .from(materias)
        .innerJoin(carreras, eq(materias.carreraId, carreras.id))
        .innerJoin(areas, eq(materias.areaId, areas.id));
}

export async function getMateriaById(id: number): Promise<MateriaWithRefs | null> {
    const [row] = await db
        .select({
            id: materias.id,
            nombre: materias.nombre,
            semestre: materias.semestre,
            carreraId: materias.carreraId,
            carreraNombre: carreras.nombre,
            areaId: materias.areaId,
            areaNombre: areas.nombre,
        })
        .from(materias)
        .innerJoin(carreras, eq(materias.carreraId, carreras.id))
        .innerJoin(areas, eq(materias.areaId, areas.id))
        .where(eq(materias.id, id));
    return row ?? null;
}

export async function createMateria(input: {
    nombre: string;
    semestre: number;
    carreraId: number;
    areaId: number;
}): Promise<MateriaRow> {
    const [created] = await db.insert(materias).values(input).returning();
    if (!created) throw new Error('Insert did not return a row');
    return created;
}

export async function updateMateria(
    id: number,
    input: Partial<{ nombre: string; semestre: number; carreraId: number; areaId: number }>,
): Promise<MateriaRow | null> {
    const [updated] = await db.update(materias).set(input).where(eq(materias.id, id)).returning();
    return updated ?? null;
}

export async function deleteMateria(id: number): Promise<boolean> {
    try {
        const [deleted] = await db
            .delete(materias)
            .where(eq(materias.id, id))
            .returning({ id: materias.id });
        return !!deleted;
    } catch (err: unknown) {
        if ((err as Record<string, unknown>)?.code === '23503') {
            throw new Error('FK_VIOLATION');
        }
        throw err;
    }
}
