import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';

export type UserRow = typeof users.$inferSelect;
export type PublicUser = Omit<UserRow, 'pass'>;
export type CreateUserInput = {
    nombre: string;
    apPaterno: string;
    apMaterno: string;
    correo: string;
    pass: string;
    usuarioRol?: number;
};
export type UpdateUserInput = Partial<CreateUserInput>;

function stripPass(user: UserRow): PublicUser {
    const { pass: _, ...pub } = user;
    return pub;
}

export async function listUsers(): Promise<PublicUser[]> {
    const rows = await db.select().from(users);
    return rows.map(stripPass);
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
    const patch: Partial<UserRow> = { ...input };
    if (input.pass) patch.pass = await bcrypt.hash(input.pass, 10);
    const [updated] = await db
        .update(users)
        .set(patch)
        .where(eq(users.id, id))
        .returning();
    return updated ? stripPass(updated) : null;
}

export async function deleteUser(id: number): Promise<boolean> {
    const [deleted] = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id });
    return !!deleted;
}
