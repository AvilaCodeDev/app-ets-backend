import { count, eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { ets, materias, carreras } from '../db/schema.ts';

export type DashboardStats = {
    totalEts: number;
    etsByCarrera: { carreraId: number; carreraNombre: string; total: number }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
    const [totalRow] = await db.select({ total: count() }).from(ets);
    const totalEts = totalRow?.total ?? 0;

    const byCarrera = await db
        .select({
            carreraId: materias.carreraId,
            carreraNombre: carreras.nombre,
            total: count(),
        })
        .from(ets)
        .innerJoin(materias, eq(ets.materiaId, materias.id))
        .innerJoin(carreras, eq(materias.carreraId, carreras.id))
        .groupBy(materias.carreraId, carreras.nombre);

    return {
        totalEts,
        etsByCarrera: byCarrera.map((r) => ({
            carreraId: r.carreraId,
            carreraNombre: r.carreraNombre,
            total: Number(r.total),
        })),
    };
}
