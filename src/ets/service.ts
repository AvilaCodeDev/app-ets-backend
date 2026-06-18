import { eq, and } from 'drizzle-orm';
// import { alias } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { ets, materias, salones, edificios, users, etsComments, etsGuides } from '../db/schema.ts';
import { alias } from 'drizzle-orm/pg-core';

export type EtsRow = typeof ets.$inferSelect;

const profesorAlias = alias(users, 'profesor');

export type EtsWithRefs = {
    id: number;
    materiaId: number;
    materiaNombre: string;
    carreraId: number;
    fecha: string;
    turno: 'MATUTINO' | 'VESPERTINO';
    salonId: number;
    salonNombre: string;
    edificioNombre: string;
    edificioDireccion: string;
    profesorId: number | null;
    profesorNombre: string | null;
    profesorApPaterno: string | null;
};

export async function listEts(filters?: {
    carreraId?: number;
    turno?: 'MATUTINO' | 'VESPERTINO';
}): Promise<EtsWithRefs[]> {
    const conditions = [];
    if (filters?.carreraId) conditions.push(eq(materias.carreraId, filters.carreraId));
    if (filters?.turno) conditions.push(eq(ets.turno, filters.turno));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return db
        .select({
            id: ets.id,
            materiaId: ets.materiaId,
            materiaNombre: materias.nombre,
            carreraId: materias.carreraId,
            fecha: ets.fecha,
            turno: ets.turno,
            salonId: ets.salonId,
            salonNombre: salones.nombre,
            edificioNombre: edificios.nombre,
            edificioDireccion: edificios.direccion,
            profesorId: ets.profesorId,
            profesorNombre: profesorAlias.nombre,
            profesorApPaterno: profesorAlias.apPaterno,
        })
        .from(ets)
        .innerJoin(materias, eq(ets.materiaId, materias.id))
        .innerJoin(salones, eq(ets.salonId, salones.id))
        .innerJoin(edificios, eq(salones.edificioId, edificios.id))
        .leftJoin(profesorAlias, eq(ets.profesorId, profesorAlias.id))
        .where(where) as unknown as Promise<EtsWithRefs[]>;
}

export async function getEtsById(id: number): Promise<EtsWithRefs | null> {
    const rows = await db
        .select({
            id: ets.id,
            materiaId: ets.materiaId,
            materiaNombre: materias.nombre,
            carreraId: materias.carreraId,
            fecha: ets.fecha,
            turno: ets.turno,
            salonId: ets.salonId,
            salonNombre: salones.nombre,
            edificioNombre: edificios.nombre,
            edificioDireccion: edificios.direccion,
            profesorId: ets.profesorId,
            profesorNombre: profesorAlias.nombre,
            profesorApPaterno: profesorAlias.apPaterno,
        })
        .from(ets)
        .innerJoin(materias, eq(ets.materiaId, materias.id))
        .innerJoin(salones, eq(ets.salonId, salones.id))
        .innerJoin(edificios, eq(salones.edificioId, edificios.id))
        .leftJoin(profesorAlias, eq(ets.profesorId, profesorAlias.id))
        .where(eq(ets.id, id));
    return (rows[0] ?? null) as EtsWithRefs | null;
}

async function validateTeacherAssignment(profesorId: number, materiaId: number): Promise<void> {
    const [teacher] = await db
        .select({ carreraId: users.carreraId, areaId: users.areaId })
        .from(users)
        .where(eq(users.id, profesorId));
    const [materia] = await db
        .select({ carreraId: materias.carreraId, areaId: materias.areaId })
        .from(materias)
        .where(eq(materias.id, materiaId));
    if (!teacher || !materia) throw new Error('NOT_FOUND');
    if (teacher.carreraId !== materia.carreraId || teacher.areaId !== materia.areaId) {
        throw new Error('TEACHER_MISMATCH');
    }
}

