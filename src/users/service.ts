import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users, carreras, areas } from '../db/schema.ts';

export type UserRow = typeof users.$inferSelect;
export type PublicUser = Omit<UserRow, 'pass'>;
export type CreateUserInput = {
    nombre: string;
    apPaterno: string;
    apMaterno: string;
    correo: string;
    pass: string;
    usuarioRol?: number;
    carreraId?: number | null;
    areaId?: number | null;
};
export type UpdateUserInput = Partial<Omit<CreateUserInput, 'pass'> & { pass?: string }>;

export type TeacherWithRefs = PublicUser & {
    carreraNombre: string | null;
    areaNombre: string | null;
};

function stripPass(user: UserRow): PublicUser {
    const { pass: _, ...pub } = user;
    return pub;
}

export async function listUsers(): Promise<PublicUser[]> {
    const rows = await db.select().from(users);
    return rows.map(stripPass);
}

export async function listTeachers(): Promise<TeacherWithRefs[]> {
    return db
        .select({
            id: users.id,
            nombre: users.nombre,
            apPaterno: users.apPaterno,
            apMaterno: users.apMaterno,
            correo: users.correo,
            usuarioRol: users.usuarioRol,
            carreraId: users.carreraId,
            carreraNombre: carreras.nombre,
            areaId: users.areaId,
            areaNombre: areas.nombre,
        })
        .from(users)
        .leftJoin(carreras, eq(users.carreraId, carreras.id))
        .leftJoin(areas, eq(users.areaId, areas.id))
        .where(eq(users.usuarioRol, 2));
}

export async function getUserById(id: number): Promise<PublicUser | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ? stripPass(user) : null;
}

export async function createUser(input: CreateUserInput): Promise<PublicUser> {
    const hashed = await bcrypt.hash(input.pass, 10);
    const [created] = await db
        .insert(users)
        .values({ ...input, pass: hashed })
        .returning();
    if (!created) throw new Error('Insert did not return a row');
    return stripPass(created);
}

export async function updateUser(
    id: number,
    input: UpdateUserInput,
): Promise<PublicUser | null> {
    const patch: Record<string, unknown> = { ...input };
    if (input.pass) patch.pass = await bcrypt.hash(input.pass, 10);
    const [updated] = await db
        .update(users)
        .set(patch)
        .where(eq(users.id, id))
        .returning();
    return updated ? stripPass(updated) : null;
}

export async function deleteUser(id: number): Promise<boolean> {
    try {
        const [deleted] = await db
            .delete(users)
            .where(eq(users.id, id))
            .returning({ id: users.id });
        return !!deleted;
    } catch (err: unknown) {
        if ((err as Record<string, unknown>)?.code === '23503') {
            throw new Error('FK_VIOLATION');
        }
        throw err;
    }
}