export async function createEts(input: {
    materiaId: number;
    fecha: string;
    turno: 'MATUTINO' | 'VESPERTINO';
    salonId: number;
    profesorId?: number | null;
}): Promise<EtsRow> {
    if (input.profesorId) {
        await validateTeacherAssignment(input.profesorId, input.materiaId);
    }
    const [created] = await db.insert(ets).values(input).returning();
    if (!created) throw new Error('Insert did not return a row');
    return created;
}

export async function updateEts(
    id: number,
    input: Partial<{
        materiaId: number;
        fecha: string;
        turno: 'MATUTINO' | 'VESPERTINO';
        salonId: number;
        profesorId: number | null;
    }>,
): Promise<EtsRow | null> {
    if (input.profesorId) {
        let materiaId = input.materiaId;
        if (materiaId == null) {
            const [current] = await db.select({ materiaId: ets.materiaId }).from(ets).where(eq(ets.id, id));
            if (!current) return null;
            materiaId = current.materiaId;
        }
        await validateTeacherAssignment(input.profesorId, materiaId);
    }
    const [updated] = await db.update(ets).set(input).where(eq(ets.id, id)).returning();
    return updated ?? null;
}

export async function deleteEts(id: number): Promise<boolean> {
    try {
        const [deleted] = await db
            .delete(ets)
            .where(eq(ets.id, id))
            .returning({ id: ets.id });
        return !!deleted;
    } catch (err: unknown) {
        if ((err as Record<string, unknown>)?.code === '23503') {
            throw new Error('FK_VIOLATION');
        }
        throw err;
    }
}

// ─── Assigned ETS for a teacher ───────────────────────────────────────────────

export async function listAssignedEts(profesorId: number): Promise<EtsWithRefs[]> {
    return db
        .select({
            id: ets.id,
            materiaId: ets.materiaId,
            materiaNombre: materias.nombre,
            carreraId: materias.carreraId,
            fecha: ets.fecha,
            turno: ets.turno,
            salonId: ets.salonId,
            salonNombre: salones.nombre,
            edificioNombre: edificios.nombre,
            edificioDireccion: edificios.direccion,
            profesorId: ets.profesorId,
            profesorNombre: profesorAlias.nombre,
            profesorApPaterno: profesorAlias.apPaterno,
        })
        .from(ets)
        .innerJoin(materias, eq(ets.materiaId, materias.id))
        .innerJoin(salones, eq(ets.salonId, salones.id))
        .innerJoin(edificios, eq(salones.edificioId, edificios.id))
        .leftJoin(profesorAlias, eq(ets.profesorId, profesorAlias.id))
        .where(eq(ets.profesorId, profesorId)) as unknown as Promise<EtsWithRefs[]>;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export type CommentWithProfesor = {
    id: number;
    etsId: number;
    profesorId: number;
    profesorNombre: string;
    texto: string;
    createdAt: Date;
};

export async function listComments(etsId: number): Promise<CommentWithProfesor[]> {
    const profe = alias(users, 'profe');
    return db
        .select({
            id: etsComments.id,
            etsId: etsComments.etsId,
            profesorId: etsComments.profesorId,
            profesorNombre: profe.nombre,
            texto: etsComments.texto,
            createdAt: etsComments.createdAt,
        })
        .from(etsComments)
        .innerJoin(profe, eq(etsComments.profesorId, profe.id))
        .where(eq(etsComments.etsId, etsId)) as unknown as Promise<CommentWithProfesor[]>;
}

export async function createComment(etsId: number, profesorId: number, texto: string): Promise<CommentWithProfesor> {
    const [created] = await db
        .insert(etsComments)
        .values({ etsId, profesorId, texto })
        .returning();
    if (!created) throw new Error('Insert did not return a row');
    const profe = alias(users, 'profe');
    const [full] = await db
        .select({ id: etsComments.id, etsId: etsComments.etsId, profesorId: etsComments.profesorId,
            profesorNombre: profe.nombre, texto: etsComments.texto, createdAt: etsComments.createdAt })
        .from(etsComments)
        .innerJoin(profe, eq(etsComments.profesorId, profe.id))
        .where(eq(etsComments.id, created.id));
    return full as unknown as CommentWithProfesor;
}

export async function updateComment(commentId: number, profesorId: number, texto: string): Promise<CommentWithProfesor | null> {
    const [existing] = await db.select({ profesorId: etsComments.profesorId })
        .from(etsComments).where(eq(etsComments.id, commentId));
    if (!existing) return null;
    if (existing.profesorId !== profesorId) throw new Error('FORBIDDEN');
    await db.update(etsComments).set({ texto }).where(eq(etsComments.id, commentId));
    const profe = alias(users, 'profe');
    const [full] = await db
        .select({ id: etsComments.id, etsId: etsComments.etsId, profesorId: etsComments.profesorId,
            profesorNombre: profe.nombre, texto: etsComments.texto, createdAt: etsComments.createdAt })
        .from(etsComments)
        .innerJoin(profe, eq(etsComments.profesorId, profe.id))
        .where(eq(etsComments.id, commentId));
    return full as unknown as CommentWithProfesor;
}

export async function deleteComment(commentId: number, profesorId: number): Promise<boolean> {
    const [existing] = await db.select({ profesorId: etsComments.profesorId })
        .from(etsComments).where(eq(etsComments.id, commentId));
    if (!existing) return false;
    if (existing.profesorId !== profesorId) throw new Error('FORBIDDEN');
    await db.delete(etsComments).where(eq(etsComments.id, commentId));
    return true;
}

// ─── Guides ───────────────────────────────────────────────────────────────────

export type GuideWithProfesor = {
    id: number;
    etsId: number;
    profesorId: number;
    profesorNombre: string;
    titulo: string;
    filePath: string;
    createdAt: Date;
};

export async function listGuides(etsId: number): Promise<GuideWithProfesor[]> {
    const profe = alias(users, 'profe');
    return db
        .select({
            id: etsGuides.id,
            etsId: etsGuides.etsId,
            profesorId: etsGuides.profesorId,
            profesorNombre: profe.nombre,
            titulo: etsGuides.titulo,
            filePath: etsGuides.filePath,
            createdAt: etsGuides.createdAt,
        })
        .from(etsGuides)
        .innerJoin(profe, eq(etsGuides.profesorId, profe.id))
        .where(eq(etsGuides.etsId, etsId)) as unknown as Promise<GuideWithProfesor[]>;
}

export async function createGuide(etsId: number, profesorId: number, titulo: string, filePath: string): Promise<GuideWithProfesor> {
    const [created] = await db
        .insert(etsGuides)
        .values({ etsId, profesorId, titulo, filePath })
        .returning();
    if (!created) throw new Error('Insert did not return a row');
    const profe = alias(users, 'profe');
    const [full] = await db
        .select({ id: etsGuides.id, etsId: etsGuides.etsId, profesorId: etsGuides.profesorId,
            profesorNombre: profe.nombre, titulo: etsGuides.titulo, filePath: etsGuides.filePath, createdAt: etsGuides.createdAt })
        .from(etsGuides)
        .innerJoin(profe, eq(etsGuides.profesorId, profe.id))
        .where(eq(etsGuides.id, created.id));
    return full as unknown as GuideWithProfesor;
}

export async function deleteGuide(guideId: number, profesorId: number): Promise<{ filePath: string } | null> {
    const [existing] = await db.select({ profesorId: etsGuides.profesorId, filePath: etsGuides.filePath })
        .from(etsGuides).where(eq(etsGuides.id, guideId));
    if (!existing) return null;
    if (existing.profesorId !== profesorId) throw new Error('FORBIDDEN');
    await db.delete(etsGuides).where(eq(etsGuides.id, guideId));
    return { filePath: existing.filePath };
}
